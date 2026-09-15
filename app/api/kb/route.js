const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../lib/auth");
const { prisma } = require("../../../lib/db");

async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const sources = await prisma.source.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return Response.json({
    sources: sources.map((s) => ({
      id: s.id,
      type: s.type,
      name: s.name,
      origin: s.origin,
      createdAt: s.createdAt,
      chunkCount: s._count.chunks,
    })),
  });
}

module.exports = { GET };
