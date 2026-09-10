import io
import os
import uuid
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from ultralytics import YOLO
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import rasterio
# pyrefly: ignore [missing-import]
from rasterio.transform import from_bounds
# pyrefly: ignore [missing-import]
import uvicorn

from tiling_engine import predict_stitched
from vectorize import convert_pixels_to_geojson

app = FastAPI(
    title="BhuMap Cadastral API",
    description="Aerial imagery building detection API supporting standard YOLOv8 inference, SAHI tiling, and GeoJSON geospatial vectorization.",
    version="1.3.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g., Vite on localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model directly into the GPU when the server starts
MODEL_PATH = r"C:\Users\panth\OneDrive\Desktop\projects\drone\BhuMap\runs\detect\training_runs\sih26012_aerial_model\weights\best.pt"
print("Loading YOLOv8 Model for standard inference...")
model = YOLO(MODEL_PATH)

# Directory where auto-converted GeoTIFFs are persisted
GEOTIFF_OUTPUT_DIR = r"C:\Users\panth\OneDrive\Desktop\projects\drone\BhuMap\backend\datasets\aerial_mapping\dataset\dataset\test\images\tif"
os.makedirs(GEOTIFF_OUTPUT_DIR, exist_ok=True)

# Accepted image extensions
GEOTIFF_EXTENSIONS = {".tif", ".tiff"}
PLAIN_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Real-world bounding boxes for supported target regions.
# Each entry: (west, south, east, north) in EPSG:4326 degrees.
CITY_BBOXES: dict[str, tuple[float, float, float, float]] = {
    "delhi":     (77.1990, 28.5990, 77.2010, 28.6010),
    "mumbai":    (72.8770, 19.0750, 72.8790, 19.0770),
    "bengaluru": (77.5940, 12.9710, 77.5960, 12.9730),
}
DEFAULT_CITY = "delhi"

# Legacy constants kept for EXIF-based path
DEFAULT_LAT, DEFAULT_LON = 28.6000, 77.2000
BBOX_HALF_DEG = 0.0005


def _dms_to_decimal(dms_tuple, ref: str) -> float:
    """
    Convert EXIF GPS DMS (degrees, minutes, seconds) to a decimal float.

    Each element of *dms_tuple* may be an IFDRational, a plain float, or an
    int.  The *ref* string ('N'/'S'/'E'/'W') determines the sign.
    """
    degrees = float(dms_tuple[0])
    minutes = float(dms_tuple[1])
    seconds = float(dms_tuple[2])
    decimal = degrees + minutes / 60.0 + seconds / 3600.0
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def extract_gps_from_exif(raw_bytes: bytes) -> tuple[float, float] | None:
    """
    Attempt to read GPS latitude/longitude from image EXIF metadata.

    Returns:
        (latitude, longitude) as decimal floats, or None if unavailable.
    """
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        exif_data = img._getexif()  # type: ignore[attr-defined]
        if exif_data is None:
            return None

        # EXIF tag 34853 = GPSInfo pointer
        from PIL.ExifTags import GPSTAGS
        gps_ifd = exif_data.get(34853)
        if gps_ifd is None:
            return None

        # Decode GPS sub-IFD into human-readable keys
        gps_info: dict[str, any] = {}
        for tag_id, value in gps_ifd.items():
            tag_name = GPSTAGS.get(tag_id, tag_id)
            gps_info[tag_name] = value

        lat_dms = gps_info.get("GPSLatitude")
        lat_ref = gps_info.get("GPSLatitudeRef", "N")
        lon_dms = gps_info.get("GPSLongitude")
        lon_ref = gps_info.get("GPSLongitudeRef", "E")

        if lat_dms is None or lon_dms is None:
            return None

        lat = _dms_to_decimal(lat_dms, lat_ref)
        lon = _dms_to_decimal(lon_dms, lon_ref)

        # Basic sanity check
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return None

        return (lat, lon)

    except Exception:
        return None


def convert_image_to_geotiff(
    pil_image: Image.Image,
    original_filename: str,
    raw_bytes: bytes,
    city: str = DEFAULT_CITY,
) -> str:
    """
    Wraps a plain RGB PIL image into a georeferenced GeoTIFF (EPSG:4326).

    Resolution order for bounding box:
    1. Real GPS coordinates extracted from EXIF metadata.
    2. City/region lookup from the CITY_BBOXES dictionary.
    3. Hard-coded Delhi fallback (should never reach here).

    The file is saved to GEOTIFF_OUTPUT_DIR for dataset persistence.

    Returns:
        Absolute path to the saved GeoTIFF file.
    """
    # --- Resolve geolocation ------------------------------------------------
    gps = extract_gps_from_exif(raw_bytes)
    if gps is not None:
        lat, lon = gps
        print(f"[auto-convert] EXIF GPS found: lat={lat:.6f}, lon={lon:.6f}")
        west  = lon - BBOX_HALF_DEG
        east  = lon + BBOX_HALF_DEG
        south = lat - BBOX_HALF_DEG
        north = lat + BBOX_HALF_DEG
    else:
        # Use the city/region lookup
        city_key = city.strip().lower()
        bbox = CITY_BBOXES.get(city_key)
        if bbox is None:
            bbox = CITY_BBOXES[DEFAULT_CITY]
            print(f"[auto-convert] Unknown city '{city}' — falling back to {DEFAULT_CITY}")
        else:
            print(f"[auto-convert] No EXIF GPS — using city bbox for: {city_key}")
        west, south, east, north = bbox

    print(f"[auto-convert] BBox: W={west}, S={south}, E={east}, N={north}")

    # --- Build GeoTIFF ------------------------------------------------------
    width, height = pil_image.size
    transform = from_bounds(west, south, east, north, width, height)

    stem = os.path.splitext(original_filename)[0]
    tif_filename = f"{stem}_{uuid.uuid4().hex[:8]}.tif"
    tif_path = os.path.join(GEOTIFF_OUTPUT_DIR, tif_filename)

    img_array = np.array(pil_image)
    img_array = np.moveaxis(img_array, -1, 0)  # (H,W,3) -> (3,H,W)

    with rasterio.open(
        tif_path, "w",
        driver="GTiff",
        height=height,
        width=width,
        count=3,
        dtype="uint8",
        crs="EPSG:4326",
        transform=transform,
    ) as dst:
        dst.write(img_array)

    print(f"[auto-convert] Saved georeferenced GeoTIFF: {tif_path}")
    return tif_path


@app.get("/", summary="Health check")
def health_check():
    """Verify backend and API availability."""
    return {"status": "online", "model_loaded": True}


@app.post("/predict", summary="Standard YOLOv8 building detection")
async def detect_buildings(file: UploadFile = File(...)):
    """Run standard single-pass YOLOv8 prediction (best for lower-resolution imagery)."""
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(exc)}")

    # Run the AI prediction
    results = model.predict(source=image, conf=0.65)

    # Parse bounding boxes
    predictions = []
    for r in results:
        for box in r.boxes:
            coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]  # [xmin, ymin, xmax, ymax]
            conf = float(box.conf[0])
            predictions.append({
                "coordinates": coords,
                "confidence": round(conf, 2)
            })

    return {
        "status": "success",
        "roofs_detected": len(predictions),
        "data": predictions
    }


