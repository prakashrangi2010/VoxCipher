def calculate_voice_trust(
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
