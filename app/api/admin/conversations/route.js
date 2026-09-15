const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");

async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, plan: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, plan: true, role: true, createdAt: true, _count: { select: { conversations: true, sources: true } } },
  });

  return Response.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      userEmail: c.user.email,
      userPlan: c.user.plan,
      messageCount: c._count.messages,
      lastMessage: c.messages[0]?.content?.slice(0, 140) || "",
      updatedAt: c.updatedAt,
    })),
    users,
  });
}

module.exports = { GET };
