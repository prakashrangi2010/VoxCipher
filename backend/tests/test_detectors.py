import pytest
import numpy as np
import io
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app
from app.detectors.audio_features import extract_acoustic_features
from app.detectors.deepfake_detector import analyze_deepfake
from app.detectors.channel_detector import analyze_channel
from app.detectors.speaker_consistency import analyze_speaker_consistency
from app.detectors.conversation_risk import analyze_conversation_risk
from app.detectors.trust_engine import calculate_voice_trust

client = TestClient(app)

def generate_dummy_wav(duration: float = 2.0, sr: int = 16000) -> bytes:
    t = np.linspace(0, duration, int(sr * duration))
    # Synthetic speech harmonic mock (150Hz base + harmonics)
    y = 0.5 * np.sin(2 * np.pi * 150 * t) + 0.3 * np.sin(2 * np.pi * 300 * t)
    bio = io.BytesIO()
    sf.write(bio, y, sr, format="WAV")
    return bio.getvalue()

def test_audio_feature_extraction():
    wav_bytes = generate_dummy_wav(1.5, 16000)
    feats = extract_acoustic_features(wav_bytes)
    assert "audio_meta" in feats
    assert feats["audio_meta"]["duration_seconds"] > 1.0
    assert "mfcc" in feats
    assert len(feats["mfcc"]["mean"]) == 13
    assert "spectral" in feats
    assert "prosodic" in feats

def test_deepfake_detector():
    feats = extract_acoustic_features(generate_dummy_wav(1.0))
    res = analyze_deepfake(feats)
    assert "deepfake_score" in res
    assert 0 <= res["deepfake_score"] <= 100
    assert "risk_indicators" in res

def test_channel_detector():
    feats = extract_acoustic_features(generate_dummy_wav(1.0))
    res = analyze_channel(feats)
    assert "channel_risk" in res
    assert "replay_risk" in res
    assert "compression_risk" in res

def test_speaker_consistency():
    sr = 16000
    t = np.linspace(0, 6.0, int(sr * 6.0))
    y = 0.5 * np.sin(2 * np.pi * 200 * t)
    res = analyze_speaker_consistency(y, sr)
    assert "speaker_consistency" in res
    assert "timeline" in res
    assert len(res["timeline"]) >= 2

def test_conversation_risk():
    text = "Transfer INR 50,000 immediately to my account. Don't tell anyone."
    res = analyze_conversation_risk(text, transaction_amount=50000.0)
    assert res["behavior_risk"] > 50
    assert res["financial_risk"] > 0
    assert res["urgency_risk"] > 0
    assert res["bypass_risk"] > 0

def test_trust_engine():
    res = calculate_voice_trust(
        deepfake_score=75,
        speaker_consistency=50,
        channel_risk=60,
        behavior_risk=85,
        transaction_amount=50000.0,
        sensitive_action="WIRE_TRANSFER"
    )
    assert res["trust_score"] < 50
    assert res["risk_level"] in ["VERIFICATION_REQUIRED", "CRITICAL"]

def test_health_api():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_analyze_api():
    wav_bytes = generate_dummy_wav(2.0)
    response = client.post(
        "/api/analyze",
        files={"file": ("test.wav", wav_bytes, "audio/wav")},
        data={"transcript": "Hello, how can I help you?", "caller_id": "+1234567890"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "threat_id" in data
    assert "trust_score" in data
    assert "deepfake_score" in data
    assert "risk_level" in data

def test_challenge_workflow():
    # 1. Create challenge
    res = client.post("/api/challenge")
    assert res.status_code == 200
    data = res.json()
    cid = data["challenge_id"]
    assert "phrase" in data

    # 2. Verify challenge
    wav_bytes = generate_dummy_wav(2.0)
    v_res = client.post(
        "/api/verify-challenge",
        data={"challenge_id": cid, "client_latency_ms": 1800},
        files={"file": ("challenge.wav", wav_bytes, "audio/wav")}
    )
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert "status" in v_data
    assert v_data["status"] in ["PASSED", "FAILED"]

def test_threats_and_analytics_api():
    t_res = client.get("/api/threats")
    assert t_res.status_code == 200
    threats = t_res.json()
    assert isinstance(threats, list)
    assert len(threats) > 0

    a_res = client.get("/api/analytics")
    assert a_res.status_code == 200
    analytics = a_res.json()
    assert "total_calls" in analytics
    assert "attack_type_distribution" in analytics

def test_attack_lab_and_simulation():
    # Lab experiment
    lab_res = client.post("/api/lab/experiment", json={"codec": "gsm"})
    assert lab_res.status_code == 200
    assert "metrics" in lab_res.json()

    # Simulation
    sim_res = client.post("/api/simulate-attack")
    assert sim_res.status_code == 200
    assert "scenario_title" in sim_res.json()
    assert "score_progression" in sim_res.json()["final_state"]
