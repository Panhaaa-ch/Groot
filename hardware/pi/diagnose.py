"""
diagnose.py  -  Full-stack test for the Plant Mood Face rig.

Runs six independent tests and prints a PASS/FAIL summary at the end.
Each test catches its own exceptions so one failure never masks another.

    scp diagnose.py <user>@raspberrypi.local:~/
    ssh <user>@raspberrypi.local
    source ~/plant/bin/activate
    python3 ~/diagnose.py
"""

import sys, time, glob, traceback

RESULTS = []                           # (test_name, ok, detail)


def test(name):
    """Decorator: capture pass/fail and any exception message."""
    def wrap(fn):
        def go():
            print(f"\n=== {name} ===")
            try:
                detail = fn() or ""
                RESULTS.append((name, True, detail))
                print(f"[PASS] {name}  {detail}")
            except Exception as e:
                RESULTS.append((name, False, str(e)))
                print(f"[FAIL] {name}  {e}")
                traceback.print_exc(limit=1)
        return go
    return wrap


# ---------------------------------------------------------------- 1. SPI
@test("SPI bus + MCP3008 responds")
def t_spi():
    import spidev
    s = spidev.SpiDev(); s.open(0, 0); s.max_speed_hz = 1_350_000
    # Read CH7 which should be floating - reading should be *unstable*
    # if the chip is alive.  A rock-solid 0 or 1023 means no chip / bad wire.
    vs = []
    for _ in range(20):
        r = s.xfer2([1, (8 + 7) << 4, 0])
        vs.append(((r[1] & 3) << 8) | r[2])
    s.close()
    spread = max(vs) - min(vs)
    if spread < 2 and (vs[0] == 0 or vs[0] == 1023):
        raise RuntimeError(f"CH7 stuck at {vs[0]} - MCP3008 not answering "
                           "(check VDD, VREF, GND, SPI wires)")
    return f"CH7 floating, values span {min(vs)}..{max(vs)}"


# ------------------------------------------------------------- 2. ADC dump
@test("All 8 ADC channels look sane")
def t_adc():
    import spidev
    s = spidev.SpiDev(); s.open(0, 0); s.max_speed_hz = 1_350_000
    def read(ch):
        r = s.xfer2([1, (8 + ch) << 4, 0]); return ((r[1] & 3) << 8) | r[2]
    print("    channel  value  hint")
    hints = ["moisture probe (CH0)", "water sensor?  (CH1)",
             "", "", "", "", "", "floating"]
    for ch in range(8):
        v = read(ch)
        print(f"      CH{ch}    {v:4d}   {hints[ch]}")
    ch0 = read(0)
    s.close()
    if ch0 == 0:      raise RuntimeError("CH0 reads 0 - moisture probe not wired, or its V/G swapped")
    if ch0 == 1023:   raise RuntimeError("CH0 reads 1023 - moisture probe signal pin not connected")
    return f"moisture (CH0) = {ch0}"


# --------------------------------------------------------------- 3. DHT11
@test("DHT11 temperature + humidity")
def t_dht():
    import board, adafruit_dht
    d = adafruit_dht.DHT11(board.D4)
    got_temp = got_humid = None
    fails = 0
    for i in range(8):
        try:
            got_temp  = d.temperature
            got_humid = d.humidity
            if got_temp is not None and got_humid is not None:
                print(f"    attempt {i+1}: {got_temp} C, {got_humid} %")
                break
        except Exception as e:
            fails += 1
            print(f"    attempt {i+1}: {e}")
        time.sleep(2)
    d.exit()
    if got_temp is None:
        raise RuntimeError(f"{fails} attempts all failed - check DATA wire, "
                           "pull-up resistor, and 3.3V power")
    return f"{got_temp} C, {got_humid} %  ({fails} retries)"


# ---------------------------------------------------------- 4. Serial port
@test("Arduino serial port present")
def t_port():
    ports = glob.glob("/dev/ttyACM*") + glob.glob("/dev/ttyUSB*")
    if not ports:
        raise RuntimeError("no /dev/ttyACM* or /dev/ttyUSB* - Arduino not connected "
                           "or Pi's USB host not powering it")
    print("    found:", ports)
    globals()["ARDUINO_PORT"] = ports[0]
    return ports[0]


# ------------------------------------------------------ 5. Serial roundtrip
@test("Arduino replies to serial commands")
def t_serial():
    import serial
    port = globals().get("ARDUINO_PORT", "/dev/ttyACM0")
    s = serial.Serial(port, 9600, timeout=1)
    time.sleep(2.5)                    # let the UNO finish rebooting
    s.reset_input_buffer()
    s.write(b"?\n")
    reply = s.readline().decode(errors="replace").strip()
    s.close()
    if not reply.startswith("mood="):
        raise RuntimeError(f"Arduino did not reply as expected. Got: {reply!r}  "
                           "(is PlantMoodFace.ino still uploaded?)")
    return reply


