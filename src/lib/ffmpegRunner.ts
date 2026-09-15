import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import ffprobePathPkg from "ffprobe-static";

// FFMPEG_PATH / FFPROBE_PATH let you override the bundled binaries with a
// system install - e.g. on Replit, where the Nix-based environment can't
// always run prebuilt binaries that expect standard FHS shared-library paths.
// Point these at `nix`-provided binaries (commonly /nix/store/.../bin/ffmpeg,
// or just "ffmpeg"/"ffprobe" if they're on PATH) if videos fail to render
// with a "spawn ENOENT" or dynamic-linker error.
export const FFMPEG_BIN = process.env.FFMPEG_PATH || (ffmpegPath as unknown as string) || "ffmpeg";
export const FFPROBE_BIN =
  process.env.FFPROBE_PATH || (ffprobePathPkg as unknown as { path: string }).path || "ffprobe";

export function runBin(bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} exited with code ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

export async function probeDurationSeconds(filePath: string): Promise<number> {
  const { stdout } = await runBin(FFPROBE_BIN, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Could not determine duration of ${filePath}`);
  }
  return seconds;
}
