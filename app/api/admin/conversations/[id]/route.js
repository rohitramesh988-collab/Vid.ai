const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../../lib/auth");
const { prisma } = require("../../../../../lib/db");

async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, user: { select: { email: true } } },
  });
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ conversation });
}

module.exports = { GET };