# -------------------------------------------------- 6. Visual face cycle
@test("Face cycles through all six moods on the LCD")
def t_face():
    import serial
    port = globals().get("ARDUINO_PORT", "/dev/ttyACM0")
    s = serial.Serial(port, 9600, timeout=1)
    time.sleep(2.5)
    names = ["HAPPY", "THIRSTY", "DROWNING", "SLEEPY", "TOO_HOT", "TOO_COLD"]
    print("    >>> WATCH THE SCREEN <<<")
    for i, n in enumerate(names):
        s.write(f"F{i}\n".encode())
        print(f"    F{i} ({n})")
        time.sleep(1.5)
    print("    talking mouth on for 3 s ...")
    s.write(b"T1\n"); time.sleep(3.0); s.write(b"T0\n")
    s.write(b"F0\n")                   # leave it happy
    s.close()
    return "sent all 6 faces + talking; check screen changed each time"


# ================================================================
# THRESHOLDS - edit these to match YOUR probe and YOUR plant.
# See plant.py's calibrate() for how to find good numbers.
# ================================================================
DRY_ADC = 750     # CH0 above this -> soil is dry     -> THIRSTY
WET_ADC = 300     # CH0 below this -> soil is soaked  -> DROWNING
HOT_C   = 30.0
COLD_C  = 15.0

FACE_NAMES = ["HAPPY", "THIRSTY", "DROWNING", "SLEEPY", "TOO_HOT", "TOO_COLD"]
HAPPY, THIRSTY, DROWNING, SLEEPY, TOO_HOT, TOO_COLD = range(6)


def decide(soil, temp_c, humid):
    """Return (mood_index, one-line reason)."""
    if temp_c is not None and temp_c >= HOT_C:
        return TOO_HOT,   f"temperature {temp_c} C >= {HOT_C}"
    if temp_c is not None and temp_c <= COLD_C:
        return TOO_COLD,  f"temperature {temp_c} C <= {COLD_C}"
    if soil >= DRY_ADC:
        return THIRSTY,   f"soil ADC {soil} >= dry threshold {DRY_ADC}"
    if soil <= WET_ADC:
        return DROWNING,  f"soil ADC {soil} <= wet threshold {WET_ADC}"
    return HAPPY,        (f"soil {soil} in [{WET_ADC}..{DRY_ADC}], "
                          f"temp {temp_c} C in ({COLD_C}..{HOT_C})")


# ------------------------------------------ 7. Real-sensor status readout
@test("Live plant status from real sensor readings")
def t_status():
    import spidev, board, adafruit_dht, serial

    # --- soil ---
    s = spidev.SpiDev(); s.open(0, 0); s.max_speed_hz = 1_350_000
    r = s.xfer2([1, (8 + 0) << 4, 0])
    soil = ((r[1] & 3) << 8) | r[2]
    s.close()

    # --- DHT11: average a few good reads, tolerate misfires ---
    d = adafruit_dht.DHT11(board.D4)
    temps, humids = [], []
    for _ in range(6):
        try:
            t, h = d.temperature, d.humidity
            if t is not None: temps.append(t)
            if h is not None: humids.append(h)
            if temps and humids: break
        except Exception:
            pass
        time.sleep(2)
    d.exit()
    temp  = sum(temps)  / len(temps)  if temps  else None
    humid = sum(humids) / len(humids) if humids else None

    mood, why = decide(soil, temp, humid)
    name = FACE_NAMES[mood]

    print( "    ---- readings ----")
    print(f"    soil moisture (CH0) : {soil}    "
          f"(dry >= {DRY_ADC}, wet <= {WET_ADC})")
    print(f"    temperature         : {temp} C  "
          f"(hot >= {HOT_C}, cold <= {COLD_C})")
    print(f"    humidity            : {humid} %")
    print( "    ---- verdict -----")
    print(f"    mood   : {name}")
    print(f"    reason : {why}")

    # push it to the face so what's on the screen matches the verdict
    port = globals().get("ARDUINO_PORT", "/dev/ttyACM0")
    try:
        sp = serial.Serial(port, 9600, timeout=1)
        time.sleep(2.5)
        sp.write(f"F{mood}\n".encode())
        sp.close()
        print(f"    (face on LCD set to {name})")
    except Exception as e:
        print(f"    (couldn't push to face: {e})")

    return f"{name} - {why}"


# ================================================================ MAIN
def summary():
    print("\n" + "=" * 60)
    print(f"{'TEST':<45} {'RESULT'}")
    print("-" * 60)
    for name, ok, detail in RESULTS:
        mark = "PASS" if ok else "FAIL"
        print(f"{name:<45} {mark}")
        if detail:
            print(f"    -> {detail}")
    n_ok = sum(1 for _, ok, _ in RESULTS if ok)
    print("-" * 60)
    print(f"{n_ok} of {len(RESULTS)} passed")
    print("=" * 60)


if __name__ == "__main__":
    t_spi()
    t_adc()
    t_dht()
    t_port()
    t_serial()
    t_face()
    t_status()
    summary()
    sys.exit(0 if all(ok for _, ok, _ in RESULTS) else 1)
