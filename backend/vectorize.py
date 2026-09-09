# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import numpy as np
from shapely.geometry import Polygon, mapping
import json


def mask_to_polygon(mask_array: np.ndarray) -> Polygon | None:
    """
    Convert a 2D YOLO segmentation mask into a Shapely Polygon.

    Args:
        mask_array (np.ndarray): 2D numpy array representing the segmentation mask.

    Returns:
        shapely.geometry.Polygon | None: Polygon geometry or None if no valid contour exists.
    """
    if mask_array is None or mask_array.ndim != 2:
        raise ValueError("Input mask must be a 2D numpy array.")

    # Ensure mask is uint8 with values 0 or 255
    if mask_array.dtype != np.uint8:
        mask_uint8 = (mask_array > 0.5).astype(np.uint8) * 255
    else:
        mask_uint8 = mask_array if mask_array.max() > 1 else mask_array * 255

    # Extract outer contours from the binary mask
    contours, _ = cv2.findContours(
        mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        return None

    # Pick the largest contour by area (main object boundary)
    largest_contour = max(contours, key=cv2.contourArea)
    points = largest_contour.reshape(-1, 2)

    # A valid polygon requires at least 3 distinct vertices
    if len(points) < 3:
        return None

    polygon = Polygon(points)

    # Fix any self-intersections if present
    if not polygon.is_valid:
        polygon = polygon.buffer(0)

    return polygon


if __name__ == "__main__":
    # Quick mock test: create a 200x200 binary mask with a 50x50 square
    mock_mask = np.zeros((200, 200), dtype=np.uint8)
    mock_mask[50:150, 50:150] = 255  # Simulated detected object

    polygon = mask_to_polygon(mock_mask)

    if polygon is not None:
        geojson_geom = mapping(polygon)
        print("Shapely Polygon:")
        print(polygon)
        print("\nGeoJSON Representation:")
        print(json.dumps(geojson_geom, indent=2))
    else:
        print("No polygon could be extracted from the mask.")
