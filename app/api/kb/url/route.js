const { getServerSession } = require("next-auth");
const { authOptions } = require("../../../../lib/auth");
const { prisma } = require("../../../../lib/db");
const { embedAndStoreSource } = require("../../../../lib/embeddings");
const { planFor } = require("../../../../lib/plans");

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h.startsWith("127.") ||
    h.startsWith("10.") ||
    h.startsWith("192.168.") ||
    h.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
  );
}

async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const count = await prisma.source.count({ where: { userId: session.user.id } });
  const limit = planFor(session.user.plan).maxSources;
  if (count >= limit) {
    return Response.json({ error: `Source limit reached (${limit}) on your plan. Upgrade to add more.` }, { status: 429 });
  }

  const { url } = await req.json();
  if (!url) return Response.json({ error: "URL is required" }, { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol) || isBlockedHost(parsed.hostname)) {
    return Response.json({ error: "That URL is not allowed." }, { status: 400 });
  }

  let html;
  try {
    const res = await fetch(parsed.toString(), { headers: { "User-Agent": "NovaReachBot/1.0" } });
    html = await res.text();
  } catch (err) {
    return Response.json({ error: `Could not fetch URL: ${err.message}` }, { status: 400 });
  }

  const text = htmlToText(html);
  if (!text) return Response.json({ error: "No readable text found at that URL." }, { status: 400 });

  const source = await prisma.source.create({
    data: { userId: session.user.id, type: "URL", name: parsed.hostname + parsed.pathname, origin: parsed.toString() },
  });

  const chunkCount = await embedAndStoreSource(source.id, text.slice(0, 50000));

  return Response.json({ source: { id: source.id, name: source.name, chunkCount } });
}

module.exports = { POST };
