import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Waves, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  ArrowRight, 
  Radio, 
  Lock, 
  KeyRound, 
  FlaskConical 
} from 'lucide-react';
import { getAnalytics, getThreats, runAttackSimulation } from '../services/api';
import { AnalyticsData, ThreatRecordItem, AttackSimulationData } from '../types';
import { ThreatBadge } from '../components/ThreatBadge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatRecordItem[]>([]);
  const [simLoading, setSimLoading] = useState(false);
  const [simData, setSimData] = useState<AttackSimulationData | null>(null);
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(console.error);
    getThreats('ALL', '').then(setRecentThreats).catch(console.error);
  }, []);

  const handleRunSimulation = async () => {
    setSimLoading(true);
    setSimStep(0);
    try {
      const data = await runAttackSimulation();
      setSimData(data);
      setTimeout(() => setSimStep(1), 800);
      setTimeout(() => setSimStep(2), 2200);
      setTimeout(() => setSimStep(3), 3600);
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            VOICE ZERO-TRUST SOC POSTURE: ARMED
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Adaptive Voice Impersonation & Deepfake Defense
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Multi-layered real-time inspection assessing acoustic anomalies, channel distortions, speaker consistency across temporal windows, and conversational social engineering.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/voice-analysis')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
            >
              <Waves className="w-4 h-4" /> Analyze Audio Call
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/40 shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              {simLoading ? 'Simulating Attack Scenario...' : '▶ RUN ATTACK SIMULATION'}
            </button>
          </div>
        </div>
      </div>

      {simData && (
        <div className="rounded-2xl border border-rose-500/60 bg-slate-950/95 p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {simData.scenario_title}
                </h3>
                <span className="text-xs text-rose-400 font-mono">
                  Target: {simData.caller_profile.target_system} • Caller: {simData.caller_profile.claimed_identity}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSimData(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
            >
              Close Simulation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border transition-all ${simStep >= 1 ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800 bg-slate-900/40 opacity-40'}`}>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-amber-400">PHASE 1: INGESTION</span>
                <span className="text-slate-400">Risk: 58</span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Caller claims to be CEO via spoofed number: <span className="text-amber-300 font-mono">{simData.caller_profile.calling_number}</span>
              </p>
              <div className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded inline-block">
                🟡 SUSPICIOUS (Initial Score: 58)
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${simStep >= 2 ? 'border-orange-500/50 bg-orange-950/20' : 'border-slate-800 bg-slate-900/40 opacity-40'}`}>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-orange-400">PHASE 2: BEHAVIORAL EXTRACTION</span>
                <span className="text-slate-400">Risk: 72</span>
              </div>
              <p className="text-xs text-slate-300 italic mb-2">
                "{simData.transcript_utterance}"
              </p>
              <div className="space-y-1">
                <span className="text-[11px] block text-orange-300">• Voice Conversion detected (76/100)</span>
                <span className="text-[11px] block text-rose-300">• Urgent Wire Transfer ₹50,000</span>
                <span className="text-[11px] block text-rose-300">• Explicit Verification Bypass</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${simStep >= 3 ? 'border-rose-500/60 bg-rose-950/30' : 'border-slate-800 bg-slate-900/40 opacity-40'}`}>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="font-bold text-rose-400">PHASE 3: CHALLENGE & VERDICT</span>
                <span className="text-slate-400">Risk: 82</span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Adaptive Challenge: "{simData.challenge_phase.challenge_phrase}"
              </p>
              <div className="text-xs text-rose-300 font-mono bg-rose-500/20 px-2.5 py-1 rounded border border-rose-500/40 font-bold mb-2">
                🔴 CHALLENGE FAILED: Latency 4,280ms
              </div>
              <div className="text-xs font-bold text-rose-200 bg-rose-600 p-2 rounded text-center shadow-lg">
                🚫 {simData.final_state.action_banner}
              </div>
            </div>
          </div>

          {simStep >= 3 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono uppercase text-slate-400">Score Progression:</span>
                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                  <span className="text-amber-400">58</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-orange-400">72</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-rose-400 text-lg">82 (CRITICAL)</span>
                </div>
              </div>
              <div className="text-xs font-mono text-emerald-400">
                STATUS: THREAT MITIGATED BY VOXCIPHER ZERO-TRUST ENGINE
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Calls Screened</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {analytics?.total_calls ?? 48}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Zero-Trust Acoustic Telemetry
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Threats Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-rose-400 font-mono">
            {analytics?.threats_detected ?? 14}
          </div>
          <span className="text-xs text-rose-300/80 mt-1 block">
            Deepfakes, Replays & Social Eng.
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Average Trust Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 font-mono">
            {analytics?.average_trust_score ?? 81} / 100
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Enterprise Call Quality Index
          </span>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>False Block Rate</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-400 font-mono">
            {analytics?.false_block_rate ?? 1.4}%
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Dynamic Challenge Minimizes Bias
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate('/voice-analysis')}
          className="group p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/70 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Waves className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-white text-base">Voice Deepfake Analysis</h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload call recordings or use live microphone to inspect acoustic dimensions and consistency.
          </p>
        </div>

        <div 
          onClick={() => navigate('/challenge-center')}
          className="group p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-amber-500/40 hover:bg-slate-900/70 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <KeyRound className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-white text-base">Adaptive Challenge Center</h3>
          <p className="text-xs text-slate-400 mt-1">
            Deploy dynamic phonetic challenges and verify latency, vocal continuity, and pitch stability.
          </p>
        </div>

        <div 
          onClick={() => navigate('/attack-lab')}
          className="group p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-purple-500/40 hover:bg-slate-900/70 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-bold text-white text-base">Attack Laboratory</h3>
          <p className="text-xs text-slate-400 mt-1">
            Stress-test audio detection against GSM, G.711, AMR, noise, and acoustic replay distortions.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Live Threat Activity Feed
            </h3>
          </div>
          <button
            onClick={() => navigate('/threats')}
            className="text-xs text-cyan-400 hover:underline font-mono"
          >
            View All Incident Logs →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase font-mono text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="p-3">Threat ID</th>
                <th className="p-3">Caller Identity</th>
                <th className="p-3">Deepfake Risk</th>
                <th className="p-3">Trust Score</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Recommended Action</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentThreats.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-cyan-400 font-bold">
                    {t.id.slice(0, 8)}...
                  </td>
                  <td className="p-3 text-slate-200 font-sans">
                    {t.caller_id}
                  </td>
                  <td className="p-3">
                    <span className={t.deepfake_score > 60 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {t.deepfake_score}/100
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={t.trust_score < 40 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {t.trust_score}/100
                    </span>
                  </td>
                  <td className="p-3">
                    <ThreatBadge level={t.risk_level} size="sm" />
                  </td>
                  <td className="p-3 text-slate-300 font-sans">
                    {t.recommended_action.replace(/_/g, ' ')}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => navigate(`/reports/${t.id}`)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-sans"
                    >
                      Audit Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
