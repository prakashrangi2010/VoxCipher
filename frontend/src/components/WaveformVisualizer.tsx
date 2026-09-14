import React, { useEffect, useRef } from 'react';

interface Props {
  stream?: MediaStream | null;
  audioUrl?: string | null;
  isPlaying?: boolean;
  color?: string;
  height?: number;
}

export const WaveformVisualizer: React.FC<Props> = ({
  stream,
  audioUrl,
  isPlaying = false,
  color = '#06B6D4',
  height = 90
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (stream) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!active) return;
          animFrameId.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
            ctx.fillStyle = color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = color;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth + 1;
          }
        };
        draw();
      } catch (err) {
        console.warn('AudioContext stream error:', err);
      }
    } else {
      // Idle or simulated playback sine wave
      let phase = 0;
      const drawIdle = () => {
        if (!active) return;
        animFrameId.current = requestAnimationFrame(drawIdle);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bars = 36;
        const barWidth = canvas.width / bars;

        for (let i = 0; i < bars; i++) {
          const amp = isPlaying
            ? Math.sin(phase + i * 0.3) * 0.5 + 0.5
            : Math.sin(phase + i * 0.15) * 0.15 + 0.15;
          const barHeight = Math.max(4, amp * canvas.height * 0.75);
          ctx.fillStyle = isPlaying ? color : '#334155';
          ctx.shadowBlur = isPlaying ? 8 : 0;
          ctx.shadowColor = color;
          ctx.fillRect(i * barWidth + 2, (canvas.height - barHeight) / 2, barWidth - 4, barHeight);
        }
        phase += isPlaying ? 0.15 : 0.04;
      };
      drawIdle();
    }

    return () => {
      active = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stream, isPlaying, color]);

  return (
    <div className="w-full overflow-hidden rounded-lg bg-slate-950/70 border border-slate-800/80 p-2">
      <canvas
        ref={canvasRef}
        width={480}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
