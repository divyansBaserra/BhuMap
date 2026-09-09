from pathlib import Path
# pyrefly: ignore [missing-import]
from ultralytics import YOLO

def run_prediction():
    # 1. Exact absolute path to your best trained weights
    model_path = r"C:\Users\panth\OneDrive\Desktop\projects\drone\BhuMap\runs\detect\training_runs\sih26012_aerial_model\weights\best.pt"
    
    print(f"Loading weights from: {model_path}")
    model = YOLO(model_path)

    # 2. Pick an image from the test set
    test_dir = Path(r"C:\Users\panth\OneDrive\Desktop\projects\drone\BhuMap\backend\datasets\aerial_mapping\dataset\dataset\test\images")
    test_images = list(test_dir.glob("*.jpg")) + list(test_dir.glob("*.png"))

    if not test_images:
        print(f"No test images found in {test_dir}. Place an image in backend/inputs/ instead.")
        return

    source_image = str(test_images[0])
    print(f"Running inference on: {source_image}")

    # 3. Predict and save annotated results
    results = model.predict(
        source=source_image,
        conf=0.25,
        save=True,       # Saves annotated image
        project="runs",
        name="test_predictions"
    )

    print("\nInference complete!")
    print("Annotated output image saved in: backend/runs/test_predictions/")

if __name__ == "__main__":
    run_prediction()