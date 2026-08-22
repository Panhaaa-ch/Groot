import time
import traceback

from sensor_reader import read_sensors            # -> dict of readings
from firebase_setup import (                      # thresholds live in one place
    push_reading, init_firebase,
    MOISTURE_LOW, MOISTURE_HIGH, TEMP_LOW, TEMP_HIGH,
)
from serial_to_arduino import send_status         # str, bool -> Arduino

READ_INTERVAL_SECONDS = 5      # how often to poll the sensors


def decide_status(reading):
    """Turn raw readings into a short human-readable status string
    (also shown on the LCD + website)."""
    moisture = reading.get("moisture")
    temperature = reading.get("temperature")

    # If a sensor failed to read, say so instead of guessing.
    if moisture is None or temperature is None:
        return "SENSOR ERROR"

    if moisture < MOISTURE_LOW:
        return "NEEDS WATER"
    if moisture > MOISTURE_HIGH:
        return "TOO WET"
    if temperature < TEMP_LOW:
        return "TOO COLD"
    if temperature > TEMP_HIGH:
        return "TOO HOT"

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
