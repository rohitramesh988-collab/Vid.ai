import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/Nav";
import { NewProjectForm } from "@/components/NewProjectForm";
import { StatusBadge } from "@/components/StatusBadge";
import { FREE_MONTHLY_VIDEO_LIMIT } from "@/lib/limits";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { UpgradeButton } from "@/components/UpgradeButton";

const STATUS_FILTERS = ["all", "draft", "scripted", "ready", "failed"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const { q = "", status = "all" } = await searchParams;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const projects = await prisma.project.findMany({
    where: {
      userId,
      ...(q ? { title: { contains: q } } : {}),
      ...(status !== "all" ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scenes: true } } },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const readyThisMonth = await prisma.project.count({
    where: { userId, status: "ready", updatedAt: { gte: startOfMonth } },
  });

  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Your videos</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {user?.plan === "pro" ? (
                "Pro plan — unlimited renders."
              ) : (
                <>
                  {readyThisMonth}/{FREE_MONTHLY_VIDEO_LIMIT} free renders used this month.
                </>
              )}
            </p>
          </div>
          {user?.plan !== "pro" && <UpgradeButton />}
        </div>

        <div className="mb-8">
          <NewProjectForm />
        </div>

        <form className="mb-6 flex flex-wrap items-center gap-3" action="/dashboard">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by title…"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s} className="bg-neutral-900">
                {s === "all" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:border-white/30"
          >
            Filter
          </button>
          {(q || status !== "all") && (
            <Link href="/dashboard" className="text-sm text-neutral-400 underline">
              Clear
            </Link>
          )}
        </form>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <p className="text-lg font-medium">
              {q || status !== "all" ? "No projects match your filters." : "No videos yet."}
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              {q || status !== "all"
                ? "Try clearing your search or filter."
                : "Drop an idea into the box above to generate your first script."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20">
                  <Link href={`/dashboard/${p.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      <span className="truncate font-medium">{p.title || "Untitled"}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {p._count.scenes} scene{p._count.scenes === 1 ? "" : "s"} · {p.aspect} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <DeleteProjectButton projectId={p.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
