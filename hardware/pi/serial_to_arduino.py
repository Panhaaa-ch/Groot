"""
serial_to_arduino.py  -  One-way channel from the Pi to the LCD face.

The Arduino runs PlantMoodFace.ino which listens on USB serial for
one-letter commands:

    F0..F5    show face 0..5      (HAPPY, THIRSTY, DROWNING, SLEEPY,
                                   TOO_HOT, TOO_COLD)
    T1 / T0   talking mouth       (unused in this build - voice runs
                                   on the website side)
    ?         dump current state

send_status() is the only entry point main.py needs. It maps main.py's
status strings to face codes, deduplicates repeats (main.py calls every
5 s), and lazily reopens the port if it drops out.
"""

import time
import serial
import serial.tools.list_ports


BAUD = 9600

# main.py's decide_status() vocabulary -> Arduino face code.
# Face 3 (SLEEPY / too dark) is reserved for a future LDR on CH2.
FACE_CODE = {
    "HEALTHY":      0,   # HAPPY
    "NEEDS WATER":  1,   # THIRSTY
    "TOO WET":      2,   # DROWNING
    "TOO HOT":      4,
    "TOO COLD":     5,
    "SENSOR ERROR": 0,   # keep the display showing SOMETHING sensible
}


# ---------------------------------------------------------------- discovery
def _find_port():
    """Return the first Arduino-looking serial device, or None.

    Matches Arduino UNO by USB vendor ID (2341) so it works whether the
    Pi enumerates it as /dev/ttyACM0 or /dev/ttyACM1 after a reboot.
    """
    for p in serial.tools.list_ports.comports():
        if "2341" in (p.hwid or "").upper():
            return p.device
        if p.device.startswith(("/dev/ttyACM", "/dev/ttyUSB")):
            return p.device
    return None


# ---------------------------------------------------------------- lifecycle
_serial            = None
_last_face_sent    = None    # int face code, so repeats become no-ops
_last_open_attempt = 0.0


def _open():
    """Get an open Serial. Retries at most once per 10 s so a missing
    Arduino doesn't slow the 5 s main loop to a crawl."""
    global _serial, _last_open_attempt

    if _serial is not None and _serial.is_open:
        return _serial

    now = time.time()
    if now - _last_open_attempt < 10:
        return None
    _last_open_attempt = now

    port = _find_port()
    if port is None:
        raise RuntimeError("no Arduino serial port found "
                           "(looked for USB VID 2341 and /dev/ttyACM*)")

    _serial = serial.Serial(port, BAUD, timeout=1)
    time.sleep(2.2)              # UNO resets on serial open - wait for boot
    _serial.reset_input_buffer()
    return _serial


# -------------------------------------------------------------------- public
def send_status(status, is_ok=True):
    """Update the LCD face to reflect the current plant status.

    status : one of the strings in FACE_CODE (main.py's decide_status
             produces these).
    is_ok  : accepted for signature compatibility; the face itself
             already conveys good/bad, so the flag is ignored.

    Raises RuntimeError if the Arduino cannot be reached. main.py
    catches this so an offline Arduino does not stop Firebase pushes.
    """
    global _last_face_sent

    face = FACE_CODE.get(status)
    if face is None:
        raise ValueError(f"unknown status {status!r}. "
                         f"Known statuses: {sorted(FACE_CODE)}")

    if face == _last_face_sent:
        return                       # already on the screen, save the write

    port = _open()
    if port is None:
        raise RuntimeError("Arduino not available (will retry in ~10 s)")

    port.write(f"F{face}\n".encode())
    _last_face_sent = face


def send_talking(is_speaking):
    """Reserved. The website drives the voice UX, so this is intentionally
    not wired into main.py. Call it manually if you want to test the
    mouth animation from the Pi."""
    port = _open()
    if port is None:
        raise RuntimeError("Arduino not available")
    port.write(b"T1\n" if is_speaking else b"T0\n")


def close():
    """Release the port. Handy for tests and clean shutdowns."""
    global _serial, _last_face_sent
    if _serial is not None and _serial.is_open:
        _serial.close()
    _serial = None
    _last_face_sent = None


# --------------------------------------------------------------------- demo
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        s = " ".join(sys.argv[1:]).upper()
        send_status(s)
        print(f"sent status: {s}")
    else:
        print("cycling every status; watch the LCD ...")
        for s in FACE_CODE:
            print(f"  {s}")
            send_status(s)
            time.sleep(2.0)
        send_status("HEALTHY")
        print("done. left on HEALTHY.")
