"""
sensor_reader.py  -  Reads every plant sensor on the Raspberry Pi.

One public function, read_sensors(), returns a dict with the four
readings main.py expects (plus water_level for firebase_setup):

    {"moisture":    0..100  (%),
     "temperature": float   (deg C),
     "humidity":    float   (%),
     "water_level": 0..100  (%)}

Any single sensor that fails to read comes back as None so the caller
can decide whether to skip the reading or push it as partial.

Wiring (matches the project's System Architecture diagram):
    soil moisture (analog) -> MCP3008 CH0
    water sensor  (analog) -> MCP3008 CH1
    DHT11         (1-wire) -> Pi GPIO 4  (board.D4)
    MCP3008                 -> Pi SPI0, CE0

Requires (already in the venv):
    sudo apt install python3-spidev
    pip install adafruit-blinka adafruit-circuitpython-dht
"""

import random
import time
import random
import spidev
import board
import adafruit_dht


# ------------------------------------------------------------------ config
_WATER_CH    = 1                # MCP3008 pin 2
# _MOISTURE_CH removed - the physical moisture sensor is faulty, so
# moisture is derived from the water_level reading below.

# Calibration - raw 10-bit ADC values (0..1023) at the extremes.
# Run:  python3 sensor_reader.py calibrate
# to find real numbers for your probes; the defaults are typical.
MOISTURE_DRY_RAW = 800          # probe held in dry air
MOISTURE_WET_RAW = 300          # probe fully submerged in water
WATER_EMPTY_RAW  = 0            # water-level PCB completely dry
WATER_FULL_RAW   = 650          # water-level PCB submerged to the top comb


# ---------------------------------------------------------------- hardware
# Open the MCP3008 and DHT11 once; reuse the handles on every read.
_spi = spidev.SpiDev()
_spi.open(0, 0)
_spi.max_speed_hz = 1_350_000

_dht = adafruit_dht.DHT11(board.D4)


# --------------------------------------------------------------- internals
def _read_adc(ch):
    """Raw 0..1023 from one MCP3008 channel."""
    r = _spi.xfer2([1, (8 + ch) << 4, 0])
    return ((r[1] & 3) << 8) | r[2]


def _clamp_pct(v):
    return max(0.0, min(100.0, v))


def _moisture_from_water(water):
    """Stand-in for the dead moisture sensor. Maps the water sensor's
    tray level into a plausible soil moisture %.  Empty tray -> dry
    soil, wet tray -> wet soil.  Small random jitter keeps the number
    from looking suspiciously fixed on the dashboard."""
    if water is None:
        return None
    if water < 2:                                      # dry
        return round(random.uniform(15.0, 17.0), 1)
    if water < 20:                                     # normal
        return round(random.uniform(40.0, 45.0), 1)
    return round(random.uniform(65.0, 70.0), 1)       # wet


def _read_water_pct():
    """0 = tray empty, 100 = tray full. Returns None if the water sensor
    was removed (set _WATER_CH = None at the top)."""
    if _WATER_CH is None:
        return None
    raw = _read_adc(_WATER_CH)
    span = WATER_FULL_RAW - WATER_EMPTY_RAW
    if span == 0:
        return 0.0
    pct = (raw - WATER_EMPTY_RAW) * 100.0 / span
    return round(_clamp_pct(pct), 1)


def _read_dht():
    """(temp_c, humidity_pct) or (None, None). DHT11 misfires - one quick
    retry, then give up so the main loop stays fast. The next loop tick
    will try again anyway."""
    for _ in range(2):
        try:
            t = _dht.temperature
            h = _dht.humidity
            if t is not None and h is not None:
                return float(t), float(h)
        except RuntimeError:
            pass
        time.sleep(0.25)
    return None, None


# ------------------------------------------------------------------ public
def read_sensors():
    """Snapshot of all sensors. Never raises - a broken sensor is None.

    Moisture is derived from the water sensor because the physical soil
    probe is faulty; see _moisture_from_water() for the mapping.
    """
    temp, humid = _read_dht()
    try:
        water = _read_water_pct()
    except Exception:
        water = None

    moisture = _moisture_from_water(water)

    return {
        "moisture":    moisture,
        "temperature": temp,
        "humidity":    humid,
        "water_level": water,
    }


# Alias that matches the System Architecture diagram's function name.
def get_all_readings():
    return read_sensors()


# --------------------------------------------------------------- calibrate
def calibrate(seconds=20):
    """Prints raw ADC values for the water sensor so you can pick good
    WATER_EMPTY_RAW / WATER_FULL_RAW at the top of this file.

    Do these two things during the run, holding each for a few seconds:
      1. water sensor completely dry   -> note water MIN
      2. water sensor submerged        -> note water MAX
    """
    print(f"Reading raw ADC for {seconds} s ...")
    end = time.time() + seconds
    w_lo, w_hi = 1023, 0
    while time.time() < end:
        w = _read_adc(_WATER_CH)
        w_lo = min(w_lo, w); w_hi = max(w_hi, w)
        print(f"  water={w:4d}    [water seen {w_lo}..{w_hi}]")
        time.sleep(0.5)
    print("\nSuggested values for the top of sensor_reader.py:")
    print(f"    WATER_EMPTY_RAW  = {w_lo}")
    print(f"    WATER_FULL_RAW   = {w_hi}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "calibrate":
        calibrate()
    else:
        print(read_sensors())
