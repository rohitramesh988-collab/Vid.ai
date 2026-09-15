import path from "node:path";
import os from "node:os";
import { mkdtemp, mkdir, writeFile, rm, copyFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { FFMPEG_BIN, runBin, probeDurationSeconds } from "@/lib/ffmpegRunner";
import { generateVoiceover } from "@/lib/tts";
import { buildCaptionAss } from "@/lib/assSubtitle";

const WIDTH = 1080;
const HEIGHT = 1920;
const FONTS_DIR = path.join(process.cwd(), "assets", "fonts");
// Deliberately NOT under /public: `next start` snapshots the public directory
// at boot and won't serve files written there afterward, which is exactly
// what happens every time a video finishes rendering. Videos are streamed
// through /api/videos/[id] instead - see that route.
export const RENDERS_DIR = path.join(process.cwd(), "storage", "renders");

function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = 2.5;
  return Math.max(2.5, words / wordsPerSecond + 1.1);
}

export async function renderProjectVideo(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { scenes: { orderBy: { order: "asc" } } },
  });
  if (!project) throw new Error("Project not found");
  if (project.scenes.length === 0) throw new Error("Project has no scenes to render");

  await prisma.project.update({ where: { id: projectId }, data: { status: "rendering", errorMessage: null } });

  const workDir = await mkdtemp(path.join(os.tmpdir(), "vidai-"));

  try {
    const sceneFiles: string[] = [];
    let totalDuration = 0;

    for (const scene of project.scenes) {
      const idx = scene.order;
      const audioPath = path.join(workDir, `scene-${idx}.mp3`);
      const hasAudio = await generateVoiceover(scene.voiceoverText, project.voice, audioPath);

      const duration = hasAudio ? await probeDurationSeconds(audioPath) : estimateDuration(scene.voiceoverText);
      totalDuration += duration;

      const assPath = path.join(workDir, `scene-${idx}.ass`);
      await writeFile(assPath, buildCaptionAss(scene.caption, duration, WIDTH, HEIGHT), "utf-8");

      const sceneOut = path.join(workDir, `scene-${idx}.mp4`);
      const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      const escapedFontsDir = FONTS_DIR.replace(/\\/g, "/").replace(/:/g, "\\:");

      const args = [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `gradients=s=${WIDTH}x${HEIGHT}:d=${duration}:c0=${scene.colorFrom}:c1=${scene.colorTo}:n=2:x0=0:y0=0:x1=${WIDTH}:y1=${HEIGHT}`,
        ...(hasAudio
          ? ["-i", audioPath]
          : ["-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`]),
        "-t",
        String(duration),
        "-vf",
        `subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'`,
        "-r",
        "30",
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        sceneOut,
      ];

      await runBin(FFMPEG_BIN, args);
      sceneFiles.push(sceneOut);

      await prisma.scene.update({
        where: { id: scene.id },
        data: { durationSec: duration, audioPath: hasAudio ? audioPath : null },
      });
    }

    const listPath = path.join(workDir, "concat.txt");
    const listContent = sceneFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listPath, listContent, "utf-8");

    const finalTemp = path.join(workDir, "final.mp4");
    await runBin(FFMPEG_BIN, ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", finalTemp]);

    await mkdir(RENDERS_DIR, { recursive: true });
    const finalPath = path.join(RENDERS_DIR, `${projectId}.mp4`);
    await copyFile(finalTemp, finalPath);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "ready",
        videoPath: `/api/videos/${projectId}`,
        videoDuration: totalDuration,
        errorMessage: null,
      },
    });
  } catch (err) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message.slice(0, 1000) : "Unknown render error",
      },
    });
    throw err;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
