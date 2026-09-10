import os
from pathlib import Path
from typing import Union, Dict, Any, List
import torch
import numpy as np
from PIL import Image

from sahi import AutoDetectionModel
from sahi.predict import get_sliced_prediction

# Determine model path dynamically
BASE_DIR = Path(__file__).resolve().parent
POSSIBLE_PATHS = [
    BASE_DIR / ".." / "runs" / "detect" / "training_runs" / "sih26012_aerial_model" / "weights" / "best.pt",
    BASE_DIR / "runs" / "detect" / "training_runs" / "sih26012_aerial_model" / "weights" / "best.pt",
    Path(r"C:\Users\panth\OneDrive\Desktop\projects\drone\BhuMap\runs\detect\training_runs\sih26012_aerial_model\weights\best.pt"),
]

MODEL_PATH = None
for p in POSSIBLE_PATHS:
    if p.exists():
        MODEL_PATH = str(p.resolve())
        break

if not MODEL_PATH:
    # Fallback to default expected path
    MODEL_PATH = str(POSSIBLE_PATHS[0].resolve())

# Hardware configuration: NVIDIA RTX 2050 (4GB VRAM) memory-aware setup
DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"
CONFIDENCE_THRESHOLD = 0.65
SLICE_HEIGHT = 640
SLICE_WIDTH = 640
OVERLAP_HEIGHT_RATIO = 0.15
OVERLAP_WIDTH_RATIO = 0.15

print(f"[TilingEngine] Initializing SAHI AutoDetectionModel on device: {DEVICE}")
print(f"[TilingEngine] Model weight path: {MODEL_PATH}")

sahi_model = AutoDetectionModel.from_pretrained(
    model_type="yolov8",
    model_path=MODEL_PATH,
    confidence_threshold=CONFIDENCE_THRESHOLD,
    device=DEVICE,
)


def predict_stitched(
    image: Union[Image.Image, str, np.ndarray],
    conf: float = CONFIDENCE_THRESHOLD,
    slice_height: int = SLICE_HEIGHT,
    slice_width: int = SLICE_WIDTH,
    overlap_ratio: float = OVERLAP_HEIGHT_RATIO,
) -> Dict[str, Any]:
    """
    Performs sliced inference on high-resolution drone imagery using SAHI
    and merges seam detections cleanly without out-of-memory errors on 4GB VRAM.

    Parameters:
        image: PIL.Image, file path, or numpy ndarray
        conf: confidence threshold override
        slice_height: height of each slice (default 640)
        slice_width: width of each slice (default 640)
        overlap_ratio: overlap ratio for height & width (default 0.15 / 15%)

    Returns:
        Clean JSON dictionary with status, count, and global bounding boxes.
    """
    conf = max(float(conf), 0.65)
    if conf != sahi_model.confidence_threshold:
        sahi_model.confidence_threshold = conf

    try:
        with torch.inference_mode():
            slice_result = get_sliced_prediction(
                image,
                sahi_model,
                slice_height=slice_height,
                slice_width=slice_width,
                overlap_height_ratio=overlap_ratio,
                overlap_width_ratio=overlap_ratio,
                perform_standard_pred=False,
                verbose=0,
            )

        predictions: List[Dict[str, Any]] = []
        for obj in slice_result.object_prediction_list:
            bbox_xyxy = [round(float(c), 2) for c in obj.bbox.to_xyxy()]
            confidence = round(float(obj.score.value), 2)
            category_name = obj.category.name if obj.category else "roof"
            category_id = obj.category.id if obj.category else 0

            predictions.append({
                "coordinates": bbox_xyxy,  # [xmin, ymin, xmax, ymax] in global image coordinates
                "confidence": confidence,
                "category_name": category_name,
                "category_id": category_id,
            })

        return {
            "status": "success",
            "roofs_detected": len(predictions),
            "data": predictions,
        }

    finally:
        # Crucial for 4GB VRAM (NVIDIA RTX 2050) memory hygiene
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


if __name__ == "__main__":
    test_img_path = BASE_DIR / "datasets" / "aerial_mapping" / "dataset" / "dataset" / "test" / "images" / "1386.png"
    if test_img_path.exists():
        print(f"[TilingEngine] Running test inference on: {test_img_path}")
        res = predict_stitched(str(test_img_path))
        print(f"[TilingEngine] Detected {res['roofs_detected']} objects.")
        if res["data"]:
            print(f"[TilingEngine] Sample box: {res['data'][0]}")
    else:
        print(f"[TilingEngine] Test image not found at {test_img_path}")
