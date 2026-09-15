import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderProjectVideo } from "@/lib/renderVideo";
import { canRenderAnotherVideo } from "@/lib/limits";

const schema = z.object({ projectId: z.string().min(1) });

// Rendering shells out to ffmpeg and can take a while for longer scripts -
// give it plenty of room on platforms that enforce a function timeout.
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const limit = await canRenderAnotherVideo(userId);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.reason }, { status: 402 });
  }

  try {
    await renderProjectVideo(project.id);
    const updated = await prisma.project.findUnique({ where: { id: project.id } });
    return NextResponse.json({ project: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video rendering failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
