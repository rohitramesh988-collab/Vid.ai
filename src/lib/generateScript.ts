import Anthropic from "@anthropic-ai/sdk";

export type GeneratedScene = {
  voiceoverText: string;
  caption: string;
  visualPrompt: string;
  colorFrom: string;
  colorTo: string;
};

export type GeneratedScript = {
  title: string;
  scenes: GeneratedScene[];
};

const SYSTEM_PROMPT = `You are a short-form video scriptwriter for TikTok/Reels/Shorts style content.
Given an idea or a rough script, produce a tight, punchy scene-by-scene breakdown optimized for retention.

Rules:
- 5 to 8 scenes total.
- Each scene's voiceover line should be 1-2 short sentences, natural to read aloud, no more than ~22 words.
- The first scene must be a strong hook that stops the scroll.
- caption is the on-screen text overlay for that scene (short, punchy, can differ slightly from voiceoverText - usually a condensed version, ALL CAPS or Title Case).
- visualPrompt briefly describes what the background visual should depict (for an AI image/video generator) - a few words, vivid and concrete.
- colorFrom / colorTo are hex colors for a gradient background that fits the scene's mood (used as a fallback when no visual is rendered).
- title is a short, scroll-stopping video title (under 60 characters).

Respond with ONLY valid JSON matching exactly this shape, no markdown fences, no commentary:
{
  "title": string,
  "scenes": [
    { "voiceoverText": string, "caption": string, "visualPrompt": string, "colorFrom": string, "colorTo": string }
  ]
}`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env to enable AI script generation."
    );
  }
  return new Anthropic({ apiKey });
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text.trim();
}

export async function generateScript(idea: string): Promise<GeneratedScript> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Idea or script:\n"""\n${idea}\n"""\n\nGenerate the scene breakdown now.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return any text content.");
  }

  let parsed: GeneratedScript;
  try {
    parsed = JSON.parse(extractJson(textBlock.text));
  } catch {
    throw new Error("Claude's response could not be parsed as JSON. Please try again.");
  }

  if (!parsed.title || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
    throw new Error("Claude's response was missing required fields. Please try again.");
  }

  return {
    title: parsed.title,
    scenes: parsed.scenes.map((s) => ({
      voiceoverText: s.voiceoverText,
      caption: s.caption,
      visualPrompt: s.visualPrompt,
      colorFrom: /^#[0-9a-fA-F]{6}$/.test(s.colorFrom) ? s.colorFrom : "#7c3aed",
      colorTo: /^#[0-9a-fA-F]{6}$/.test(s.colorTo) ? s.colorTo : "#ec4899",
    })),
  };
}
