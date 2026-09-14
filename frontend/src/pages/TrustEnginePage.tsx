import React, { useState } from 'react';
import { Gauge } from 'lucide-react';
import { TrustGauge } from '../components/TrustGauge';

export const TrustEnginePage: React.FC = () => {
  const [wDeepfake, setWDeepfake] = useState(30);
  const [wConsistency, setWConsistency] = useState(20);
  const [wChannel, setWChannel] = useState(15);
  const [wBehavior, setWBehavior] = useState(25);
  const [wLiveness, setWLiveness] = useState(10);

  const [inDeepfake, setInDeepfake] = useState(65);
  const [inConsistency, setInConsistency] = useState(70);
  const [inChannel, setInChannel] = useState(40);
  const [inBehavior, setInBehavior] = useState(75);
  const [inLiveness, setInLiveness] = useState(80);

  const inconsistencyDeficit = Math.max(0, 100 - inConsistency);
  const livenessDeficit = Math.max(0, 100 - inLiveness);
  const totalWeight = (wDeepfake + wConsistency + wChannel + wBehavior + wLiveness) || 100;

  const rawRisk = (
    (inDeepfake * wDeepfake) +
    (inconsistencyDeficit * wConsistency) +
    (inChannel * wChannel) +
    (inBehavior * wBehavior) +
    (livenessDeficit * wLiveness)
  ) / totalWeight;

  const compositeRisk = Math.min(98, Math.max(5, Math.round(rawRisk)));
  const trustScore = Math.max(2, Math.min(98, 100 - compositeRisk));

  let tier = 'TRUSTED';
  if (compositeRisk >= 80) tier = 'CRITICAL';
  else if (compositeRisk >= 60) tier = 'VERIFICATION_REQUIRED';
  else if (compositeRisk >= 30) tier = 'SUSPICIOUS';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Gauge className="w-7 h-7 text-cyan-400" />
          Voice Trust Engine & Weight Configurator
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Feature 9: Multi-signal mathematical aggregation • Heuristic calibration • Action-aware risk tiering
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              <span>Detector Layer Weights (% Share)</span>
              <span className="text-cyan-400 font-mono">Total: {wDeepfake + wConsistency + wChannel + wBehavior + wLiveness}%</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>1. Deepfake Acoustic Anomaly Weight</span>
                  <span className="text-cyan-400 font-bold">{wDeepfake}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={wDeepfake}
                  onChange={(e) => setWDeepfake(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>2. Temporal Consistency Weight</span>
                  <span className="text-cyan-400 font-bold">{wConsistency}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={wConsistency}
                  onChange={(e) => setWConsistency(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>3. Channel & Replay Attack Weight</span>
                  <span className="text-cyan-400 font-bold">{wChannel}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={wChannel}
                  onChange={(e) => setWChannel(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>4. Conversational Risk Weight</span>
                  <span className="text-cyan-400 font-bold">{wBehavior}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={45}
                  value={wBehavior}
                  onChange={(e) => setWBehavior(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>5. Dynamic Challenge / Liveness Bonus</span>
                  <span className="text-cyan-400 font-bold">{wLiveness}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  value={wLiveness}
                  onChange={(e) => setWLiveness(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Live Threat Simulation Inputs
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Deepfake Score: {inDeepfake}/100</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inDeepfake}
                  onChange={(e) => setInDeepfake(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Speaker Consistency: {inConsistency}/100</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inConsistency}
                  onChange={(e) => setInConsistency(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Channel Risk: {inChannel}/100</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inChannel}
                  onChange={(e) => setInChannel(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Behavioral Risk: {inBehavior}/100</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inBehavior}
                  onChange={(e) => setInBehavior(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 sticky top-20 flex flex-col items-center justify-center space-y-5">
            <TrustGauge
              score={trustScore}
              riskLevel={tier}
              size={240}
              subLabel="Calculated Voice Trust Score"
            />

            <div className="w-full space-y-2 text-xs font-mono pt-2 border-t border-slate-800">
              <div className={`p-2 rounded-lg flex justify-between items-center ${tier === 'TRUSTED' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'}`}>
                <span>0 – 30 Risk</span>
                <span>🟢 Trusted</span>
              </div>
              <div className={`p-2 rounded-lg flex justify-between items-center ${tier === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500'}`}>
                <span>30 – 60 Risk</span>
                <span>🟡 Suspicious</span>
              </div>
              <div className={`p-2 rounded-lg flex justify-between items-center ${tier === 'VERIFICATION_REQUIRED' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-slate-500'}`}>
                <span>60 – 80 Risk</span>
                <span>🟠 Verification Required</span>
              </div>
              <div className={`p-2 rounded-lg flex justify-between items-center ${tier === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-500'}`}>
                <span>80 – 100 Risk</span>
                <span>🔴 High-Risk Impersonation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
