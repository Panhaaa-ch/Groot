/* =====================================================================
   PLANT MOOD FACE  -  Duinotech XC4630 2.4" TFT shield + Arduino UNO R3
   ---------------------------------------------------------------------
   The screen shows a face that represents the plant:
       HAPPY     - everything is fine
       THIRSTY   - soil is dry            (frown + panting tongue)
       DROWNING  - over-watered           (crying, tears run down)
       SLEEPY    - too dark               (closed eyes + floating Zzz)
       TOO HOT   - too much sun/heat      (squint + flying sweat)
       TOO COLD  - too cold               (chattering teeth + snow)

   For the trial there are no sensors: a KY-040 rotary encoder simulates
   the conditions - one detent (click) = one condition.
   Pressing the encoder shaft toggles an AUTO demo that cycles by itself.

   Libraries (Arduino IDE -> Tools -> Manage Libraries):
       "Adafruit GFX Library"      by Adafruit
       "MCUFRIEND_kbv"             by David Prentice
   ===================================================================== */

#include <Adafruit_GFX.h>
#include <MCUFRIEND_kbv.h>

MCUFRIEND_kbv tft;

/* ========================= HOW YOU CHANGE MOODS ======================
   Set ONE of these to 1.

   INPUT_TOUCH   - no wiring at all.  Tap the screen = next condition,
                   press and hold ~1 s = start/stop the auto demo.
                   Needs the "Adafruit TouchScreen" library.

   INPUT_ENCODER - KY-040 rotary encoder on D11/D12/D13.  Remember the
                   shield uses D2..D9 and A0..A4, and D10..D13 belong to
                   the (unused) microSD slot, so those three are all
                   that is left.
   -------------------------------------------------------------------- */
#define INPUT_TOUCH    1
#define INPUT_ENCODER  0

#if INPUT_TOUCH
  #include <TouchScreen.h>
  // Touch panel pins for THIS board, measured with MCUFRIEND_kbv's
  // diagnose_Touchpins example:
  //     X plate = A2 + D8  (~300 ohm)
  //     Y plate = A3 + D9  (~500 ohm)
  // Note this shield does NOT use the common D6/D7 arrangement.
  // XM/XP and YP/YM could be the other way round, but that only mirrors
  // the coordinates - and we only use pressure, so it makes no odds.
  #define XM A2
  #define XP 8
  #define YP A3
  #define YM 9
  #define TS_MINPRESSURE 60
  #define TS_MAXPRESSURE 1000
  #define TS_HOLD_MS     900        // hold this long to toggle auto demo
  TouchScreen ts = TouchScreen(XP, YP, XM, YM, 300);
  #define HINT_IDLE "TAP = next condition,  HOLD = auto"
  #define HINT_AUTO "AUTO DEMO - tap the screen to stop"
#endif

#if INPUT_ENCODER
  #define ENC_CLK   11      // KY-040 "CLK"
  #define ENC_DT    12      // KY-040 "DT"
  #define ENC_SW    13      // KY-040 "SW"
  #define ENC_REVERSE        0   // set to 1 if the knob turns "backwards"
  #define COUNTS_PER_DETENT  4   // KY-040 = 4.  Use 2 if it skips 2 moods.
  #define HINT_IDLE "Turn knob = condition, press = auto"
  #define HINT_AUTO "AUTO DEMO - press knob to stop"
#endif

/* ----------------------------- COLOURS ------------------------------ */
#define C565(r,g,b) ((uint16_t)((((r)&0xF8)<<8)|(((g)&0xFC)<<3)|((b)>>3)))
#define BLACK  0x0000
#define WHITE  0xFFFF

/* ------------------------- FACE GEOMETRY ---------------------------- */
#define SCR_W   240
#define SCR_H   320
#define CX      120        // face centre X
#define CY      158        // face centre Y
#define FR       92        // face radius
#define EYE_DX   36        // eye offset from centre
#define EYE_Y   132        // eye centre Y
#define EYE_R    20        // eye (white) radius
#define MOUTH_Y 200        // mouth reference line

