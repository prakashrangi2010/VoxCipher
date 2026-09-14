from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
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
