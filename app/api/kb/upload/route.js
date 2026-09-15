const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");
const { embedAndStoreSource } = require("../../../../lib/embeddings");
const { planFor } = require("../../../../lib/plans");

async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const count = await prisma.source.count({ where: { userId: session.user.id } });
  const limit = planFor(session.user.plan).maxSources;
  if (count >= limit) {
    return Response.json({ error: `Source limit reached (${limit}) on your plan. Upgrade to add more.` }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  if (!text || !text.trim()) {
    return Response.json({ error: "File appears to be empty or unreadable as text." }, { status: 400 });
  }

  const source = await prisma.source.create({
    data: { userId: session.user.id, type: "FILE", name: file.name },
  });

  const chunkCount = await embedAndStoreSource(source.id, text);

  return Response.json({ source: { id: source.id, name: source.name, chunkCount } });
}

module.exports = { POST };
