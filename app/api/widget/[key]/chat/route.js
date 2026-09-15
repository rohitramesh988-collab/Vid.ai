const { prisma } = require("../../../../../lib/db");
const { getOpenAI, CHAT_MODEL } = require("../../../../../lib/openai");
const { retrieveContext } = require("../../../../../lib/embeddings");
const { checkAndIncrementUsage } = require("../../../../../lib/usage");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function POST(req, { params }) {
  const owner = await prisma.user.findUnique({ where: { widgetKey: params.key } });
  if (!owner) return Response.json({ error: "Unknown widget" }, { status: 404, headers: CORS_HEADERS });

  const { message, history } = await req.json();
  if (!message || !message.trim())
    return Response.json({ error: "Message is required" }, { status: 400, headers: CORS_HEADERS });

  const usage = await checkAndIncrementUsage(owner.id, owner.plan);
  if (!usage.allowed) {
    return Response.json(
      { error: "This assistant has reached its daily message limit. Please try again tomorrow." },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  const setting = await prisma.setting.findUnique({ where: { key: "systemPrompt" } });
  let systemPrompt = setting?.value || "You are a helpful assistant.";

  let contextChunks = [];
  try {
    contextChunks = await retrieveContext(owner.id, message, 4);
  } catch {
    contextChunks = [];
  }
  if (contextChunks.length > 0) {
    const contextText = contextChunks.map((c) => `[Source: ${c.sourceName}]\n${c.content}`).join("\n\n---\n\n");
    systemPrompt += `\n\nUse the following knowledge base context to answer the visitor when relevant.\n\n${contextText}`;
  }

  const openai = getOpenAI();
  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = [
    { role: "system", content: systemPrompt },
    ...safeHistory.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
    { role: "user", content: message },
  ];

  let reply = "";
  try {
    const completion = await openai.chat.completions.create({ model: CHAT_MODEL, messages });
    reply = completion.choices?.[0]?.message?.content || "";
  } catch (err) {
    return Response.json({ error: `Model error: ${err.message}` }, { status: 500, headers: CORS_HEADERS });
  }

  return Response.json({ reply }, { headers: CORS_HEADERS });
}

module.exports = { POST, OPTIONS };
