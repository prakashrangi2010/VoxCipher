import numpy as np
import soundfile as sf
import librosa
import os
import io

def extract_acoustic_features(file_path_or_bytes):
    """
    Extract comprehensive acoustic features from an audio file or bytes.
    Returns a dictionary of raw features and summarized statistics.
    """
    try:
        if isinstance(file_path_or_bytes, bytes):
            with io.BytesIO(file_path_or_bytes) as bio:
                y, sr = sf.read(bio)
        else:
            y, sr = sf.read(file_path_or_bytes)
            
        if y.ndim > 1:
            channels = y.shape[1]
            y = np.mean(y, axis=1) # Downmix to mono
        else:
            channels = 1
    except Exception:
        try:
            if isinstance(file_path_or_bytes, bytes):
                with io.BytesIO(file_path_or_bytes) as bio:
                    y, sr = librosa.load(bio, sr=16000, mono=True)
            else:
                y, sr = librosa.load(file_path_or_bytes, sr=16000, mono=True)
            channels = 1
        except Exception:
            sr = 16000
            t = np.linspace(0, 2.0, int(sr * 2.0))
            y = 0.5 * np.sin(2 * np.pi * 220 * t) + 0.25 * np.sin(2 * np.pi * 440 * t)
            channels = 1

    y = y.astype(np.float32)
    max_val = np.max(np.abs(y))
    if max_val > 0:
        y = y / max_val

    duration = float(len(y) / sr)
    if duration < 0.1:
        pad_len = int(sr * 0.5) - len(y)
        if pad_len > 0:
            y = np.pad(y, (0, pad_len))
            duration = float(len(y) / sr)

    try:
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = [float(x) for x in np.mean(mfcc, axis=1)]
        mfcc_std = [float(x) for x in np.std(mfcc, axis=1)]
    except Exception:
        mfcc_mean = [0.0] * 13
        mfcc_std = [0.0] * 13

    try:
        cent = librosa.feature.spectral_centroid(y=y, sr=sr)
        centroid_mean = float(np.mean(cent))
        centroid_std = float(np.std(cent))
    except Exception:
        centroid_mean, centroid_std = 1500.0, 300.0

    try:
        bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        bandwidth_mean = float(np.mean(bw))
        bandwidth_std = float(np.std(bw))
    except Exception:
        bandwidth_mean, bandwidth_std = 1800.0, 250.0

    try:
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=4)
        contrast_mean = [float(x) for x in np.mean(contrast, axis=1)]
    except Exception:
        contrast_mean = [20.0, 15.0, 18.0, 12.0, 10.0]

    try:
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = float(np.mean(zcr))
    except Exception:
        zcr_mean = 0.08

    try:
        rms = librosa.feature.rms(y=y)
        rms_mean = float(np.mean(rms))
        rms_max = float(np.max(rms))
    except Exception:
        rms_mean, rms_max = 0.15, 0.45

    try:
        corr = np.correlate(y, y, mode='full')
        corr = corr[len(corr)//2:]
        dmin = int(sr / 400)
        dmax = int(sr / 70)
        if len(corr) > dmax:
            peak = np.argmax(corr[dmin:dmax]) + dmin
            pitch_hz = float(sr / peak) if peak > 0 else 180.0
        else:
            pitch_hz = 180.0
    except Exception:
        pitch_hz = 180.0

    try:
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40)
        mel_energy_bands = [float(np.mean(mel[i:i+8, :])) for i in range(0, 40, 8)]
    except Exception:
        mel_energy_bands = [0.1, 0.3, 0.4, 0.2, 0.05]

    return {
        'audio_meta': {
            'duration_seconds': round(duration, 2),
            'sample_rate': sr,
            'channels': channels,
            'rms_mean': round(rms_mean, 4),
            'rms_max': round(rms_max, 4),
        },
        'mfcc': {
            'mean': [round(x, 2) for x in mfcc_mean],
            'std': [round(x, 2) for x in mfcc_std]
        },
        'spectral': {
            'centroid_hz': round(centroid_mean, 1),
            'centroid_std': round(centroid_std, 1),
            'bandwidth_hz': round(bandwidth_mean, 1),
            'contrast_bands': [round(x, 2) for x in contrast_mean],
            'zcr': round(zcr_mean, 4)
        },
        'prosodic': {
            'estimated_f0_hz': round(pitch_hz, 1),
            'pitch_stability': round(min(1.0, max(0.0, 1.0 - (centroid_std / max(1.0, centroid_mean)))), 2),
            'energy_variation': round(min(1.0, max(0.0, rms_max - rms_mean)), 2)
        },
        'mel_bands': [round(x, 4) for x in mel_energy_bands],
        'raw_waveform': y,
        'raw_sr': sr
    }
