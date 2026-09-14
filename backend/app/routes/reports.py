from fastapi import APIRouter, Depends, HTTPException
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
