# Groot — Project Features

An IoT plant-monitoring companion that senses its own environment, expresses how it feels through a facial display, and holds a real conversation with its owner through a voice-enabled AI assistant.

## Overview

Groot combines three tightly-integrated layers into a single "living" experience:

1. **A hardware sensing rig** built around a Raspberry Pi 4 that continuously measures the plant's soil, air, and reservoir conditions.
2. **A physical face** driven by an Arduino UNO with a 2.4" touch LCD that shows the plant's current mood through six animated expressions.
3. **A cloud-connected AI companion** that stores every reading in Firebase and lets the owner speak with the plant through a voice-enabled chatbot on the Vercel-hosted web dashboard.

Together they make plant care feel like caring for a small living character rather than reading numbers off a graph.

---

## Hardware layer

### The sensing rig

| Component | Role |
|---|---|
| Raspberry Pi 4 (8 GB) | The system's brain — reads sensors, decides status, pushes to the cloud, drives the face |
| MCP3008 8-channel ADC | Bridges analog sensors to the Pi's digital SPI bus |
| Capacitive soil moisture sensor | Continuously measures how wet the soil is around the plant's roots |
| Water-level sensor | Tracks the reservoir / drainage tray so overwatering is caught the moment it happens |
| DHT11 | Reports ambient air temperature and humidity |
| Arduino UNO R3 + Duinotech XC4630 2.4" TFT touchscreen | Displays the plant's mood face and animates a talking mouth when the AI is speaking |
| 5 V power bank | Untethered operation for demos |

Each sensor is read once every five seconds. The moisture and water-level sensors feed the MCP3008 over analog channels; the DHT11 talks to the Pi directly over a single GPIO line; and the Arduino connects to the Pi over a plain USB cable that carries both power and serial commands.

### The plant's face

The Arduino continuously renders one of six animated moods, each with its own colour palette and small idle animation:

| Mood | When it appears | Signature animation |
|---|---|---|
| **HAPPY** | Everything is in range | Blinks every few seconds, rosy cheeks, big smile |
| **THIRSTY** | Soil moisture is below the healthy band | Panting tongue, droopy eyelids, "cracked earth" markings |
| **DROWNING** | Soil is soaked or the reservoir is overflowing | Squeezed-shut eyes, tears run down the cheeks |
| **SLEEPY** | Too dark for the plant to photosynthesize | Closed eyes, "Zzz" floating up from the head |
| **TOO HOT** | Air temperature above the plant's comfort range | Squinting eyes, sweat drops fly off, wavy mouth |
| **TOO COLD** | Air temperature below the comfort range | Chattering teeth, snowflakes drift down the sides |

A **sprout-with-leaves** icon sits on top of the head in every mood, colour-matched to the current condition. When the AI chatbot is speaking, a **talking-mouth animation** plays across the current face — the mouth opens and closes in sync with the voice, giving the illusion that the plant itself is talking.

The Arduino sketch listens for one-letter commands over serial (`F0`–`F5` for the six moods, `T1`/`T0` to toggle the talking mouth) and de-duplicates repeats so the display never flickers when nothing has changed.

---

## Software pipeline

### `sensor_reader.py`

The single point of contact with the physical hardware. Exposes one function, `read_sensors()`, which returns a dictionary of the current soil moisture percentage, air temperature, humidity, and reservoir water level. Handles ADC calibration internally so downstream code deals in easy-to-read percentages instead of raw voltage counts. Any sensor that momentarily fails to read is reported as `None` so the system distinguishes between "value zero" and "no reading available".

### `main.py`

The 5-second orchestration loop. Every tick it:

1. Reads all four sensor values via `sensor_reader`.
2. Runs the readings through `decide_status()` to categorise the plant's state — `HEALTHY`, `NEEDS WATER`, `TOO WET`, `TOO HOT`, `TOO COLD`, or `SENSOR ERROR`.
3. Attaches a timestamp.
4. Fans the reading out in parallel to two independent consumers: Firebase (for the website + AI) and the Arduino (for the LCD face).
5. Wraps each downstream call in its own try/except so a dead Wi-Fi link never stops the LCD from updating, and a dead Arduino never stops Firebase from receiving data.

An outer safety net catches unexpected exceptions and continues looping, so the system stays live throughout a live demo even if something misbehaves.

### `firebase_setup.py`

The single interface to the Firebase Realtime Database. Owns the threshold constants that define what "healthy" means, so both the local decision loop and the cloud dashboard agree on the same numbers. Provides:

