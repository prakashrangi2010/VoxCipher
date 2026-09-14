import React from 'react';
import { TimelineSegment } from '../types';

interface Props {
  segments?: TimelineSegment[];
  overallScore?: number;
}

export const ConsistencyTimeline: React.FC<Props> = ({ segments = [], overallScore = 100 }) => {
  if (!segments || segments.length === 0) {
    segments = [
      { window_index: 0, start: 0, end: 3, score: 92, status: 'safe' },
      { window_index: 1, start: 3, end: 6, score: 88, status: 'safe' },
      { window_index: 2, start: 6, end: 9, score: 79, status: 'warning' },
      { window_index: 3, start: 9, end: 12, score: 85, status: 'safe' }
    ];
  }

  return (
    <div className="w-full space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Temporal Speaker Consistency Timeline
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            Window: 3.0s Slices
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Global Consistency:</span>
          <span className={`text-sm font-bold font-mono ${overallScore > 75 ? 'text-emerald-400' : overallScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            {overallScore}/100
          </span>
        </div>
      </div>

      {/* Graphical Bar Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {segments.map((seg, idx) => {
          let bg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
          let icon = '🟢';
          if (seg.status === 'warning') {
            bg = 'bg-amber-500/20 border-amber-500/40 text-amber-400';
            icon = '🟡';
          } else if (seg.status === 'critical') {
            bg = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
            icon = '🔴';
          }

          return (
            <div
              key={idx}
              className={`rounded-lg border p-2.5 flex flex-col justify-between transition-all hover:scale-[1.02] ${bg}`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span>{icon} W{idx + 1}</span>
                <span className="font-bold">{seg.score}%</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-300 font-mono">
                {seg.start.toFixed(1)}s ── {seg.end.toFixed(1)}s
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Consistent (80-100)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Acoustic Drift (55-79)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Voice Conversion / Splice (&lt;55)</span>
      </div>
    </div>
  );
};
