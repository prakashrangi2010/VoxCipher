import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Cpu, Bell, Key, Save, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [criticalCutoff, setCriticalCutoff] = useState(80);
  const [suspiciousCutoff, setSuspiciousCutoff] = useState(55);
  const [transferLimit, setTransferLimit] = useState(50000);
  const [modelMode, setModelMode] = useState('acoustic_heuristic');
  const [webhookUrl, setWebhookUrl] = useState('https://siem.corp.internal/api/v1/voice-alerts');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-cyan-400" />
          SOC Policy & Detector Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Configure zero-trust risk thresholds, action-aware intercept triggers, and model backend integration.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Shield className="w-4 h-4 text-cyan-400" />
            Zero-Trust Risk Thresholds (0 - 100)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 block mb-1">
                Critical Impersonation Block Threshold (Current: {criticalCutoff})
              </label>
              <input
                type="range"
                min={65}
                max={95}
                value={criticalCutoff}
                onChange={(e) => setCriticalCutoff(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-slate-500 text-[11px] block mt-1">
                Calls scoring above this will trigger immediate ACTION BLOCK.
              </span>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">
                Dynamic Challenge Trigger Threshold (Current: {suspiciousCutoff})
              </label>
              <input
                type="range"
                min={35}
                max={75}
                value={suspiciousCutoff}
                onChange={(e) => setSuspiciousCutoff(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-slate-500 text-[11px] block mt-1">
                Calls reaching this risk level automatically deploy a dynamic challenge.
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Cpu className="w-4 h-4 text-purple-400" />
            Detection Engine Backend Connector
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <input
                  type="radio"
                  name="modelMode"
                  value="acoustic_heuristic"
                  checked={modelMode === 'acoustic_heuristic'}
                  onChange={(e) => setModelMode(e.target.value)}
                  className="text-cyan-500"
                />
                <div>
                  <div className="font-bold text-slate-200">VoxCipher Acoustic-Spectral DSP v1.2 (Active)</div>
                  <div className="text-slate-400 text-[11px]">Real-time multi-dimensional spectral centroid, ZCR, Mel distribution & pitch prosody.</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <input
                  type="radio"
                  name="modelMode"
                  value="aasist_connector"
                  checked={modelMode === 'aasist_connector'}
                  onChange={(e) => setModelMode(e.target.value)}
                  className="text-cyan-500"
                />
                <div>
                  <div className="font-bold text-slate-200">AASIST Graph Attention Neural Vocoder Model (Plug & Play)</div>
                  <div className="text-slate-400 text-[11px]">PyTorch / TorchScript checkpoint connector for ASVspoof benchmarks.</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <input
                  type="radio"
                  name="modelMode"
                  value="wav2vec2_adapter"
                  checked={modelMode === 'wav2vec2_adapter'}
                  onChange={(e) => setModelMode(e.target.value)}
                  className="text-cyan-500"
                />
                <div>
                  <div className="font-bold text-slate-200">Wav2Vec 2.0 XLSR Representation Adapter</div>
                  <div className="text-slate-400 text-[11px]">Self-supervised cross-lingual voice latent feature extractor.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            <Bell className="w-4 h-4 text-cyan-400" />
            Action-Aware Enterprise Defenses
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 block mb-1">High-Risk Financial Cutoff (INR ₹)</label>
              <input
                type="number"
                value={transferLimit}
                onChange={(e) => setTransferLimit(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">SIEM Webhook Integration URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle className="w-4 h-4" /> Policy Configurations Applied to Zero-Trust Engine
            </div>
          )}
          <button
            type="submit"
            className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Save className="w-4 h-4" /> Save Policy Changes
          </button>
        </div>
      </form>
    </div>
  );
};
