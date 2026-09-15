import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Radio,
  Eye,
  ThermometerSnowflake,
  Zap,
  MapPin,
  Trash2,
  Navigation,
  Compass,
  Crosshair,
  Wifi
} from 'lucide-react';
import {
  LocationSite,
  RoomDefinition,
  PlacedSensor,
  InvestigatorPosition,
  ActiveEntityState,
  SensorType
} from '../types';
import { ghostAudio } from '../utils/audio';

interface TacticalMapProps {
  site: LocationSite;
  currentFloor: number;
  onFloorChange: (floor: number) => void;
  investigator: InvestigatorPosition;
  onMoveInvestigator: (x: number, y: number, roomId: string | null) => void;
  sensors: PlacedSensor[];
  onAddSensor: (sensor: PlacedSensor) => void;
  onRemoveSensor: (id: string) => void;
  activeEntity: ActiveEntityState;
  selectedRoom: RoomDefinition | null;
  onSelectRoom: (room: RoomDefinition | null) => void;
  activeTool: 'navigate' | 'deploy_emf' | 'deploy_temp' | 'deploy_motion' | 'deploy_camera' | 'mark_incident';
  onSelectTool: (tool: 'navigate' | 'deploy_emf' | 'deploy_temp' | 'deploy_motion' | 'deploy_camera' | 'mark_incident') => void;
  nightVisionMode: boolean;
  showEmfOverlay: boolean;
  showThermalOverlay: boolean;
  onToggleEmfOverlay: () => void;
  onToggleThermalOverlay: () => void;
  onToggleNightVision: () => void;
  liveEmf: number;
  liveTemp: number;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  site,
  currentFloor,
  onFloorChange,
  investigator,
  onMoveInvestigator,
  sensors,
  onAddSensor,
  onRemoveSensor,
  activeEntity,
  selectedRoom,
  onSelectRoom,
  activeTool,
  onSelectTool,
  nightVisionMode,
  showEmfOverlay,
  showThermalOverlay,
  onToggleEmfOverlay,
  onToggleThermalOverlay,
  onToggleNightVision,
  liveEmf,
  liveTemp
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const roomsOnFloor = site.rooms.filter((r) => r.floor === currentFloor);
  const sensorsOnFloor = sensors.filter((s) => s.floor === currentFloor);
  const isEntityOnFloor = activeEntity.floor === currentFloor;

