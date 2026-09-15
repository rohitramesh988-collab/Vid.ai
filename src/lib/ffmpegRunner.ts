import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import ffprobePathPkg from "ffprobe-static";

export const FFMPEG_BIN = (ffmpegPath as unknown as string) ?? "ffmpeg";
export const FFPROBE_BIN = (ffprobePathPkg as unknown as { path: string }).path ?? "ffprobe";

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
