import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These ship native binaries (ffmpeg/ffprobe) whose paths must be resolved
  // at runtime, not inlined by the bundler - bundling them corrupts the path.
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
};

export default nextConfig;
