import React, { useState } from 'react';
import { KeyRound, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { AudioRecorder } from '../components/AudioRecorder';
import { TrustGauge } from '../components/TrustGauge';
import { createChallenge, verifyChallenge } from '../services/api';
import { ChallengeSessionData, ChallengeVerificationResult } from '../types';

export const ChallengeCenter: React.FC = () => {
  const [session, setSession] = useState<ChallengeSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<ChallengeVerificationResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await createChallenge();
      setSession(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioReady = async (blob: Blob, dur: number) => {
    if (!session) return;
    setVerifying(true);
    try {
      const res = await verifyChallenge(session.challenge_id, blob, 1850);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <KeyRound className="w-7 h-7 text-amber-400" />
          Adaptive Dynamic Voice Challenge Center
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Feature 10: Dynamic challenge generation & liveness verification via acoustic latency, continuity & pitch dynamics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Challenge Phrase Generator
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {session ? 'Generate New Phrase' : 'Start Dynamic Challenge'}
              </button>
            </div>

            {session ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-6 rounded-xl bg-slate-950 border border-amber-500/40 text-center space-y-2">
                  <span className="text-[11px] uppercase tracking-widest text-amber-400 font-mono font-bold block">
                    SECURITY VERIFICATION PHRASE
                  </span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-wide">
                    "{session.phrase}"
                  </div>
                  <span className="text-xs text-slate-400 block pt-1">
                    Please repeat the phrase clearly into your microphone below.
                  </span>
                </div>

                <AudioRecorder
                  onAudioReady={handleAudioReady}
                  disabled={verifying}
                  label="Record Challenge Response Audio"
                  color="#F59E0B"
                />

                {verifying && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse text-center">
                    Analyzing response latency, vocal tract resonance & replay artifacts...
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <KeyRound className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-mono">
                  Click "Start Dynamic Challenge" to generate a one-time random security verification prompt.
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {result.status === 'PASSED' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                  <h3 className="text-base font-bold text-white">
                    Verification Verdict: <span className={result.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}>{result.status}</span>
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Latency: {result.latency_ms}ms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">ACOUSTIC MATCH</span>
                  <span className="text-base font-bold text-cyan-400">{result.acoustic_match_score}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">PROSODY MATCH</span>
                  <span className="text-base font-bold text-amber-400">{result.prosody_match_score}%</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">INITIAL RISK</span>
                  <span className="text-base font-bold text-slate-400">{result.initial_risk}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">UPDATED RISK</span>
                  <span className={`text-base font-bold ${result.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.updated_risk}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 sticky top-20 flex flex-col items-center justify-center space-y-4">
            <TrustGauge
              score={result ? result.trust_score : 50}
              riskLevel={result?.risk_level}
              size={220}
              subLabel="Updated Voice Trust Score"
            />

            {result && (
              <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs">
                <span className="text-slate-400 block mb-1">Post-Challenge Action:</span>
                <span className="font-bold text-sm text-cyan-300">
                  {result.recommended_action.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
