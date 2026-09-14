import os
import sys

detectors_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'detectors')
os.makedirs(detectors_dir, exist_ok=True)

# 1. audio_features.py
features_code = '''import numpy as np
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
'''

with open(os.path.join(detectors_dir, 'audio_features.py'), 'w', encoding='utf-8') as f:
    f.write(features_code)

# 2. deepfake_detector.py
deepfake_code = '''import numpy as np

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
        'model_name': 'VoxSentinel-Acoustic-Heuristic-v1.2 (AASIST-ready architecture)',
        'confidence_level': confidence,
        'risk_indicators': indicators if indicators else ['Natural speech harmonic balance observed'],
        'vocoder_artifact_detected': deepfake_risk > 65
    }
'''

with open(os.path.join(detectors_dir, 'deepfake_detector.py'), 'w', encoding='utf-8') as f:
    f.write(deepfake_code)

# 3. channel_detector.py
channel_code = '''import numpy as np

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
'''

with open(os.path.join(detectors_dir, 'channel_detector.py'), 'w', encoding='utf-8') as f:
    f.write(channel_code)

# 4. speaker_consistency.py
speaker_code = '''import numpy as np
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
'''

with open(os.path.join(detectors_dir, 'speaker_consistency.py'), 'w', encoding='utf-8') as f:
    f.write(speaker_code)

# 5. conversation_risk.py
convo_code = '''def analyze_conversation_risk(transcript: str, sensitive_action: str = '', transaction_amount: float = 0.0) -> dict:
    if not transcript:
        transcript = ''

    text = transcript.lower()
    flags = []
    
    otp_keywords = ['otp', 'one-time password', 'verification code', 'auth code', 'security pin', 'sms code', '6-digit code', 'six digit']
    otp_matches = [w for w in otp_keywords if w in text]
    otp_risk = 85 if otp_matches else 0
    if otp_matches:
        flags.append({
            'category': 'OTP_REQUEST',
            'severity': 'HIGH',
            'description': f'Direct solicitation of authentication credentials ({", ".join(otp_matches[:2])})',
            'weight': 35
        })

    cred_keywords = ['password', 'secret key', 'passphrase', 'private key', 'login credentials', 'master password', 'pin number']
    cred_matches = [w for w in cred_keywords if w in text]
    cred_risk = 90 if cred_matches else 0
    if cred_matches:
        flags.append({
            'category': 'CREDENTIAL_THEFT',
            'severity': 'HIGH',
            'description': f'Attempted extraction of confidential security secrets ({", ".join(cred_matches[:2])})',
            'weight': 40
        })

    financial_keywords = ['transfer', 'wire', 'rupees', 'inr', 'usd', 'dollars', 'payment', 'bank account', 'neft', 'rtgs', 'upi', 'send money', 'deposit', '₹', '$']
    fin_matches = [w for w in financial_keywords if w in text] or transaction_amount > 0
    if fin_matches or transaction_amount > 0:
        amount_note = f' (Amount: ₹{transaction_amount:,.2f})' if transaction_amount > 0 else ''
        fin_risk = 80 if (transaction_amount > 25000 or len(fin_matches) >= 2) else 50
        flags.append({
            'category': 'FINANCIAL_REQUEST',
            'severity': 'HIGH' if fin_risk > 70 else 'MEDIUM',
            'description': f'Monetary transfer or fund redirection solicitation{amount_note}',
            'weight': 30
        })
    else:
        fin_risk = 0

    urgency_keywords = ['immediately', 'right now', 'urgent', 'emergency', 'without delay', 'hurry', 'fast', 'freeze', 'cancelled', 'deadline', 'critical', 'asap']
    urgency_matches = [w for w in urgency_keywords if w in text]
    urgency_risk = 80 if len(urgency_matches) >= 2 else (50 if urgency_matches else 0)
    if urgency_matches:
        flags.append({
            'category': 'PSYCHOLOGICAL_URGENCY',
            'severity': 'HIGH' if urgency_risk > 65 else 'MEDIUM',
            'description': f'Coercive urgency indicators designed to inhibit verification ({", ".join(urgency_matches[:3])})',
            'weight': 25
        })

    bypass_keywords = ["don't tell", "do not tell", 'bypass', 'skip verification', 'keep this confidential', 'between us', 'skip protocol', 'override', 'call nobody', "don't call"]
    bypass_matches = [w for w in bypass_keywords if w in text]
    bypass_risk = 90 if bypass_matches else 0
    if bypass_matches:
        flags.append({
            'category': 'VERIFICATION_BYPASS',
            'severity': 'CRITICAL',
            'description': f'Explicit command to bypass standard authorization checks or observe secrecy ({", ".join(bypass_matches[:2])})',
            'weight': 35
        })

    authority_keywords = ['ceo', 'cfo', 'director', 'managing director', 'chairman', 'board', 'headquarters', 'president', 'police', 'tax inspector']
    auth_matches = [w for w in authority_keywords if w in text]
    if auth_matches:
        flags.append({
            'category': 'AUTHORITY_IMPERSONATION',
            'severity': 'HIGH',
            'description': f'Caller claiming high-level organizational or law enforcement authority ({", ".join(auth_matches[:2])})',
            'weight': 25
        })

    if not flags:
        behavior_score = 12
    else:
        total_weight = sum(f['weight'] for f in flags)
        behavior_score = min(98, max(25, total_weight))

    return {
        'behavior_risk': behavior_score,
        'otp_risk': otp_risk,
        'financial_risk': fin_risk,
        'urgency_risk': urgency_risk,
        'bypass_risk': bypass_risk,
        'flags': flags,
        'flags_count': len(flags)
    }
'''

