# pyrefly: ignore [missing-import]
import os
import json
import uuid
import shutil
import tempfile
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from sqlalchemy import func
# pyrefly: ignore [missing-import]
from ultralytics import YOLO
from shapely.geometry import mapping
from database import engine, SessionLocal
from models import Base, Parcel
from vectorize import mask_to_polygon

# This command tells SQLAlchemy to auto-generate the tables in PostGIS!
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BhuMap GIS Engine",
    description="Automated Urban Parcel Mapping API",
    version="1.0.0"
)

# Enable CORS so Next.js (port 3000) can communicate without browser blocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "online", "database": "connected (mock)"}

@app.get("/api/parcels")
def get_mock_parcels():
    """
    Returns mock cadastral parcel polygons formatted in standard RFC 7946 GeoJSON.
    """
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": 1,
                "properties": {
                    "parcel_id": "DEL-URB-00101",
                    "owner": "Rajesh Kumar",
                    "area_sqm": 248.5,
                    "status": "Verified",
                    "risk_flag": False
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.2085, 28.6135],
                            [77.2092, 28.6135],
                            [77.2092, 28.6142],
                            [77.2085, 28.6142],
                            [77.2085, 28.6135]
                        ]
                    ]
                }
            },
            {
                "type": "Feature",
                "id": 2,
                "properties": {
                    "parcel_id": "DEL-URB-00102",
                    "owner": "Anita Sharma",
                    "area_sqm": 312.0,
                    "status": "Overlap Review",
                    "risk_flag": True
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.2091, 28.6138],
                            [77.2098, 28.6138],
                            [77.2098, 28.6146],
                            [77.2091, 28.6146],
                            [77.2091, 28.6138]
                        ]
                    ]
                }
            }
        ]
    }


@app.post("/api/upload-drone-image")
async def upload_drone_image(file: UploadFile = File(...)):
    """
    Accepts a drone image, runs YOLOv8 segmentation, vectorizes the output mask,
    and stores the generated polygon into the PostGIS database.
    """
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    if not suffix:
        suffix = ".jpg"

    # Save uploaded file temporarily to disk
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        # Run inference using YOLOv8 segmentation model
        model = YOLO("yolov8n-seg.pt")
        results = model(temp_path)

        # Extract masks data from YOLO result
        if not results or results[0].masks is None or results[0].masks.data is None:
            raise HTTPException(
                status_code=400,
                detail="No segmentation masks detected in the uploaded image."
            )

        masks_data = results[0].masks.data
        if len(masks_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Masks data is empty."
            )

        # Extract first mask and convert to 2D numpy array
        mask_array = masks_data[0].cpu().numpy()

        # Vectorize mask to Shapely Polygon
        polygon = mask_to_polygon(mask_array)
        if polygon is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to convert segmentation mask into a valid polygon."
            )

        # Convert polygon to GeoJSON representation
        if hasattr(polygon, "__geo_interface__"):
            geojson_geom = mapping(polygon)
            geojson_str = json.dumps(geojson_geom)
        elif isinstance(polygon, str):
            geojson_str = polygon
            geojson_geom = json.loads(polygon)
        else:
            geojson_geom = polygon
            geojson_str = json.dumps(polygon)

        # Save to PostGIS using Parcel model and SessionLocal
        db = SessionLocal()
        try:
            parcel_id = f"DRONE-{uuid.uuid4().hex[:8].upper()}"
            area_sqm = float(polygon.area) if hasattr(polygon, "area") else 0.0

            new_parcel = Parcel(
                parcel_id=parcel_id,
                owner="Automated Drone Detection",
                area_sqm=area_sqm,
                geom=func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326),
            )
            db.add(new_parcel)
            db.commit()
            db.refresh(new_parcel)
            saved_id = new_parcel.id
            saved_parcel_id = new_parcel.parcel_id
        except Exception as db_err:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to persist parcel to PostGIS: {str(db_err)}"
            )
        finally:
            db.close()

        # Return success response containing the generated GeoJSON
        return {
            "status": "success",
            "message": "Drone image processed and saved to PostGIS successfully.",
            "parcel_id": saved_parcel_id,
            "id": saved_id,
            "geojson": geojson_geom,
        }

    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
