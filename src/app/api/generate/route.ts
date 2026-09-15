import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateScript } from "@/lib/generateScript";

const schema = z.object({ projectId: z.string().min(1) });

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

  await prisma.project.update({ where: { id: project.id }, data: { status: "scripting", errorMessage: null } });

  try {
    const script = await generateScript(project.idea);

    await prisma.scene.deleteMany({ where: { projectId: project.id } });
    await prisma.$transaction(
      script.scenes.map((scene, i) =>
        prisma.scene.create({
          data: {
            projectId: project.id,
            order: i,
            voiceoverText: scene.voiceoverText,
            caption: scene.caption,
            visualPrompt: scene.visualPrompt,
            colorFrom: scene.colorFrom,
            colorTo: scene.colorTo,
          },
        })
      )
    );

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { title: script.title.slice(0, 120), status: "scripted", errorMessage: null },
      include: { scenes: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ project: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script generation failed.";
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "failed", errorMessage: message.slice(0, 1000) },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