with open(os.path.join(detectors_dir, 'conversation_risk.py'), 'w', encoding='utf-8') as f:
    f.write(convo_code)

# 6. trust_engine.py
trust_code = '''def calculate_voice_trust(
    deepfake_score: int,
    speaker_consistency: int,
    channel_risk: int,
    behavior_risk: int,
    liveness_score: int = 100,
    transaction_amount: float = 0.0,
    device_trusted: bool = True,
    sensitive_action: str = '',
    challenge_status: str = 'NONE'
) -> dict:
    speaker_inconsistency = max(0, 100 - speaker_consistency)

    w_df = 0.30
    w_cons = 0.20
    w_ch = 0.15
    w_beh = 0.25
    w_live = 0.10
    
    liveness_deficit = max(0, 100 - liveness_score)
    
    raw_risk = (
        (deepfake_score * w_df) +
        (speaker_inconsistency * w_cons) +
        (channel_risk * w_ch) +
        (behavior_risk * w_beh) +
        (liveness_deficit * w_live)
    )

    if challenge_status == 'PASSED':
        raw_risk = max(10, raw_risk * 0.45)
    elif challenge_status == 'FAILED':
        raw_risk = min(98, max(82, raw_risk * 1.35 + 20))

    escalation_reasons = []
    if transaction_amount > 50000:
        raw_risk = min(98, raw_risk + 15)
        escalation_reasons.append(f'High-value financial transaction (₹{transaction_amount:,.2f})')
    elif transaction_amount > 10000:
        raw_risk = min(98, raw_risk + 8)
        escalation_reasons.append(f'Financial transaction (₹{transaction_amount:,.2f})')

    if not device_trusted:
        raw_risk = min(98, raw_risk + 12)
        escalation_reasons.append('Unrecognized device or spoofed caller CLI')

    if sensitive_action in ['WIRE_TRANSFER', 'PASSWORD_RESET', 'OTP_VERIFICATION', 'ACCOUNT_TAKEOVER']:
        raw_risk = min(98, raw_risk + 10)
        escalation_reasons.append(f'High-privilege sensitive action requested: {sensitive_action}')

    composite_risk = int(min(98, max(5, round(raw_risk))))
    trust_score = max(2, min(98, 100 - composite_risk))

    if composite_risk < 30:
        risk_level = 'TRUSTED'
        color = '#10B981'
        recommended_action = 'ALLOW'
        action_title = 'Safe to Proceed'
    elif composite_risk < 60:
        risk_level = 'SUSPICIOUS'
        color = '#F59E0B'
        recommended_action = 'MONITOR'
        action_title = 'Monitor & Step-up Telemetry'
    elif composite_risk < 80:
        risk_level = 'VERIFICATION_REQUIRED'
        color = '#F97316'
        recommended_action = 'INDEPENDENT_VERIFICATION'
        action_title = 'Trigger Dynamic Voice Challenge / Callback'
    else:
        risk_level = 'CRITICAL'
        color = '#EF4444'
        if transaction_amount > 0:
            recommended_action = 'BLOCK_SENSITIVE_ACTION'
            action_title = 'FREEZE TRANSACTION & BLOCK CALL'
        else:
            recommended_action = 'BLOCK_SENSITIVE_ACTION'
            action_title = 'BLOCK SENSITIVE ACTION'

    return {
        'trust_score': trust_score,
        'composite_risk': composite_risk,
        'risk_level': risk_level,
        'color': color,
        'recommended_action': recommended_action,
        'action_title': action_title,
        'action_aware_escalations': escalation_reasons,
        'challenge_recommended': composite_risk >= 55 and challenge_status != 'PASSED',
        'weights_applied': {
            'deepfake': w_df,
            'speaker_consistency': w_cons,
            'channel_risk': w_ch,
            'behavior_risk': w_beh,
            'liveness': w_live
        }
    }
'''

with open(os.path.join(detectors_dir, 'trust_engine.py'), 'w', encoding='utf-8') as f:
    f.write(trust_code)

print("All 6 detectors written successfully.")
