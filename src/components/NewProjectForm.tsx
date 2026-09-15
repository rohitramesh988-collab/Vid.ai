"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const ASPECTS = [
  { value: "9:16", label: "Vertical (9:16) — Reels/TikTok/Shorts" },
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
];

export function NewProjectForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, aspect }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/dashboard/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <label className="mb-2 block text-sm font-medium text-neutral-200">
        What&apos;s the video about?
      </label>
      <textarea
        required
        minLength={10}
        rows={4}
        placeholder="e.g. 3 things nobody tells you before your first marathon — or paste a full script."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={aspect}
          onChange={(e) => setAspect(e.target.value)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-400"
        >
          {ASPECTS.map((a) => (
            <option key={a.value} value={a.value} className="bg-neutral-900">
              {a.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white px-5 py-2.5 font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create project"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
