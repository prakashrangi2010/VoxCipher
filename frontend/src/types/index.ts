export type RiskLevel = 'TRUSTED' | 'SUSPICIOUS' | 'VERIFICATION_REQUIRED' | 'CRITICAL';

export type RecommendedAction = 
  | 'ALLOW' 
  | 'MONITOR' 
  | 'INDEPENDENT_VERIFICATION' 
  | 'CALLBACK_REGISTERED_NUMBER' 
  | 'FREEZE_TRANSACTION' 
  | 'BLOCK_SENSITIVE_ACTION';

export interface AudioFeatures {
  audio_meta: {
    duration_seconds: number;
    sample_rate: number;
    channels: number;
    rms_mean: number;
    rms_max: number;
  };
  mfcc: {
    mean: number[];
    std: number[];
  };
  spectral: {
    centroid_hz: number;
    centroid_std: number;
    bandwidth_hz: number;
    contrast_bands: number[];
    zcr: number;
  };
  prosodic: {
    estimated_f0_hz: number;
    pitch_stability: number;
    energy_variation: number;
  };
  mel_bands: number[];
}

export interface TimelineSegment {
  window_index: number;
  start: number;
  end: number;
  score: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface BehaviorFlag {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  weight?: number;
}

export interface AnalysisResult {
  threat_id: string;
  filename: string;
  deepfake_score: number;
  speaker_consistency: number;
  channel_risk: number;
  behavior_risk: number;
  liveness_score: number;
  replay_risk: number;
  compression_risk: number;
  injection_risk: number;
  tts_score: number;
  voice_conversion_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  recommended_action: RecommendedAction;
  action_title: string;
  action_aware_escalations: string[];
  challenge_recommended: boolean;
  timeline: TimelineSegment[];
  behavior_flags: BehaviorFlag[];
  deepfake_details?: {
    model_name: string;
    confidence_level: string;
    risk_indicators: string[];
    vocoder_artifact_detected: boolean;
  };
  channel_details?: {
    details: {
      replay_status: string;
      codec_identified: string;
      injection_detected: boolean;
    };
  };
  audio_features?: AudioFeatures;
}

export interface ThreatRecordItem {
  id: string;
  timestamp: string;
  caller_id: string;
  filename: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  deepfake_score: number;
  speaker_consistency: number;
  channel_risk: number;
  replay_risk: number;
  compression_risk: number;
  injection_risk: number;
  tts_score: number;
  voice_conversion_score: number;
  behavior_risk: number;
  liveness_score: number;
  trust_score: number;
  risk_level: RiskLevel;
  recommended_action: RecommendedAction;
  transcript: string;
  behavior_flags: BehaviorFlag[];
  timeline: TimelineSegment[];
  features: any;
  challenge_triggered: boolean;
  challenge_status: string;
  sensitive_action: string;
  transaction_amount: number;
}

export interface ChallengeSessionData {
  challenge_id: string;
  threat_id?: string;
  phrase: string;
  created_at: string;
  instruction: string;
  timeout_seconds: number;
}

export interface ChallengeVerificationResult {
  challenge_id: string;
  status: 'PASSED' | 'FAILED';
  latency_ms: number;
  acoustic_match_score: number;
  prosody_match_score: number;
  liveness_verified: boolean;
  initial_risk: number;
  updated_risk: number;
  trust_score: number;
  risk_level: RiskLevel;
  recommended_action: RecommendedAction;
  details: {
    pitch_f0_hz: number;
    response_duration: number;
    latency_acceptable: boolean;
    prosodic_naturalness: boolean;
  };
}

export interface AttackSimulationData {
  scenario_title: string;
  caller_profile: {
    claimed_identity: string;
    calling_number: string;
    device_status: string;
    target_system: string;
  };
  initial_state: {
    deepfake_score: number;
    speaker_consistency: number;
    channel_risk: number;
    behavior_risk: number;
    trust_score: number;
    risk_score: number;
    risk_level: RiskLevel;
    action: string;
  };
  transcript_utterance: string;
  detection_event: {
    voice_conversion_detected: boolean;
    voice_conversion_score: number;
    behavior_flags: Array<{ category: string; severity: string; detail: string }>;
    intermediate_risk_score: number;
    intermediate_trust_score: number;
    intermediate_risk_level: RiskLevel;
    action: string;
  };
  challenge_phase: {
    challenge_phrase: string;
    challenge_status: 'PASSED' | 'FAILED';
    failure_reason: string;
    latency_ms: number;
    acoustic_match_score: number;
  };
  final_state: {
    deepfake_score: number;
    speaker_consistency: number;
    channel_risk: number;
    behavior_risk: number;
    trust_score: number;
    risk_score: number;
    risk_level: RiskLevel;
    recommended_action: RecommendedAction;
    action_banner: string;
    score_progression: Array<{ step: string; risk: number; trust: number; status: string }>;
  };
}

export interface LabResult {
  experiment_id: string;
  timestamp: string;
  codec_key: string;
  codec_name: string;
  metrics: {
    original_detection_score: number;
    telephony_robust_score: number;
    equal_error_rate_pct: number;
    false_acceptance_rate_pct: number;
    false_rejection_rate_pct: number;
    detection_latency_ms: number;
    codec_robustness_index_pct: number;
  };
  spectral_comparison: {
    frequencies_khz: number[];
    original_energy_db: number[];
    distorted_energy_db: number[];
  };
  analysis_notes: string;
}

export interface AnalyticsData {
  total_calls: number;
  threats_detected: number;
  average_trust_score: number;
  critical_threats: number;
  attack_type_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  latency_trend: Array<{ time: string; latency_ms: number; volume: number }>;
  challenge_stats: {
    total: number;
    passed: number;
    failed: number;
    success_rate: number;
  };
  false_block_rate: number;
}
