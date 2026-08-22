import time
import traceback

from sensor_reader import read_sensors            # -> dict of readings
from firebase_setup import (                      # thresholds live in one place
    push_reading, init_firebase,
    MOISTURE_LOW, MOISTURE_HIGH, TEMP_LOW, TEMP_HIGH,
)
from serial_to_arduino import send_status         # str, bool -> Arduino

READ_INTERVAL_SECONDS = 2      # how often to poll the sensors
                               # (DHT11 minimum is 1 s; 2 s leaves headroom)


def decide_status(reading):
    """Turn raw readings into a short human-readable status string
    (also shown on the LCD + website).

    Temperature has priority: extreme temperature always wins over
    whatever the moisture is doing.  Only when the air sits inside the
    comfortable band do we look at moisture and pick between THIRSTY,
    HAPPY, and TOO WET.
    """
    moisture = reading.get("moisture")
    temperature = reading.get("temperature")

    # If a sensor failed to read, say so instead of guessing.
    if moisture is None or temperature is None:
        return "SENSOR ERROR"

    # Temperature first - extreme heat/cold overrides everything.
    if temperature < TEMP_LOW:            # 0..16
        return "TOO COLD"
    if temperature > TEMP_HIGH:           # 32+
        return "TOO HOT"

    # Comfortable temperature -> fall back to the moisture story.
    if moisture < MOISTURE_LOW:
        return "NEEDS WATER"
    if moisture > MOISTURE_HIGH:
        return "TOO WET"

    return "HEALTHY"


def run_once():
    """One iteration of the loop. Kept separate so it's easy to test."""
    reading = read_sensors()
    status = decide_status(reading)

    # Attach the derived fields so the website can display them too.
    reading["status"] = status
    reading["timestamp"] = int(time.time())

    # Fan out to the two consumers. Each is wrapped on its own so a
    # dead wifi link doesn't stop the LCD, and a dead Arduino doesn't
    # stop Firebase.
    try:
        push_reading(reading)
    except Exception as exc:
        print(f"[firebase] push failed: {exc}")

    try:
        send_status(status)
    except Exception as exc:
        print(f"[arduino]  send failed: {exc}")

    print(reading)


def main():
    print("Plant Guardian starting up...")
    init_firebase()
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
