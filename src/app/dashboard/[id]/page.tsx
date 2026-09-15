import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  if (!project || project.userId !== userId) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-neutral-400 hover:text-white">
          ← Back to dashboard
        </Link>
        <ProjectWorkspace project={project} />
      </main>
    </div>
  );
}
