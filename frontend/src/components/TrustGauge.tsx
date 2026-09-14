import React from 'react';
import { RiskLevel } from '../types';

interface Props {
  score: number; // 0 - 100
  size?: number;
  label?: string;
  subLabel?: string;
  riskLevel?: RiskLevel | string;
}

export const TrustGauge: React.FC<Props> = ({
  score,
  size = 220,
  label = 'Voice Trust Score',
  subLabel,
  riskLevel
}) => {
  // Score mapping:
  // 0 - 30: Trusted (Emerald)
  // 30 - 60: Suspicious (Amber)
  // 60 - 80: Verification Required (Orange)
  // 80 - 100: Critical Impersonation (Rose/Red)
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#10B981'; // green
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let tierLabel = 'TRUSTED';

  // For display, if risk level is passed, use it, or infer from inverse trust
  const effectiveRisk = riskLevel || (score < 30 ? 'CRITICAL' : score < 60 ? 'VERIFICATION_REQUIRED' : score < 80 ? 'SUSPICIOUS' : 'TRUSTED');

  if (effectiveRisk === 'CRITICAL' || score < 30) {
    color = '#EF4444';
    glowColor = 'rgba(239, 68, 68, 0.5)';
    tierLabel = 'HIGH-RISK IMPERSONATION';
  } else if (effectiveRisk === 'VERIFICATION_REQUIRED' || score < 60) {
    color = '#F97316';
    glowColor = 'rgba(249, 115, 22, 0.4)';
    tierLabel = 'VERIFICATION REQUIRED';
  } else if (effectiveRisk === 'SUSPICIOUS' || score < 80) {
    color = '#F59E0B';
    glowColor = 'rgba(245, 158, 11, 0.4)';
    tierLabel = 'SUSPICIOUS';
  } else {
    color = '#10B981';
    glowColor = 'rgba(16, 185, 129, 0.4)';
    tierLabel = 'AUTHENTIC / TRUSTED';
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Animated Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 10px ${glowColor})`
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center select-none">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-['JetBrains_Mono',monospace]" style={{ color }}>
            {clampedScore}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
            out of 100
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-slate-800 bg-slate-900/80" style={{ color }}>
          {tierLabel}
        </div>
        {subLabel && <p className="text-xs text-slate-400 mt-1 max-w-[240px]">{subLabel}</p>}
      </div>
    </div>
  );
};
