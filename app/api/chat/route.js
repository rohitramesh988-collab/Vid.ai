const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../lib/auth");
const { prisma } = require("../../../lib/db");
const { getOpenAI, CHAT_MODEL } = require("../../../lib/openai");
const { retrieveContext } = require("../../../lib/embeddings");
const { checkAndIncrementUsage } = require("../../../lib/usage");

async function getSystemPrompt() {
  const setting = await prisma.setting.findUnique({ where: { key: "systemPrompt" } });
  return setting?.value || "You are a helpful assistant.";
}

async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { conversationId, message } = await req.json();
  if (!message || !message.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const usage = await checkAndIncrementUsage(session.user.id, session.user.plan);
  if (!usage.allowed) {
    return Response.json(
      { error: `Daily message limit reached (${usage.limit}/day on your plan). Upgrade for more.` },
      { status: 429 }
    );
  }

  let conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: session.user.id } })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: session.user.id, title: message.slice(0, 60) },
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  let systemPrompt = await getSystemPrompt();

  let contextChunks = [];
  try {
    contextChunks = await retrieveContext(session.user.id, message, 4);
  } catch (e) {
    contextChunks = [];
  }

  if (contextChunks.length > 0) {
    const contextText = contextChunks
      .map((c, i) => `[Source: ${c.sourceName}]\n${c.content}`)
      .join("\n\n---\n\n");
    systemPrompt += `\n\nUse the following knowledge base context to answer the user when relevant. If the context doesn't contain the answer, say you're not certain rather than inventing details.\n\n${contextText}`;
  }

  const openai = getOpenAI();
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId: conversation.id })}\n\n`));
      try {
        const completion = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages,
          stream: true,
        });

        for await (const part of completion) {
          const delta = part.choices?.[0]?.delta?.content || "";
          if (delta) {
            assistantText += delta;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ delta })}\n\n`));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ delta: `\n\n[Error contacting the model: ${err.message}]` })}\n\n`)
        );
      }

      await prisma.message.create({
        data: { conversationId: conversation.id, role: "assistant", content: assistantText || "" },
      });
      await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

module.exports = { POST };
