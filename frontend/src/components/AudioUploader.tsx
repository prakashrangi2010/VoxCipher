import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Play, Pause, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<Props> = ({ onFileSelected, disabled = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.includes('audio') && !file.name.match(/\.(wav|mp3|m4a|ogg|flac)$/i)) {
      alert('Please select a valid audio file (.wav, .mp3, .m4a, .ogg)');
      return;
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setSelectedFile(file);

    // Extract duration from audio element
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setDuration(Math.round(tempAudio.duration * 10) / 10);
    };

    onFileSelected(file);
  };

  const clearFile = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSelectedFile(null);
    setDuration(null);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Demo Samples Generator
  const loadDemoSample = (type: 'clean' | 'deepfake' | 'replay') => {
    const sr = 16000;
    const dur = 4.0;
    const numSamples = sr * dur;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (v: DataView, o: number, s: string) => {
      for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++, offset += 2) {
      const t = i / sr;
      let s = 0;
      if (type === 'clean') {
        s = (Math.sin(2 * Math.PI * 180 * t) * 0.4 + Math.sin(2 * Math.PI * 360 * t) * 0.2) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t));
      } else if (type === 'deepfake') {
        // High harmonic vocoder buzz
        s = (Math.sin(2 * Math.PI * 220 * t) * 0.4 + Math.sin(2 * Math.PI * 3200 * t) * 0.25) * 0.6;
      } else {
        // Replay with delay
        s = Math.sin(2 * Math.PI * 160 * t) * 0.4;
        if (i > 800) s += Math.sin(2 * Math.PI * 160 * (t - 0.05)) * 0.3;
      }
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    const blob = new Blob([view], { type: 'audio/wav' });
    const file = new File([blob], `demo_${type}_sample.wav`, { type: 'audio/wav' });
    processFile(file);
  };

  const loadBackendSample = async (filename: string, displayName: string) => {
    try {
      const res = await fetch(`/api/samples/audio/${filename}`);
      if (!res.ok) throw new Error('Sample fetch failed');
      const blob = await res.blob();
      const file = new File([blob], displayName, { type: 'audio/wav' });
      processFile(file);
    } catch (e) {
      console.warn('Fallback generating local synthetic sample', e);
      loadDemoSample('clean');
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.ogg"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-200">
              Drag & Drop Call Recording or Audio
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Supports WAV, MP3, M4A, OGG (up to 50MB)
            </span>
          </div>
        </div>
      </div>

      {/* Selected Audio Preview Card */}
      {selectedFile && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-slate-200 truncate">
                {selectedFile.name}
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                {duration && <span>• {duration}s duration</span>}
                <span className="text-cyan-400">• Ready for Analysis</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {audioUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Remove audio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      )}

      {/* Preset Demo Samples */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Standard Presets:</span>
          <button
            type="button"
            onClick={() => loadDemoSample('clean')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-all"
          >
            🟢 Clean Voice
          </button>
          <button
            type="button"
            onClick={() => loadDemoSample('deepfake')}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-mono transition-all"
          >
            🔴 AI Deepfake Buzz
          </button>
          <button
            type="button"
            onClick={() => loadDemoSample('replay')}
            className="px-2.5 py-1 text-xs rounded-md bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 font-mono transition-all"
          >
            🟡 Replay Attack
          </button>
        </div>

        {/* Indian Accent & Hindi Dataset Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-1">
            🇮🇳 Indian Accent Dataset:
          </span>
          <button
            type="button"
            onClick={() => loadBackendSample('sample_indian_clean_voice.wav', 'indian_accent_clean.wav')}
            className="px-2.5 py-1 text-xs rounded-md bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 font-mono transition-all"
          >
            🇮🇳 Indian Accent (Clean)
          </button>
          <button
            type="button"
            onClick={() => loadBackendSample('sample_hindi_urgent_fraud.wav', 'hindi_urgent_scam_call.wav')}
            className="px-2.5 py-1 text-xs rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-mono transition-all"
          >
            🇮🇳 Hindi Urgent Wire Fraud
          </button>
          <button
            type="button"
            onClick={() => loadBackendSample('sample_indian_deepfake_synthetic.wav', 'indian_voice_clone_ai.wav')}
            className="px-2.5 py-1 text-xs rounded-md bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 font-mono transition-all"
          >
            🇮🇳 Indian Voice Clone (AI)
          </button>
        </div>
      </div>
    </div>
  );
};
