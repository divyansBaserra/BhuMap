# pyrefly: ignore [missing-import]
from ultralytics import YOLO
# pyrefly: ignore [missing-import]
import cv2

def run_segmentation():
    print("Loading YOLOv8-Seg model...")
    # This will automatically download the lightweight Nano segmentation model
    model = YOLO("yolov8n-seg.pt") 

    # For testing, we need an image. 
    # Create a dummy image using OpenCV if you don't have a drone image handy.
    print("Generating a test image...")
    dummy_image = "test_drone_img.jpg"
    # Create a simple white image with a black square to represent a building
    img = cv2.imread(dummy_image) 
    if img is None:
        # pyrefly: ignore [missing-import]
        import numpy as np
        img = np.ones((500, 500, 3), dtype=np.uint8) * 255
        cv2.rectangle(img, (100, 100), (300, 300), (0, 0, 0), -1)
        cv2.imwrite(dummy_image, img)
        print("Created dummy test image.")

    print("Running inference...")
    # Run the model on the image
    results = model(dummy_image)

    # Display the results
    for result in results:
        # Check if the model found any segmentation masks
        if result.masks is not None:
            print(f"Success! Found {len(result.masks)} objects with pixel masks.")
            # Save an image showing the model's predictions
            result.save(filename="segmentation_result.jpg") 
            print("Saved output to segmentation_result.jpg")
        else:
            print("No masks found in this image.")

if __name__ == "__main__":
    run_segmentation()