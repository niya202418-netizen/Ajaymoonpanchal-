import React from 'react';
import {
  Compass,
  Clock,
  HeartPulse,
  Play,
  Pause,
  FastForward,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Building,
  RotateCcw,
  Smartphone,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { LocationSite, ThreatLevel } from '../types';
import { INVESTIGATION_SITES } from '../data/locations';
import { ghostAudio } from '../utils/audio';

interface InvestigationControlsProps {
  selectedSite: LocationSite;
  onSelectSite: (site: LocationSite) => void;
  sessionTimeSeconds: number;
  investigatorSanity: number;
  isRunning: boolean;
  onToggleRunning: () => void;
  simulationSpeed: number;
  onCycleSpeed: () => void;
  audioMuted: boolean;
  onToggleAudioMuted: () => void;
  onUseSmudgeStick: () => void;
  smudgeActive: boolean;
  onResetSession: () => void;
  threatScore?: number;
  threatLevel?: ThreatLevel;
  onOpenMobileApk?: () => void;
  onOpenThreatDiagnostics?: () => void;
}

export const InvestigationControls: React.FC<InvestigationControlsProps> = ({
  selectedSite,
  onSelectSite,
  sessionTimeSeconds,
  investigatorSanity,
  isRunning,
  onToggleRunning,
  simulationSpeed,
  onCycleSpeed,
  audioMuted,
  onToggleAudioMuted,
  onUseSmudgeStick,
  smudgeActive,
  onResetSession,
  threatScore = 12,
  threatLevel = 'calm',
  onOpenMobileApk,
  onOpenThreatDiagnostics
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getSanityColor = (sanity: number) => {
    if (sanity > 65) return 'text-emerald-400';
    if (sanity > 35) return 'text-amber-400';
    return 'text-red-400 animate-pulse';
  };

  const getThreatBadgeColor = (lvl: ThreatLevel | string = 'calm') => {
    switch (lvl) {
      case 'hunt':
        return 'bg-red-950 text-red-400 border-red-500 animate-pulse';
      case 'critical':
        return 'bg-rose-950 text-rose-400 border-rose-500';
      case 'high':
        return 'bg-orange-950 text-orange-400 border-orange-600';
      case 'elevated':
        return 'bg-amber-950 text-amber-400 border-amber-600';
      case 'calm':
      default:
        return 'bg-emerald-950 text-emerald-400 border-emerald-600/50';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 sm:py-3 shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: App Title & Site Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Compass className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold font-mono tracking-wide text-slate-100 uppercase">
                GHOST HUNTING TRACKER
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 hidden xs:inline">
                P.K.E. v4.5
              </span>
            </div>

            {/* Site Picker dropdown */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSite.id}
                onChange={(e) => {
                  const s = INVESTIGATION_SITES.find((site) => site.id === e.target.value);
                  if (s) {
                    onSelectSite(s);
                    ghostAudio.playUiClick();
                  }
                }}
                className="bg-transparent text-slate-300 hover:text-white font-mono text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {INVESTIGATION_SITES.map((site) => (
                  <option key={site.id} value={site.id} className="bg-slate-900 text-slate-200">
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center: Live Session Indicators (Timer, Sanity & Threat HUD pill) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 bg-slate-950/90 border border-slate-800/90 px-3 py-1.5 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">MISSION:</span>
            <span className="text-slate-100 font-bold">{formatTime(sessionTimeSeconds)}</span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <HeartPulse className={`w-3.5 h-3.5 ${getSanityColor(investigatorSanity)}`} />
            <span className="text-slate-400 hidden sm:inline">SANITY:</span>
            <span className={`font-bold ${getSanityColor(investigatorSanity)}`}>
              {investigatorSanity}%
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Direct Threat Quick Indicator */}
          <button
            onClick={() => {
              if (onOpenThreatDiagnostics) onOpenThreatDiagnostics();
              ghostAudio.playUiClick();
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold uppercase transition-all hover:scale-105 ${getThreatBadgeColor(
              threatLevel
            )}`}
            title="Current Threat Level - Click to open diagnostic monitor"
          >
            {threatLevel === 'hunt' ? (
              <Flame className="w-3 h-3 text-red-400 animate-bounce" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            <span>THREAT {threatScore}%</span>
          </button>
        </div>

        {/* Right: Simulation Controls, Mobile APK & Protective Ward */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile APK Modal trigger button */}
          <button
            onClick={() => {
              if (onOpenMobileApk) onOpenMobileApk();
              ghostAudio.playUiClick();
            }}
            className="px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/70 shadow-[0_0_10px_rgba(16,185,129,0.15)] transition-all"
            title="Install Mobile App / Android APK or iOS PWA"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Mobile APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Smudge stick ward button */}
          <button
            onClick={() => {
              onUseSmudgeStick();
              ghostAudio.playUiClick();
            }}
            disabled={smudgeActive}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all ${
              smudgeActive
                ? 'bg-purple-950/80 text-purple-300 border border-purple-600 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Burn Sacred Sage to repel ghosts and delay hunts for 30 seconds"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">
              {smudgeActive ? 'Sage Ward Active' : 'Burn Sage Ward'}
            </span>
            <span className="sm:hidden">{smudgeActive ? 'Sage Active' : 'Sage'}</span>
          </button>

          {/* Pause / Play telemetry simulator */}
          <button
            onClick={() => {
              onToggleRunning();
              ghostAudio.playUiClick();
            }}
            className={`p-1.5 rounded-lg font-mono text-xs transition-all ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
            }`}
            title={isRunning ? 'Pause Telemetry Simulation' : 'Resume Telemetry Simulation'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Speed cycle button */}
          <button
            onClick={() => {
              onCycleSpeed();
              ghostAudio.playUiClick();
            }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 hidden xs:block"
            title="Simulation Speed (1x, 2x, 5x)"
          >
            {simulationSpeed}x
          </button>

          {/* Audio Mute toggle */}
          <button
            onClick={() => {
              onToggleAudioMuted();
              ghostAudio.playUiClick();
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              audioMuted
                ? 'bg-red-950/40 border-red-800/80 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={audioMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset session button */}
          <button
            onClick={() => {
              if (confirm('Reset investigation session and logs?')) {
                onResetSession();
                ghostAudio.playUiClick();
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Reset Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

