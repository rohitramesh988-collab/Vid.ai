const { getOpenAI, EMBEDDING_MODEL } = require("./openai");
const { prisma } = require("./db");

function chunkText(text, chunkSize = 1000, overlap = 150) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - overlap;
  }
  return chunks;
}

async function embedTexts(texts) {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

async function embedAndStoreSource(sourceId, text) {
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;

  const batchSize = 32;
  let stored = 0;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const vectors = await embedTexts(batch);
    await prisma.chunk.createMany({
      data: batch.map((content, idx) => ({
        sourceId,
        content,
        embedding: JSON.stringify(vectors[idx]),
      })),
    });
    stored += batch.length;
  }
  return stored;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function retrieveContext(userId, query, topK = 4) {
  const sources = await prisma.source.findMany({
    where: { userId },
    select: { id: true },
  });
  if (sources.length === 0) return [];

  const sourceIds = sources.map((s) => s.id);
  const chunks = await prisma.chunk.findMany({
    where: { sourceId: { in: sourceIds } },
    include: { source: { select: { name: true } } },
  });
  if (chunks.length === 0) return [];

  const [queryEmbedding] = await embedTexts([query]);

  const scored = chunks.map((c) => ({
    content: c.content,
    sourceName: c.source.name,
    score: cosineSimilarity(queryEmbedding, JSON.parse(c.embedding)),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0.15);
}

module.exports = { chunkText, embedTexts, embedAndStoreSource, retrieveContext, cosineSimilarity };
