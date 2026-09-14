from sqlalchemy.orm import Session
from ..database.models import ThreatRecord
import json
import datetime
import uuid

def create_threat_record(db: Session, data: dict) -> ThreatRecord:
    record = ThreatRecord(
        id=data.get('id', str(uuid.uuid4())),
        caller_id=data.get('caller_id', 'Unknown Caller'),
        filename=data.get('filename', 'recording.wav'),
        duration_seconds=data.get('duration_seconds', 0.0),
        sample_rate=data.get('sample_rate', 16000),
        channels=data.get('channels', 1),
        deepfake_score=data.get('deepfake_score', 0),
        speaker_consistency=data.get('speaker_consistency', 100),
        channel_risk=data.get('channel_risk', 0),
        replay_risk=data.get('replay_risk', 0),
        compression_risk=data.get('compression_risk', 0),
        injection_risk=data.get('injection_risk', 0),
        tts_score=data.get('tts_score', 0),
        voice_conversion_score=data.get('voice_conversion_score', 0),
        behavior_risk=data.get('behavior_risk', 0),
        liveness_score=data.get('liveness_score', 100),
        trust_score=data.get('trust_score', 100),
        risk_level=data.get('risk_level', 'TRUSTED'),
        recommended_action=data.get('recommended_action', 'ALLOW'),
        transcript=data.get('transcript', ''),
        behavior_flags=json.dumps(data.get('behavior_flags', [])),
        timeline_json=json.dumps(data.get('timeline', [])),
        features_summary=json.dumps(data.get('features', {})),
        challenge_triggered=data.get('challenge_triggered', False),
        challenge_status=data.get('challenge_status', 'NONE'),
        sensitive_action=data.get('sensitive_action', ''),
        transaction_amount=data.get('transaction_amount', 0.0),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_threats_list(db: Session, level: str = 'ALL', limit: int = 50, search: str = ''):
    query = db.query(ThreatRecord)
    if level and level.upper() != 'ALL':
        query = query.filter(ThreatRecord.risk_level == level.upper())
    if search:
        query = query.filter(
            (ThreatRecord.caller_id.ilike(f'%{search}%')) |
            (ThreatRecord.transcript.ilike(f'%{search}%'))
        )
    records = query.order_by(ThreatRecord.timestamp.desc()).limit(limit).all()
    return [r.to_dict() for r in records]

def get_threat_by_id(db: Session, threat_id: str):
    record = db.query(ThreatRecord).filter(ThreatRecord.id == threat_id).first()
    return record.to_dict() if record else None

def get_analytics_summary(db: Session) -> dict:
    records = db.query(ThreatRecord).all()
    total_calls = len(records)
    
    if total_calls == 0:
        return {
            'total_calls': 0,
            'threats_detected': 0,
            'average_trust_score': 85,
            'critical_threats': 0,
            'attack_type_distribution': {'Deepfake': 0, 'Replay': 0, 'TTS': 0, 'Voice Conversion': 0, 'Social Engineering': 0},
            'risk_distribution': {'TRUSTED': 0, 'SUSPICIOUS': 0, 'VERIFICATION_REQUIRED': 0, 'CRITICAL': 0},
            'latency_trend': [],
            'challenge_stats': {'total': 0, 'passed': 0, 'failed': 0, 'success_rate': 0},
            'false_block_rate': 1.2
        }

    critical_count = sum(1 for r in records if r.risk_level == 'CRITICAL')
    suspicious_count = sum(1 for r in records if r.risk_level in ['SUSPICIOUS', 'VERIFICATION_REQUIRED'])
    threats_detected = critical_count + suspicious_count
    
    avg_trust = int(sum(r.trust_score for r in records) / total_calls)

    attack_distribution = {
        'Deepfake': sum(1 for r in records if r.deepfake_score > 60),
        'Replay': sum(1 for r in records if r.replay_risk > 50),
        'TTS': sum(1 for r in records if r.tts_score > 60),
        'Voice Conversion': sum(1 for r in records if r.voice_conversion_score > 60),
        'Social Engineering': sum(1 for r in records if r.behavior_risk > 50)
    }

    risk_distribution = {
        'TRUSTED': sum(1 for r in records if r.risk_level == 'TRUSTED'),
        'SUSPICIOUS': sum(1 for r in records if r.risk_level == 'SUSPICIOUS'),
        'VERIFICATION_REQUIRED': sum(1 for r in records if r.risk_level == 'VERIFICATION_REQUIRED'),
        'CRITICAL': critical_count
    }

    challenges = [r for r in records if r.challenge_status in ['PASSED', 'FAILED']]
    c_passed = sum(1 for r in challenges if r.challenge_status == 'PASSED')
    c_failed = sum(1 for r in challenges if r.challenge_status == 'FAILED')
    c_rate = round((c_passed / len(challenges) * 100), 1) if challenges else 78.5

    # Mock latency trend
    latency_trend = [
        {'time': '08:00', 'latency_ms': 18.2, 'volume': 14},
        {'time': '10:00', 'latency_ms': 22.4, 'volume': 28},
        {'time': '12:00', 'latency_ms': 19.8, 'volume': 42},
        {'time': '14:00', 'latency_ms': 25.1, 'volume': 36},
        {'time': '16:00', 'latency_ms': 21.0, 'volume': 31}
    ]

    return {
        'total_calls': total_calls,
        'threats_detected': threats_detected,
        'average_trust_score': avg_trust,
        'critical_threats': critical_count,
        'attack_type_distribution': attack_distribution,
        'risk_distribution': risk_distribution,
        'latency_trend': latency_trend,
        'challenge_stats': {
            'total': len(challenges),
            'passed': c_passed,
            'failed': c_failed,
            'success_rate': c_rate
        },
        'false_block_rate': 1.4
    }

def seed_demo_threats_if_empty(db: Session):
    count = db.query(ThreatRecord).count()
    if count == 0:
        demo_items = [
            {
                'caller_id': '+91 98201 44821 (VIP Executive Spoof)',
                'filename': 'executive_urgent_wire.wav',
                'duration_seconds': 14.2,
                'sample_rate': 16000,
                'channels': 1,
                'deepfake_score': 82,
                'speaker_consistency': 52,
                'channel_risk': 74,
                'replay_risk': 25,
                'compression_risk': 68,
                'injection_risk': 75,
                'tts_score': 45,
                'voice_conversion_score': 84,
                'behavior_risk': 92,
                'liveness_score': 28,
                'trust_score': 18,
                'risk_level': 'CRITICAL',
                'recommended_action': 'BLOCK_SENSITIVE_ACTION',
                'transcript': 'Please authorize immediate transfer of INR 50,000 to vendor account. Do not call to verify, I am in flight.',
                'behavior_flags': [
                    {'category': 'AUTHORITY_IMPERSONATION', 'severity': 'HIGH', 'description': 'Caller claiming VIP status'},
                    {'category': 'FINANCIAL_REQUEST', 'severity': 'HIGH', 'description': 'INR 50,000 wire requested'},
                    {'category': 'VERIFICATION_BYPASS', 'severity': 'CRITICAL', 'description': 'Command not to verify'}
                ],
                'timeline': [
                    {'window_index': 0, 'start': 0.0, 'end': 3.5, 'score': 78, 'status': 'warning'},
                    {'window_index': 1, 'start': 3.5, 'end': 7.0, 'score': 48, 'status': 'critical'},
                    {'window_index': 2, 'start': 7.0, 'end': 10.5, 'score': 42, 'status': 'critical'},
                    {'window_index': 3, 'start': 10.5, 'end': 14.2, 'score': 50, 'status': 'critical'}
                ],
                'challenge_triggered': True,
                'challenge_status': 'FAILED',
                'sensitive_action': 'WIRE_TRANSFER',
                'transaction_amount': 50000.0
            },
            {
                'caller_id': '+1 (415) 890-2104 (Unknown Voip)',
                'filename': 'customer_support_query.wav',
                'duration_seconds': 18.5,
                'sample_rate': 16000,
                'channels': 1,
                'deepfake_score': 15,
                'speaker_consistency': 94,
                'channel_risk': 22,
                'replay_risk': 12,
                'compression_risk': 25,
                'injection_risk': 10,
                'tts_score': 18,
                'voice_conversion_score': 14,
                'behavior_risk': 10,
                'liveness_score': 95,
                'trust_score': 92,
                'risk_level': 'TRUSTED',
                'recommended_action': 'ALLOW',
                'transcript': 'Hello, I wanted to check the operating hours for the downtown branch tomorrow afternoon.',
                'behavior_flags': [],
                'timeline': [
                    {'window_index': 0, 'start': 0.0, 'end': 4.5, 'score': 95, 'status': 'safe'},
                    {'window_index': 1, 'start': 4.5, 'end': 9.0, 'score': 92, 'status': 'safe'},
                    {'window_index': 2, 'start': 9.0, 'end': 13.5, 'score': 94, 'status': 'safe'},
                    {'window_index': 3, 'start': 13.5, 'end': 18.5, 'score': 93, 'status': 'safe'}
                ],
                'challenge_triggered': False,
                'challenge_status': 'NONE',
                'sensitive_action': '',
                'transaction_amount': 0.0
            },
            {
                'caller_id': '+44 20 7946 0192 (Banking Helpdesk)',
                'filename': 'otp_harvesting_attempt.wav',
                'duration_seconds': 11.8,
                'sample_rate': 16000,
                'channels': 1,
                'deepfake_score': 62,
                'speaker_consistency': 68,
                'channel_risk': 55,
                'replay_risk': 62,
                'compression_risk': 45,
                'injection_risk': 50,
                'tts_score': 58,
                'voice_conversion_score': 48,
                'behavior_risk': 88,
                'liveness_score': 45,
                'trust_score': 32,
                'risk_level': 'VERIFICATION_REQUIRED',
                'recommended_action': 'INDEPENDENT_VERIFICATION',
                'transcript': 'This is Bank Security. Please read the 6-digit verification code you just received on your device immediately.',
                'behavior_flags': [
                    {'category': 'OTP_REQUEST', 'severity': 'HIGH', 'description': '6-digit SMS authentication code solicited'},
                    {'category': 'PSYCHOLOGICAL_URGENCY', 'severity': 'HIGH', 'description': 'Urgent security claim'}
                ],
                'timeline': [
                    {'window_index': 0, 'start': 0.0, 'end': 3.5, 'score': 70, 'status': 'warning'},
                    {'window_index': 1, 'start': 3.5, 'end': 7.0, 'score': 65, 'status': 'warning'},
                    {'window_index': 2, 'start': 7.0, 'end': 11.8, 'score': 68, 'status': 'warning'}
                ],
                'challenge_triggered': True,
                'challenge_status': 'PENDING',
                'sensitive_action': 'OTP_VERIFICATION',
                'transaction_amount': 0.0
            }
        ]
        for item in demo_items:
            create_threat_record(db, item)
