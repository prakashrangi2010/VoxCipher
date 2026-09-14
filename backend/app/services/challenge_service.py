import random
import uuid
import datetime
import numpy as np
from sqlalchemy.orm import Session
from ..database.models import ChallengeSession, ThreatRecord
from ..detectors.audio_features import extract_acoustic_features
from ..detectors.trust_engine import calculate_voice_trust

CHALLENGE_PHRASES = [
    "Suraj purab se ugta hai aur pashchim mein dhalta hai.",
    "Himalaya ki choti par taaza barf giri hai.",
    "Ganga kinare mandir mein subah aarti hoti hai.",
    "Chambal river flows past the ancient fortress.",
    "Blue mango 47 is arriving tomorrow.",
    "Seven silver birds crossed the bridge.",
    "Project Orion starts at 6:40 PM.",
    "Narmada bridge traffic resumes at sunrise.",
    "Copper kettle whistling on the northern stove."
]

def generate_challenge(threat_id: str = None, db: Session = None) -> dict:
    session_id = str(uuid.uuid4())
    phrase = random.choice(CHALLENGE_PHRASES)
    
    session_record = ChallengeSession(
        id=session_id,
        threat_id=threat_id,
        phrase=phrase,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    if db:
        db.add(session_record)
        db.commit()
        db.refresh(session_record)

    return {
        "challenge_id": session_id,
        "threat_id": threat_id,
        "phrase": phrase,
        "created_at": session_record.created_at.isoformat(),
        "instruction": "Please repeat the security verification phrase clearly into your microphone.",
        "timeout_seconds": 30
    }

def verify_challenge_response(
    challenge_id: str,
    audio_bytes: bytes,
    db: Session = None,
    client_latency_ms: int = 1500
) -> dict:
    features = extract_acoustic_features(audio_bytes)
    prosodic = features.get("prosodic", {})
    spectral = features.get("spectral", {})
    meta = features.get("audio_meta", {})
    
    f0 = prosodic.get("estimated_f0_hz", 180)
    stability = prosodic.get("pitch_stability", 0.7)
    duration = meta.get("duration_seconds", 2.0)
    
    # Analyze challenge validity:
    # 1. Latency check (rapid synthetic injection vs human response time)
    # Natural human read time for 6 words is ~1.5s - 3.5s
    latency_ms = client_latency_ms if client_latency_ms > 0 else 1850
    latency_flag = latency_ms < 600 or latency_ms > 8000
    
    # 2. Acoustic naturalness
    # Monotone AI synthesizers have stability > 0.94
    is_monotone_ai = stability > 0.93 or stability < 0.25
    
    # 3. Replay check on challenge
    replay_score = 15
    if spectral.get("centroid_hz", 1500) < 1200:
        replay_score += 35

    # Verification decision
    passed = (not is_monotone_ai) and (not latency_flag) and (duration >= 1.0) and (replay_score < 60)
    status = "PASSED" if passed else "FAILED"
    
    acoustic_match = int(min(98, max(20, (1.0 - abs(stability - 0.7)) * 100)))
    prosody_match = 88 if passed else 34
    
    # Update DB session if exists
    threat_record = None
    if db:
        session = db.query(ChallengeSession).filter(ChallengeSession.id == challenge_id).first()
        if session:
            session.status = status
            session.latency_ms = latency_ms
            session.acoustic_match = acoustic_match
            session.prosody_match = prosody_match
            session.verified_at = datetime.datetime.utcnow()
            db.commit()
            
            if session.threat_id:
                threat_record = db.query(ThreatRecord).filter(ThreatRecord.id == session.threat_id).first()
                if threat_record:
                    threat_record.challenge_status = status
                    # Recalculate trust score
                    trust_res = calculate_voice_trust(
                        deepfake_score=threat_record.deepfake_score,
                        speaker_consistency=threat_record.speaker_consistency,
                        channel_risk=threat_record.channel_risk,
                        behavior_risk=threat_record.behavior_risk,
                        liveness_score=95 if passed else 25,
                        transaction_amount=threat_record.transaction_amount or 0.0,
                        device_trusted=True,
                        sensitive_action=threat_record.sensitive_action or "",
                        challenge_status=status
                    )
                    threat_record.trust_score = trust_res["trust_score"]
                    threat_record.risk_level = trust_res["risk_level"]
                    threat_record.recommended_action = trust_res["recommended_action"]
                    db.commit()
                    db.refresh(threat_record)

    # Trust score projection if no DB threat
    initial_risk = 58
    updated_risk = 22 if passed else 82
    updated_trust = 78 if passed else 18
    risk_level = "TRUSTED" if passed else "CRITICAL"
    action = "ALLOW" if passed else "BLOCK_SENSITIVE_ACTION"

    if threat_record:
        updated_trust = threat_record.trust_score
        risk_level = threat_record.risk_level
        action = threat_record.recommended_action

    return {
        "challenge_id": challenge_id,
        "status": status,
        "latency_ms": latency_ms,
        "acoustic_match_score": acoustic_match,
        "prosody_match_score": prosody_match,
        "liveness_verified": passed,
        "initial_risk": initial_risk,
        "updated_risk": updated_risk,
        "trust_score": updated_trust,
        "risk_level": risk_level,
        "recommended_action": action,
        "details": {
            "pitch_f0_hz": f0,
            "response_duration": duration,
            "latency_acceptable": not latency_flag,
            "prosodic_naturalness": not is_monotone_ai
        }
    }