@app.post("/predict-stitched", summary="SAHI sliced high-resolution drone building detection")
async def detect_buildings_stitched(file: UploadFile = File(...)):
    """
    Run SAHI sliced inference with 640x640 window and 15% overlap.
    Merges detections across seams to deliver global bounding boxes without GPU OOM errors.
    """
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(exc)}")

    # Execute SAHI sliced inference via the tiling engine
    result = predict_stitched(image)
    return result


@app.post("/api/detect-footprints", summary="Detect building footprints with pixel polygons")
@app.post("/detect-footprints")
async def detect_footprints(file: UploadFile = File(...)):
    """
    Accepts any drone imagery file (.jpg, .jpeg, .png, .tif, .tiff).
    Runs AI inference (SAHI tiled inference or YOLOv8) and returns real
    footprint polygon coordinates strictly relative to the uploaded image pixel dimensions.
    """
    try:
        content = await file.read()
        filename = file.filename or "image.png"

        # Open image with PIL or fallback to rasterio for complex GeoTIFFs
        image = None
        try:
            image = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception:
            with rasterio.io.MemoryFile(content) as memfile:
                with memfile.open() as dataset:
                    if dataset.count >= 3:
                        arr = dataset.read([1, 2, 3])
                        arr = np.moveaxis(arr, 0, -1)
                    else:
                        arr = dataset.read(1)
                        arr = np.stack([arr] * 3, axis=-1)
                    if arr.dtype != np.uint8:
                        max_val = arr.max()
                        arr = (arr / max_val * 255).astype(np.uint8) if max_val > 0 else arr.astype(np.uint8)
                    image = Image.fromarray(arr).convert("RGB")

        img_w, img_h = image.size

        # Run SAHI tiled inference for high-res drone image
        try:
            sahi_result = predict_stitched(image)
            raw_detections = sahi_result.get("data", [])
        except Exception as e:
            print(f"[detect-footprints] SAHI fallback to standard YOLO predict: {e}")
            yolo_res = model.predict(source=image, conf=0.35)
            raw_detections = []
            for r in yolo_res:
                for box in r.boxes:
                    coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]
                    conf = float(box.conf[0])
                    raw_detections.append({
                        "coordinates": coords,
                        "confidence": round(conf, 2),
                        "category_name": "roof",
                        "category_id": 0
                    })

        footprints = []
        features = []
        for i, det in enumerate(raw_detections):
            xmin, ymin, xmax, ymax = det["coordinates"]
            conf = det.get("confidence", 0.0)
            cat = det.get("category_name", "Building Footprint")

            # Form closed polygon in image pixel coordinates [x, y]
            poly_coords = [
                [xmin, ymin],
                [xmax, ymin],
                [xmax, ymax],
                [xmin, ymax],
                [xmin, ymin]
            ]

            box_w = round(xmax - xmin, 1)
            box_h = round(ymax - ymin, 1)
            area_px = round(box_w * box_h)
            bldg_id = f"BLDG-{i+1:03d}"

            footprints.append({
                "id": bldg_id,
                "category": cat.capitalize() if isinstance(cat, str) else "Building",
                "confidence": conf,
                "coordinates": poly_coords,
                "bbox": [xmin, ymin, xmax, ymax],
                "dimensions": f"{box_w} × {box_h} px",
                "area_px": f"{area_px:,} px²"
            })

            # GeoJSON coordinates for Leaflet L.CRS.Simple: [x, height - y]
            geojson_poly = [
                [px, img_h - py] for px, py in poly_coords
            ]
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [geojson_poly]
                },
                "properties": {
                    "parcel_id": bldg_id,
                    "category": cat.capitalize() if isinstance(cat, str) else "Building",
                    "confidence": conf,
                    "dimensions": f"{box_w} × {box_h} px",
                    "area_px": f"{area_px:,} px²"
                }
            })

        return {
            "status": "success",
            "image_dimensions": {"width": img_w, "height": img_h},
            "footprints_detected": len(footprints),
            "footprints": footprints,
            "geojson": {
                "type": "FeatureCollection",
                "features": features
            }
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Footprint detection failed: {str(exc)}")



@app.post("/predict-geospatial", summary="SAHI detection + auto GeoTIFF conversion + GeoJSON output")
async def predict_geospatial(
    file: UploadFile = File(...),
    city: str = Form("delhi"),
):
    """
    Accepts any image file (.jpg, .jpeg, .png, .tif, .tiff).

    - If the upload is already a GeoTIFF, it is used directly.
    - If the upload is a plain image, it is automatically wrapped into a
      georeferenced GeoTIFF (EPSG:4326, default Delhi/NCR bbox) and saved
      to the dataset directory before processing.

    Runs SAHI tiled inference and returns a GeoJSON FeatureCollection with
    true GPS polygon coordinates.
    """
    filename = file.filename or "upload.tif"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in GEOTIFF_EXTENSIONS and ext not in PLAIN_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Accepted: {', '.join(sorted(GEOTIFF_EXTENSIONS | PLAIN_IMAGE_EXTENSIONS))}"
        )

    temp_path: str | None = None
    auto_converted = False

    try:
        content = await file.read()
        pil_image = Image.open(io.BytesIO(content)).convert("RGB")

        if ext in GEOTIFF_EXTENSIONS:
            # Already a GeoTIFF — save as temp file for rasterio to read headers
            temp_path = f"temp_{filename}"
            with open(temp_path, "wb") as f:
                f.write(content)
        else:
            # Plain image — auto-convert to georeferenced GeoTIFF
            temp_path = convert_image_to_geotiff(pil_image, filename, content, city=city)
            auto_converted = True

        # 1. Run SAHI/YOLO tiled prediction on the PIL image
        sahi_result = predict_stitched(pil_image)
        detections = sahi_result.get("data", [])

        # 2. Convert pixel bounding boxes → GPS GeoJSON via rasterio affine transform
        geojson_data = convert_pixels_to_geojson(temp_path, detections)

        # Attach metadata about the conversion
        geojson_data["metadata"] = {
            "original_filename": filename,
            "auto_converted": auto_converted,
            "geotiff_path": temp_path if auto_converted else None,
        }

        return geojson_data

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Geospatial processing failed: {str(exc)}")
    finally:
        # Only clean up temp files for native GeoTIFF uploads;
        # auto-converted files are kept in the dataset directory intentionally
        if temp_path and not auto_converted and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)