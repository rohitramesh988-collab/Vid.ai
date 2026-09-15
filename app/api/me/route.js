const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../lib/auth");
const { prisma } = require("../../../lib/db");

async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return Response.json({ widgetKey: user.widgetKey, plan: user.plan, email: user.email });
}

module.exports = { GET };
