import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Printer, ShieldCheck, ShieldAlert, ArrowLeft, Search } from 'lucide-react';
import { getReport, getThreats } from '../services/api';
import { ThreatRecordItem } from '../types';
import { ThreatBadge } from '../components/ThreatBadge';

export const Reports: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatRecordItem[]>([]);
  const [reportIdInput, setReportIdInput] = useState(id || '');

  useEffect(() => {
    getThreats('ALL', '').then((data) => {
      setRecentThreats(data);
      if (!id && data.length > 0) {
        loadReport(data[0].id);
      }
    }).catch(console.error);

    if (id) {
      loadReport(id);
    }
  }, [id]);

  const loadReport = (threatId: string) => {
    getReport(threatId).then(setReport).catch((err) => {
      console.error(err);
      alert('Report not found for given ID');
    });
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `VoxCipher_${report.report_id}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-cyan-400" />
            Cyber Forensic Audit & Incident Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Feature 15: Full chain-of-custody acoustic evidence • Threat classification • Zero-trust mitigation logs
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Download JSON
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-mono">Select Historical Threat Record:</span>
        {recentThreats.slice(0, 5).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              navigate(`/reports/${t.id}`);
              loadReport(t.id);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              report?.incident?.threat_id === t.id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {t.caller_id.slice(0, 16)}...
          </button>
        ))}
      </div>

      {report ? (
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950 space-y-6 shadow-2xl font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <div className="text-[10px] text-cyan-400 tracking-widest uppercase">
                {report.classification}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                AUDIT DOSSIER: {report.report_id}
              </h2>
              <span className="text-slate-500">Incident Timestamp: {report.generated_at}</span>
            </div>
            <div className="text-right">
              <ThreatBadge level={report.trust_verdict.risk_level} size="lg" />
              <div className="text-slate-400 mt-1">Policy: {report.trust_verdict.policy_decision}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase">1. Call Identification Metadata</h3>
              <div className="space-y-1 text-slate-400">
                <div className="flex justify-between"><span>Caller Identity:</span> <span className="text-slate-200 font-bold">{report.incident.caller_id}</span></div>
                <div className="flex justify-between"><span>Audio Filename:</span> <span>{report.incident.audio_filename}</span></div>
                <div className="flex justify-between"><span>Duration:</span> <span>{report.incident.duration} seconds</span></div>
                <div className="flex justify-between"><span>Sampling Rate:</span> <span>{report.incident.sample_rate} Hz</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase">2. Multi-Signal Security Verdict</h3>
              <div className="space-y-1 text-slate-400">
                <div className="flex justify-between"><span>Voice Trust Score:</span> <span className="text-cyan-400 font-bold">{report.trust_verdict.voice_trust_score} / 100</span></div>
                <div className="flex justify-between"><span>Risk Classification:</span> <span className="text-rose-400 font-bold">{report.trust_verdict.risk_level}</span></div>
                <div className="flex justify-between"><span>Enforced Action:</span> <span className="text-white font-bold">{report.trust_verdict.recommended_action}</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase">3. Acoustic & Channel Telemetry</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DEEPFAKE RISK</span>
                <span className="text-base font-bold text-rose-400">{report.acoustic_forensics.deepfake_risk_score}/100</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">REPLAY ATTACK</span>
                <span className="text-base font-bold text-amber-400">{report.acoustic_forensics.replay_risk}/100</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TTS / SYNTHESIS</span>
                <span className="text-base font-bold text-purple-400">{report.acoustic_forensics.tts_score}/100</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">VOICE CONVERSION</span>
                <span className="text-base font-bold text-orange-400">{report.acoustic_forensics.voice_conversion_score}/100</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase">4. Behavioral Risk & Conversation Analysis</h3>
            <p className="text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              "{report.behavioral_intelligence.transcript || 'No transcript provided.'}"
            </p>
            {report.behavioral_intelligence.flags && report.behavioral_intelligence.flags.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {report.behavioral_intelligence.flags.map((f: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <span>{f.category} [{f.severity}]</span>
                    <span>{f.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase">5. Adaptive Challenge Verification</h3>
              <span className="text-slate-400">Triggered: {report.challenge_audit.triggered ? 'YES' : 'NO'} • Status: {report.challenge_audit.status}</span>
            </div>
            <div className={`px-3 py-1 rounded font-bold ${report.challenge_audit.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {report.challenge_audit.status}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono">
          Loading report dossier...
        </div>
      )}
    </div>
  );
};