/* --------------------------- MOOD TABLE ----------------------------- */
struct Mood {
  const char *name;
  const char *tip;
  uint16_t bg;             // screen background
  uint16_t face;           // face fill
  uint16_t dark;           // outlines, header/footer bars
  uint16_t leaf;           // little sprout on top of the head
};

const Mood moods[] = {
  /* 0 */ { "HAPPY",    "Soil moist - light just right",
            C565( 10, 60, 30), C565(150,205, 70), C565( 25, 55, 15), C565( 60,150, 50) },
  /* 1 */ { "THIRSTY",  "Soil is DRY - please water me!",
            C565( 70, 45, 15), C565(220,195,115), C565( 95, 60, 20), C565(150,140, 45) },
  /* 2 */ { "DROWNING", "Too much water - let me dry",
            C565( 10, 40, 90), C565(120,190,170), C565( 15, 55, 75), C565( 60,140,120) },
  /* 3 */ { "SLEEPY",   "Too dark - I need some light",
            C565(  8, 10, 35), C565( 80,115, 85), C565( 25, 45, 30), C565( 45, 90, 50) },
  /* 4 */ { "TOO HOT",  "Baking! move me to the shade",
            C565(110, 30, 10), C565(235,145, 90), C565(125, 40, 20), C565(170,120, 40) },
  /* 5 */ { "TOO COLD", "Brrr - bring me inside",
            C565( 15, 45, 80), C565(155,205,230), C565( 35, 75,115), C565( 70,150,140) }
};
#define N_MOODS (sizeof(moods)/sizeof(moods[0]))

/* --------------------------- STATE ---------------------------------- */
uint8_t  mood      = 0;
bool     autoMode  = false;
bool     talking   = false;      // driven by the Pi over serial
uint16_t frame     = 0;
uint32_t tAnim     = 0;
uint32_t tAuto     = 0;

int16_t  tearY[2];         // crying animation
int16_t  snowY[2];         // cold animation

// Mouth mask - covers every mouth shape across all six moods
#define MOUTH_X  (CX - 40)
#define MOUTH_W   80
#define MOUTH_TOP 176
#define MOUTH_H    72

/* ================= SMALL DRAWING HELPERS ============================ */

// thick arc: cx,cy = centre, r = radius, a0..a1 in degrees (0 = right, 90 = down)
void arcT(int cx, int cy, int r, int a0, int a1, int th, uint16_t col) {
  for (int a = a0; a <= a1; a += 2) {
    float rad = a * 0.01745329f;
    tft.fillCircle(cx + (int)(cos(rad) * r), cy + (int)(sin(rad) * r), th, col);
  }
}

void centerText(const char *s, int y, uint8_t size, uint16_t fg, uint16_t bg) {
  tft.setTextSize(size);
  tft.setTextColor(fg, bg);
  int w = strlen(s) * 6 * size;
  tft.setCursor((SCR_W - w) / 2, y);
  tft.print(s);
}

void eyeOpen(int x, int y, int r, int pr, int px, int py, uint16_t dark) {
  tft.fillCircle(x, y, r, WHITE);
  tft.drawCircle(x, y, r, dark);
  tft.fillCircle(x + px, y + py, pr, BLACK);
  tft.fillCircle(x + px - pr / 3, y + py - pr / 3, pr / 3 + 1, WHITE);  // glint
}

void eyeArcDown(int x, int y, uint16_t col) {          // closed / sleeping  "u"
  arcT(x, y - 8, 16, 20, 160, 2, col);
}
void eyeArcUp(int x, int y, uint16_t col) {            // squeezed shut  "n"
  arcT(x, y + 10, 16, 200, 340, 2, col);
}
void eyeSquint(int x, int y, uint16_t dark) {          // narrow slit
  tft.fillRoundRect(x - 18, y - 6, 36, 12, 6, WHITE);
  tft.drawRoundRect(x - 18, y - 6, 36, 12, 6, dark);
  tft.fillCircle(x, y, 5, BLACK);
}

void drawSprout(const Mood &M) {
  tft.fillRect(CX - 3, 36, 6, 34, M.leaf);
  tft.fillCircle(CX - 17, 46, 12, M.leaf);
  tft.fillCircle(CX + 17, 40, 12, M.leaf);
}

