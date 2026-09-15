import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Zap,
  ThermometerSnowflake,
  Radio,
  Eye,
  AlertTriangle,
  Skull
} from 'lucide-react';
import { GHOST_EVIDENCES, GHOST_ENTITIES } from '../data/entities';
import { ghostAudio } from '../utils/audio';

interface EvidenceDossierProps {
  confirmedEvidence: string[]; // array of evidence IDs
  onToggleEvidence: (id: string) => void;
  identifiedGhost: string | null;
  onSelectIdentifiedGhost: (id: string | null) => void;
  telemetryEmf: number;
  telemetryTemp: number;
}

export const EvidenceDossier: React.FC<EvidenceDossierProps> = ({
  confirmedEvidence,
  onToggleEvidence,
  identifiedGhost,
  onSelectIdentifiedGhost,
  telemetryEmf,
  telemetryTemp
}) => {
  const [selectedEntityForModal, setSelectedEntityForModal] = useState<string | null>(null);

  // Check matching entities
  const entityMatches = GHOST_ENTITIES.map((entity) => {
    // Has all confirmed evidence?
    const hasAllConfirmed = confirmedEvidence.every((ev) =>
      entity.evidence.includes(ev)
    );
    const missingEvidence = entity.evidence.filter(
      (ev) => !confirmedEvidence.includes(ev)
    );
    return {
      entity,
      isPossible: hasAllConfirmed,
      missingEvidence,
      matchCount: entity.evidence.filter((ev) => confirmedEvidence.includes(ev)).length
    };
  }).sort((a, b) => {
    if (a.isPossible && !b.isPossible) return -1;
    if (!a.isPossible && b.isPossible) return 1;
    return b.matchCount - a.matchCount;
  });

  const getDangerBadge = (danger: string) => {
    switch (danger) {
      case 'Extreme':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'High':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'Moderate':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-800 text-purple-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              PARANORMAL EVIDENCE DOSSIER
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Entity identification matrix & field evidence
            </p>
          </div>
        </div>

        {identifiedGhost && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono text-xs">
            <Skull className="w-3.5 h-3.5 text-purple-400" />
            <span>
              HYPOTHESIS: <strong>{GHOST_ENTITIES.find((g) => g.id === identifiedGhost)?.name}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-y-auto">
        {/* Left Column: Evidence Checkboxes */}
        <div className="lg:col-span-5 space-y-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Confirmed Field Evidence ({confirmedEvidence.length}/3)
          </span>

          {GHOST_EVIDENCES.map((ev) => {
            const isChecked = confirmedEvidence.includes(ev.id);
            // Automatic hint indicators based on live telemetry
            const autoAlert =
              (ev.id === 'emf_5' && telemetryEmf >= 20.0) ||
              (ev.id === 'freezing_temps' && telemetryTemp <= 0);

            return (
              <div
                key={ev.id}
                onClick={() => {
                  onToggleEvidence(ev.id);
                  ghostAudio.playUiClick();
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                  isChecked
                    ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5">
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600 bg-slate-800/60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isChecked ? 'text-purple-200' : 'text-slate-300'
                      }`}
                    >
                      {ev.name}
                    </span>
                    {autoAlert && !isChecked && (
                      <span className="text-[10px] font-mono font-bold text-red-400 bg-red-950 px-1.5 py-0.2 rounded animate-pulse border border-red-800">
                        DETECTED NOW
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {ev.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Entity Matching Matrix */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Entity Possibilities (
              {entityMatches.filter((m) => m.isPossible).length} viable)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Select to lock hypothesis
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {entityMatches.map(({ entity, isPossible, missingEvidence, matchCount }) => {
              const isSelected = identifiedGhost === entity.id;

              return (
                <div
                  key={entity.id}
                  onClick={() => {
                    if (!isPossible) return;
                    onSelectIdentifiedGhost(isSelected ? null : entity.id);
                    ghostAudio.playUiClick();
                  }}
                  className={`p-3 rounded-lg border transition-all text-xs font-mono ${
                    !isPossible
                      ? 'opacity-30 bg-slate-950/40 border-slate-900 line-through cursor-not-allowed'
                      : isSelected
                      ? 'bg-purple-900/30 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] cursor-pointer'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isSelected
                            ? 'text-purple-300'
                            : isPossible
                            ? 'text-slate-100'
                            : 'text-slate-500'
                        }`}
                      >
                        {entity.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        [{entity.category}]
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getDangerBadge(
                          entity.dangerLevel
                        )}`}
                      >
                        {entity.dangerLevel}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-600 text-white font-bold">
                          IDENTIFIED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Required Evidence Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {entity.evidence.map((evId) => {
                      const hasEv = confirmedEvidence.includes(evId);
                      const evObj = GHOST_EVIDENCES.find((e) => e.id === evId);
                      return (
                        <span
                          key={evId}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            hasEv
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {hasEv ? '✓ ' : '• '}
                          {evObj?.name.split(' (')[0] || evId}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 font-sans italic leading-relaxed">
                    {entity.behaviorNotes}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
