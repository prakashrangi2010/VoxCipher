import { 
  AnalysisResult, 
  ThreatRecordItem, 
  ChallengeSessionData, 
  ChallengeVerificationResult, 
  AttackSimulationData, 
  LabResult, 
  AnalyticsData 
} from '../types';

// Fallback logic if proxy fails
async function smartFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = `/api${endpoint}`;
  try {
    const res = await fetch(url, init);
    // If Vite proxy returns 502/504 Bad Gateway, fallback to direct backend
    if (res.status === 502 || res.status === 504) {
      return await fetch(`http://127.0.0.1:8000/api${endpoint}`, init);
    }
    return res;
  } catch (err) {
    // Network failure (e.g. CORS or proxy down): try direct port 8000
    try {
      return await fetch(`http://127.0.0.1:8000/api${endpoint}`, init);
    } catch {
      throw err;
    }
  }
}

export async function analyzeAudio(
  file: File | Blob,
  fileName: string = 'recording.wav',
  transcript: string = '',
  callerId: string = 'Unknown Caller',
  deviceTrusted: boolean = true,
  transactionAmount: number = 0,
  sensitiveAction: string = ''
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('transcript', transcript);
  formData.append('caller_id', callerId);
  formData.append('device_trusted', String(deviceTrusted));
  formData.append('transaction_amount', String(transactionAmount));
  formData.append('sensitive_action', sensitiveAction);

  const res = await smartFetch('/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Analysis request failed');
  }

  return res.json();
}

export async function createChallenge(threatId?: string): Promise<ChallengeSessionData> {
  const res = await smartFetch('/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threat_id: threatId }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate dynamic voice challenge');
  }

  return res.json();
}

export async function verifyChallenge(
  challengeId: string,
  audioBlob: Blob,
  latencyMs: number = 1800
): Promise<ChallengeVerificationResult> {
  const formData = new FormData();
  formData.append('challenge_id', challengeId);
  formData.append('file', audioBlob, 'challenge_response.wav');
  formData.append('client_latency_ms', String(latencyMs));

  const res = await smartFetch('/verify-challenge', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Challenge verification request failed');
  }

  return res.json();
}

export async function runAttackSimulation(): Promise<AttackSimulationData> {
  const res = await smartFetch('/simulate-attack', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to run attack simulation');
  }

  return res.json();
}

export async function getThreats(level: string = 'ALL', search: string = ''): Promise<ThreatRecordItem[]> {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (search) params.append('search', search);

  const res = await smartFetch(`/threats?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch threat intelligence');
  return res.json();
}

export async function getThreatById(id: string): Promise<ThreatRecordItem> {
  const res = await smartFetch(`/threats/${id}`);
  if (!res.ok) throw new Error('Threat record not found');
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const res = await smartFetch('/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics telemetry');
  return res.json();
}

export async function runLabExperiment(codec: string): Promise<LabResult> {
  const res = await smartFetch('/lab/experiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codec }),
  });

  if (!res.ok) throw new Error('Lab experiment failed');
  return res.json();
}

export async function getReport(id: string): Promise<any> {
  const res = await smartFetch(`/report/${id}`);
  if (!res.ok) throw new Error('Report not found');
  return res.json();
}

export async function getHealth(): Promise<any> {
  const res = await smartFetch('/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
