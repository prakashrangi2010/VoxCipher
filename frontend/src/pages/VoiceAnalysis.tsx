import React, { useState } from 'react';
import { 
  Waves, 
  Mic, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  KeyRound 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AudioUploader } from '../components/AudioUploader';
import { AudioRecorder } from '../components/AudioRecorder';
import { TrustGauge } from '../components/TrustGauge';
import { ConsistencyTimeline } from '../components/ConsistencyTimeline';
import { ThreatBadge } from '../components/ThreatBadge';
import { ActionDefenseModal } from '../components/ActionDefenseModal';
import { analyzeAudio } from '../services/api';
import { AnalysisResult } from '../types';

export const VoiceAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upload' | 'mic'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [callerId, setCallerId] = useState('+91 98201 44821');
  const [transcript, setTranscript] = useState('Transfer ₹50,000 immediately to vendor account. Don\'t call back.');
  const [amount, setAmount] = useState<number>(50000);
  const [sensitiveAction, setSensitiveAction] = useState('WIRE_TRANSFER');
  const [deviceTrusted, setDeviceTrusted] = useState(false);

  const [step, setStep] = useState<'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showInterceptModal, setShowInterceptModal] = useState(false);

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      alert('Please select or record an audio file first.');
      return;
    }

    setStep('uploading');
    setTimeout(() => setStep('processing'), 400);
    setTimeout(() => setStep('analyzing'), 900);

    try {
      const res = await analyzeAudio(
        selectedFile,
        (selectedFile as any).name || 'recording.wav',
        transcript,
        callerId,
        deviceTrusted,
        amount,
        sensitiveAction
      );
      setResult(res);
      setStep('complete');

      if (res.risk_level === 'CRITICAL') {
        setShowInterceptModal(true);
      }
    } catch (err: any) {
      alert(`Analysis error: ${err.message || 'Failed'}`);
      setStep('idle');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Waves className="w-7 h-7 text-cyan-400" />
          Voice Forensic Analysis Station
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Multi-layer acoustic inspection • Deepfake vocoder markers • Temporal consistency • Social engineering detection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upload' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Audio File Upload
            </button>
            <button
              onClick={() => setActiveTab('mic')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mic' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" /> Browser Microphone
            </button>
          </div>

          {activeTab === 'upload' ? (
            <AudioUploader onFileSelected={(f) => setSelectedFile(f)} />
          ) : (
            <AudioRecorder onAudioReady={(b) => setSelectedFile(b)} />
          )}

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Contextual Metadata & Conversation Clues
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Caller ID / Phone Number</label>
                <input
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Transaction Value (INR ₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Sensitive Action Type</label>
                <select
                  value={sensitiveAction}
                  onChange={(e) => setSensitiveAction(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">None / Normal Inquiry</option>
                  <option value="WIRE_TRANSFER">Urgent Wire Transfer</option>
                  <option value="OTP_VERIFICATION">OTP / 2FA Solicitation</option>
                  <option value="PASSWORD_RESET">Privilege / Password Reset</option>
                  <option value="ACCOUNT_TAKEOVER">Beneficiary Account Modification</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="devTrusted"
                  checked={deviceTrusted}
                  onChange={(e) => setDeviceTrusted(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="devTrusted" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Caller Device Registered in MDM / Known CLI
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">Conversation Transcript (for Behavioral Risk)</label>
                <span className="text-[11px] text-cyan-400 font-mono">Supports English & Hindi / Hinglish</span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[10px] text-slate-500 font-mono">Sample Scenarios:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript("Bhaiya, main bank head office se bol raha hoon. Turant ₹50,000 transfer karo nahi toh khata suspend ho jayega. Kisi ko mat batana aur turant OTP bataiye.");
                    setAmount(50000);
                    setSensitiveAction('WIRE_TRANSFER');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-mono"
                >
                  🇮🇳 Hindi Urgent Wire & OTP Fraud
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript("Namaste, main bank support executive bol raha hoon. Aapke account mein verification ke liye 6-digit code bheja hai, turant batao.");
                    setAmount(0);
                    setSensitiveAction('OTP_VERIFICATION');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 font-mono"
                >
                  🇮🇳 Hindi OTP Solicitation
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={handleStartAnalysis}
              disabled={step !== 'idle' && step !== 'complete'}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" /> Run Zero-Trust Voice Analysis
            </button>

            {step !== 'idle' && step !== 'complete' && (
              <div className="flex items-center gap-3 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/30">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  {step === 'uploading' && 'Uploading audio slice...'}
                  {step === 'processing' && 'Extracting MFCC, Mel bands & pitch...'}
                  {step === 'analyzing' && 'Running Deepfake & Channel Detectors...'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 sticky top-20 flex flex-col items-center justify-center space-y-4">
            <TrustGauge
              score={result ? result.trust_score : 100}
              riskLevel={result?.risk_level}
              size={220}
              subLabel="Voice Trust Score (0-100)"
            />

            {result && (
              <div className="w-full space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-mono">
                    Recommended Security Action
                  </div>
                  <div className="text-sm font-bold text-cyan-300 font-mono">
                    {result.recommended_action.replace(/_/g, ' ')}
                  </div>
                </div>

                {result.challenge_recommended && (
                  <button
                    onClick={() => navigate('/challenge-center')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-600/20 transition-all"
                  >
                    <KeyRound className="w-4 h-4" /> Start Dynamic Voice Challenge
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6 pt-4 border-t border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              Forensic Detection Intelligence
            </h2>
            <ThreatBadge level={result.risk_level} size="lg" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">DEEPFAKE RISK</span>
              <span className={`text-2xl font-extrabold ${result.deepfake_score > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {result.deepfake_score}/100
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">CONSISTENCY</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {result.speaker_consistency}/100
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">REPLAY RISK</span>
              <span className="text-2xl font-extrabold text-amber-400">
                {result.replay_risk}/100
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">COMPRESSION</span>
              <span className="text-2xl font-extrabold text-slate-300">
                {result.compression_risk}/100
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">TTS SCORE</span>
              <span className="text-2xl font-extrabold text-purple-400">
                {result.tts_score}/100
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-[11px] text-slate-400 block">BEHAVIOR RISK</span>
              <span className={`text-2xl font-extrabold ${result.behavior_risk > 60 ? 'text-rose-400' : 'text-slate-300'}`}>
                {result.behavior_risk}/100
              </span>
            </div>
          </div>

          <ConsistencyTimeline
            segments={result.timeline}
            overallScore={result.speaker_consistency}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Extracted Acoustic Properties (Feature 4)
              </h3>
              {result.audio_features && (
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Audio Duration:</span>
                    <span>{result.audio_features.audio_meta.duration_seconds} seconds</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Sample Rate:</span>
                    <span>{result.audio_features.audio_meta.sample_rate} Hz (Mono)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Spectral Centroid:</span>
                    <span>{result.audio_features.spectral.centroid_hz} Hz</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Spectral Bandwidth:</span>
                    <span>{result.audio_features.spectral.bandwidth_hz} Hz</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Zero Crossing Rate (ZCR):</span>
                    <span>{result.audio_features.spectral.zcr}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">Estimated Pitch F0:</span>
                    <span>{result.audio_features.prosodic.estimated_f0_hz} Hz</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Conversation Risk & Social Engineering Flags
              </h3>
              {result.behavior_flags && result.behavior_flags.length > 0 ? (
                <div className="space-y-2">
                  {result.behavior_flags.map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold font-mono text-[11px]">{f.category} [{f.severity}]</div>
                        <div className="text-slate-300 text-[11px] mt-0.5">{f.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>No malicious conversational keywords or urgency pressure patterns detected.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {result && (
        <ActionDefenseModal
          isOpen={showInterceptModal}
          onClose={() => setShowInterceptModal(false)}
          riskLevel={result.risk_level}
          trustScore={result.trust_score}
          recommendedAction={result.recommended_action}
          reasons={result.action_aware_escalations}
          amount={amount}
        />
      )}
    </div>
  );
};
