"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ------------------------------------------------------------------ */
/*  Fix Leaflet's default icon paths which break under bundlers       */
/* ------------------------------------------------------------------ */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface DetectedFootprint {
  id: string;
  category: string;
  confidence: number;
  coordinates: number[][]; // [[x, y], ...] in image pixel space
  bbox?: number[];
  dimensions?: string;
  area_px?: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    parcel_id?: string;
    category?: string;
    confidence?: number;
    dimensions?: string;
    area_px?: string;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface WorkspaceMapProps {
  imageUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  geojsonData?: GeoJSONFeatureCollection | null;
  footprints?: DetectedFootprint[] | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function WorkspaceMap({
  imageUrl,
  imageDimensions,
  geojsonData,
  footprints,
}: WorkspaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  /* ---------- Initialise map once on mount with CRS.Simple ---------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    /* Flat 2D image viewer using L.CRS.Simple — NO tile layers */
    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 4,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      zoomControl: false,
      attributionControl: false,
    });

    /* Zoom control positioned top-right */
    L.control.zoom({ position: "topright" }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    /* Resize observer keeps viewport crisp when sidebar resizes */
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------- Update Image Overlay when image changes ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old image overlay if present
    if (imageOverlayRef.current) {
      imageOverlayRef.current.remove();
      imageOverlayRef.current = null;
    }

    if (!imageUrl || !imageDimensions) {
      // Return map view to neutral zero state
      map.setView([0, 0], 0);
      return;
    }

    const { width, height } = imageDimensions;

    // In L.CRS.Simple, bounds are [[0, 0], [height, width]]
    const bounds = L.latLngBounds([0, 0], [height, width]);

    const overlay = L.imageOverlay(imageUrl, bounds, {
      interactive: true,
      opacity: 1,
    }).addTo(map);

    imageOverlayRef.current = overlay;

    // Fit view to the exact image bounds with padding
    map.fitBounds(bounds, { padding: [24, 24] });
    map.setMaxBounds(bounds.pad(0.3));
  }, [imageUrl, imageDimensions]);

  /* ---------- Render / re-render AI polygon footprints ---------- */
  useEffect(() => {
    const map = mapRef.current;
    const lg = layerGroupRef.current;
    if (!map || !lg) return;

    lg.clearLayers();

    // 1. Direct footprints array (real backend output)
    if (footprints && footprints.length > 0 && imageDimensions) {
      footprints.forEach((fp) => {
        // Map pixel coordinates [x, y] to Leaflet CRS.Simple [lat, lng]:
        // In CRS.Simple, lat = height - y, lng = x
        const latLngs: L.LatLngTuple[] = fp.coordinates.map(([x, y]) => [
          imageDimensions.height - y,
          x,
        ]);

        const poly = L.polygon(latLngs, {
          color: "#38bdf8",
          weight: 2.5,
          fillColor: "#0ea5e9",
          fillOpacity: 0.35,
        });

        const conf =
          fp.confidence != null
            ? `${(fp.confidence * 100).toFixed(1)}%`
            : "N/A";
        const dimStr = fp.dimensions
          ? `<div><span style="color:#94a3b8">Dimensions:</span> <b>${fp.dimensions}</b></div>`
          : "";
        const areaStr = fp.area_px
          ? `<div><span style="color:#94a3b8">Footprint Area:</span> <b>${fp.area_px}</b></div>`
          : "";

        poly.bindPopup(
          `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.6;min-width:190px;color:#f8fafc">
             <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#38bdf8;display:flex;align-items:center;justify-content:space-between">
               <span>${fp.category ?? "Building Footprint"}</span>
               <span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:rgba(56,189,248,0.15);color:#38bdf8;font-weight:600">${fp.id}</span>
             </div>
             <div><span style="color:#94a3b8">Confidence:</span> <b style="color:#34d399">${conf}</b></div>
             ${dimStr}
             ${areaStr}
           </div>`,
          { className: "bhumap-popup" }
        );

        poly.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 3.5,
              color: "#67e8f9",
              fillColor: "#38bdf8",
              fillOpacity: 0.55,
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: () => {
            poly.setStyle({
              color: "#38bdf8",
              weight: 2.5,
              fillColor: "#0ea5e9",
              fillOpacity: 0.35,
            });
          },
        });

        poly.addTo(lg);
      });
      return;
    }

    // 2. Fallback to GeoJSON FeatureCollection if provided
    if (!geojsonData || !geojsonData.features?.length) return;

    const geoLayer = L.geoJSON(geojsonData as any, {
      style: () => ({
        color: "#38bdf8",
        weight: 2.5,
        fillColor: "#0ea5e9",
        fillOpacity: 0.35,
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties ?? {};
        const conf =
          props.confidence != null
            ? `${(props.confidence * 100).toFixed(1)}%`
            : "N/A";
        const dimStr = props.dimensions
          ? `<div><span style="color:#94a3b8">Dimensions:</span> <b>${props.dimensions}</b></div>`
          : "";
        const areaStr = props.area_px
          ? `<div><span style="color:#94a3b8">Footprint Area:</span> <b>${props.area_px}</b></div>`
          : "";

        layer.bindPopup(
          `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.6;min-width:190px;color:#f8fafc">
             <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#38bdf8;display:flex;align-items:center;justify-content:space-between">
               <span>${props.category ?? "Building Footprint"}</span>
               <span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:rgba(56,189,248,0.15);color:#38bdf8;font-weight:600">${props.parcel_id ?? "AI"}</span>
             </div>
             <div><span style="color:#94a3b8">Confidence:</span> <b style="color:#34d399">${conf}</b></div>
             ${dimStr}
             ${areaStr}
           </div>`,
          { className: "bhumap-popup" }
        );

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 3.5,
              color: "#67e8f9",
              fillColor: "#38bdf8",
              fillOpacity: 0.55,
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: (e) => {
            geoLayer.resetStyle(e.target);
          },
        });
      },
    });

    geoLayer.addTo(lg);
  }, [geojsonData, footprints, imageDimensions]);

  return (
    <div className="relative h-full w-full bg-slate-950">
      {/* Leaflet Flat Image Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 bg-slate-950"
      />

      {/* Blank Initial State Overlay (Active when no image is loaded) */}
      {!imageUrl && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 backdrop-blur-sm">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-sky-950/40">
            <svg
              className="h-10 w-10 text-slate-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-amber-500/80" />
          </div>
          <h2 className="text-base font-bold text-slate-200 tracking-tight">
            Image Canvas Idle
          </h2>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Upload a drone image (.jpg or .png) via the left control panel to initialize the flat pixel workspace.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            CRS: L.CRS.Simple · 0 Basemaps Loaded
          </div>
        </div>
      )}
    </div>
  );
}

