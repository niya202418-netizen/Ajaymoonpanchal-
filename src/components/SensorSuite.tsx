import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  ThermometerSnowflake,
  Radio,
  Activity,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Flame,
  Waves,
  Eye,
  Radar
} from 'lucide-react';
import { LiveTelemetry, SensorType } from '../types';
import { ghostAudio } from '../utils/audio';

interface SensorSuiteProps {
  telemetry: LiveTelemetry;
  currentRoomName: string;
  isSpiritBoxActive: boolean;
  onToggleSpiritBox: () => void;
  tempUnit: 'C' | 'F';
  onToggleTempUnit: () => void;
  audioMuted: boolean;
  onToggleAudioMuted: () => void;
  onTriggerManifestation: () => void;
  isHunting: boolean;
}

export const SensorSuite: React.FC<SensorSuiteProps> = ({
  telemetry,
  currentRoomName,
  isSpiritBoxActive,
  onToggleSpiritBox,
  tempUnit,
  onToggleTempUnit,
  audioMuted,
  onToggleAudioMuted,
  onTriggerManifestation,
  isHunting
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spiritBoxFreq, setSpiritBoxFreq] = useState<number>(104.3);

  // Convert temp
  const displayTemp =
    tempUnit === 'C'
      ? telemetry.temperature
      : (telemetry.temperature * 9) / 5 + 32;

  const isFreezing = telemetry.temperature <= 0;
  const isEmf5 = telemetry.emf >= 20.0;

  // Spirit box radio sweep animation
  useEffect(() => {
    if (!isSpiritBoxActive) return;
    const interval = setInterval(() => {
      setSpiritBoxFreq((f) => {
        const next = f + 0.2;
        return next > 108.0 ? 88.0 : parseFloat(next.toFixed(1));
      });
      ghostAudio.playSpiritBoxSweep();
    }, 120);
    return () => clearInterval(interval);
  }, [isSpiritBoxActive]);

  // Audio Oscilloscope Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Spectral wave
      const amplitude = Math.min(
        height / 2 - 4,
        (Math.abs(telemetry.audioDb + 80) / 80) * (height / 2.2) + (isSpiritBoxActive ? 12 : 3)
      );

      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isEmf5
        ? '#ef4444'
        : isFreezing
        ? '#38bdf8'
        : isSpiritBoxActive
        ? '#a855f7'
        : '#10b981';

      for (let x = 0; x < width; x++) {
        const freqMultiplier = (telemetry.audioFrequencyHz / 400) * 0.05;
        const noise = (Math.random() - 0.5) * (isSpiritBoxActive ? 4 : 1.5);
        const y =
          height / 2 +
          Math.sin(x * freqMultiplier + phase) * amplitude * Math.cos(x * 0.02) +
          noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += 0.15;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [telemetry.audioDb, telemetry.audioFrequencyHz, isSpiritBoxActive, isEmf5, isFreezing]);

  // Determine EMF Stage 1 to 5
  const getEmfLeds = () => {
    const emf = telemetry.emf;
    return [
      { active: emf >= 0.5, color: 'bg-emerald-500', label: '1.5mG' },
      { active: emf >= 2.5, color: 'bg-emerald-400', label: '2.5mG' },
      { active: emf >= 10.0, color: 'bg-amber-400', label: '10mG' },
      { active: emf >= 15.0, color: 'bg-orange-500', label: '15mG' },
      { active: emf >= 20.0, color: 'bg-red-500 animate-ping', label: 'EMF 5' }
    ];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 select-none">
      {/* 1. EMF METER (K-II Style) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden">
        {isEmf5 && (
          <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 animate-pulse" />
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                isEmf5
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-slate-800 text-emerald-400'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                K2 EMF FIELD
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentRoomName || 'Perimeter'}
              </span>
            </div>
          </div>
          {isEmf5 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/80 text-red-200 border border-red-500 animate-pulse">
              LEVEL 5 EVIDENCE
            </span>
          )}
        </div>

        {/* Large Digital EMF Value */}
        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono text-3xl font-black tracking-tight ${
                isEmf5
                  ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                  : telemetry.emf > 10
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {telemetry.emf.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">mG</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              STATUS
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                isEmf5
                  ? 'text-red-400'
                  : telemetry.emf > 5
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {isEmf5 ? 'MANIFESTING' : telemetry.emf > 5 ? 'ELEVATED' : 'BASELINE'}
            </span>
          </div>
        </div>

        {/* 5-LED Stage Bar */}
        <div className="space-y-1">
          <div className="grid grid-cols-5 gap-1.5 h-3">
            {getEmfLeds().map((led, i) => (
              <div
                key={i}
                className={`rounded-sm transition-all duration-150 ${
                  led.active
                    ? `${led.color} shadow-[0_0_8px_currentColor]`
                    : 'bg-slate-800/80 opacity-40'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>Normal</span>
            <span>Surge</span>
            <span className="text-red-400 font-bold">EMF 5</span>
          </div>
        </div>
      </div>

      {/* 2. THERMAL SENSOR (Cryogenic / Cold Spot) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden">
        {isFreezing && (
          <div className="absolute top-0 right-0 left-0 h-1 bg-cyan-400 animate-pulse" />
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                isFreezing
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-slate-800 text-cyan-400'
              }`}
            >
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                THERMAL SENSOR
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Ambient & Cryo Monitor
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onToggleTempUnit();
              ghostAudio.playUiClick();
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700"
          >
            °{tempUnit}
          </button>
        </div>

        {/* Large Digital Temperature */}
        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-mono text-3xl font-black tracking-tight ${
                isFreezing
                  ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                  : telemetry.temperature < 10
                  ? 'text-sky-300'
                  : 'text-slate-200'
              }`}
            >
              {displayTemp > 0 ? `+${displayTemp.toFixed(1)}` : displayTemp.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">°{tempUnit}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              BREATH STATE
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                isFreezing ? 'text-cyan-300 animate-pulse' : 'text-slate-400'
              }`}
            >
              {isFreezing ? 'FREEZING COLD' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Cold Spot Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            {/* Visual scale: freezing on left, warm on right */}
            <div
              className={`h-full transition-all duration-300 ${
                isFreezing ? 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-600'
              }`}
              style={{
                width: `${Math.min(100, Math.max(5, ((25 - telemetry.temperature) / 35) * 100))}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">&lt; 0°C (Freezing Breath)</span>
            <span>22°C (Room)</span>
          </div>
        </div>
      </div>

      {/* 3. SPIRIT BOX & AUDIO EVP */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                isSpiritBoxActive
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'bg-slate-800 text-purple-400'
              }`}
            >
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                SB7 SPIRIT BOX
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {isSpiritBoxActive ? `${spiritBoxFreq} MHz AM/FM` : 'OFFLINE'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onToggleSpiritBox();
              ghostAudio.playUiClick();
            }}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
              isSpiritBoxActive
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSpiritBoxActive ? 'SCANNING' : 'POWER ON'}
          </button>
        </div>

        {/* Live Audio Oscilloscope Canvas */}
        <div className="relative my-1 bg-slate-950 rounded-lg border border-slate-800/80 p-1">
          <canvas ref={canvasRef} width={240} height={42} className="w-full h-[42px] block" />
          {/* EVP Phrase Display banner */}
          {telemetry.spiritBoxPhrase && (
            <div className="absolute inset-0 bg-purple-950/90 flex items-center justify-center rounded border border-purple-500 animate-pulse">
              <span className="text-purple-200 font-mono font-black text-sm tracking-widest drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]">
                "{telemetry.spiritBoxPhrase}"
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Audio: {telemetry.audioDb.toFixed(0)} dB</span>
          <span>Peak: {telemetry.audioFrequencyHz.toFixed(0)} Hz</span>
          <span className={telemetry.spiritBoxPhrase ? 'text-purple-400 font-bold' : ''}>
            {telemetry.spiritBoxPhrase ? 'EVP CAPTURED' : 'STATIC SWEEP'}
          </span>
        </div>
      </div>

      {/* 4. REM POD & HUNT ACTIVITY INDEX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden">
        {isHunting && (
          <div className="absolute inset-0 bg-red-950/40 border border-red-600 animate-pulse pointer-events-none z-10" />
        )}
        <div className="flex items-center justify-between mb-2 z-20">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                isHunting
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-slate-800 text-amber-400'
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
                PARANORMAL INDEX
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {isHunting ? '⚠️ ACTIVE HUNT' : 'REM-Pod Proximity'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onToggleAudioMuted();
              ghostAudio.playUiClick();
            }}
            className={`p-1 rounded text-[10px] font-mono transition-all ${
              audioMuted
                ? 'bg-red-950/60 text-red-400'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={audioMuted ? 'Unmute Audio Senses' : 'Mute Audio'}
          >
            {audioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Activity Meter Progress */}
        <div className="my-2 z-20">
          <div className="flex items-baseline justify-between mb-1">
            <span
              className={`font-mono text-3xl font-black ${
                telemetry.paranormalActivityScore > 75
                  ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : telemetry.paranormalActivityScore > 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {telemetry.paranormalActivityScore}%
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {telemetry.remPodDistance !== null
                ? `REM: ${telemetry.remPodDistance.toFixed(1)}m`
                : 'No Proximity'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.paranormalActivityScore > 75
                  ? 'bg-red-500'
                  : telemetry.paranormalActivityScore > 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${telemetry.paranormalActivityScore}%` }}
            />
          </div>
        </div>

        {/* Provoke / Manifest Button */}
        <div className="z-20 pt-1">
          <button
            onClick={() => {
              onTriggerManifestation();
              ghostAudio.playAlertSiren();
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-800/80 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:shadow-[0_0_16px_rgba(239,68,68,0.4)]"
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            PROVOKE ENTITY EVENT
          </button>
        </div>
      </div>
    </div>
  );
};
