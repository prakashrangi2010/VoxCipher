import os

routes_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'routes')
os.makedirs(routes_dir, exist_ok=True)

# 1. analyze.py
analyze_code = '''from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import json
import uuid
import os
import shutil

from ..database.connection import get_db
from ..detectors.audio_features import extract_acoustic_features
from ..detectors.deepfake_detector import analyze_deepfake
from ..detectors.channel_detector import analyze_channel
from ..detectors.speaker_consistency import analyze_speaker_consistency
from ..detectors.conversation_risk import analyze_conversation_risk
from ..detectors.trust_engine import calculate_voice_trust
from ..services.threat_service import create_threat_record
from ..services.simulation_service import run_attack_simulation

router = APIRouter(tags=["Analysis"])

@router.post("/api/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    transcript: Optional[str] = Form(""),
    caller_id: Optional[str] = Form("Unknown Caller"),
    device_trusted: Optional[bool] = Form(True),
    transaction_amount: Optional[float] = Form(0.0),
    sensitive_action: Optional[str] = Form(""),
    db: Session = Depends(get_db)
):
    """
    Feature 1 & Feature 3: Audio upload & analysis pipeline.
    Incoming Audio -> Acoustic Extraction -> Multi-Layer Detection -> Risk Analysis -> Voice Trust Score -> Threat DB -> Response.
    """
    try:
        audio_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read audio file: {str(e)}")

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    # 1. Feature Extraction
    features = extract_acoustic_features(audio_bytes)
    audio_meta = features.get("audio_meta", {})
    waveform = features.get("raw_waveform")
    sr = features.get("raw_sr", 16000)

    # 2. Multi-layer Detectors
    deepfake_res = analyze_deepfake(features)
    channel_res = analyze_channel(features)
    consistency_res = analyze_speaker_consistency(waveform, sr)
    convo_res = analyze_conversation_risk(
        transcript=transcript,
        sensitive_action=sensitive_action,
        transaction_amount=transaction_amount
    )

    # 3. Voice Trust Engine
    deepfake_score = deepfake_res["deepfake_score"]
    consistency_score = consistency_res["speaker_consistency"]
    channel_risk = channel_res["channel_risk"]
    behavior_risk = convo_res["behavior_risk"]

    trust_res = calculate_voice_trust(
        deepfake_score=deepfake_score,
        speaker_consistency=consistency_score,
        channel_risk=channel_risk,
        behavior_risk=behavior_risk,
        liveness_score=100,
        transaction_amount=transaction_amount,
        device_trusted=device_trusted,
        sensitive_action=sensitive_action,
        challenge_status="NONE"
    )

    # Clean features for JSON response (omit large numpy raw arrays)
    clean_features = {k: v for k, v in features.items() if k not in ['raw_waveform', 'raw_sr']}

    threat_id = str(uuid.uuid4())
    threat_data = {
        "id": threat_id,
        "caller_id": caller_id if caller_id else "Unknown Caller",
        "filename": file.filename or "recording.wav",
        "duration_seconds": audio_meta.get("duration_seconds", 0.0),
        "sample_rate": audio_meta.get("sample_rate", 16000),
        "channels": audio_meta.get("channels", 1),
        "deepfake_score": deepfake_score,
        "speaker_consistency": consistency_score,
        "channel_risk": channel_risk,
        "replay_risk": channel_res.get("replay_risk", 0),
        "compression_risk": channel_res.get("compression_risk", 0),
        "injection_risk": channel_res.get("injection_risk", 0),
        "tts_score": channel_res.get("tts_score", 0),
        "voice_conversion_score": channel_res.get("voice_conversion_score", 0),
        "behavior_risk": behavior_risk,
        "liveness_score": 100,
        "trust_score": trust_res["trust_score"],
        "risk_level": trust_res["risk_level"],
        "recommended_action": trust_res["recommended_action"],
        "transcript": transcript,
        "behavior_flags": convo_res.get("flags", []),
        "timeline": consistency_res.get("timeline", []),
        "features": clean_features,
        "challenge_triggered": trust_res["challenge_recommended"],
        "challenge_status": "PENDING" if trust_res["challenge_recommended"] else "NONE",
        "sensitive_action": sensitive_action,
        "transaction_amount": transaction_amount
    }

    # Save to SQLite
    create_threat_record(db, threat_data)

    return {
        "threat_id": threat_id,
        "filename": file.filename,
        "deepfake_score": deepfake_score,
        "speaker_consistency": consistency_score,
        "channel_risk": channel_risk,
        "behavior_risk": behavior_risk,
        "liveness_score": 100,
        "replay_risk": channel_res.get("replay_risk", 0),
        "compression_risk": channel_res.get("compression_risk", 0),
        "injection_risk": channel_res.get("injection_risk", 0),
        "tts_score": channel_res.get("tts_score", 0),
        "voice_conversion_score": channel_res.get("voice_conversion_score", 0),
        "trust_score": trust_res["trust_score"],
        "risk_level": trust_res["risk_level"],
        "recommended_action": trust_res["recommended_action"],
        "action_title": trust_res["action_title"],
        "action_aware_escalations": trust_res["action_aware_escalations"],
        "challenge_recommended": trust_res["challenge_recommended"],
        "timeline": consistency_res.get("timeline", []),
        "behavior_flags": convo_res.get("flags", []),
        "deepfake_details": deepfake_res,
        "channel_details": channel_res,
        "audio_features": clean_features
    }

@router.post("/api/simulate-attack")
async def simulate_attack():
    """
    Feature 12: Complete simulated attack workflow.
    """
    return run_attack_simulation()
'''

