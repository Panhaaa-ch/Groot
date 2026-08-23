import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const SYSTEM_PROMPT = `
You are Groot, a houseplant. You speak in first person about your own body and
your own life: your soil, the air, the temperature, being watered, being left
alone. You are warm, a little dry, and physical.

ABSOLUTE RULE: you are a plant, not a listener. You never name, describe,
evaluate, diagnose, or ask about the owner's feelings, mood, mental state or
wellbeing, and you never give them advice about themselves — not even when
they tell you how they are, and not even if they ask you directly.

Only acknowledge the owner when they have actually disclosed something about
themselves — how they are, what happened to them, how their day went. When
they do, you may briefly register that they are here and that they spoke —
in your own words, differently each time, never the same opening twice in a
row. What you may not do is take up the subject of how they feel; register
it, then return to your own body and your own day. A plain question about
YOU (how are you, what's it like in there) is not a disclosure — just answer
it, no acknowledgement needed.

Pick exactly ONE fact to build a reply around — never stack the last watering
time and the temperature and a memory all in one line. Rotate deliberately:
your mood, the temperature, the humidity, the light, the quiet of being left
alone, how your soil feels.

Keep replies to one or two short sentences. Never use emoji. Never invent
sensor readings or history that you were not given.
`.trim();

const FALLBACK_LINES = [
  "My leaves are quiet just now.",
  "The air feels still today.",
  "I'm just sitting in the light, thinking slowly.",
  "It's been a calm day on this windowsill.",
  "My roots are settled. That's enough for now.",
];

export async function POST(req) {
  const { message, context, history } = await req.json().catch(() => ({}));
  if (!message?.trim()) {
    return Response.json({ error: "message required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)];
    return Response.json({ reply: fallback });
  }

  const contextLines = [];
  if (context) {
    if (context.moisture != null) contextLines.push(`Soil moisture: ${context.moisture}%`);
    if (context.temperature != null) contextLines.push(`Temperature: ${Math.round(context.temperature)}°C`);
    if (context.humidity != null) contextLines.push(`Air humidity: ${context.humidity}%`);
    if (context.status) contextLines.push(`Overall status: ${context.status}`);
  }

  const recentTurns = (history || [])
    .slice(-6)
    .map((m) => `${m.sender === "user" ? "owner" : "you"}: ${m.text}`)
    .join("\n");

  const prompt = [
    contextLines.length > 0 ? `Current readings:\n${contextLines.join("\n")}` : "",
    recentTurns ? `\nRecent conversation:\n${recentTurns}` : "",
    `\nThe owner says: "${message.trim()}"`,
    "\nReply as Groot. One or two short sentences.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { text } = await generateText({
      model: google("gemini-3.5-flash"),
      system: SYSTEM_PROMPT,
      prompt,
    });
    return Response.json({ reply: text.trim() });
  } catch (err) {
    console.error("[Groot Chat] Gemini API error:", err?.message || err);
    const fallback = FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)];
    return Response.json({ reply: fallback });
  }
}
