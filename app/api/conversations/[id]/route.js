const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");

async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ conversation });
}

async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.conversation.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return Response.json({ ok: true });
}

module.exports = { GET, DELETE };