with open(os.path.join(routes_dir, 'analyze.py'), 'w', encoding='utf-8') as f:
    f.write(analyze_code)

# 2. challenge.py
challenge_code = '''from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from ..database.connection import get_db
from ..services.challenge_service import generate_challenge, verify_challenge_response

router = APIRouter(tags=["Challenge Center"])

class ChallengeRequest(BaseModel):
    threat_id: Optional[str] = None

@router.post("/api/challenge")
async def create_challenge(payload: Optional[ChallengeRequest] = None, db: Session = Depends(get_db)):
    threat_id = payload.threat_id if payload else None
    return generate_challenge(threat_id=threat_id, db=db)

@router.post("/api/verify-challenge")
async def verify_challenge(
    challenge_id: str = Form(...),
    file: UploadFile = File(...),
    client_latency_ms: Optional[int] = Form(1500),
    db: Session = Depends(get_db)
):
    try:
        audio_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read challenge response: {str(e)}")

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Challenge response audio is empty.")

    result = verify_challenge_response(
        challenge_id=challenge_id,
        audio_bytes=audio_bytes,
        db=db,
        client_latency_ms=client_latency_ms
    )
    return result
'''

with open(os.path.join(routes_dir, 'challenge.py'), 'w', encoding='utf-8') as f:
    f.write(challenge_code)

# 3. threats.py
threats_code = '''from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database.connection import get_db
from ..services.threat_service import get_threats_list, get_threat_by_id

router = APIRouter(tags=["Threat Intelligence"])

@router.get("/api/threats")
def list_threats(
    level: str = Query("ALL"),
    limit: int = Query(50),
    search: str = Query(""),
    db: Session = Depends(get_db)
):
    return get_threats_list(db=db, level=level, limit=limit, search=search)

@router.get("/api/threats/{id}")
def get_threat(id: str, db: Session = Depends(get_db)):
    record = get_threat_by_id(db=db, threat_id=id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Threat record {id} not found.")
    return record
'''

with open(os.path.join(routes_dir, 'threats.py'), 'w', encoding='utf-8') as f:
    f.write(threats_code)

# 4. analytics.py
analytics_code = '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..services.threat_service import get_analytics_summary

router = APIRouter(tags=["Analytics"])

@router.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    return get_analytics_summary(db)
'''

with open(os.path.join(routes_dir, 'analytics.py'), 'w', encoding='utf-8') as f:
    f.write(analytics_code)

# 5. lab.py
lab_code = '''from fastapi import APIRouter, Form
from typing import Optional
from pydantic import BaseModel

from ..services.lab_service import run_codec_experiment

router = APIRouter(tags=["Attack Laboratory"])

class LabExperimentRequest(BaseModel):
    codec: str = "gsm"

@router.post("/api/lab/experiment")
def test_codec(payload: LabExperimentRequest):
    return run_codec_experiment(codec=payload.codec)
