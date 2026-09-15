{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    # System ffmpeg as a fallback for the bundled ffmpeg-static binary - see
    # FFMPEG_PATH / FFPROBE_PATH in src/lib/ffmpegRunner.ts and the README's
    # "Deploying to Replit" section.
    pkgs.ffmpeg
  ];
}
