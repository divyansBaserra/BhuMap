import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# 1. Load the token from the .env file located one folder up in the BhuMap root
load_dotenv(dotenv_path="../.env")

# 2. Import Kaggle AFTER loading the environment variable so it authenticates automatically
# pyrefly: ignore [missing-import]
import kaggle

def setup_aerial_dataset():
    # Create the dataset structure directly inside the backend folder
    download_path = "datasets/aerial_mapping"
    os.makedirs(download_path, exist_ok=True)
    
    dataset_name = "chandru0503/airs-dataset-for-roof-top-detection-yolov8"
    
    print(f"Connecting to Kaggle using API Token to download: {dataset_name}...")
    
    try:
        # The unzip=True flag automatically extracts the images and labels
        kaggle.api.dataset_download_cli(
            dataset_name, 
            path=download_path, 
            unzip=True
        )
        print(f"Success! Dataset extracted to backend/{download_path}")
    except Exception as e:
        print(f"Error downloading dataset: {e}")

if __name__ == "__main__":
    setup_aerial_dataset()