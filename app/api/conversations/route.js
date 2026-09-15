const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../lib/auth");
const { prisma } = require("../../../lib/db");

async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return Response.json({ conversations });
}

module.exports = { GET };
