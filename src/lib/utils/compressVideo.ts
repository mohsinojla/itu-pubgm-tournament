/**
 * Browser-side video compression using FFmpeg.wasm.
 * Loaded lazily from CDN on first use — ~31 MB download, then cached by the browser.
 *
 * Rules:
 *  - < 5 MB  → returned unchanged
 *  - ≥ 5 MB  → compressed with libx264 CRF 28 at up to 1080p
 *  - Still ≥ 5 MB → second pass: CRF 35 scaled to 480p
 *  - Still ≥ 5 MB → returned as-is with a warning flag
 *
 * Max accepted input: 500 MB. Anything larger is rejected before compression.
 */

export type VideoCompressProgress = {
  stage: "loading" | "preparing" | "compressing" | "done";
  pct: number; // 0-100
};

// Module-level singleton so FFmpeg is only loaded once per page session
let _ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let _loading = false;
const _loadWaiters: Array<() => void> = [];

async function getFFmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (_ffmpeg) return _ffmpeg;

  if (_loading) {
    await new Promise<void>((res) => _loadWaiters.push(res));
    return _ffmpeg!;
  }

  _loading = true;

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ff = new FFmpeg();

  const BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ff.load({
    coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });

  _ffmpeg = ff;
  _loading = false;
  _loadWaiters.forEach((r) => r());
  _loadWaiters.length = 0;

  return ff;
}

export const MAX_VIDEO_INPUT_MB = 500;
export const MAX_VIDEO_OUTPUT_MB = 5;

export async function compressVideo(
  file: File,
  onProgress?: (p: VideoCompressProgress) => void
): Promise<{ file: File; compressed: boolean; warning?: string }> {
  const MAX_OUT = MAX_VIDEO_OUTPUT_MB * 1024 * 1024;
  const MAX_IN = MAX_VIDEO_INPUT_MB * 1024 * 1024;

  if (file.size > MAX_IN) {
    throw new Error(
      `Video is too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Maximum accepted size is ${MAX_VIDEO_INPUT_MB} MB.`
    );
  }

  if (file.size <= MAX_OUT) {
    onProgress?.({ stage: "done", pct: 100 });
    return { file, compressed: false };
  }

  // Need compression — load FFmpeg
  onProgress?.({ stage: "loading", pct: 0 });
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFFmpeg();

  onProgress?.({ stage: "preparing", pct: 5 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const inputName = `input.${ext}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const runPass = async (
    outputName: string,
    crf: string,
    scaleFilter: string,
    audioBitrate: string,
    progressStart: number,
    progressEnd: number
  ): Promise<Blob> => {
    let lastPct = progressStart;

    const handler = ({ progress }: { progress: number }) => {
      const pct = Math.round(
        progressStart + progress * (progressEnd - progressStart)
      );
      if (pct > lastPct) {
        lastPct = pct;
        onProgress?.({ stage: "compressing", pct });
      }
    };

    ffmpeg.on("progress", handler);

    await ffmpeg.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-crf", crf,
      "-preset", "fast",
      "-vf", `${scaleFilter},scale=trunc(iw/2)*2:trunc(ih/2)*2`,
      "-c:a", "aac",
      "-b:a", audioBitrate,
      "-movflags", "+faststart",
      "-y", outputName,
    ]);

    ffmpeg.off("progress", handler);

    const data = await ffmpeg.readFile(outputName);
    await ffmpeg.deleteFile(outputName);

    // readFile returns string | Uint8Array<ArrayBufferLike>.
    // Copy into a plain ArrayBuffer so TypeScript accepts it as a BlobPart.
    const src = typeof data === "string" ? new TextEncoder().encode(data) : (data as Uint8Array);
    const plain = new ArrayBuffer(src.byteLength);
    new Uint8Array(plain).set(src);
    return new Blob([plain], { type: "video/mp4" });
  };

  let blob: Blob;

  // Pass 1: CRF 28, keep original resolution (cap at 1080p)
  blob = await runPass("out1.mp4", "28", "scale=-2:min(ih\\,1080)", "96k", 5, 55);

  let warning: string | undefined;

  if (blob.size > MAX_OUT) {
    // Pass 2: CRF 35, scale to 480p
    blob = await runPass("out2.mp4", "35", "scale=-2:480", "64k", 55, 95);

    if (blob.size > MAX_OUT) {
      warning = `Video compressed but still ${(blob.size / 1024 / 1024).toFixed(1)} MB (target < ${MAX_VIDEO_OUTPUT_MB} MB). Consider trimming it.`;
    }
  }

  await ffmpeg.deleteFile(inputName);

  onProgress?.({ stage: "done", pct: 100 });

  const outFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, ".mp4"),
    { type: "video/mp4", lastModified: Date.now() }
  );

  return { file: outFile, compressed: true, warning };
}
