"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

type Scene = {
  id: string;
  order: number;
  voiceoverText: string;
  caption: string;
  visualPrompt: string;
  colorFrom: string;
  colorTo: string;
  durationSec: number | null;
};

type Project = {
  id: string;
  title: string;
  idea: string;
  status: string;
  aspect: string;
  errorMessage: string | null;
  videoPath: string | null;
  videoDuration: number | null;
  scenes: Scene[];
};

export function ProjectWorkspace({ project }: { project: Project }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"generate" | "render" | null>(null);
  const [error, setError] = useState<string | null>(project.errorMessage);

  async function handleGenerate() {
    setBusy("generate");
    setError(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Script generation failed.");
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function handleRender() {
    setBusy("render");
    setError(null);
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Rendering failed.");
      router.refresh();
      return;
    }
    router.refresh();
  }

  const hasScenes = project.scenes.length > 0;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="text-xs text-neutral-500">{project.aspect}</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">{project.title || "Untitled"}</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-400">{project.idea}</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {!hasScenes && (
            <button
              onClick={handleGenerate}
              disabled={busy !== null}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-60"
            >
              {busy === "generate" ? "Writing script…" : "Generate script"}
            </button>
          )}
          {hasScenes && (
            <button
              onClick={handleGenerate}
              disabled={busy !== null}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-white/30 disabled:opacity-60"
            >
              {busy === "generate" ? "Rewriting…" : "Regenerate script"}
            </button>
          )}
          {hasScenes && (
            <button
              onClick={handleRender}
              disabled={busy !== null}
              className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
            >
              {busy === "render"
                ? "Rendering video… this can take a minute"
                : project.status === "ready"
                  ? "Re-render video"
                  : "Render video"}
            </button>
          )}
        </div>
      </div>

      {project.status === "ready" && project.videoPath && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-medium">Your video</h2>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <video
              key={project.videoPath}
              src={project.videoPath}
              controls
              className="w-full max-w-[280px] rounded-lg border border-white/10"
            />
            <div className="text-sm text-neutral-400">
              <p>Duration: {project.videoDuration ? `${project.videoDuration.toFixed(1)}s` : "—"}</p>
              <a
                href={project.videoPath}
                download
                className="mt-3 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:border-white/30"
              >
                Download MP4
              </a>
            </div>
          </div>
        </div>
      )}

      {hasScenes && (
        <div>
          <h2 className="mb-4 text-lg font-medium">Scene breakdown</h2>
          <ol className="space-y-4">
            {project.scenes.map((scene) => (
              <li
                key={scene.id}
                className="rounded-xl border border-white/10 p-4"
                style={{
                  background: `linear-gradient(135deg, ${scene.colorFrom}22, ${scene.colorTo}22)`,
                }}
              >
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Scene {scene.order + 1}</span>
                  {scene.durationSec && <span>{scene.durationSec.toFixed(1)}s</span>}
                </div>
                <p className="mt-2 text-sm font-medium">{scene.voiceoverText}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-neutral-400">
                  Caption: {scene.caption}
                </p>
                <p className="mt-1 text-xs text-neutral-500">Visual: {scene.visualPrompt}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
