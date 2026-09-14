import React from 'react';
import { AlertTriangle, ShieldAlert, X, Ban, PhoneCall, Lock, CheckCircle } from 'lucide-react';
import { RecommendedAction, RiskLevel } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  riskLevel: RiskLevel | string;
  trustScore: number;
  recommendedAction: RecommendedAction | string;
  actionTitle?: string;
  reasons?: string[];
  amount?: number;
}

export const ActionDefenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  riskLevel,
  trustScore,
  recommendedAction,
  actionTitle = 'Critical Impersonation Risk Intercepted',
  reasons = [],
  amount = 0
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-[#0F172A] border border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.3)] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-rose-500/20 border-b border-rose-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-rose-200 text-lg uppercase tracking-wide">
                Action-Aware Defense Intercept
              </h3>
              <p className="text-xs text-rose-300/80 font-mono">
                SECURITY POLICY ENFORCEMENT LEVEL: ZERO-TRUST
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-950/40 border border-rose-900/60">
            <div>
              <div className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                Recommended Response
              </div>
              <div className="text-xl font-extrabold text-rose-100 font-mono mt-0.5">
                {recommendedAction.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold">Voice Trust</div>
              <div className="text-2xl font-extrabold font-mono text-rose-400">
                {trustScore} / 100
              </div>
            </div>
          </div>

          {amount > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
              <span>High-Value Financial Transaction at Risk:</span>
              <span className="font-bold font-mono text-sm">₹{amount.toLocaleString()}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Automated Intercept Triggers:
            </h4>
            <ul className="space-y-2">
              {reasons.length > 0 ? (
                reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Acoustic deepfake indicators combined with high behavioral risk flags.</span>
                </li>
              )}
            </ul>
          </div>

          {/* Action Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                alert('Sensitive action blocked. Incident recorded in Threat Intelligence Database.');
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
            >
              <Ban className="w-4 h-4" /> Block Sensitive Action
            </button>
            <button
              onClick={() => {
                alert('Callback initiated to pre-registered officer number.');
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" /> Out-of-Band Callback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
