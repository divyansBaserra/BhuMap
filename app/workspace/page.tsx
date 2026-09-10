"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type {
  GeoJSONFeatureCollection,
  DetectedFootprint,
} from "@/components/WorkspaceMap";

/* ------------------------------------------------------------------ */
/*  Dynamic import – Leaflet must NEVER run on the server              */
/* ------------------------------------------------------------------ */
const WorkspaceMap = dynamic(() => import("@/components/WorkspaceMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span className="text-sm text-slate-400">Initialising flat canvas…</span>
      </div>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Client-side GeoTIFF -> Base64 Data URL converter                   */
/* ------------------------------------------------------------------ */
async function parseTiffToDataUrl(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  const { fromArrayBuffer } = await import("geotiff");
  const buffer = await file.arrayBuffer();
  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const rasters = await image.readRasters();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create HTML canvas 2D rendering context.");
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  const numBands = Array.isArray(rasters) ? rasters.length : 1;
  const rBand = (Array.isArray(rasters) ? rasters[0] : rasters) as ArrayLike<number>;
  const gBand = (numBands >= 3 ? rasters[1] : rBand) as ArrayLike<number>;
  const bBand = (numBands >= 3 ? rasters[2] : rBand) as ArrayLike<number>;
  const aBand = numBands >= 4 ? (rasters[3] as ArrayLike<number>) : null;

  // Normalization for 16-bit or floating-point raster samples
  let maxVal = 255;
  for (let i = 0; i < Math.min(totalPixels, 3000); i++) {
    if (rBand[i] > maxVal) {
      maxVal = 65535;
      break;
    }
  }
  const scale = maxVal > 255 ? 255 / maxVal : 1;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    data[idx] = Math.min(255, Math.max(0, Math.round(rBand[i] * scale)));
    data[idx + 1] = Math.min(255, Math.max(0, Math.round(gBand[i] * scale)));
    data[idx + 2] = Math.min(255, Math.max(0, Math.round(bBand[i] * scale)));
    data[idx + 3] = aBand
      ? Math.min(255, Math.max(0, Math.round(aBand[i] * scale)))
      : 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  return { dataUrl, width, height };
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function WorkspacePage() {
  /* — state -------------------------------------------------------- */
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [decodingTiff, setDecodingTiff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [footprints, setFootprints] = useState<DetectedFootprint[] | null>(null);
  const [geojson, setGeojson] = useState<GeoJSONFeatureCollection | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUrlRef = useRef<string | null>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  /* — derived analytics -------------------------------------------- */
  const totalDetected = footprints?.length ?? geojson?.features?.length ?? 0;
  const avgConfidence =
    totalDetected > 0 && footprints
      ? (
          (footprints.reduce((sum, f) => sum + (f.confidence ?? 0), 0) /
            totalDetected) *
          100
        ).toFixed(1)
      : "—";

  /* — file handlers (JPG, PNG, TIF, TIFF) --------------------------- */
  const handleFile = useCallback(async (f: File | null) => {
    if (!f) return;
    const isTiff =
      /\.(tiff?)$/i.test(f.name) ||
      f.type === "image/tiff" ||
      f.type === "image/tif";
    const isImage = /\.(jpe?g|png)$/i.test(f.name) || f.type.startsWith("image/");

    if (!isTiff && !isImage) {
      setError(
        "Please select a valid drone image file (.tif, .tiff, .jpg, or .png)."
      );
      return;
    }

    // Revoke previous blob URL if exists
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }

    setFile(f);
    setError(null);
    setFootprints(null);
    setGeojson(null);

    if (isTiff) {
      // Parse TIFF on client side with geotiff and hidden canvas
      setDecodingTiff(true);
      try {
        const { dataUrl, width, height } = await parseTiffToDataUrl(f);
        setImageDimensions({ width, height });
        setImageUrl(dataUrl);
      } catch (err: any) {
        console.error("TIFF decoding failed:", err);
        setError(`Failed to parse TIFF image: ${err?.message || "Unknown error"}`);
      } finally {
        setDecodingTiff(false);
      }
    } else {
      // Standard JPG / PNG via URL.createObjectURL()
      const objectUrl = URL.createObjectURL(f);
      activeUrlRef.current = objectUrl;

      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setImageUrl(objectUrl);
      };
      img.onerror = () => {
        setError("Failed to decode image dimensions.");
      };
      img.src = objectUrl;
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFile(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFile]
  );

  /* — real backend AI footprint detection -------------------------- */
  const runDetection = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setFootprints(null);
    setGeojson(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/api/detect-footprints", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Server responded ${res.status}${text ? `: ${text}` : ""}`
        );
      }

      const data = await res.json();

      if (data.status === "success") {
        if (data.footprints && Array.isArray(data.footprints)) {
          setFootprints(data.footprints);
        }
        if (data.geojson) {
          setGeojson(data.geojson);
        }
        if (data.footprints_detected === 0) {
          setError(
            "No building footprints detected in this image. Try an image with clearer building/roof visibility."
          );
        }
      } else {
        throw new Error(data.detail || "Backend returned an unsuccessful response.");
      }
    } catch (err: any) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        setError(
          "Cannot reach FastAPI backend at 127.0.0.1:8000. Ensure python api_server.py is running."
        );
      } else {
        setError(err.message ?? "An unexpected error occurred during AI detection.");
      }
    } finally {
      setLoading(false);
    }
  }, [file]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ————————————————————— LEFT SIDEBAR ————————————————————— */}
      <aside className="flex w-96 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        {/* ---------- Header ---------- */}
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100">
                BhuMap Workspace
              </h1>
              <span className="inline-block mt-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Flat Canvas · CRS.Simple
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Scrollable body ---------- */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* — Upload zone — */}
          <section>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Drone Imagery Input
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragOver
                  ? "border-sky-500 bg-sky-500/5"
                  : file
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tif,.tiff,.jpg,.jpeg,.png,image/tiff,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {decodingTiff ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                  <span className="text-xs font-semibold text-sky-400">
                    Decoding GeoTIFF Raster…
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Rendering TIFF onto flat canvas via geotiff
                  </span>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 break-all">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                    {imageDimensions
                      ? ` · ${imageDimensions.width} × ${imageDimensions.height} px`
                      : ""}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Click to replace image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    Drop drone image or click to browse
                  </span>
                  <span className="text-[11px] text-slate-500">
                    .tif / .tiff / .jpg / .png · GeoTIFF Native
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* — Run button — */}
          <button
            onClick={runDetection}
            disabled={!file || loading || decodingTiff}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
              !file || loading || decodingTiff
                ? "cursor-not-allowed bg-slate-800 text-slate-600"
                : "bg-sky-600 text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing AI Model…
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run AI Footprint Detection
              </>
            )}
          </button>

          {/* — Error / notice banner — */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-[13px] leading-relaxed text-red-400">
                {error}
              </span>
            </div>
          )}

          {/* — Analytics cards — */}
          <section>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Detection Analytics
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-[11px] font-medium text-slate-500">
                  Total Footprints
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-100">
                  {totalDetected}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <p className="text-[11px] font-medium text-slate-500">
                  Avg Confidence
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-sky-400">
                  {avgConfidence}
                  {avgConfidence !== "—" && (
                    <span className="text-base font-semibold">%</span>
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* — Feature list — */}
          {footprints && footprints.length > 0 && (
            <section>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Detected Footprints ({footprints.length})
              </label>
              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto rounded-xl border border-slate-800 bg-slate-800/30 p-2">
                {footprints.map((f, i) => {
                  const conf =
                    f.confidence != null
                      ? `${(f.confidence * 100).toFixed(1)}%`
                      : "—";
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-sky-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">
                            {f.category || `Footprint ${i + 1}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {f.id} · {f.dimensions}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-sky-400 shrink-0">
                        {conf}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Spacer pushes status to bottom */}
          <div className="flex-1" />

          {/* — System status — */}
          <section className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
            <label className="mb-3 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              System Status
            </label>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Canvas Engine</span>
                <span className="text-[12px] font-semibold text-slate-300">
                  Leaflet CRS.Simple
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Environment</span>
                <span className="text-[12px] font-semibold text-slate-300">
                  Flat Image Viewer
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Dimensions</span>
                <span className="text-[12px] font-mono font-semibold text-emerald-400">
                  {imageDimensions
                    ? `${imageDimensions.width} × ${imageDimensions.height} px`
                    : "No Image"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Backend AI</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-sky-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  FastAPI · SAHI/YOLOv8
                </span>
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* —————————————————— RIGHT: MAP CANVAS —————————————————— */}
      <main className="relative flex-1">
        <WorkspaceMap
          imageUrl={imageUrl}
          imageDimensions={imageDimensions}
          footprints={footprints}
          geojsonData={geojson}
        />

        {/* Floating canvas status chip */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/85 px-3 py-1.5 backdrop-blur-md">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              imageDimensions ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          <span className="text-[11px] font-medium text-slate-400 font-mono">
            {imageDimensions
              ? `Canvas: ${imageDimensions.width} × ${imageDimensions.height} px · CRS.Simple`
              : "Canvas: Blank · Awaiting Image"}
          </span>
        </div>
      </main>
    </div>
  );
}