'''

with open(os.path.join(routes_dir, 'lab.py'), 'w', encoding='utf-8') as f:
    f.write(lab_code)

# 6. reports.py
reports_code = '''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..services.threat_service import get_threat_by_id

router = APIRouter(tags=["Reports"])

@router.get("/api/report/{id}")
def get_report(id: str, db: Session = Depends(get_db)):
    threat = get_threat_by_id(db=db, threat_id=id)
    if not threat:
        raise HTTPException(status_code=404, detail="Incident report not found.")

    return {
        "report_id": f"REP-{threat['id'][:8].upper()}",
        "generated_at": threat["timestamp"],
        "classification": "CONFIDENTIAL // CYBER FORENSIC AUDIT",
        "incident": {
            "threat_id": threat["id"],
            "caller_id": threat["caller_id"],
            "audio_filename": threat["filename"],
            "duration": threat["duration_seconds"],
            "sample_rate": threat["sample_rate"],
            "channels": threat["channels"]
        },
        "acoustic_forensics": {
            "deepfake_risk_score": threat["deepfake_score"],
            "speaker_consistency_score": threat["speaker_consistency"],
            "channel_risk_score": threat["channel_risk"],
            "replay_risk": threat["replay_risk"],
            "compression_risk": threat["compression_risk"],
            "injection_risk": threat["injection_risk"],
            "tts_score": threat["tts_score"],
            "voice_conversion_score": threat["voice_conversion_score"],
            "features_summary": threat["features"]
        },
        "behavioral_intelligence": {
            "behavior_risk_score": threat["behavior_risk"],
            "transcript": threat["transcript"],
            "flags": threat["behavior_flags"],
            "sensitive_action": threat["sensitive_action"],
            "transaction_amount": threat["transaction_amount"]
        },
        "timeline_consistency": threat["timeline"],
        "challenge_audit": {
            "triggered": threat["challenge_triggered"],
            "status": threat["challenge_status"],
            "liveness_verified": threat["liveness_score"] > 60
        },
        "trust_verdict": {
            "voice_trust_score": threat["trust_score"],
            "risk_level": threat["risk_level"],
            "recommended_action": threat["recommended_action"],
            "policy_decision": "ACTION BLOCKED" if threat["risk_level"] == "CRITICAL" else "AUTHORIZED"
        }
    }
'''

with open(os.path.join(routes_dir, 'reports.py'), 'w', encoding='utf-8') as f:
    f.write(reports_code)

# 7. health.py
health_code = '''from fastapi import APIRouter

router = APIRouter(tags=["System Health"])

@router.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "VoxSentinel Multi-Layer Voice Defense Engine",
        "version": "1.0.0",
        "modules": {
            "deepfake_detector": "ACTIVE (Acoustic Spectral v1.2)",
            "channel_detector": "ACTIVE (Replay & Codec DSP)",
            "speaker_consistency": "ACTIVE (Windowed Cosine Fingerprinting)",
            "conversation_risk": "ACTIVE (NLP Pattern Extractor)",
            "adaptive_challenge": "ACTIVE (Dynamic Liveness Hub)",
            "voice_trust_engine": "ACTIVE (Action-Aware Multi-Signal)",
            "attack_laboratory": "ACTIVE (DSP Codec Simulator)"
        }
    }
'''

with open(os.path.join(routes_dir, 'health.py'), 'w', encoding='utf-8') as f:
    f.write(health_code)

# 8. main.py
main_code = '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database.connection import engine, Base, SessionLocal
from .services.threat_service import seed_demo_threats_if_empty
from .routes import analyze, challenge, threats, analytics, lab, reports, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed initial demo threats for rich SOC experience
    db = SessionLocal()
    try:
        seed_demo_threats_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="VoxSentinel – Adaptive Voice Impersonation Defense API",
    description="Multi-layered zero-trust voice defense against deepfakes, channel spoofing, and social engineering.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(challenge.router)
app.include_router(threats.router)
app.include_router(analytics.router)
app.include_router(lab.router)
app.include_router(reports.router)
'''

with open(os.path.join(os.path.dirname(routes_dir), 'main.py'), 'w', encoding='utf-8') as f:
    f.write(main_code)

print("All routes and main.py written successfully.")
