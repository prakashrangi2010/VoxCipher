import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Eye, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getThreats } from '../services/api';
import { ThreatRecordItem } from '../types';
import { ThreatBadge } from '../components/ThreatBadge';

export const Threats: React.FC = () => {
  const navigate = useNavigate();
  const [threats, setThreats] = useState<ThreatRecordItem[]>([]);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatRecordItem | null>(null);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const data = await getThreats(levelFilter, search);
      setThreats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, [levelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchThreats();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
          SOC Threat Intelligence Database
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Feature 14: Historical call recordings, multi-layer acoustic scores, conversation behavior flags, and audit records.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'CRITICAL', 'VERIFICATION_REQUIRED', 'SUSPICIOUS', 'TRUSTED'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                levelFilter === lvl
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lvl.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search caller ID, transcript..."
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 w-56 sm:w-72"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase font-mono text-slate-400 bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="p-3">Threat ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Caller Identity</th>
                <th className="p-3">Deepfake</th>
                <th className="p-3">Replay</th>
                <th className="p-3">TTS / VC</th>
                <th className="p-3">Behavior</th>
                <th className="p-3">Trust</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3">Action</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {threats.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-cyan-400 font-bold">
                    {t.id.slice(0, 8)}...
                  </td>
                  <td className="p-3 text-slate-400">
                    {t.timestamp.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="p-3 text-slate-200 font-sans max-w-[140px] truncate">
                    {t.caller_id}
                  </td>
                  <td className="p-3">
                    <span className={t.deepfake_score > 60 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {t.deepfake_score}
                    </span>
                  </td>
                  <td className="p-3 text-amber-400">
                    {t.replay_risk}
                  </td>
                  <td className="p-3 text-purple-400">
                    {t.tts_score} / {t.voice_conversion_score}
                  </td>
                  <td className="p-3">
                    <span className={t.behavior_risk > 60 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {t.behavior_risk}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={t.trust_score < 40 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {t.trust_score}
                    </span>
                  </td>
                  <td className="p-3">
                    <ThreatBadge level={t.risk_level} size="sm" />
                  </td>
                  <td className="p-3 text-slate-300 font-sans max-w-[130px] truncate">
                    {t.recommended_action.replace(/_/g, ' ')}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedThreat(t)}
                      className="text-slate-400 hover:text-cyan-400 p-1"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => navigate(`/reports/${t.id}`)}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline text-[11px] font-sans"
                    >
                      Forensic Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Threat Incident Details</h3>
                <span className="text-xs text-cyan-400 font-mono">ID: {selectedThreat.id}</span>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">CALLER</span>
                <span className="font-bold text-slate-200">{selectedThreat.caller_id}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">DEEPFAKE RISK</span>
                <span className="font-bold text-rose-400">{selectedThreat.deepfake_score}/100</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">TRUST SCORE</span>
                <span className="font-bold text-emerald-400">{selectedThreat.trust_score}/100</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">RISK LEVEL</span>
                <span className="font-bold text-amber-400">{selectedThreat.risk_level}</span>
              </div>
            </div>

            {selectedThreat.transcript && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                <span className="text-slate-500 block mb-1">Transcript Snippet:</span>
                <p className="text-slate-300 italic">"{selectedThreat.transcript}"</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => navigate(`/reports/${selectedThreat.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md"
              >
                <FileText className="w-4 h-4" /> Open Full Forensic Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
