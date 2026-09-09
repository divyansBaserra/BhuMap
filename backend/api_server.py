import io
import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from ultralytics import YOLO
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import uvicorn

from tiling_engine import predict_stitched
from vectorize import convert_pixels_to_geojson

app = FastAPI(
    title="BhuMap Cadastral API",
    description="Aerial imagery building detection API supporting standard YOLOv8 inference, SAHI tiling, and GeoJSON geospatial vectorization.",
    version="1.2.0"
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
    results = model.predict(source=image, conf=0.25)

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


@app.post("/predict-geospatial", summary="SAHI detection + GeoTIFF to GeoJSON transformation")
async def predict_geospatial(file: UploadFile = File(...)):
    """
    Accepts a georeferenced GeoTIFF (.tif) file, runs SAHI tiled inference, 
    and converts pixel bounding boxes into true GPS/GeoJSON polygons.
    """
    temp_path = f"temp_{file.filename}"
    try:
        # Save upload temporarily so rasterio can read spatial headers
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # Re-open as PIL Image for the SAHI tiling pipeline
        image = Image.open(io.BytesIO(content)).convert("RGB")
        
        # 1. Run SAHI/YOLO prediction
        sahi_result = predict_stitched(image)
        
        # Extract detections array
        detections = sahi_result.get("data", [])
        
        # 2. Convert pixel boxes to geographic GeoJSON coordinates via rasterio
        geojson_data = convert_pixels_to_geojson(temp_path, detections)
        return geojson_data

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Geospatial processing failed: {str(exc)}")
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)