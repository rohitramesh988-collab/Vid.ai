const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const setting = await prisma.setting.findUnique({ where: { key: "systemPrompt" } });
  return Response.json({ systemPrompt: setting?.value || "" });
}

async function POST(req) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { systemPrompt } = await req.json();
  await prisma.setting.upsert({
    where: { key: "systemPrompt" },
    update: { value: systemPrompt },
    create: { key: "systemPrompt", value: systemPrompt },
  });
  return Response.json({ ok: true });
}

module.exports = { GET, POST };
