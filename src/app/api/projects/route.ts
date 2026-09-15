import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  idea: z.string().min(10, "Give a bit more detail - at least 10 characters.").max(4000),
  aspect: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const title = parsed.data.idea.slice(0, 60);

  const project = await prisma.project.create({
    data: {
      userId,
      title,
      idea: parsed.data.idea,
      aspect: parsed.data.aspect,
      status: "draft",
    },
  });

  return NextResponse.json({ id: project.id });
}
