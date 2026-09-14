import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Radio, 
  KeyRound,
  Network,
  Server,
  Terminal,
  Copy,
  Check,
  Play,
  Mic,
  Volume2,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { AudioRecorder } from '../components/AudioRecorder';
import { TrustGauge } from '../components/TrustGauge';
import { ConsistencyTimeline } from '../components/ConsistencyTimeline';
import { ActionDefenseModal } from '../components/ActionDefenseModal';
import { analyzeAudio, createChallenge, verifyChallenge } from '../services/api';
import { AnalysisResult, ChallengeSessionData } from '../types';

export const LiveCall: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browser_sniffer' | 'telephony_gateway'>('browser_sniffer');

  // Call & Browser Sniffer State
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callerName, setCallerName] = useState('Vikram Malhotra (Group CEO)');
  const [callerNumber, setCallerNumber] = useState('+91 98201 44821');
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [challenge, setChallenge] = useState<ChallengeSessionData | null>(null);
  const [challengeVerified, setChallengeVerified] = useState<boolean | null>(null);
  const [showInterceptModal, setShowInterceptModal] = useState(false);

  // Telephony & WebSocket State
  const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [wsLogs, setWsLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let interval: number;
    if (callActive) {
      interval = window.setInterval(() => setCallTimer((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const addWsLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setWsLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleStartCall = () => {
    setCallActive(true);
    setCallTimer(0);
    setTranscript('Connecting to enterprise voice gateway...');
    setTimeout(() => {
      setTranscript('Caller: "Good afternoon. Please verify the executive treasury disbursement account immediately."');
    }, 1500);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setCallTimer(0);
  };

  const handleAudioRecorded = async (blob: Blob, dur: number) => {
    setAnalyzing(true);
    try {
      const res = await analyzeAudio(
        blob,
        'live_call_sample.wav',
        transcript,
        callerName,
        false,
        50000,
        'WIRE_TRANSFER'
      );
      setAnalysis(res);

      if (res.risk_level === 'CRITICAL') {
        setShowInterceptModal(true);
      } else if (res.challenge_recommended) {
        const ch = await createChallenge(res.threat_id);
        setChallenge(ch);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChallengeResponse = async (blob: Blob) => {
    if (!challenge) return;
    try {
      const v = await verifyChallenge(challenge.challenge_id, blob);
      setChallengeVerified(v.status === 'PASSED');
      if (analysis) {
        setAnalysis({
          ...analysis,
          trust_score: v.trust_score,
          risk_level: v.risk_level,
          recommended_action: v.recommended_action
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Telephony WebSocket Controls
  const toggleWebSocket = () => {
    if (wsRef.current && wsStatus === 'CONNECTED') {
      wsRef.current.close();
      setWsStatus('DISCONNECTED');
      addWsLog('WebSocket stream disconnected by operator.');
      return;
    }

    setWsStatus('CONNECTING');
    addWsLog('Connecting to ws://' + window.location.hostname + ':8000/api/ws/call-stream ...');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8000/api/ws/call-stream`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsStatus('CONNECTED');
        addWsLog('Stream socket ESTABLISHED. Handshake completed.');
      };

      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          addWsLog(`RECV [${data.event}]: ${JSON.stringify(data)}`);
          if (data.event === 'analysis_frame') {
            addWsLog(`-> Trust Score: ${data.trust_score} | Risk: ${data.risk_level} | Action: ${data.recommended_action}`);
          }
        } catch {
          addWsLog(`RECV RAW: ${evt.data}`);
        }
      };

      socket.onerror = () => {
        setWsStatus('ERROR');
        addWsLog('WebSocket error encountered on connection.');
      };

      socket.onclose = () => {
        setWsStatus('DISCONNECTED');
        addWsLog('WebSocket stream closed.');
      };

      wsRef.current = socket;
    } catch (err) {
      setWsStatus('ERROR');
      addWsLog(`Connection failed: ${err}`);
    }
  };

  const sendWsPing = () => {
    if (!wsRef.current || wsStatus !== 'CONNECTED') {
      addWsLog('Cannot send ping: WebSocket not connected.');
      return;
    }
    wsRef.current.send(JSON.stringify({ event: 'ping', client_time: Date.now() }));
    addWsLog(`SENT: { event: "ping" } (RTT measurement initiated)`);
  };

  const simulateWsCallStream = () => {
    if (!wsRef.current || wsStatus !== 'CONNECTED') {
      addWsLog('Connect WebSocket first before streaming simulated call audio.');
      return;
    }

    addWsLog('Sending Twilio Media Stream handshake simulation...');
    wsRef.current.send(JSON.stringify({
      event: 'start',
      streamSid: 'MZ_SIM_' + Math.floor(Math.random() * 1000000),
      start: {
        callSid: 'CA_' + Math.floor(Math.random() * 1000000),
        tracks: ['inbound'],
        mediaFormat: { encoding: 'audio/x-mulaw', sampleRate: 8000, channels: 1 }
      }
    }));

    // Send dummy mu-law audio packet (simulating synthetic voice burst)
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // 16,000 samples of mu-law silence/tone = ~2 seconds of 8kHz
        const dummyUlaw = new Uint8Array(16000);
        for (let i = 0; i < dummyUlaw.length; i++) {
          dummyUlaw[i] = (Math.sin(i * 0.1) > 0 ? 0xff : 0x80);
        }
        let binaryStr = '';
        for (let i = 0; i < dummyUlaw.length; i++) {
          binaryStr += String.fromCharCode(dummyUlaw[i]);
        }
        const b64 = btoa(binaryStr);

        wsRef.current.send(JSON.stringify({
          event: 'media',
          media: {
            payload: b64,
            chunk: '1',
            timestamp: Date.now()
          }
        }));
        addWsLog('SENT: 2.0s Twilio PCMU audio frame (16,000 bytes). Waiting for multi-layer detection response...');
      }
    }, 600);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const twimlSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi">VoxCipher Zero-Trust Call Interception active. Real-time acoustic authentication active.</Say>
    <Connect>
        <Stream url="wss://${window.location.hostname}:8000/api/ws/call-stream" />
    </Connect>
</Response>`;

  const asteriskSnippet = `; Asterisk extensions.conf - VoxCipher RTP AudioSocket Mirror
[inbound-calls]
exten => _X.,1,Answer()
same => n,Set(CALL_UUID=\${UNIQUEID})
same => n,Playback(beep)
; Tap bidirectional audio stream directly to VoxCipher
same => n,AudioSocket(\${CALL_UUID},${window.location.hostname}:8000/api/ws/call-stream)
same => n,Hangup()`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${callActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Live Call Interception Console
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${callActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                {callActive ? `ACTIVE STREAM [${Math.floor(callTimer / 60)}:${(callTimer % 60).toString().padStart(2, '0')}]` : 'IDLE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Caller: {callerName} ({callerNumber}) • Device: UNVERIFIED VOIP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!callActive ? (
            <button
              onClick={handleStartCall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
            >
              <PhoneCall className="w-4 h-4" /> Initiate Call Intercept
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all"
            >
              <PhoneOff className="w-4 h-4" /> Disconnect Call
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('browser_sniffer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'browser_sniffer'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Mic className="w-4 h-4" />
          Interactive Mic & Sniffer Console
        </button>
        <button
          onClick={() => setActiveTab('telephony_gateway')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'telephony_gateway'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Network className="w-4 h-4" />
          Telephony Gateway & Live WebSocket Stream
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Twilio / SIP
          </span>
        </button>
      </div>

      {/* TAB 1: BROWSER SNIFFER & MIC */}
      {activeTab === 'browser_sniffer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Real-time Audio Sniffer & Capture</span>
                <span className="text-cyan-400 font-mono">16kHz Raw PCM</span>
              </div>

              <AudioRecorder
                onAudioReady={handleAudioRecorded}
                disabled={!callActive || analyzing}
                label="Record Live Incoming Audio Slice"
              />

              {analyzing && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono animate-pulse flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-spin" />
                  Running Real-Time Acoustic & Spectral Deepfake Inference...
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Live Conversation NLP Stream</span>
                <span className="text-emerald-400 font-mono">Speech-to-Text Active</span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcript will stream here, or simulate caller dialogue..."
                rows={4}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Inject Risky Utterance:</span>
                <button
                  type="button"
                  onClick={() => setTranscript('Caller: "Transfer ₹50,000 immediately to vendor account 99281. Do not tell anyone or call back."')}
                  className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono"
                >
                  Wire Transfer + Secrecy
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript('Caller: "Please read the 6-digit OTP you received on your screen right now."')}
                  className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono"
                >
                  OTP Harvesting
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript('कॉलर: "तुरंत ₹50,000 भेजें, यह अति-आवश्यक ऑडिट है और किसी को मत बताना।"')}
                  className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono"
                >
                  Hindi Urgent Fraud
                </button>
              </div>
            </div>

            {analysis && (
              <ConsistencyTimeline
                segments={analysis.timeline}
                overallScore={analysis.speaker_consistency}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center">
              <TrustGauge
                score={analysis ? analysis.trust_score : 85}
                riskLevel={analysis?.risk_level}
                size={200}
                subLabel="Voice Zero-Trust Metric"
              />

              {analysis && (
                <div className="mt-4 w-full p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deepfake Risk:</span>
                    <span className="text-rose-400 font-bold">{analysis.deepfake_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Channel Distortion:</span>
                    <span className="text-amber-400">{analysis.channel_risk}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Behavioral Risk:</span>
                    <span className="text-rose-400">{analysis.behavior_risk}/100</span>
                  </div>
                </div>
              )}
            </div>

            {challenge && (
              <div className="p-5 rounded-xl border border-amber-500/50 bg-amber-950/20 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <KeyRound className="w-4 h-4" />
                  Adaptive Voice Challenge Active
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 text-center font-mono text-sm font-bold text-amber-200">
                  "{challenge.phrase}"
                </div>
                <p className="text-[11px] text-slate-400">
                  Instruct the caller to repeat the security phrase. Record response:
                </p>
                <AudioRecorder
                  onAudioReady={handleChallengeResponse}
                  label="Record Caller Phrase Response"
                  color="#F59E0B"
                />
                {challengeVerified !== null && (
                  <div className={`p-2 rounded-lg text-xs font-mono font-bold text-center ${challengeVerified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {challengeVerified ? 'CHALLENGE PASSED: Acoustic Match Validated' : 'CHALLENGE FAILED: Synthetic Latency Anomaly'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'telephony_gateway' && (
        <div className="space-y-6">
          {/* Live WebSocket Status & Testing Console */}
          <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10 backdrop-blur-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Live Telephony WebSocket Stream Endpoint</h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    wsStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    wsStatus === 'CONNECTING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {wsStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  URI: ws://{window.location.hostname}:8000/api/ws/call-stream (Supports Twilio PCMU 8kHz, 16kHz PCM, and WebRTC audio)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleWebSocket}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    wsStatus === 'CONNECTED'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  {wsStatus === 'CONNECTED' ? 'Disconnect Socket' : 'Connect Socket'}
                </button>

                <button
                  onClick={sendWsPing}
                  disabled={wsStatus !== 'CONNECTED'}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40"
                >
                  Ping RTT
                </button>

                <button
                  onClick={simulateWsCallStream}
                  disabled={wsStatus !== 'CONNECTED'}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5" />
                  Stream 2s Twilio Audio
                </button>
              </div>
            </div>

            {/* Socket Activity Terminal */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-300">Live Socket Activity Log</span>
                </div>
                <button
                  onClick={() => setWsLogs([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear Logs
                </button>
              </div>
              <div className="h-40 overflow-y-auto space-y-1 text-slate-300 pr-2">
                {wsLogs.length === 0 ? (
                  <p className="text-slate-600 italic">Click "Connect Socket" above to verify live connection to VoxCipher's streaming backend...</p>
                ) : (
                  wsLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4 Architecture Blueprints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Twilio Integration */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Method 1: Twilio Voice Media Streams</h4>
                </div>
                <button
                  onClick={() => copyToClipboard(twimlSnippet, 'twiml')}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  {copiedKey === 'twiml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'twiml' ? 'Copied' : 'Copy TwiML'}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect real PSTN/Mobile numbers. Configure Twilio's incoming call webhook to <code className="text-cyan-300">/api/telephony/twilio-webhook</code>. Twilio forks incoming audio bidirectionally via WebSocket.
              </p>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                {twimlSnippet}
              </pre>
            </div>

            {/* 2. Asterisk / FreePBX AudioSocket */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Method 2: Asterisk / FreePBX SIP Trunk</h4>
                </div>
                <button
                  onClick={() => copyToClipboard(asteriskSnippet, 'asterisk')}
                  className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  {copiedKey === 'asterisk' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'asterisk' ? 'Copied' : 'Copy Config'}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For bank call centers and on-premise PBXs. Use Asterisk's high-performance <code className="text-cyan-300">res_audiosocket</code> to mirror RTP call channels directly to VoxCipher without call latency.
              </p>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-amber-300 overflow-x-auto">
                {asteriskSnippet}
              </pre>
            </div>

            {/* 3. Desktop Sniffing (Zoom / Teams / WhatsApp) */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Method 3: Desktop Call Sniffing (Instant PC Test)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test immediately on your computer with real WhatsApp, Teams, or Zoom calls with <strong>no telephony provider needed</strong>:
              </p>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                <li>Install free <strong>VB-Audio Virtual Cable</strong> or enable Windows <strong>Stereo Mix</strong>.</li>
                <li>Set Zoom / Teams / WhatsApp Speaker output to <em>"CABLE Input"</em>.</li>
                <li>In VoxCipher's <strong>Browser Sniffer</strong> tab, select <em>"CABLE Output"</em> as your input source. All incoming caller voice streams directly into VoxCipher!</li>
              </ol>
            </div>

            {/* 4. In-Browser WebRTC Softphone */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Method 4: In-Browser WebRTC Softphone</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Embed a WebRTC SIP softphone directly in VoxCipher. The browser's Web Audio <code className="text-cyan-300">AudioContext</code> taps the incoming peer media stream and dispatches 2-second acoustic slices to the detection pipeline.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400">
                AudioContext.createMediaStreamSource(webrtcStream) → ScriptProcessorNode / AudioWorklet → ws.send(rawPCM)
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <ActionDefenseModal
          isOpen={showInterceptModal}
          onClose={() => setShowInterceptModal(false)}
          riskLevel={analysis.risk_level}
          trustScore={analysis.trust_score}
          recommendedAction={analysis.recommended_action}
          reasons={analysis.action_aware_escalations}
          amount={50000}
        />
      )}
    </div>
  );
};

