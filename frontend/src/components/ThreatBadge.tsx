import React from 'react';
import { RiskLevel } from '../types';

interface Props {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThreatBadge: React.FC<Props> = ({ level, size = 'md' }) => {
  const norm = (level || 'TRUSTED').toUpperCase();

  let colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';
  let label = 'TRUSTED';

  if (norm === 'SUSPICIOUS') {
    colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    label = 'SUSPICIOUS';
  } else if (norm === 'VERIFICATION_REQUIRED') {
    colors = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-400';
    label = 'VERIFICATION REQ.';
  } else if (norm === 'CRITICAL') {
    colors = 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
    dotColor = 'bg-rose-400 animate-ping';
    label = 'CRITICAL RISK';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colors} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
