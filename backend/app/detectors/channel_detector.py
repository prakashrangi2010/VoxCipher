import numpy as np

def analyze_channel(features: dict) -> dict:
    spectral = features.get('spectral', {})
    meta = features.get('audio_meta', {})
    mel_bands = features.get('mel_bands', [0.2, 0.2, 0.2, 0.2, 0.2])
    
    centroid = spectral.get('centroid_hz', 1600)
    bandwidth = spectral.get('bandwidth_hz', 1700)
    
    replay_risk = 18
    if centroid < 1200 and bandwidth < 1400:
        replay_risk += 35
    if len(mel_bands) > 3 and mel_bands[-1] < 0.01:
        replay_risk += 20
    replay_risk = int(min(95, max(8, replay_risk)))

    compression_risk = 22
    if bandwidth < 1500 or centroid < 1400:
        compression_risk += 35
    if len(mel_bands) >= 5 and (mel_bands[0] > 0.4 and mel_bands[4] < 0.05):
        compression_risk += 25
    compression_risk = int(min(95, max(10, compression_risk)))

    injection_risk = int(min(90, max(12, abs(centroid - 1600) / 30 + (25 if replay_risk > 50 else 0))))
    tts_score = int(min(96, max(10, (features.get('prosodic', {}).get('pitch_stability', 0.5) * 60) + 15)))

    f0 = features.get('prosodic', {}).get('estimated_f0_hz', 180)
    vc_score = int(min(95, max(8, abs(centroid - f0 * 8) / 40 + 20)))

    composite_channel = int((replay_risk * 0.35) + (compression_risk * 0.25) + (injection_risk * 0.40))
    composite_channel = min(100, max(5, composite_channel))

    return {
        'channel_risk': composite_channel,
        'replay_risk': replay_risk,
        'compression_risk': compression_risk,
        'injection_risk': injection_risk,
        'tts_score': tts_score,
        'voice_conversion_score': vc_score,
        'details': {
            'replay_status': 'SUSPICIOUS' if replay_risk > 55 else 'CLEAR',
            'codec_identified': 'G.711/PSTN-like' if compression_risk > 50 else 'Wideband-High-Fidelity',
            'injection_detected': injection_risk > 60
        }
    }
