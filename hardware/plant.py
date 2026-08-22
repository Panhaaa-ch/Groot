"""
plant.py  -  Plant Mood Face, Raspberry Pi driver

Reads soil moisture and DHT11, decides which of the six moods to show,
and drives the Arduino face over USB serial.  Exposes talk_on / talk_off
for the voice-AI process (your friend's code) to call whenever the plant
is speaking, so the mouth animates.

Setup (Raspberry Pi OS Bookworm):

    sudo raspi-config    # Interface Options -> SPI -> Enable, then reboot
    sudo apt install python3-pip python3-venv python3-spidev
    python3 -m venv ~/plant && source ~/plant/bin/activate
    pip install pyserial adafruit-blinka adafruit-circuitpython-dht

    # find the Arduino's serial device (usually /dev/ttyACM0)
    ls /dev/serial/by-id/

Run:
    python plant.py
"""

import time
import threading
import serial
import spidev
import board
import adafruit_dht


# ----- ARDUINO FACE ------------------------------------------------------
# 9600 baud must match the sketch.  Opening the port pulls DTR which
# resets the UNO, so we wait for its boot before sending anything.
ARDUINO_PORT = "/dev/ttyACM0"
FACE = serial.Serial(ARDUINO_PORT, 9600, timeout=1)
time.sleep(2.5)

_face_lock = threading.Lock()


def face(cmd: str) -> None:
    with _face_lock:
        FACE.write((cmd + "\n").encode())


def talk_on()  -> None: face("T1")   # call before the AI starts speaking
def talk_off() -> None: face("T0")   # call when the AI stops


# ----- MCP3008 (SPI0, CE0) -----------------------------------------------
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1_350_000


def adc(ch: int) -> int:
    """Read one MCP3008 channel, 0..1023."""
    r = spi.xfer2([1, (8 + ch) << 4, 0])
    return ((r[1] & 3) << 8) | r[2]


# ----- DHT11 on GPIO 4 ---------------------------------------------------
dht = adafruit_dht.DHT11(board.D4)


# ----- MOOD DECISION -----------------------------------------------------
# Face indices match the Arduino sketch.
HAPPY, THIRSTY, DROWNING, SLEEPY, TOO_HOT, TOO_COLD = range(6)
NAMES = ["HAPPY", "THIRSTY", "DROWNING", "SLEEPY", "TOO_HOT", "TOO_COLD"]

# Tune these to YOUR probe and YOUR plant.  Read a few raw values with the
# probe dry and dunked in wet soil first (see calibrate() below).
DRY_ADC   = 750       # above this = soil is dry     -> THIRSTY
WET_ADC   = 300       # below this = soil is soaked  -> DROWNING
HOT_C     = 30.0
COLD_C    = 15.0
# SLEEPY (too dark) needs a light sensor - not wired yet, so skip it.


def decide(soil: int, temp_c, humid) -> int:
    if temp_c is not None and temp_c >= HOT_C:  return TOO_HOT
    if temp_c is not None and temp_c <= COLD_C: return TOO_COLD
    if soil >= DRY_ADC:                         return THIRSTY
    if soil <= WET_ADC:                         return DROWNING
    return HAPPY


def read_dht():
    """DHT11 misfires often - swallow the retry noise."""
    try:
        return dht.temperature, dht.humidity
    except RuntimeError:
        return None, None


# ----- HYSTERESIS + MAIN LOOP -------------------------------------------
# Only send a new face when the decision has been stable for 3 reads.
# Keeps the display from twitching when a value sits on a threshold.

def run():
    last_sent    = None
    candidate    = None
    stable_count = 0
    STABLE       = 3
    PERIOD       = 2.0     # seconds between reads

    print("plant.py running  (Ctrl-C to quit)")

    while True:
        soil = adc(0)
        temp, humid = read_dht()
        m = decide(soil, temp, humid)

        print(f"soil={soil:4d}  temp={temp}  humid={humid}  -> {NAMES[m]}")

        if m == candidate:
            stable_count += 1
        else:
            candidate    = m
            stable_count = 1

        if stable_count >= STABLE and m != last_sent:
            face(f"F{m}")
            last_sent = m
            print(f"    >>> face -> {NAMES[m]}")

        time.sleep(PERIOD)


# ----- CALIBRATION HELPER ------------------------------------------------
def calibrate(seconds: int = 30):
    """
    Hold the probe in the air, run this, note the reading (that is your
    DRY value).  Then dunk it in a glass of water, run again - that is
    the WET value.  Set DRY_ADC and WET_ADC in between the two.
    """
    print("Reading soil probe for", seconds, "seconds ...")
    end = time.time() + seconds
    lo, hi = 1023, 0
    while time.time() < end:
        v = adc(0)
        lo = min(lo, v); hi = max(hi, v)
        print(f"  {v}   (min={lo}  max={hi})")
        time.sleep(0.5)
    print(f"\nrange:  dry~{hi}   wet~{lo}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "calibrate":
        calibrate()
    else:
        try:
            run()
        except KeyboardInterrupt:
            face("F0")     # leave a happy face when we quit
            print()
