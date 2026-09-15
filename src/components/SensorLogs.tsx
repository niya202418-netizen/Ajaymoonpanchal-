import React, { useState, useMemo } from 'react';
import {
  FileText,
  Filter,
  Search,
  Download,
  Trash2,
  PlusCircle,
  Bookmark,
  BookmarkCheck,
  AlertOctagon,
  Zap,
  ThermometerSnowflake,
  Radio,
  Eye,
  Activity,
  Check
} from 'lucide-react';
import { SensorLogEntry, SensorType, AnomalySeverity } from '../types';
import { ghostAudio } from '../utils/audio';

interface SensorLogsProps {
  logs: SensorLogEntry[];
  onAddManualLog: (entry: Omit<SensorLogEntry, 'id' | 'timestamp'>) => void;
  onClearLogs: () => void;
  onToggleFlag: (id: string) => void;
  roomsList: { id: string; name: string }[];
  currentRoomId: string | null;
  siteName: string;
}

export const SensorLogs: React.FC<SensorLogsProps> = ({
  logs,
  onAddManualLog,
  onClearLogs,
  onToggleFlag,
  roomsList,
  currentRoomId,
  siteName
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFlagged, setOnlyFlagged] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Manual entry state
  const [manualRoom, setManualRoom] = useState<string>(
    currentRoomId ? roomsList.find((r) => r.id === currentRoomId)?.name || 'Grand Foyer' : 'Grand Foyer'
  );
  const [manualType, setManualType] = useState<SensorType>('emf');
  const [manualValue, setManualValue] = useState<string>('18.4');
  const [manualUnit, setManualUnit] = useState<string>('mG');
  const [manualSeverity, setManualSeverity] = useState<AnomalySeverity>('high');
  const [manualNote, setManualNote] = useState<string>('');

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== 'all' && log.sensorType !== filterType) return false;
      if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
      if (onlyFlagged && !log.isFlagged) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRoom = log.location.toLowerCase().includes(q);
        const matchMsg = log.message.toLowerCase().includes(q);
        const matchVal = String(log.value).toLowerCase().includes(q);
        if (!matchRoom && !matchMsg && !matchVal) return false;
      }
      return true;
    });
  }, [logs, filterType, filterSeverity, onlyFlagged, searchQuery]);

  const handleExportText = () => {
    ghostAudio.playUiClick();
    const reportHeader = `===========================================================
PARANORMAL INVESTIGATION LOG REPORT
SITE: ${siteName.toUpperCase()}
DATE: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
TOTAL SENSOR LOGS: ${logs.length}
===========================================================\n\n`;

    const logLines = logs
      .map((l) => {
        const time = new Date(l.timestamp).toLocaleTimeString();
        return `[${time}] [${l.severity.toUpperCase()}] [${l.location} Lvl ${l.floor}] [${l.sensorType.toUpperCase()}]: ${l.value} ${l.unit} - ${l.message}`;
      })
      .join('\n');

    const blob = new Blob([reportHeader + logLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ghost_investigation_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    ghostAudio.playUiClick();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ghost_sensor_telemetry_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim()) return;

    onAddManualLog({
      location: manualRoom,
      floor: 1,
      sensorType: manualType,
      value: manualValue,
      unit: manualUnit,
      severity: manualSeverity,
      message: manualNote,
      isFlagged: true
    });

    setManualNote('');
    setIsModalOpen(false);
    ghostAudio.playUiClick();
  };

  const getSeverityBadge = (severity: AnomalySeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 animate-pulse">
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950 text-orange-400 border border-orange-800">
            HIGH
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950 text-amber-400 border border-amber-800">
            MODERATE
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-900">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
            BASELINE
          </span>
        );
    }
  };

  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'emf':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'temperature':
        return <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />;
      case 'spirit_box':
      case 'audio_evp':
        return <Radio className="w-3.5 h-3.5 text-purple-400" />;
      case 'motion':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      case 'uv_optical':
        return <Eye className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header bar */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-800 text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              SENSOR TELEMETRY LOGS
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                {logs.length} entries
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Live timestamps & anomalous activity stream
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsModalOpen(true);
              ghostAudio.playUiClick();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + Manual Entry
          </button>

          <button
            onClick={handleExportText}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1 transition-all"
            title="Download formatted text report"
          >
            <Download className="w-3.5 h-3.5" />
            Report
          </button>

          <button
            onClick={handleExportJson}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1 transition-all"
            title="Export raw JSON"
          >
            JSON
          </button>

          <button
            onClick={() => {
              onClearLogs();
              ghostAudio.playUiClick();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 transition-all"
            title="Clear all logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="px-3.5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sensor type filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono text-[11px]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Sensors</option>
              <option value="emf">EMF Fields</option>
              <option value="temperature">Thermal / Cryo</option>
              <option value="spirit_box">Spirit Box</option>
              <option value="audio_evp">Audio EVP</option>
              <option value="motion">REM / Motion</option>
              <option value="uv_optical">UV & Optical</option>
            </select>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono text-[11px]">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical Only</option>
              <option value="high">High & Critical</option>
              <option value="moderate">Moderate+</option>
              <option value="low">Low</option>
              <option value="baseline">Baseline</option>
            </select>
          </div>

          {/* Flagged only toggle */}
          <button
            onClick={() => setOnlyFlagged(!onlyFlagged)}
            className={`px-2 py-1 rounded font-mono text-xs flex items-center gap-1 transition-all ${
              onlyFlagged
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarked
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Logs Table / Stream Container */}
      <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-800/60 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono">
            No sensor telemetry matching current filters.
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={entry.id}
                className={`px-3.5 py-2.5 flex items-start justify-between gap-3 hover:bg-slate-800/50 transition-colors ${
                  entry.severity === 'critical'
                    ? 'bg-red-950/20'
                    : entry.severity === 'high'
                    ? 'bg-amber-950/15'
                    : ''
                }`}
              >
                {/* Left block: Icon, Timestamp, Room */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="mt-0.5 shrink-0 p-1 rounded bg-slate-800 border border-slate-700/60">
                    {getSensorIcon(entry.sensorType)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-slate-400 font-bold">{timeStr}</span>
                      <span className="text-slate-300 font-semibold truncate">
                        {entry.location}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Lvl {entry.floor})
                      </span>
                      {getSeverityBadge(entry.severity)}
                    </div>

                    <p className="text-slate-300 text-xs break-words">{entry.message}</p>
                  </div>
                </div>

                {/* Right block: Value & Bookmark toggle */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="text-right">
                    <span className="text-amber-400 font-bold font-mono">
                      {entry.value}
                    </span>
                    <span className="text-slate-400 text-[10px] ml-1">{entry.unit}</span>
                  </div>

                  <button
                    onClick={() => {
                      onToggleFlag(entry.id);
                      ghostAudio.playUiClick();
                    }}
                    className={`p-1 rounded transition-colors ${
                      entry.isFlagged
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={entry.isFlagged ? 'Remove bookmark' : 'Bookmark entry'}
                  >
                    {entry.isFlagged ? (
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-mono font-bold text-slate-100 mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              LOG FIELD OBSERVATION
            </h3>

            <form onSubmit={submitManualLog} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Room / Zone</label>
                <select
                  value={manualRoom}
                  onChange={(e) => setManualRoom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {roomsList.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Sensor Instrument</label>
                  <select
                    value={manualType}
                    onChange={(e) => {
                      const t = e.target.value as SensorType;
                      setManualType(t);
                      if (t === 'emf') {
                        setManualUnit('mG');
                        setManualValue('21.2');
                      } else if (t === 'temperature') {
                        setManualUnit('°C');
                        setManualValue('-2.1');
                      } else if (t === 'spirit_box') {
                        setManualUnit('MHz');
                        setManualValue('104.3');
                      } else {
                        setManualUnit('dB');
                        setManualValue('-14');
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="emf">EMF Meter</option>
                    <option value="temperature">Thermal Scanner</option>
                    <option value="spirit_box">Spirit Box</option>
                    <option value="audio_evp">Audio EVP</option>
                    <option value="motion">REM Pod</option>
                    <option value="uv_optical">UV / Optical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Severity Rating</label>
                  <select
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value as AnomalySeverity)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="baseline">Baseline</option>
                    <option value="low">Low Activity</option>
                    <option value="moderate">Moderate Anomaly</option>
                    <option value="high">High Spike</option>
                    <option value="critical">Critical Manifestation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Reading Value</label>
                  <input
                    type="text"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 22.4"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. mG"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observation Details</label>
                <textarea
                  rows={3}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Distinct freezing breath observed, door latch clicked and swung shut violently."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold shadow-lg"
                >
                  Record Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
