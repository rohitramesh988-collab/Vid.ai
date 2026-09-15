"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this project and its rendered video? This can't be undone.")) return;
    setLoading(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="shrink-0 rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      aria-label="Delete project"
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
