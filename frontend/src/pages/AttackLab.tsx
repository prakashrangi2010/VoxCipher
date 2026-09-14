import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { FlaskConical, Play, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { runLabExperiment } from '../services/api';
import { LabResult } from '../types';

const CODECS = [
  { id: 'clean', name: 'Clean PCM' },
  { id: 'gsm', name: 'GSM 06.10' },
  { id: 'g711', name: 'ITU-T G.711' },
  { id: 'amr', name: 'AMR-NB' },
  { id: 'noise', name: 'Ambient Noise' },
  { id: 'echo', name: 'Multi-Path Echo' },
  { id: 'compression', name: 'AAC Quant' },
  { id: 'replay', name: 'Replay Filter' },
  { id: 'mixed', name: 'Adversarial Mix' }
];

export const AttackLab: React.FC = () => {
  const [selectedCodec, setSelectedCodec] = useState('gsm');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);

  const handleRunExperiment = async () => {
    setLoading(true);
    try {
      const data = await runLabExperiment(selectedCodec);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const spectralChartData = result ? result.spectral_comparison.frequencies_khz.map((f, i) => ({
    freq: `${f} kHz`,
    Original: result.spectral_comparison.original_energy_db[i],
    Degraded: result.spectral_comparison.distorted_energy_db[i]
  })) : [];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FlaskConical className="w-7 h-7 text-purple-400" />
          Attack & Telephony Codec Laboratory
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Feature 13: Stress-testing acoustic detectors under narrowband telephony codecs, acoustic noise & replay impulse responses.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Select Channel Degradation / Adversarial Codec
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {CODECS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCodec(c.id)}
              className={`p-3 rounded-xl border text-xs font-mono font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                selectedCodec === c.id
                  ? 'border-purple-500 bg-purple-500/15 text-purple-300 shadow-md shadow-purple-500/20 scale-[1.02]'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunExperiment}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synthesizing & Benchmarking DSP...' : 'Run Experiment'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-purple-400 font-bold uppercase">
                Active Benchmark Profile
              </span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">
                {result.codec_name}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">STANDARD MODEL SCORE</span>
                <span className="text-base font-bold text-amber-400">
                  {result.metrics.original_detection_score}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40">
                <span className="text-purple-400 block font-bold">VOXCIPHER ROBUST SCORE</span>
                <span className="text-base font-bold text-emerald-400">
                  {result.metrics.telephony_robust_score}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-slate-500 block">EQUAL ERROR RATE (EER)</span>
              <span className="text-xl font-extrabold text-white">{result.metrics.equal_error_rate_pct}%</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-slate-500 block">FALSE ACCEPT RATE (FAR)</span>
              <span className="text-xl font-extrabold text-rose-400">{result.metrics.false_acceptance_rate_pct}%</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-slate-500 block">FALSE REJECT RATE (FRR)</span>
              <span className="text-xl font-extrabold text-amber-400">{result.metrics.false_rejection_rate_pct}%</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-slate-500 block">DETECTION LATENCY</span>
              <span className="text-xl font-extrabold text-cyan-400">{result.metrics.detection_latency_ms} ms</span>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-slate-500 block">CODEC ROBUSTNESS INDEX</span>
              <span className="text-xl font-extrabold text-emerald-400">{result.metrics.codec_robustness_index_pct}%</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Spectral Distortion Profile Across Octaves (dB)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spectralChartData}>
                  <XAxis dataKey="freq" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="Original" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Reference Audio Energy (dB)" />
                  <Bar dataKey="Degraded" fill="#A855F7" radius={[4, 4, 0, 0]} name="Codec-Degraded Energy (dB)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/60">
              {result.analysis_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