/* ================= THE SIX FACES ==================================== */
void drawMood(uint8_t m) {
  const Mood &M = moods[m];

  tft.fillScreen(M.bg);

  // header bar + name
  tft.fillRect(0, 0, SCR_W, 30, M.dark);
  centerText(M.name, 8, 2, WHITE, M.dark);

  // footer bar + hint
  tft.fillRect(0, 292, SCR_W, 28, M.dark);
  centerText(autoMode ? HINT_AUTO : HINT_IDLE, 301, 1, WHITE, M.dark);

  // one-line advice
  centerText(M.tip, 266, 1, WHITE, M.bg);

  drawSprout(M);
  tft.fillCircle(CX, CY, FR, M.face);
  tft.drawCircle(CX, CY, FR, M.dark);
  tft.drawCircle(CX, CY, FR - 1, M.dark);

  switch (m) {

    case 0:  // ---------------- HAPPY -----------------------------
      eyeOpen(CX - EYE_DX, EYE_Y, EYE_R, 9, 0, 2, M.dark);
      eyeOpen(CX + EYE_DX, EYE_Y, EYE_R, 9, 0, 2, M.dark);
      tft.fillCircle(CX - 60, 182, 11, C565(240,120,130));   // rosy cheeks
      tft.fillCircle(CX + 60, 182, 11, C565(240,120,130));
      arcT(CX, 176, 46, 20, 160, 3, M.dark);                 // big smile
      break;

    case 1:  // ---------------- THIRSTY ---------------------------
      eyeOpen(CX - EYE_DX, EYE_Y, EYE_R, 8, 0, 6, M.dark);   // droopy pupils
      eyeOpen(CX + EYE_DX, EYE_Y, EYE_R, 8, 0, 6, M.dark);
      tft.fillRect(CX - EYE_DX - EYE_R, EYE_Y - EYE_R - 1,
                   EYE_R * 2 + 1, EYE_R, M.face);            // heavy top lids
      tft.fillRect(CX + EYE_DX - EYE_R, EYE_Y - EYE_R - 1,
                   EYE_R * 2 + 1, EYE_R, M.face);
      arcT(CX - EYE_DX, EYE_Y - 2, EYE_R, 185, 355, 2, M.dark);
      arcT(CX + EYE_DX, EYE_Y - 2, EYE_R, 185, 355, 2, M.dark);
      for (int i = 0; i < 3; i++) {                          // dry "cracks"
        tft.drawLine(CX - 74 + i * 6, 172 + i * 9, CX - 62 + i * 6, 182 + i * 9, M.dark);
        tft.drawLine(CX + 62 + i * 6, 182 + i * 9, CX + 74 + i * 6, 172 + i * 9, M.dark);
      }
      arcT(CX, 244, 46, 200, 340, 3, M.dark);                // frown
      break;

    case 2:  // ---------------- DROWNING --------------------------
      eyeArcUp(CX - EYE_DX, EYE_Y, M.dark);
      eyeArcUp(CX + EYE_DX, EYE_Y, M.dark);
      tft.fillRoundRect(CX - 26, 194, 52, 46, 22, M.dark);   // wailing mouth
      tearY[0] = 152;  tearY[1] = 194;
      break;

    case 3:  // ---------------- SLEEPY ----------------------------
      eyeArcDown(CX - EYE_DX, EYE_Y, M.dark);
      eyeArcDown(CX + EYE_DX, EYE_Y, M.dark);
      tft.fillCircle(CX, 212, 13, M.dark);                   // snoring "o"
      break;

    case 4:  // ---------------- TOO HOT ---------------------------
      eyeSquint(CX - EYE_DX, EYE_Y, M.dark);
      eyeSquint(CX + EYE_DX, EYE_Y, M.dark);
      for (int x = -34; x <= 34; x += 2)                     // wavy mouth
        tft.fillCircle(CX + x, 208 + (int)(6 * sin(x * 0.22f)), 2, M.dark);
      break;

    case 5:  // ---------------- TOO COLD --------------------------
      eyeOpen(CX - EYE_DX, EYE_Y, 15, 7, 0, -2, M.dark);
      eyeOpen(CX + EYE_DX, EYE_Y, 15, 7, 0, -2, M.dark);
      tft.fillRoundRect(CX - 30, 192, 60, 30, 6, WHITE);     // chattering teeth
      tft.drawRoundRect(CX - 30, 192, 60, 30, 6, M.dark);
      tft.drawFastHLine(CX - 30, 207, 60, M.dark);
      for (int i = 1; i < 4; i++) tft.drawFastVLine(CX - 30 + i * 15, 192, 30, M.dark);
      snowY[0] = 40;  snowY[1] = 170;
      break;
  }
  frame = 0;
}

