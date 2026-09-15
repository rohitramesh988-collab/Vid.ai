import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RENDERS_DIR } from "@/lib/renderVideo";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (project.videoPath) {
    const filePath = path.join(RENDERS_DIR, `${id}.mp4`);
    await unlink(filePath).catch(() => {});
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
