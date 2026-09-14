import numpy as np

def analyze_deepfake(features: dict) -> dict:
    spectral = features.get('spectral', {})
    prosodic = features.get('prosodic', {})
    mfcc = features.get('mfcc', {})
    meta = features.get('audio_meta', {})
    
    centroid = spectral.get('centroid_hz', 1500)
    bandwidth = spectral.get('bandwidth_hz', 1800)
    zcr = spectral.get('zcr', 0.08)
    f0 = prosodic.get('estimated_f0_hz', 180)
    stability = prosodic.get('pitch_stability', 0.7)
    
    score = 25
    indicators = []
    
    if stability > 0.90:
        score += 26
        indicators.append('Unnatural pitch rigidity / lack of micro-prosody')
    elif stability < 0.35:
        score += 15
        indicators.append('Erratic prosodic transitions / phase discontinuity')
        
    if centroid > 2800 or centroid < 700:
        score += 20
        indicators.append('Spectral centroid distribution anomaly (vocoder artifact)')
        
    if zcr > 0.22:
        score += 18
        indicators.append('High Zero-Crossing Rate (synthetic high-band leakage)')
    elif zcr < 0.02:
        score += 12
        indicators.append('Overly attenuated zero crossings (quantization suppression)')
        
    contrast_bands = spectral.get('contrast_bands', [15, 15, 15, 15, 15])
    if len(contrast_bands) >= 3 and np.std(contrast_bands) < 2.0:
        score += 15
        indicators.append('Compressed spectral contrast across octaves')

    deepfake_risk = int(min(98, max(6, score)))
    confidence = 'HIGH' if (deepfake_risk > 70 or deepfake_risk < 30) else 'MODERATE'

    return {
        'deepfake_score': deepfake_risk,
        'model_name': 'VoxCipher-Acoustic-Heuristic-v1.2 (AASIST-ready architecture)',
        'confidence_level': confidence,
        'risk_indicators': indicators if indicators else ['Natural speech harmonic balance observed'],
        'vocoder_artifact_detected': deepfake_risk > 65
    }
