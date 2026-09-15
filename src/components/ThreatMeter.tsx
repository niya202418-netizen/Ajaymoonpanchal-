import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  AlertTriangle,
  Flame,
  Skull,
  Activity,
  Heart,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Zap,
  ThermometerSnowflake,
  Radar,
  Info,
  Smartphone,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ThreatState, ThreatLevel } from '../types';
import { ghostAudio } from '../utils/audio';

interface ThreatMeterProps {
  threat: ThreatState;
  audioMuted: boolean;
  onToggleAudioMuted: () => void;
  onUseSmudgeStick: () => void;
  smudgeActive: boolean;
  deviceSensorsEnabled?: boolean;
  onToggleDeviceSensors?: () => void;
}

export const ThreatMeter: React.FC<ThreatMeterProps> = ({
  threat,
  audioMuted,
  onToggleAudioMuted,
  onUseSmudgeStick,
  smudgeActive,
  deviceSensorsEnabled = false,
  onToggleDeviceSensors
}) => {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [heartbeatSoundEnabled, setHeartbeatSoundEnabled] = useState<boolean>(true);
  const ekgCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniEkgCanvasRef = useRef<HTMLCanvasElement>(null);
  const historyCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastLevelRef = useRef<ThreatLevel>(threat.level);

  // Sound and Haptic reactions on threat tier upgrade
  useEffect(() => {
    if (threat.level !== lastLevelRef.current) {
      if (threat.level === 'hunt') {
        ghostAudio.playThreatChirp('hunt');
        ghostAudio.triggerHaptic([200, 100, 200, 100, 400]);
      } else if (threat.level === 'critical') {
        ghostAudio.playThreatChirp('critical');
        ghostAudio.triggerHaptic([150, 80, 150]);
      } else if (threat.level === 'high') {
        ghostAudio.playThreatChirp('danger');
        ghostAudio.triggerHaptic(120);
      } else if (threat.level === 'elevated') {
        ghostAudio.playThreatChirp('caution');
        ghostAudio.triggerHaptic(60);
      }
      lastLevelRef.current = threat.level;
    }
  }, [threat.level]);

  // Heartbeat audio pulse loop (accelerates with threat)
  useEffect(() => {
    if (!heartbeatSoundEnabled || audioMuted || threat.score < 25) return;

    const intervalMs = (60 / threat.heartbeatBpm) * 1000;
    const intensity = Math.min(1, threat.score / 100);

    const timer = setInterval(() => {
      ghostAudio.playHeartbeat(intensity);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [heartbeatSoundEnabled, audioMuted, threat.heartbeatBpm, threat.score]);

  // Real-time EKG Waveform animation
  useEffect(() => {
    const canvas = ekgCanvasRef.current;
    const miniCanvas = miniEkgCanvasRef.current;
    if (!canvas && !miniCanvas) return;

    let animId: number;
    let offset = 0;

    const drawEkg = (c: HTMLCanvasElement, isMini = false) => {
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const w = c.width;
      const h = c.height;

      ctx.clearRect(0, 0, w, h);

      // Grid line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Color based on level
      let strokeColor = '#10b981'; // calm green
      if (threat.level === 'hunt') strokeColor = '#ef4444';
      else if (threat.level === 'critical') strokeColor = '#f43f5e';
      else if (threat.level === 'high') strokeColor = '#f97316';
      else if (threat.level === 'elevated') strokeColor = '#f59e0b';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isMini ? 1.5 : 2;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = threat.score > 60 ? 6 : 2;

      ctx.beginPath();
      const points = 80;
      const step = w / points;
      const mid = h / 2;
      const speedMultiplier = threat.heartbeatBpm / 60;

      for (let i = 0; i <= points; i++) {
        const x = i * step;
        const cycle = ((i * step * 0.05 + offset * speedMultiplier) % 10);
        let y = mid;

        // EKG P-Q-R-S-T wave simulation
        if (cycle > 4.5 && cycle < 4.8) {
          y = mid - 4 * (threat.score / 60); // P wave
        } else if (cycle >= 4.8 && cycle < 5.0) {
          y = mid + 6 * (threat.score / 40); // Q dip
        } else if (cycle >= 5.0 && cycle < 5.3) {
          y = mid - (h * 0.42) * Math.min(1.2, threat.score / 50); // R peak
        } else if (cycle >= 5.3 && cycle < 5.6) {
          y = mid + (h * 0.28) * Math.min(1.2, threat.score / 50); // S dip
        } else if (cycle >= 5.8 && cycle < 6.4) {
          y = mid - 5 * (threat.score / 50); // T wave
        } else {
          // Micro-fluctuation
          y += (Math.random() - 0.5) * (threat.score > 70 ? 2.5 : 0.8);
        }

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      offset += 0.08;
      if (canvas) drawEkg(canvas, false);
      if (miniCanvas) drawEkg(miniCanvas, true);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [threat.level, threat.score, threat.heartbeatBpm, isDiagnosticOpen]);

  // Draw 60s history rolling graph inside Diagnostic Modal
  useEffect(() => {
    if (!isDiagnosticOpen || !historyCanvasRef.current) return;
    const canvas = historyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Reference bands (safe, caution, critical)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.fillRect(0, h * 0.8, w, h * 0.2); // 0-20%
    ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
    ctx.fillRect(0, h * 0.55, w, h * 0.25); // 20-45%
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, 0, w, h * 0.3); // 70-100%

    // Horizontal gridlines at 25%, 50%, 75%
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((pct) => {
      ctx.beginPath();
      ctx.moveTo(0, h * (1 - pct));
      ctx.lineTo(w, h * (1 - pct));
      ctx.stroke();
    });

    const pts = threat.history;
    if (pts.length < 2) return;

    const step = w / Math.max(20, pts.length - 1);

    // Area fill
    ctx.beginPath();
    ctx.moveTo(0, h);
    pts.forEach((p, idx) => {
      const x = idx * step;
      const y = h - (p.score / 100) * (h - 8);
      ctx.lineTo(x, y);
    });
    ctx.lineTo((pts.length - 1) * step, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    ctx.lineWidth = 2;
    pts.forEach((p, idx) => {
      const x = idx * step;
      const y = h - (p.score / 100) * (h - 8);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle =
      threat.level === 'hunt' || threat.level === 'critical' ? '#ef4444' : '#f59e0b';
    ctx.stroke();

    // Current point dot
    const lastX = (pts.length - 1) * step;
    const lastY = h - (pts[pts.length - 1].score / 100) * (h - 8);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [threat.history, isDiagnosticOpen, threat.level]);

  // Color mappings
  const getThemeColors = (lvl: ThreatLevel) => {
    switch (lvl) {
      case 'hunt':
        return {
          bg: 'bg-red-950/70 border-red-500/80',
          badgeBg: 'bg-red-900/90 text-red-200 border-red-500',
          text: 'text-red-400',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse',
          barColor: 'bg-red-500'
        };
      case 'critical':
        return {
          bg: 'bg-rose-950/60 border-rose-500/70',
          badgeBg: 'bg-rose-900/80 text-rose-200 border-rose-500',
          text: 'text-rose-400',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
          barColor: 'bg-rose-500'
        };
      case 'high':
        return {
          bg: 'bg-amber-950/50 border-orange-500/60',
          badgeBg: 'bg-orange-950/90 text-orange-200 border-orange-600',
          text: 'text-orange-400',
          glow: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]',
          barColor: 'bg-orange-500'
        };
      case 'elevated':
        return {
          bg: 'bg-yellow-950/30 border-amber-500/50',
          badgeBg: 'bg-amber-950/80 text-amber-200 border-amber-600',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
          barColor: 'bg-amber-500'
        };
      case 'calm':
      default:
        return {
          bg: 'bg-emerald-950/20 border-emerald-500/30',
          badgeBg: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          barColor: 'bg-emerald-500'
        };
    }
  };

  const colors = getThemeColors(threat.level);

  // SVG Needle angle (-90deg to +90deg for 0 - 100 score)
  const needleAngle = -90 + (threat.score / 100) * 180;

  return (
    <>
      {/* 1. Main Inline Threat Monitor Banner */}
      <div
        id="realtime-threat-meter-banner"
        className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${colors.bg} ${colors.glow} p-3 sm:p-4`}
      >
        {/* Active Hunt Ambient Alert Strobe */}
        {threat.activeHunt && (
          <div className="absolute inset-0 bg-red-600/15 animate-ping pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Tactical Gauge Arc & Score */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Radial Segmented Ring Graphic */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                {/* Background Ring Track */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  stroke="#1e293b"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="176"
                  strokeDashoffset="35"
                />
                {/* Dynamic Threat Progress Fill */}
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="176"
                  strokeDashoffset={176 - (threat.score / 100) * 141}
                  strokeLinecap="round"
                  className={`transition-all duration-500 ${colors.text}`}
                />
              </svg>

              {/* Center Numerical Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg sm:text-xl font-black font-mono tracking-tighter leading-none text-white">
                  {threat.score}
                  <span className="text-[10px] text-slate-400 font-sans">%</span>
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                  THREAT
                </span>
              </div>
            </div>

            {/* Label, Status Badge & Protocol */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
                  PARANORMAL THREAT METER
                </span>

                {/* Threat Tier Pill */}
                <div
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider border flex items-center gap-1.5 ${colors.badgeBg}`}
                >
                  {threat.level === 'hunt' && <Flame className="w-3 h-3 text-red-300 animate-bounce" />}
                  {threat.level === 'critical' && <Skull className="w-3 h-3 text-rose-300 animate-pulse" />}
                  {threat.level === 'high' && <AlertTriangle className="w-3 h-3 text-orange-300" />}
                  {threat.level === 'elevated' && <Zap className="w-3 h-3 text-amber-300" />}
                  {threat.level === 'calm' && <Shield className="w-3 h-3 text-emerald-300" />}
                  <span>{threat.level === 'hunt' ? 'ACTIVE HUNT!' : threat.level.toUpperCase()}</span>
                </div>

                {/* Smudge Active Tag */}
                {smudgeActive && (
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-700/60 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> WARD ENGAGED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1 font-sans line-clamp-1">
                {threat.recommendedAction}
              </p>

              {/* 10-segment LED bar */}
              <div className="flex items-center gap-1 mt-2 max-w-xs">
                {Array.from({ length: 10 }).map((_, i) => {
                  const threshold = (i + 1) * 10;
                  const isFilled = threat.score >= threshold - 5;
                  return (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-xs transition-all duration-300 ${
                        isFilled
                          ? i >= 8
                            ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                            : i >= 6
                            ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]'
                            : i >= 4
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Real-time EKG wave & Quick Action Controls */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Cardiac Pulse / EKG Oscilloscope */}
            <div className="hidden sm:flex flex-col items-end gap-1 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <Heart
                  className={`w-3 h-3 ${colors.text} ${
                    threat.score > 40 ? 'animate-ping' : ''
                  }`}
                />
                <span>PULSE:</span>
                <span className={`font-bold ${colors.text}`}>{threat.heartbeatBpm} BPM</span>
              </div>
              <canvas
                ref={miniEkgCanvasRef}
                width={120}
                height={26}
                className="w-[120px] h-[26px]"
              />
            </div>

            {/* Quick Diagnostic Expand & Audio Controls */}
            <div className="flex items-center gap-2">
              {/* Audio Heartbeat toggle */}
              <button
                id="threat-heartbeat-sound-toggle"
                onClick={() => {
                  setHeartbeatSoundEnabled(!heartbeatSoundEnabled);
                  ghostAudio.playUiClick();
                }}
                className={`p-2 rounded-lg border font-mono text-xs transition-all ${
                  heartbeatSoundEnabled && !audioMuted
                    ? 'bg-slate-800/90 text-amber-300 border-slate-700'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800'
                }`}
                title={
                  heartbeatSoundEnabled
                    ? 'Heartbeat audio feedback ON'
                    : 'Heartbeat audio feedback OFF'
                }
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Master Audio Mute */}
              <button
                onClick={() => {
                  onToggleAudioMuted();
                  ghostAudio.playUiClick();
                }}
                className={`p-2 rounded-lg border font-mono text-xs transition-all ${
                  audioMuted
                    ? 'bg-red-950/40 border-red-800 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={audioMuted ? 'Unmute All Sounds' : 'Mute All Sounds'}
              >
                {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Expand Detailed Threat Diagnostics */}
              <button
                id="threat-meter-diagnostics-btn"
                onClick={() => {
                  setIsDiagnosticOpen(true);
                  ghostAudio.playUiClick();
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                title="Open Tactical Threat Radar & Detailed Diagnostic Analytics"
              >
                <Radar className="w-4 h-4 text-amber-400" />
                <span className="hidden xs:inline">Diagnostics</span>
                <Maximize2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tactical Threat Diagnostic Modal (High-Resolution Radar & Factor Decomposition) */}
      {isDiagnosticOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
          <div
            id="threat-diagnostic-modal"
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
          >
            {/* Modal Header */}
            <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Radar className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-mono tracking-wide text-slate-100 uppercase">
                    TACTICAL THREAT RADAR & DIAGNOSTICS
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Real-time Paranormal Energy Decomposition • Sampling 1000ms
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsDiagnosticOpen(false);
                  ghostAudio.playUiClick();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-slate-200">
              {/* Primary Gauge Needle Arc & Live EKG Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                {/* Precision Needle Semi-Circle Gauge */}
                <div className="md:col-span-6 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-28 overflow-hidden flex items-end justify-center">
                    {/* Dial Semi-Circle Arc */}
                    <svg viewBox="0 0 200 110" className="w-full h-full">
                      {/* Scale sectors: green, yellow, orange, red */}
                      <path
                        d="M 20 100 A 80 80 0 0 1 60 40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeOpacity="0.8"
                      />
                      <path
                        d="M 60 40 A 80 80 0 0 1 100 20"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeOpacity="0.8"
                      />
                      <path
                        d="M 100 20 A 80 80 0 0 1 140 40"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="12"
                        strokeOpacity="0.8"
                      />
                      <path
                        d="M 140 40 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="12"
                        strokeOpacity="0.8"
                      />

                      {/* Calibrated Tick Marks */}
                      {[0, 25, 50, 75, 100].map((tick) => {
                        const angle = (-180 + (tick / 100) * 180) * (Math.PI / 180);
                        const x1 = 100 + 72 * Math.cos(angle);
                        const y1 = 100 + 72 * Math.sin(angle);
                        const x2 = 100 + 84 * Math.cos(angle);
                        const y2 = 100 + 84 * Math.sin(angle);
                        return (
                          <line
                            key={tick}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#94a3b8"
                            strokeWidth="2"
                          />
                        );
                      })}

                      {/* Needle */}
                      <g transform={`rotate(${needleAngle}, 100, 100)`}>
                        <line
                          x1="100"
                          y1="100"
                          x2="100"
                          y2="24"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                        />
                        <circle cx="100" cy="100" r="7" fill="#f59e0b" />
                        <circle cx="100" cy="100" r="3" fill="#ffffff" />
                      </g>
                    </svg>

                    <div className="absolute bottom-0 text-center">
                      <span className="text-2xl font-mono font-black tracking-tight text-white">
                        {threat.score}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 mt-2">
                    <span className="text-emerald-400">0% CALM</span>
                    <span className="text-amber-400">25% ELEV</span>
                    <span className="text-orange-400">50% HIGH</span>
                    <span className="text-red-400">75%+ DANGER</span>
                  </div>
                </div>

                {/* EKG Oscilloscope & Cardiac Telemetry */}
                <div className="md:col-span-6 flex flex-col justify-center space-y-2 bg-slate-900/90 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      CARDIAC BIO-METRICS
                    </span>
                    <span className={`font-bold ${colors.text}`}>{threat.heartbeatBpm} BPM</span>
                  </div>

                  <canvas
                    ref={ekgCanvasRef}
                    width={280}
                    height={64}
                    className="w-full h-16 rounded bg-slate-950 border border-slate-800"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Stress Index: {Math.round(threat.score * 0.9)}%</span>
                    <span>Hunt Risk: {threat.score > 70 ? 'IMMINENT' : 'LOW'}</span>
                  </div>
                </div>
              </div>

              {/* Threat Factor Decomposition Bars */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  TELEMETRY VECTOR DECOMPOSITION
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  {/* EMF Magnetic Flux */}
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> Magnetic Flux (EMF)
                      </span>
                      <span className="font-bold text-slate-200">{threat.emfScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${threat.emfScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Thermal Cold Spot */}
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ThermometerSnowflake className="w-3 h-3 text-cyan-400" /> Thermal Drop
                      </span>
                      <span className="font-bold text-slate-200">{threat.tempScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${threat.tempScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Entity Proximity Vector */}
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Radar className="w-3 h-3 text-red-400" /> Entity Proximity
                      </span>
                      <span className="font-bold text-slate-200">{threat.proximityScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${threat.proximityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Acoustic & EVP Vocal */}
                  <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-purple-400" /> Acoustic / EVP Resonance
                      </span>
                      <span className="font-bold text-slate-200">{threat.audioScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${threat.audioScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rolling 60-Second Oscilloscope History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    60-SECOND ROLLING THREAT OSCILLOSCOPE
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Trend: <span className="font-bold text-amber-400 uppercase">{threat.trend}</span>
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <canvas
                    ref={historyCanvasRef}
                    width={600}
                    height={100}
                    className="w-full h-24 rounded bg-slate-950"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-1">
                    <span>-60 sec</span>
                    <span>-30 sec</span>
                    <span>Live Now</span>
                  </div>
                </div>
              </div>

              {/* Active Threat Triggers List */}
              {threat.factors.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ACTIVE ANOMALY CONTRIBUTORS
                  </h3>
                  <div className="space-y-1.5">
                    {threat.factors.map((factor) => (
                      <div
                        key={factor.id}
                        className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 font-mono">
                              {factor.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                              {factor.value}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                            {factor.description}
                          </p>
                        </div>
                        <div className="shrink-0 font-mono font-bold text-amber-400">
                          +{factor.contribution}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Phone Device Sensors Integration Banner */}
              {onToggleDeviceSensors && (
                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        PHYSICAL PHONE SENSORS (MOBILE APK/PWA)
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Sync phone accelerometer motion into agitation calculations.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onToggleDeviceSensors();
                      ghostAudio.playUiClick();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all ${
                      deviceSensorsEnabled
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {deviceSensorsEnabled ? 'SENSORS ON' : 'ENABLE'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  onUseSmudgeStick();
                  ghostAudio.playUiClick();
                }}
                disabled={smudgeActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  smudgeActive
                    ? 'bg-purple-950 text-purple-300 border-purple-600 animate-pulse'
                    : 'bg-purple-900/80 hover:bg-purple-800 text-purple-100 border-purple-600'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {smudgeActive ? 'Sage Ward Active' : 'Deploy Sacred Sage Ward'}
              </button>

              <button
                onClick={() => {
                  setIsDiagnosticOpen(false);
                  ghostAudio.playUiClick();
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Sticky Bottom Mobile Threat Pill (Mobile-Only, keeps threat on screen while hunting) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <div
          onClick={() => {
            setIsDiagnosticOpen(true);
            ghostAudio.playUiClick();
          }}
          className={`cursor-pointer rounded-xl border backdrop-blur-md p-2.5 shadow-2xl flex items-center justify-between gap-2.5 transition-all ${colors.bg} ${colors.glow}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing indicator light */}
            <div
              className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                threat.score > 70
                  ? 'bg-red-500 animate-ping'
                  : threat.score > 40
                  ? 'bg-orange-500'
                  : 'bg-emerald-500'
              }`}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-black text-white">
                  THREAT {threat.score}%
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${colors.badgeBg}`}
                >
                  {threat.level}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-sans truncate block">
                {threat.recommendedAction}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Smudge button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseSmudgeStick();
                ghostAudio.playUiClick();
              }}
              disabled={smudgeActive}
              className="p-1.5 rounded bg-purple-950 text-purple-300 border border-purple-600 text-[10px]"
              title="Smudge"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDiagnosticOpen(true);
                ghostAudio.playUiClick();
              }}
              className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-700"
            >
              <Radar className="w-3 h-3 text-amber-400" />
              HUD
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