/* ================= TALKING MOUTH ==================================== */
// Simple opening/closing "O" that overrides the per-mood mouth while
// the Pi is streaming speech at us.
void animateMouth(uint16_t f) {
  const Mood &M = moods[mood];
  static const uint8_t phases[6] = { 6, 16, 26, 32, 22, 12 };
  uint8_t h = phases[f % 6];
  tft.fillRect(MOUTH_X, MOUTH_TOP, MOUTH_W, MOUTH_H, M.face);
  int y = MOUTH_TOP + (MOUTH_H - h) / 2;
  tft.fillRoundRect(CX - 24, y, 48, h, 10, M.dark);
  if (h > 12) tft.fillRoundRect(CX - 16, y + h - 6, 32, 4, 2, C565(210, 70, 80));
}

/* ================= PER-MOOD ANIMATION =============================== */
void animate(uint8_t m, uint16_t f) {
  if (talking) { animateMouth(f); return; }
  const Mood &M = moods[m];

  switch (m) {

    case 0: {                                   // blink every ~3 s
      uint8_t p = f % 30;
      if (p != 0 && p != 28) return;
      tft.fillCircle(CX - EYE_DX, EYE_Y, EYE_R + 2, M.face);
      tft.fillCircle(CX + EYE_DX, EYE_Y, EYE_R + 2, M.face);
      if (p == 28) {                            // eyes shut
        eyeArcDown(CX - EYE_DX, EYE_Y, M.dark);
        eyeArcDown(CX + EYE_DX, EYE_Y, M.dark);
      } else {                                  // eyes open again
        eyeOpen(CX - EYE_DX, EYE_Y, EYE_R, 9, 0, 2, M.dark);
        eyeOpen(CX + EYE_DX, EYE_Y, EYE_R, 9, 0, 2, M.dark);
      }
      break;
    }

    case 1: {                                   // panting tongue
      if (f % 4) return;
      int len = ((f / 4) & 1) ? 34 : 20;
      tft.fillRect(CX - 16, MOUTH_Y + 4, 32, 40, M.face);
      tft.fillRoundRect(CX - 11, MOUTH_Y + 4, 22, len, 8, C565(210, 70, 80));
      break;
    }

    case 2: {                                   // tears running down
      for (uint8_t s = 0; s < 2; s++) {
        int x = CX + (s ? EYE_DX : -EYE_DX);
        tft.fillCircle(x, tearY[s], 5, M.face);           // erase old drop
        tearY[s] += 9;
        if (tearY[s] > 232) tearY[s] = 152;
        tft.fillCircle(x, tearY[s], 5, C565(120, 200, 255));
      }
      break;
    }

    case 3: {                                   // floating  z z z
      if (f % 6) return;
      uint8_t n = (f / 6) % 4;
      tft.fillRect(146, 30, 94, 40, M.bg);
      tft.setTextColor(WHITE);
      if (n > 0) { tft.setTextSize(2); tft.setCursor(150, 50); tft.print('z'); }
      if (n > 1) { tft.setTextSize(3); tft.setCursor(174, 40); tft.print('z'); }
      if (n > 2) { tft.setTextSize(4); tft.setCursor(202, 32); tft.print('z'); }
      break;
    }

    case 4: {                                   // sweat flying off
      if (f % 3) return;
      static const uint8_t sx[3] = {202, 214, 226};
      static const uint8_t sy[3] = { 92,  76,  60};
      uint8_t n = (f / 3) % 3;
      tft.fillRect(194, 50, 46, 54, M.bg);
      tft.fillCircle(sx[n], sy[n], 5, C565(150, 220, 255));
      break;
    }

    case 5: {                                   // snow falling either side
      if (f & 1) return;
      static const uint8_t sxc[2] = {14, 226};
      for (uint8_t s = 0; s < 2; s++) {
        tft.fillCircle(sxc[s], snowY[s], 4, M.bg);
        snowY[s] += 12;
        if (snowY[s] > 284) snowY[s] = 38;
        tft.fillCircle(sxc[s], snowY[s], 4, WHITE);
      }
      break;
    }
  }
}

