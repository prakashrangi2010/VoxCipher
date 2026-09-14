import numpy as np
import librosa

def analyze_speaker_consistency(y: np.ndarray, sr: int, window_seconds: float = 3.0) -> dict:
    if len(y) == 0:
        return {
            'speaker_consistency': 85,
            'timeline': [{'window_index': 0, 'start': 0.0, 'end': 3.0, 'score': 85, 'status': 'safe'}],
            'inconsistency_flag': False
        }

    duration = len(y) / sr
    window_samples = int(sr * window_seconds)
    step_samples = max(int(sr * 1.5), window_samples // 2)

    embeddings = []
    start_s = 0
    while start_s < len(y):
        end_s = min(len(y), start_s + window_samples)
        chunk = y[start_s:end_s]
        t_start = round(start_s / sr, 1)
        t_end = round(end_s / sr, 1)

        if len(chunk) > sr * 0.25:
            try:
                mfcc = np.mean(librosa.feature.mfcc(y=chunk, sr=sr, n_mfcc=6), axis=1)
                cent = np.mean(librosa.feature.spectral_centroid(y=chunk, sr=sr)) / 1000.0
                rms = np.mean(librosa.feature.rms(y=chunk)) * 10.0
                vec = np.concatenate([mfcc, [cent, rms]])
            except Exception:
                vec = np.ones(8)
            embeddings.append((t_start, t_end, vec))

        start_s += step_samples

    if not embeddings:
        embeddings.append((0.0, max(1.0, duration), np.ones(8)))

    baseline = embeddings[0][2]
    norm_base = np.linalg.norm(baseline)
    if norm_base == 0:
        norm_base = 1.0

    timeline = []
    scores = []

    for idx, (t_start, t_end, vec) in enumerate(embeddings):
        norm_v = np.linalg.norm(vec)
        if norm_v == 0:
            norm_v = 1.0
            
        similarity = float(np.dot(baseline, vec) / (norm_base * norm_v))
        similarity = max(-1.0, min(1.0, similarity))
        window_score = int(max(10, min(100, (similarity + 1.0) * 50.0)))
        
        if window_score >= 80:
            status = 'safe'
        elif window_score >= 55:
            status = 'warning'
        else:
            status = 'critical'

        timeline.append({
            'window_index': idx,
            'start': t_start,
            'end': t_end,
            'score': window_score,
            'status': status
        })
        scores.append(window_score)

    overall_consistency = int(np.mean(scores)) if scores else 85
    min_score = min(scores) if scores else 85
    inconsistency_flag = min_score < 55

    return {
        'speaker_consistency': overall_consistency,
        'timeline': timeline,
        'inconsistency_flag': inconsistency_flag,
        'variance_detected': bool(np.std(scores) > 15) if scores else False
    }
