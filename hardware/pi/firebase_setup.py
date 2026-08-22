"""
Groot -- Firebase Realtime Database connection layer.

Single point of contact between the sensor pipeline (main.py) and
Firebase. Everything downstream (website dashboard, chatbot, LCD data)
depends on the schema written here matching PRD section 5.

Thresholds live here so main.py and firebase agree on what "healthy"
means. main.py imports them.
"""

import random
from datetime import datetime, timedelta, timezone

import firebase_admin
from firebase_admin import credentials, db

DATABASE_URL = "https://groot-39462-default-rtdb.asia-southeast1.firebasedatabase.app"
CRED_FILE = "firebase_credentials.json"

# Threshold logic for get_status(). Tuned for common houseplants; adjust
# once sensor_reader.py is calibrated against real dry/wet readings.
MOISTURE_LOW = 20        # <20  -> NEEDS WATER  (catches the dry band 15-17)
MOISTURE_HIGH = 50       # >50  -> TOO WET      (catches the wet band 65-70;
                         #                       healthy band 40-45 sits in between)
WATER_LEVEL_LOW = 20
TEMP_LOW = 18
TEMP_HIGH = 27
HUMIDITY_LOW = 40
HUMIDITY_HIGH = 60


def init_firebase():
    """Connect to the Firebase project using CRED_FILE and DATABASE_URL.
    Call once at startup, before push_reading/get_baseline/etc."""
    if firebase_admin._apps:
        return                       # already initialised
    cred = credentials.Certificate(CRED_FILE)
    firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})


def get_status(moisture, temp, humidity, water_level=None):
    """Pure threshold logic, no network calls. Returns 'green' or 'red'."""
    if moisture is None or temp is None or humidity is None:
        return "red"

    if moisture < MOISTURE_LOW or moisture > MOISTURE_HIGH:
        return "red"
    if water_level is not None and water_level < WATER_LEVEL_LOW:
        return "red"
    if temp < TEMP_LOW or temp > TEMP_HIGH:
        return "red"
    if humidity < HUMIDITY_LOW or humidity > HUMIDITY_HIGH:
        return "red"

    return "green"


def push_reading(reading):
    """Write the latest reading to 'current' (overwritten) and append it
    to 'history' (append-only log).

    Accepts the same dict main.py builds:
        {"moisture", "temperature", "humidity", "water_level",
         "status", "ok", "timestamp", ...}

    Extra keys are written through unchanged; missing sensors come in
    as None and are stored as None so the dashboard can grey them out.
    """
    moisture    = reading.get("moisture")
    temperature = reading.get("temperature")
    humidity    = reading.get("humidity")
    water_level = reading.get("water_level")

    fb_status = get_status(moisture, temperature, humidity, water_level)

    payload = {
        "moisture":    moisture,
        "water_level": water_level,
        "temp":        temperature,          # firebase schema uses "temp"
        "humidity":    humidity,
        "status":      fb_status,            # "green" / "red" for dashboard
        "timestamp":   datetime.now(timezone.utc).isoformat(),
    }
    # Passthrough of any extra fields main.py attached (e.g. LCD status).
    for k, v in reading.items():
        if k not in payload:
            payload[k] = v

    db.reference("current").set(payload)
    db.reference("history").push(payload)

    return payload


def seed_fake_history(days, readings_per_day):
    """Generate realistic fake historical readings so the baseline/trend
    feature has data during the demo, without days of real collection.

    Pushed oldest-first so Firebase's auto-generated (chronologically
    sorting) push IDs line up with the fake timestamps' order.
    """
    history_ref = db.reference("history")
    now = datetime.now(timezone.utc)
    total = days * readings_per_day
    interval = timedelta(days=days) / total

    # Slow-drifting baseline so consecutive readings look continuous
    # rather than pure noise, with the occasional bad reading mixed in.
    moisture = random.uniform(45, 60)
    water_level = random.uniform(50, 80)
    temp = random.uniform(21, 24)
    humidity = random.uniform(45, 55)

    for i in range(total):
        timestamp = now - interval * (total - i)

        moisture = min(100, max(0, moisture + random.uniform(-4, 3)))
        water_level = min(100, max(0, water_level + random.uniform(-3, 2)))
        temp = temp + random.uniform(-0.5, 0.5)
        humidity = min(100, max(0, humidity + random.uniform(-2, 2)))

        fb_status = get_status(moisture, temp, humidity, water_level)
        reading = {
            "moisture":    round(moisture, 1),
            "water_level": round(water_level, 1),
            "temp":        round(temp, 1),
            "humidity":    round(humidity, 1),
            "status":      fb_status,
            "timestamp":   timestamp.isoformat(),
        }
        history_ref.push(reading)


def get_baseline(sample_size):
    """Average the last N entries in history, so a live reading can be
    compared against the plant's own recent normal."""
    entries = (
        db.reference("history")
        .order_by_key()
        .limit_to_last(sample_size)
        .get()
    )

    if not entries:
        return None

    values = list(entries.values())
    n = len(values)

    return {
        "moisture":    sum(v["moisture"]    for v in values) / n,
        "water_level": sum(v["water_level"] for v in values) / n,
        "temp":        sum(v["temp"]        for v in values) / n,
        "humidity":    sum(v["humidity"]    for v in values) / n,
        "sample_size": n,
    }


if __name__ == "__main__":
    init_firebase()
    print("Firebase initialized.")

    seed_fake_history(days=7, readings_per_day=24)
    print("Seeded 7 days of fake history.")

    reading = push_reading({
        "moisture": 42, "temperature": 23.5, "humidity": 48, "water_level": 65,
    })
    print("Pushed live reading:", reading)

    baseline = get_baseline(sample_size=20)
    print("Baseline (last 20 readings):", baseline)
