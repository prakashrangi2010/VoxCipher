from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from datetime import datetime
import uuid
import json
from .connection import Base

class ThreatRecord(Base):
    __tablename__ = 'threat_records'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    caller_id = Column(String(100), default='Unknown Caller')
    filename = Column(String(255), default='')
    duration_seconds = Column(Float, default=0.0)
    sample_rate = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    
    # Security Scores (0-100)
    deepfake_score = Column(Integer, default=0)
    speaker_consistency = Column(Integer, default=100)
    channel_risk = Column(Integer, default=0)
    replay_risk = Column(Integer, default=0)
    compression_risk = Column(Integer, default=0)
    injection_risk = Column(Integer, default=0)
    tts_score = Column(Integer, default=0)
    voice_conversion_score = Column(Integer, default=0)
    behavior_risk = Column(Integer, default=0)
    liveness_score = Column(Integer, default=100)
    
    # Aggregate Voice Trust Score & Risk Level
    trust_score = Column(Integer, default=100)
    risk_level = Column(String(50), default='TRUSTED') # TRUSTED, SUSPICIOUS, VERIFICATION_REQUIRED, CRITICAL
    recommended_action = Column(String(100), default='ALLOW') # ALLOW, MONITOR, INDEPENDENT_VERIFICATION, FREEZE_TRANSACTION, BLOCK_SENSITIVE_ACTION
    
    # Metadata & Context
    transcript = Column(Text, default='')
    behavior_flags = Column(Text, default='[]') # JSON array
    timeline_json = Column(Text, default='[]') # JSON array of segment consistency
    features_summary = Column(Text, default='{}') # JSON dict of acoustic features
    
    # Challenge State
    challenge_triggered = Column(Boolean, default=False)
    challenge_status = Column(String(50), default='NONE') # NONE, PENDING, PASSED, FAILED
    
    # Action-Aware Defense
    sensitive_action = Column(String(100), default='')
    transaction_amount = Column(Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else '',
            'caller_id': self.caller_id,
            'filename': self.filename,
            'duration_seconds': round(self.duration_seconds, 2),
            'sample_rate': self.sample_rate,
            'channels': self.channels,
            'deepfake_score': self.deepfake_score,
            'speaker_consistency': self.speaker_consistency,
            'channel_risk': self.channel_risk,
            'replay_risk': self.replay_risk,
            'compression_risk': self.compression_risk,
            'injection_risk': self.injection_risk,
            'tts_score': self.tts_score,
            'voice_conversion_score': self.voice_conversion_score,
            'behavior_risk': self.behavior_risk,
            'liveness_score': self.liveness_score,
            'trust_score': self.trust_score,
            'risk_level': self.risk_level,
            'recommended_action': self.recommended_action,
            'transcript': self.transcript,
            'behavior_flags': json.loads(self.behavior_flags or '[]'),
            'timeline': json.loads(self.timeline_json or '[]'),
            'features': json.loads(self.features_summary or '{}'),
            'challenge_triggered': self.challenge_triggered,
            'challenge_status': self.challenge_status,
            'sensitive_action': self.sensitive_action,
            'transaction_amount': self.transaction_amount
        }

class ChallengeSession(Base):
    __tablename__ = 'challenge_sessions'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    threat_id = Column(String(36), nullable=True)
    phrase = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default='PENDING') # PENDING, PASSED, FAILED
    latency_ms = Column(Integer, default=0)
    acoustic_match = Column(Integer, default=0)
    prosody_match = Column(Integer, default=0)
    verified_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            'challenge_id': self.id,
            'threat_id': self.threat_id,
            'phrase': self.phrase,
            'created_at': self.created_at.isoformat() if self.created_at else '',
            'status': self.status,
            'latency_ms': self.latency_ms,
            'acoustic_match': self.acoustic_match,
            'prosody_match': self.prosody_match,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }

class LabExperiment(Base):
    __tablename__ = 'lab_experiments'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow)
    codec = Column(String(50), nullable=False)
    original_score = Column(Float, default=0.0)
    robust_score = Column(Float, default=0.0)
    eer = Column(Float, default=0.0)
    far = Column(Float, default=0.0)
    frr = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    robustness_score = Column(Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else '',
            'codec': self.codec,
            'original_score': round(self.original_score, 1),
            'robust_score': round(self.robust_score, 1),
            'eer': round(self.eer, 2),
            'far': round(self.far, 2),
            'frr': round(self.frr, 2),
            'latency_ms': round(self.latency_ms, 1),
            'robustness_score': round(self.robustness_score, 1)
        }
