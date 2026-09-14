from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request, Response
from sqlalchemy.orm import Session
from typing import Optional
import json
import uuid
import os
import shutil
import base64
import wave
import io
import time

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

@router.get("/api/samples/indian-accent")
def list_indian_accent_samples():
    """
    Returns the status of the Kaggle Indian Accent dataset (polly42rose/indian-accent-dataset)
    and lists all pre-packaged and downloaded Hindi & Indian accent audio samples.
    """
    from ..services.kaggle_dataset_service import get_indian_accent_status
    return get_indian_accent_status()

@router.get("/api/samples/audio/{filename}")
def get_sample_audio(filename: str):
    from fastapi.responses import FileResponse
    samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "samples")
    fpath = os.path.join(samples_dir, filename)
    if os.path.exists(fpath):
        return FileResponse(fpath, media_type="audio/wav")
    raise HTTPException(status_code=404, detail="Sample audio file not found.")

def pcm_to_wav_bytes(pcm_data: bytes, sample_rate: int = 8000, channels: int = 1, sampwidth: int = 2) -> bytes:
    with io.BytesIO() as wav_io:
        with wave.open(wav_io, 'wb') as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sampwidth)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_data)
        return wav_io.getvalue()

try:
    import audioop
    def ulaw_to_pcm(ulaw_bytes: bytes) -> bytes:
        return audioop.ulaw2lin(ulaw_bytes, 2)
except Exception:
    import numpy as np
    def ulaw_to_pcm(ulaw_bytes: bytes) -> bytes:
        u = np.frombuffer(ulaw_bytes, dtype=np.uint8)
        inv_u = ~u
        sign = (inv_u & 0x80)
        exponent = (inv_u >> 4) & 0x07
        mantissa = inv_u & 0x0F
        sample = ((mantissa << 3) + 132) << exponent
        sample -= 132
        sample = np.where(sign != 0, -sample, sample).astype(np.int16)
        return sample.tobytes()

@router.api_route("/api/telephony/twilio-webhook", methods=["GET", "POST"])
async def twilio_voice_webhook(request: Request):
    """
    Twilio Voice TwiML Webhook.
    Directs incoming telephone calls to stream live audio bidirectionally over WebSocket to VoxCipher.
    """
    host = request.headers.get("host", "localhost:8000")
    protocol = "wss" if "https" in str(request.url.scheme) or "ngrok" in host else "ws"
    ws_url = f"{protocol}://{host}/api/ws/call-stream"
    twiml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">Connecting call to VoxCipher Zero-Trust Voice Defense. Real-time acoustic authentication active.</Say>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml_content, media_type="application/xml")

@router.websocket("/api/ws/call-stream")
async def call_stream_websocket(websocket: WebSocket):
    """
    Continuous Live Call Audio WebSocket endpoint.
    Compatible with:
      - Twilio Media Streams (PCMU / 8kHz)
      - Asterisk AudioSocket / FreePBX
      - Browser WebRTC / Softphone audio chunks
      - Direct client PCM audio
    """
    await websocket.accept()
    await websocket.send_json({
        "event": "connected",
        "status": "ONLINE",
        "message": "VoxCipher Live Call Intercept Socket Active",
        "supported_codecs": ["PCMU 8000Hz (Twilio)", "Linear PCM 16-bit 16000Hz", "Base64 WAV chunks"]
    })

    audio_buffer = bytearray()
    stream_sid = None
    call_sid = None
    total_frames_analyzed = 0

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                audio_buffer.extend(message["bytes"])
            elif "text" in message and message["text"]:
                try:
                    payload_data = json.loads(message["text"])
                    event_type = payload_data.get("event")

                    if event_type == "start":
                        stream_sid = payload_data.get("streamSid")
                        call_sid = payload_data.get("start", {}).get("callSid")
                        await websocket.send_json({
                            "event": "stream_started",
                            "streamSid": stream_sid,
                            "callSid": call_sid
                        })
                    elif event_type == "media":
                        media = payload_data.get("media", {})
                        raw_payload = media.get("payload", "")
                        if raw_payload:
                            chunk_bytes = base64.b64decode(raw_payload)
                            pcm_chunk = ulaw_to_pcm(chunk_bytes)
                            audio_buffer.extend(pcm_chunk)
                    elif event_type in ["audio_chunk", "raw_audio"]:
                        raw_b64 = payload_data.get("data") or payload_data.get("audio", "")
                        if raw_b64:
                            audio_buffer.extend(base64.b64decode(raw_b64))
                    elif event_type == "ping":
                        await websocket.send_json({"event": "pong", "timestamp": time.time()})
                    elif event_type == "stop":
                        break
                except json.JSONDecodeError:
                    pass

            if len(audio_buffer) >= 32000:
                chunk_to_analyze = bytes(audio_buffer[:32000])
                audio_buffer = audio_buffer[16000:]

                wav_bytes = pcm_to_wav_bytes(chunk_to_analyze, sample_rate=8000)
                try:
                    features = extract_acoustic_features(wav_bytes)
                    deepfake_res = analyze_deepfake(features)
                    channel_res = analyze_channel(features)
                    
                    deepfake_score = deepfake_res["deepfake_score"]
                    channel_risk = channel_res["channel_risk"]
                    
                    trust_res = calculate_voice_trust(
                        deepfake_score=deepfake_score,
                        speaker_consistency=88,
                        channel_risk=channel_risk,
                        behavior_risk=20,
                        liveness_score=95,
                        transaction_amount=0,
                        device_trusted=False,
                        sensitive_action="LIVE_INTERCEPT"
                    )

                    total_frames_analyzed += 1
                    await websocket.send_json({
                        "event": "analysis_frame",
                        "frame_index": total_frames_analyzed,
                        "streamSid": stream_sid,
                        "timestamp": time.time(),
                        "trust_score": trust_res["trust_score"],
                        "risk_level": trust_res["risk_level"],
                        "deepfake_score": deepfake_score,
                        "channel_risk": channel_risk,
                        "recommended_action": trust_res["recommended_action"],
                        "action_title": trust_res["action_title"],
                        "challenge_recommended": trust_res["challenge_recommended"]
                    })
                except Exception as exc:
                    await websocket.send_json({
                        "event": "frame_error",
                        "error": str(exc)
                    })

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass

