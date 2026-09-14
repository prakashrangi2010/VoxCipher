import os
import glob
import shutil

KAGGLE_CACHE_DIR = os.path.expanduser(r"~\.cache\kagglehub\datasets\polly42rose\indian-accent-dataset")
LOCAL_SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "samples")

def get_indian_accent_status() -> dict:
    """
    Checks the status of the Kaggle Indian Accent dataset download
    and lists all available Indian accent and Hindi audio files.
    """
    is_downloaded = False
    downloaded_files = []
    
    if os.path.exists(KAGGLE_CACHE_DIR):
        # Check for audio files or extracted directories
        audio_patterns = ["*.wav", "*.mp3", "*.flac", "*/*.wav", "*/*.mp3", "*/*/*.wav"]
        found = []
        for pat in audio_patterns:
            found.extend(glob.glob(os.path.join(KAGGLE_CACHE_DIR, pat)))
        
        if found:
            is_downloaded = True
            downloaded_files = [os.path.basename(f) for f in found[:30]]

    # Local pre-packaged Indian accent and Hindi samples
    local_samples = []
    if os.path.exists(LOCAL_SAMPLES_DIR):
        for f in os.listdir(LOCAL_SAMPLES_DIR):
            if f.endswith((".wav", ".mp3")) and ("indian" in f.lower() or "hindi" in f.lower()):
                local_samples.append({
                    "filename": f,
                    "name": f.replace("sample_", "").replace(".wav", "").replace("_", " ").title(),
                    "language": "Hindi / Indian English",
                    "path": os.path.join(LOCAL_SAMPLES_DIR, f)
                })

    return {
        "dataset_name": "polly42rose/indian-accent-dataset",
        "cache_dir": KAGGLE_CACHE_DIR,
        "is_downloaded": is_downloaded,
        "kaggle_files_count": len(downloaded_files),
        "available_kaggle_samples": downloaded_files[:10],
        "local_indian_samples": local_samples,
        "status": "READY" if is_downloaded or len(local_samples) > 0 else "DOWNLOADING"
    }