/* ================= INPUT: TOUCH SCREEN ============================== */
#if INPUT_TOUCH
// Returns 0 = nothing, 1 = short tap, 2 = long hold.
// Deliberately ignores WHERE you touched, so it needs no calibration
// and works whichever way round your touch panel is wired.
uint8_t readTouchAction() {
  static bool     down  = false;
  static bool     fired = false;
  static uint32_t tDown = 0;

  TSPoint p = ts.getPoint();
  pinMode(XM, OUTPUT);              // hand the shared pins back to the LCD
  pinMode(YP, OUTPUT);
  bool touched = (p.z > TS_MINPRESSURE && p.z < TS_MAXPRESSURE);

  if (touched && !down) {                       // finger down
    down = true;  fired = false;  tDown = millis();
  } else if (touched && down && !fired && millis() - tDown > TS_HOLD_MS) {
    fired = true;  return 2;                    // held long enough
  } else if (!touched && down) {                // finger lifted
    down = false;
    if (!fired && millis() - tDown > 40) return 1;
  }
  return 0;
}
#endif

/* ================= INPUT: ROTARY ENCODER ============================ */
#if INPUT_ENCODER
const int8_t ENC_TABLE[16] = { 0, -1,  1,  0,
                               1,  0,  0, -1,
                              -1,  0,  0,  1,
                               0,  1, -1,  0 };
uint8_t prevAB   = 0;
int8_t  encAccum = 0;

int8_t readEncoder() {
  uint8_t ab = (digitalRead(ENC_CLK) << 1) | digitalRead(ENC_DT);
  if (ab == prevAB) return 0;
  encAccum += ENC_TABLE[(prevAB << 2) | ab];
  prevAB = ab;
  if (encAccum >=  COUNTS_PER_DETENT) { encAccum = 0; return ENC_REVERSE ? -1 : +1; }
  if (encAccum <= -COUNTS_PER_DETENT) { encAccum = 0; return ENC_REVERSE ? +1 : -1; }
  return 0;
}

bool buttonPressed() {                       // debounced falling edge
  static uint8_t  last  = HIGH;
  static uint32_t tEdge = 0;
  uint8_t now = digitalRead(ENC_SW);
  if (now != last && millis() - tEdge > 40) {
    tEdge = millis();
    last  = now;
    if (now == LOW) return true;
  }
  return false;
}
#endif

/* ================= SHARED ACTIONS =================================== */
void gotoMood(int8_t step) {
  autoMode = false;
  mood = (mood + N_MOODS + step) % N_MOODS;
  Serial.print(F("Condition -> ")); Serial.println(moods[mood].name);
  drawMood(mood);
  tAuto = millis();
}

void toggleAuto() {
  autoMode = !autoMode;
  Serial.print(F("Auto mode ")); Serial.println(autoMode ? F("ON") : F("OFF"));
  drawMood(mood);
  tAuto = millis();
}

/* ================= SERIAL COMMAND PROTOCOL ==========================
   F0..F5  set face      T1/T0  talking on/off
   A1/A0   auto demo     ?      dump state
   -------------------------------------------------------------------- */
