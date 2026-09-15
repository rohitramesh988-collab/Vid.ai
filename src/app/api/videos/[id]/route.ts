import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RENDERS_DIR } from "@/lib/renderVideo";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Not signed in.", { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== userId || !project.videoPath) {
    return new Response("Not found.", { status: 404 });
  }

  const filePath = path.join(RENDERS_DIR, `${id}.mp4`);
  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response("Video file missing.", { status: 404 });
  }

  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    const start = match ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : size - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "video/mp4",
      },
    });
  }

  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Length": String(size),
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${id}.mp4"`,
    },
  });
}
