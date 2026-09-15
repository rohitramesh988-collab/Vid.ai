const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");

async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.savedPrompt.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return Response.json({ ok: true });
}

module.exports = { DELETE };