  // Find room under coordinate
  const findRoomAtCoords = (x: number, y: number): RoomDefinition | null => {
    return (
      roomsOnFloor.find(
        (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
      ) || null
    );
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const boundedX = Math.max(2, Math.min(98, Math.round(clickX)));
    const boundedY = Math.max(2, Math.min(98, Math.round(clickY)));
    const room = findRoomAtCoords(boundedX, boundedY);

    if (activeTool === 'navigate') {
      onMoveInvestigator(boundedX, boundedY, room ? room.id : null);
      if (room) {
        onSelectRoom(room);
      }
      ghostAudio.playUiClick();
    } else if (activeTool.startsWith('deploy_')) {
      const typeMap: Record<string, { type: SensorType; label: string }> = {
        deploy_emf: { type: 'emf', label: 'EMF Pod' },
        deploy_temp: { type: 'temperature', label: 'Thermal Sensor' },
        deploy_motion: { type: 'motion', label: 'REM Motion Pod' },
        deploy_camera: { type: 'uv_optical', label: 'IR Optical Cam' }
      };
      const def = typeMap[activeTool] || { type: 'emf', label: 'Sensor Pod' };
      const newSensor: PlacedSensor = {
        id: `sensor_${Date.now()}`,
        type: def.type,
        floor: currentFloor,
        roomId: room ? room.id : 'corridor',
        x: boundedX,
        y: boundedY,
        label: `${def.label} ${sensors.length + 1}`,
        battery: 98,
        active: true,
        placedAt: Date.now()
      };
      onAddSensor(newSensor);
      ghostAudio.playUiClick();
      onSelectTool('navigate'); // switch back after deploy
    } else if (activeTool === 'mark_incident') {
      onSelectRoom(room);
      ghostAudio.playAlertSiren();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.shiftKey) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative select-none">
      {/* Tactical Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        {/* Floor Level Selector */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-mono flex items-center gap-1.5 mr-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            FLOOR:
          </span>
          {site.floors.map((fl) => (
            <button
              key={fl.level}
              onClick={() => {
                onFloorChange(fl.level);
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
                currentFloor === fl.level
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {fl.name}
            </button>
          ))}
        </div>

        {/* View Overlays & Night Vision */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleEmfOverlay}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono transition-all ${
              showEmfOverlay
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-700/50'
            }`}
            title="Toggle EMF Radiation Field Overlay"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            EMF Grid
          </button>

          <button
            onClick={onToggleThermalOverlay}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono transition-all ${
              showThermalOverlay
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-700/50'
            }`}
            title="Toggle Cryogenic Cold Spot Heatmap"
          >
            <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
            Cold Spots
          </button>

          <button
            onClick={onToggleNightVision}
            className={`px-2.5 py-1 rounded flex items-center gap-1 font-mono transition-all ${
              nightVisionMode
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-700/50'
            }`}
            title="Toggle Optical IR Night Vision Mode"
          >
            <Eye className="w-3.5 h-3.5" />
            IR Cam
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Reset Map View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Interactive Canvas / SVG Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 w-full h-[460px] md:h-[520px] overflow-hidden ${
          nightVisionMode
            ? 'bg-[#03140b] bg-[radial-gradient(#053b1b_1px,transparent_1px)] [background-size:24px_24px]'
            : 'bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]'
        }`}
      >
        {/* Night Vision Scanlines & Noise FX */}
        {nightVisionMode && (
          <div className="absolute inset-0 pointer-events-none z-30 opacity-40 bg-[repeating-linear-gradient(0deg,rgba(0,255,100,0.06)_0px,rgba(0,255,100,0.06)_1px,transparent_2px,transparent_4px)]" />
        )}

        {/* Live Radar Sweep Line */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent animate-[scan_4s_linear_infinite]" />
        </div>

        {/* Scaled & Panned SVG Floorplan */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center cursor-crosshair"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full max-w-[700px] max-h-[500px] select-none"
            onClick={handleMapClick}
          >
            <defs>
              {/* EMF Glow Gradient */}
              <radialGradient id="emfGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              {/* Freezing Cold Gradient */}
              <radialGradient id="coldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#0284c7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>

              {/* Floor Grid Pattern */}
              <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#334155" strokeWidth="0.15" />
              </pattern>
            </defs>

            {/* Background Perimeter / Walls */}
            <rect
              x="5"
              y="5"
              width="90"
              height="90"
              fill={nightVisionMode ? '#041d0e' : '#090d16'}
              stroke={nightVisionMode ? '#10b981' : '#475569'}
              strokeWidth="0.8"
              rx="2"
            />
            <rect x="5" y="5" width="90" height="90" fill="url(#grid)" opacity="0.3" />

            {/* Corridors / Outer Blueprint Label */}
            <text
              x="8"
              y="9"
              fill={nightVisionMode ? '#34d399' : '#64748b'}
              fontSize="2.2"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {site.name.toUpperCase()} // LVL {currentFloor}
            </text>

            {/* Render Each Room on Current Floor */}
            {roomsOnFloor.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const hasInvestigator = investigator.currentRoomId === room.id && investigator.floor === currentFloor;
              const hasEntity = isEntityOnFloor && activeEntity.currentRoomId === room.id;

              // Anomaly visual calculations
              const roomEmf = hasEntity ? liveEmf : room.baseEmf;
              const roomTemp = hasEntity ? liveTemp : room.baseTemp;

              return (
                <g
                  key={room.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRoom(room);
                    if (activeTool === 'navigate') {
                      onMoveInvestigator(
                        room.x + room.width / 2,
                        room.y + room.height / 2,
                        room.id
                      );
                    }
                    ghostAudio.playUiClick();
                  }}
                >
                  {/* Room Base Fill & Border */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill={
                      isSelected
                        ? nightVisionMode
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(245, 158, 11, 0.18)'
                        : hasInvestigator
                        ? 'rgba(59, 130, 246, 0.15)'
                        : nightVisionMode
                        ? '#062815'
                        : '#0f172a'
                    }
                    stroke={
                      isSelected
                        ? '#f59e0b'
                        : hasEntity && activeEntity.activityLevel > 50
                        ? '#ef4444'
                        : nightVisionMode
                        ? '#059669'
                        : '#334155'
                    }
                    strokeWidth={isSelected ? '0.7' : '0.4'}
                    strokeDasharray={isSelected ? '1 0.5' : undefined}
                  />

                  {/* EMF Heatmap Overlay if enabled */}
                  {showEmfOverlay && roomEmf > 1.5 && (
                    <circle
                      cx={room.x + room.width / 2}
                      cy={room.y + room.height / 2}
                      r={Math.min(room.width, room.height) * 0.75 * Math.min(2, roomEmf / 5)}
                      fill="url(#emfGlow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Thermal Cold Spot Overlay if enabled */}
                  {showThermalOverlay && roomTemp < 5.0 && (
                    <circle
                      cx={room.x + room.width / 2}
                      cy={room.y + room.height / 2}
                      r={Math.min(room.width, room.height) * 0.7}
                      fill="url(#coldGlow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Doorway Indicators */}
                  <line
                    x1={room.x + room.width / 2 - 2}
                    y1={room.y + room.height}
                    x2={room.x + room.width / 2 + 2}
                    y2={room.y + room.height}
                    stroke="#0284c7"
                    strokeWidth="0.8"
                  />

                  {/* Room Name & Telemetry Mini-Tag */}
                  <text
                    x={room.x + 2}
                    y={room.y + 4.5}
                    fill={isSelected ? '#fbbf24' : nightVisionMode ? '#6ee7b7' : '#94a3b8'}
                    fontSize="2.1"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {room.name}
                  </text>

                  {/* Room Sensor Metrics Tag */}
                  <text
                    x={room.x + 2}
                    y={room.y + 8}
                    fill={
                      roomEmf >= 10
                        ? '#ef4444'
                        : roomTemp <= 0
                        ? '#38bdf8'
                        : '#64748b'
                    }
                    fontSize="1.7"
                    fontFamily="monospace"
                  >
                    {roomTemp.toFixed(1)}°C | {roomEmf.toFixed(1)} mG
                  </text>

                  {/* Feature marks (bed, table, stairs) */}
                  {room.features && room.features[0] && (
                    <text
                      x={room.x + 2}
                      y={room.y + room.height - 2}
                      fill="#475569"
                      fontSize="1.4"
                      fontFamily="monospace"
                    >
                      [{room.features[0]}]
                    </text>
                  )}
                </g>
              );
            })}

            {/* Placed Sensors on Floor */}
            {sensorsOnFloor.map((s) => (
              <g
                key={s.id}
                transform={`translate(${s.x}, ${s.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  ghostAudio.playUiClick();
                }}
              >
                {/* Ping wave */}
                <circle
                  r="2.5"
                  fill="none"
                  stroke={
                    s.type === 'emf'
                      ? '#10b981'
                      : s.type === 'temperature'
                      ? '#38bdf8'
                      : s.type === 'motion'
                      ? '#f59e0b'
                      : '#a855f7'
                  }
                  strokeWidth="0.3"
                  className="animate-ping opacity-75"
                />
                <circle
                  r="1.4"
                  fill={
                    s.type === 'emf'
                      ? '#10b981'
                      : s.type === 'temperature'
                      ? '#38bdf8'
                      : s.type === 'motion'
                      ? '#f59e0b'
                      : '#a855f7'
                  }
                  stroke="#000"
                  strokeWidth="0.3"
                />
                <text
                  x="2.5"
                  y="0.8"
                  fill="#e2e8f0"
                  fontSize="1.6"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {s.label}
                </text>
              </g>
            ))}

            {/* Active Entity Aura / Manifestation (if close or hunting) */}
            {isEntityOnFloor && (
              <g
                transform={`translate(${activeEntity.x}, ${activeEntity.y})`}
                className="pointer-events-none"
              >
                <circle
                  r={activeEntity.isHunting ? '5' : '3.5'}
                  fill={activeEntity.isHunting ? 'rgba(239,68,68,0.3)' : 'rgba(168,85,247,0.2)'}
                  stroke={activeEntity.isHunting ? '#ef4444' : '#c084fc'}
                  strokeWidth="0.4"
                  strokeDasharray="0.8 0.4"
                  className="animate-spin"
                />
                {/* Spectral Orb particle */}
                <circle
                  r="1.2"
                  fill={activeEntity.isHunting ? '#f87171' : '#e9d5ff'}
                  className="animate-pulse"
                />
                <text
                  x="2"
                  y="-2"
                  fill={activeEntity.isHunting ? '#ef4444' : '#d8b4fe'}
                  fontSize="1.8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {activeEntity.isHunting ? '⚠️ HUNT ACTIVE' : '👻 ENTITY DETECTED'}
                </text>
              </g>
            )}

            {/* Investigator Token (You) */}
            {investigator.floor === currentFloor && (
              <g
                transform={`translate(${investigator.x}, ${investigator.y})`}
                className="cursor-grab"
              >
                {/* Directional Field of View Flashlight Cone */}
                <polygon
                  points="0,0 -8,-14 8,-14"
                  fill="rgba(254, 240, 138, 0.12)"
                  stroke="rgba(254, 240, 138, 0.3)"
                  strokeWidth="0.2"
                />
                {/* Investigator Beacon Pulse */}
                <circle
                  r="3.2"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.3"
                  className="animate-ping opacity-60"
                />
                <circle r="1.8" fill="#2563eb" stroke="#ffffff" strokeWidth="0.4" />
                <circle r="0.7" fill="#ffffff" />
                <text
                  x="2.4"
                  y="1.2"
                  fill="#93c5fd"
                  fontSize="1.9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {investigator.name}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Bottom Tactical Floating Tool Palette */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-2 rounded-lg text-xs shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono mr-1 hidden sm:inline">TOOL:</span>
            <button
              onClick={() => {
                onSelectTool('navigate');
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono flex items-center gap-1 transition-all ${
                activeTool === 'navigate'
                  ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Navigate / Move
            </button>

            <button
              onClick={() => {
                onSelectTool('deploy_emf');
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono flex items-center gap-1 transition-all ${
                activeTool === 'deploy_emf'
                  ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Deploy EMF Sensor Pod"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              + EMF Pod
            </button>

            <button
              onClick={() => {
                onSelectTool('deploy_temp');
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono flex items-center gap-1 transition-all ${
                activeTool === 'deploy_temp'
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Deploy Thermal Sensor"
            >
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-300" />
              + Temp Pod
            </button>

            <button
              onClick={() => {
                onSelectTool('deploy_motion');
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono flex items-center gap-1 transition-all ${
                activeTool === 'deploy_motion'
                  ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Deploy REM Motion Sensor"
            >
              <Radio className="w-3.5 h-3.5 text-amber-300" />
              + REM Pod
            </button>

            <button
              onClick={() => {
                onSelectTool('mark_incident');
                ghostAudio.playUiClick();
              }}
              className={`px-2.5 py-1 rounded font-mono flex items-center gap-1 transition-all ${
                activeTool === 'mark_incident'
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Flag Anomaly Location"
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-300" />
              Mark Event
            </button>
          </div>

          {/* Quick Placed Sensor Counts & Clear */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">
              Active Pods: <strong className="text-amber-400">{sensors.length}</strong>
            </span>
            {sensors.length > 0 && (
              <button
                onClick={() => {
                  sensors.forEach((s) => onRemoveSensor(s.id));
                  ghostAudio.playUiClick();
                }}
                className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 text-[10px] font-mono flex items-center gap-1"
                title="Recall all deployed sensor pods"
              >
                <Trash2 className="w-3 h-3" />
                Recall All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Room Status Footer */}
      {selectedRoom && (
        <div className="px-4 py-2 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200">{selectedRoom.name}</span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                (Floor {selectedRoom.floor} • Base {selectedRoom.baseTemp}°C • {selectedRoom.baseEmf} mG)
              </span>
            </div>
          </div>
          <div className="text-slate-400 text-[11px] truncate max-w-md italic">
            "{selectedRoom.description}"
          </div>
          <button
            onClick={() => {
              onMoveInvestigator(
                selectedRoom.x + selectedRoom.width / 2,
                selectedRoom.y + selectedRoom.height / 2,
                selectedRoom.id
              );
              ghostAudio.playUiClick();
            }}
            className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-mono text-[11px]"
          >
            Move Here
          </button>
        </div>
      )}
    </div>
  );
};
