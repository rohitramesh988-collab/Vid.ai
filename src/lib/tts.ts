import { writeFile } from "node:fs/promises";

/**
 * Generates a voiceover mp3 for a scene using OpenAI's TTS API.
 * Returns null (no audio) when OPENAI_API_KEY isn't configured, so the app
 * still works end-to-end without it - just with silent scenes and captions.
 */
export async function generateVoiceover(
  text: string,
  voice: string,
  outPath: string
): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: voice || "alloy",
      input: text,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI TTS failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buffer);
  return true;
}
