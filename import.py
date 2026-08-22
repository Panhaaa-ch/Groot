import time
import traceback
 
from sensor_reader import read_sensors          # -> dict of readings
from firebase_setup import push_reading         # dict  -> Firebase
from serial_to_arduino import send_status       # str, bool -> Arduino
 
READ_INTERVAL_SECONDS = 5      # how often to poll the sensors
 
# Thresholds for turning raw numbers into a status. Tune these during
# testing - they are the only "opinion" in the whole loop.
MOISTURE_DRY_BELOW = 30        # % - below this the soil is too dry
MOISTURE_WET_ABOVE = 80        # % - above this the soil is waterlogged
TEMP_LOW_BELOW     = 10        # deg C
TEMP_HIGH_ABOVE    = 35        # deg C
 
 
def decide_status(reading):
    """Turn raw readings into a simple status.
 
    Returns (status, is_ok):
      status : short human-readable string (also shown on the LCD + website)
      is_ok  : True -> green LED, False -> red LED
    """
    moisture = reading.get("moisture")
    temperature = reading.get("temperature")
 
    # If a sensor failed to read, say so instead of guessing.
    if moisture is None or temperature is None:
        return "SENSOR ERROR", False
 
    if moisture < MOISTURE_DRY_BELOW:
        return "NEEDS WATER", False
    if moisture > MOISTURE_WET_ABOVE:
        return "TOO WET", False
    if temperature < TEMP_LOW_BELOW:
        return "TOO COLD", False
    if temperature > TEMP_HIGH_ABOVE:
        return "TOO HOT", False
 
    return "HEALTHY", True
 
 
def run_once():
    """One iteration of the loop. Kept separate so it's easy to test."""
    reading = read_sensors()
    status, is_ok = decide_status(reading)
 
    # Attach the derived fields so the website can display them too.
    reading["status"] = status
    reading["ok"] = is_ok
    reading["timestamp"] = int(time.time())
 
    # Fan out to the two consumers. Each is wrapped on its own so a
    # dead wifi link doesn't stop the LCD, and a dead Arduino doesn't
    # stop Firebase.
    try:
        push_reading(reading)
    except Exception as exc:
        print(f"[firebase] push failed: {exc}")
 
    try:
        send_status(status, is_ok)
    except Exception as exc:
        print(f"[arduino]  send failed: {exc}")
 
    print(reading)
 
 
def main():
    print("Plant Guardian starting up...")
    while True:
        try:
            run_once()
        except Exception:
            # Absolute backstop: never let the loop die during the demo.
            print("Unexpected error in main loop:")
            traceback.print_exc()
        time.sleep(READ_INTERVAL_SECONDS)
 
 
if __name__ == "__main__":
    main()