void handleCmd(char *s) {
  if (!s[0]) return;
  char c = s[0], a = s[1];
  if (c == 'F' && a >= '0' && a < '0' + (char)N_MOODS) {
    autoMode = false;
    mood = a - '0';
    drawMood(mood);
    Serial.print(F("OK F ")); Serial.println(moods[mood].name);
  } else if (c == 'T') {
    talking = (a == '1');
    if (!talking) drawMood(mood);         // restore the real mouth
    Serial.print(F("OK T ")); Serial.println(talking ? 1 : 0);
  } else if (c == 'A') {
    autoMode = (a == '1');
    drawMood(mood);
    Serial.print(F("OK A ")); Serial.println(autoMode ? 1 : 0);
  } else if (c == '?') {
    Serial.print(F("mood="));  Serial.print(moods[mood].name);
    Serial.print(F(" talk=")); Serial.print(talking ? 1 : 0);
    Serial.print(F(" auto=")); Serial.println(autoMode ? 1 : 0);
  } else {
    Serial.print(F("ERR "));   Serial.println(s);
  }
}

void pumpSerial() {
  static char buf[16];
  static uint8_t bi = 0;
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r' || bi >= sizeof(buf) - 1) {
      buf[bi] = 0;
      if (bi) handleCmd(buf);
      bi = 0;
    } else {
      buf[bi++] = c;
    }
  }
}

/* ================= SETUP / LOOP ===================================== */
void setup() {
  Serial.begin(9600);

#if INPUT_ENCODER
  pinMode(ENC_CLK, INPUT_PULLUP);
  pinMode(ENC_DT,  INPUT_PULLUP);
  pinMode(ENC_SW,  INPUT_PULLUP);
  prevAB = (digitalRead(ENC_CLK) << 1) | digitalRead(ENC_DT);
#endif

  uint16_t id = tft.readID();
  Serial.print(F("TFT ID = 0x")); Serial.println(id, HEX);
  // readID() is unreliable on this shield - it answers 0x9341 on some
  // resets and 0xD3D3 (a failed read) on others.  The controller is a
  // known ILI9341, so pin it down instead of trusting the read.
  id = 0x9341;
  tft.begin(id);
  tft.setRotation(0);                       // portrait 240 x 320

  drawMood(mood);
  tAnim = tAuto = millis();
}

void loop() {
  pumpSerial();

#if INPUT_TOUCH
  /* --- tap = next condition, hold = auto demo --- */
  static uint32_t tTouch = 0;
  if (millis() - tTouch > 30) {                 // poll gently, the touch
    tTouch = millis();                          // panel shares LCD pins
    uint8_t act = readTouchAction();
    if      (act == 1) gotoMood(+1);
    else if (act == 2) toggleAuto();
  }
#endif

#if INPUT_ENCODER
  /* --- knob turned: next / previous condition --- */
  int8_t step = readEncoder();
  if (step) gotoMood(step);

  /* --- knob pressed: toggle the auto demo --- */
  if (buttonPressed()) toggleAuto();
#endif

  if (autoMode && millis() - tAuto > 2500) {
    tAuto = millis();
    mood = (mood + 1) % N_MOODS;
    drawMood(mood);
  }

  /* --- animation tick (non-blocking) --- */
  if (millis() - tAnim > 110) {
    tAnim = millis();
    animate(mood, ++frame);
  }
}

/* =====================================================================
   WHEN THE REAL SENSORS ARRIVE
   ---------------------------------------------------------------------
   Drop the encoder part of loop() and call this instead.  A5 is the only
   analog pin the shield leaves free, so a second/third sensor needs an
   analog multiplexer (CD4051) or a board with more ADC inputs.

   uint8_t moodFromSensors() {
     int soil  = analogRead(A5);      // dry = high, wet = low (typical)
     int light = analogRead(A?);      // dark = low
     int temp  = analogRead(A?);

     if (light < 120)          return 3;   // SLEEPY   - too dark
     if (temp  > 800)          return 4;   // TOO HOT
     if (temp  < 200)          return 5;   // TOO COLD
     if (soil  > 700)          return 1;   // THIRSTY  - dry
     if (soil  < 300)          return 2;   // DROWNING - soaked
     return 0;                             // HAPPY
   }

   Read the sensors about once a second and only call drawMood() when the
   returned value actually changes (a full redraw takes ~0.3 s).  Add a
   little hysteresis so the face does not flicker between two moods when
   a reading sits right on a threshold.
   ===================================================================== */
