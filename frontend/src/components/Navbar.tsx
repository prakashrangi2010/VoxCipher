import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Radio, Activity, Cpu, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHealth } from '../services/api';

interface Props {
  onRunSimulation?: () => void;
}

export const Navbar: React.FC<Props> = ({ onRunSimulation }) => {
  const navigate = useNavigate();
  const [healthy, setHealthy] = useState(true);

  useEffect(() => {
    getHealth()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-800/80 bg-[#070A12]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              VOX<span className="text-cyan-400">CIPHER</span>
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v1.0 SOC
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono block -mt-0.5">
            Adaptive Voice Impersonation Defense
          </span>
        </div>
      </div>

      {/* Center Ticker / Status */}
      <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${healthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300">SYSTEM: {healthy ? 'ONLINE (AASIST/DSP ACTIVE)' : 'OFFLINE'}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>ZERO-TRUST VOICE GATEWAY</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRunSimulation || (() => navigate('/live-call'))}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>▶ RUN ATTACK SIMULATION</span>
        </button>
      </div>
    </header>
  );
};
