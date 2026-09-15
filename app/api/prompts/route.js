const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../lib/auth");
const { prisma } = require("../../../lib/db");

async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const prompts = await prisma.savedPrompt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ prompts });
}

async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) return Response.json({ error: "Title and content are required" }, { status: 400 });

  const prompt = await prisma.savedPrompt.create({
    data: { userId: session.user.id, title, content },
  });
  return Response.json({ prompt });
}

module.exports = { GET, POST };