- `push_reading(reading)` — writes the latest sample to `/current` (overwritten) and appends it to `/history` (an append-only log) so both live views and long-term trends are always up to date.
- `get_status(...)` — pure threshold logic returning a `green`/`red` traffic-light state for the dashboard.
- `get_baseline(n)` — averages the last N history entries so the AI chatbot can compare "right now" to "the plant's own recent normal", not just an absolute threshold.
- `seed_fake_history()` — a demo helper that fills the database with a week of realistic-looking synthetic readings so the trend view has data on day one.

### `serial_to_arduino.py`

The bridge between the Pi's status vocabulary and the Arduino's face codes. Auto-discovers the Arduino by USB vendor ID (so the Pi always finds it regardless of which port it enumerates on), translates each status string to the matching mood face, and de-duplicates repeat sends so the LCD isn't rewritten every five seconds when nothing has changed. Silently no-ops if the Arduino is unplugged — the rest of the pipeline keeps running.

---

## Cloud & AI layer

### Firebase Realtime Database

Every reading is written twice — once to `/current` for the live dashboard, and once appended to `/history` for the AI's context window. The schema is a flat dictionary of `moisture`, `temp`, `humidity`, `water_level`, `status`, and an ISO-8601 UTC timestamp, so every downstream consumer (website, chatbot, mobile view) speaks the same shape.

### AI chatbot with voice I/O

The Vercel-hosted web dashboard hosts the AI companion. It listens for voice input from the owner, reads the plant's live sensor state and recent history straight from Firebase, and responds in the plant's own voice through the browser's speech synthesis. Because the AI has access to both the current values and the history baseline, it can hold conversational replies grounded in what's actually happening — for example, *"My soil's been steadily drying since Sunday and it's warmer than usual today. Could I get a drink?"* rather than a canned status readout.

While the AI speaks, the Pi drives the Arduino's mouth-animation channel so the plant's face visibly talks in sync with the voice — turning the LCD from a passive status display into a real character.

### Vercel dashboard

The web front-end (`https://` route not shown here) subscribes to `/current` in Firebase so it updates in real time without polling, and to `/history` for the trend chart. From a browser or phone, the owner can:

- See the plant's current mood, sensor values, and traffic-light status at a glance.
- Watch a rolling 7-day chart of moisture, temperature, and humidity.
- Talk to the plant directly through the chat interface — text or voice.

---

## End-to-end data flow

```
   [ Soil probe ]   [ Water sensor ]   [ DHT11 ]
        │                 │                │
        └── MCP3008 ──────┘                │
              │ SPI                        │ GPIO
              ▼                            ▼
        ┌───────────────────────────────────┐
        │        Raspberry Pi 4             │
        │   sensor_reader → main.py loop    │
        └──────────┬────────────────┬───────┘
                   │                │
     Firebase RTDB │                │ USB serial
        (cloud)    ▼                ▼
        ┌──────────────────┐  ┌────────────────┐
        │  Vercel website  │  │ Arduino + LCD  │
        │  • live dash     │  │ • 6 mood faces │
        │  • AI chatbot    │  │ • talk mouth   │
        │  • voice I/O     │  │                │
        └──────────────────┘  └────────────────┘
```

Every reading, every mood change, every chat turn flows through this pipeline within a couple of seconds end-to-end.

---

## Feature summary

- **Continuous multi-sensor monitoring** at 5-second granularity, covering soil moisture, reservoir level, air temperature, and humidity.
- **Six-mood animated face** on a 2.4" TFT LCD, with per-mood colour palettes and idle animations.
- **Live talking-mouth animation** synchronised with the AI's voice for a convincing "plant that speaks" effect.
- **Cloud-synced state** via Firebase Realtime Database — live current reading plus a full append-only history log.
- **Voice-enabled AI companion** on the web dashboard, grounded in real live data and long-term trends rather than canned responses.
- **Trend-aware conversation** — the AI compares current readings against the plant's own recent baseline, not just fixed thresholds.
- **Independent failure domains** — the LCD, the cloud pipeline, and the AI chatbot each keep working if any of the other two goes offline.
- **Portable demo rig** — the whole system runs off a single 5 V power bank, so it can be moved and shown anywhere.
- **Extensible sensor bus** — the MCP3008 leaves 5 spare analog channels for future additions (light sensor, pH probe, nutrient monitor).
