import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Map,
  Activity,
  FileText,
  BookOpen,
  Radio,
  Zap,
  ThermometerSnowflake,
  AlertOctagon,
  Shield,
  Sparkles,
  Info
} from 'lucide-react';
import {
  LocationSite,
  RoomDefinition,
  PlacedSensor,
  InvestigatorPosition,
  ActiveEntityState,
  LiveTelemetry,
  SensorLogEntry,
  SensorType,
  AnomalySeverity,
  ThreatState
} from './types';
import { INVESTIGATION_SITES } from './data/locations';
import { GHOST_ENTITIES, SPIRIT_BOX_PHRASES } from './data/entities';
import { TacticalMap } from './components/TacticalMap';
import { SensorSuite } from './components/SensorSuite';
import { ThreatMeter } from './components/ThreatMeter';
import { MobileApkModal } from './components/MobileApkModal';
import { SensorLogs } from './components/SensorLogs';
import { EvidenceDossier } from './components/EvidenceDossier';
import { InvestigationControls } from './components/InvestigationControls';
import { calculateThreatState } from './utils/threatCalculator';
import { useDeviceSensors } from './utils/useDeviceSensors';
import { ghostAudio } from './utils/audio';

export default function App() {
  // Selected site & floor
  const [selectedSite, setSelectedSite] = useState<LocationSite>(INVESTIGATION_SITES[0]);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<RoomDefinition | null>(null);

  // Investigator state
  const [investigator, setInvestigator] = useState<InvestigatorPosition>({
    floor: 1,
    x: 50,
    y: 75,
    currentRoomId: 'f1_foyer',
    name: 'Agent Vance'
  });

  // Placed sensor equipment
  const [sensors, setSensors] = useState<PlacedSensor[]>([
    {
      id: 'sensor_init_1',
      type: 'emf',
      floor: 1,
      roomId: 'f1_living',
      x: 22,
      y: 70,
      label: 'EMF Pod 1',
      battery: 95,
      active: true,
      placedAt: Date.now() - 300000
    },
    {
      id: 'sensor_init_2',
      type: 'temperature',
      floor: 1,
      roomId: 'f1_library',
      x: 25,
      y: 30,
      label: 'Temp Pod 1',
      battery: 92,
      active: true,
      placedAt: Date.now() - 240000
    },
    {
      id: 'sensor_init_3',
      type: 'motion',
      floor: 1,
      roomId: 'f1_foyer',
      x: 50,
      y: 70,
      label: 'REM Pod 1',
      battery: 89,
      active: true,
      placedAt: Date.now() - 180000
    }
  ]);

  // Active paranormal entity
  const [activeEntity, setActiveEntity] = useState<ActiveEntityState>(() => {
    const randomEntity = GHOST_ENTITIES[Math.floor(Math.random() * GHOST_ENTITIES.length)];
    return {
      currentRoomId: 'f1_library',
      floor: 1,
      x: 24,
      y: 28,
      activityLevel: 45,
      isHunting: false,
      ghostType: randomEntity,
      lastManifestation: Date.now()
    };
  });

  // Map Tools & Overlays
  const [activeTool, setActiveTool] = useState<
    'navigate' | 'deploy_emf' | 'deploy_temp' | 'deploy_motion' | 'deploy_camera' | 'mark_incident'
  >('navigate');
  const [nightVisionMode, setNightVisionMode] = useState<boolean>(false);
  const [showEmfOverlay, setShowEmfOverlay] = useState<boolean>(true);
  const [showThermalOverlay, setShowThermalOverlay] = useState<boolean>(true);

  // Simulation Controls
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState<number>(312);
  const [investigatorSanity, setInvestigatorSanity] = useState<number>(82);
  const [smudgeActive, setSmudgeActive] = useState<boolean>(false);
  const [smudgeTimer, setSmudgeTimer] = useState<number>(0);

  // Sensor Settings
  const [isSpiritBoxActive, setIsSpiritBoxActive] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Evidence Dossier
  const [confirmedEvidence, setConfirmedEvidence] = useState<string[]>(['emf_5']);
  const [identifiedGhost, setIdentifiedGhost] = useState<string | null>(null);

  // Navigation Tabs for mobile/desktop flexibility
  const [activeTab, setActiveTab] = useState<'tactical' | 'logs' | 'dossier'>('tactical');

  // Mobile APK / PWA Modal
  const [isMobileApkOpen, setIsMobileApkOpen] = useState<boolean>(false);

  // Physical Phone Hardware Sensors (Accelerometer / Motion)
  const deviceSensors = useDeviceSensors();

  // Telemetry Ref to avoid stale closures in interval
  const telemetryRef = useRef<LiveTelemetry>({
    emf: 1.2,
    temperature: 17.5,
    tempTrend: 'stable',
    audioDb: -48,
    audioFrequencyHz: 320,
    motionDetected: false,
    spiritBoxPhrase: null,
    remPodDistance: null,
    paranormalActivityScore: 28
  });

  // Real-time Threat Meter State
  const [threatState, setThreatState] = useState<ThreatState>(() =>
    calculateThreatState({
      telemetry: {
        emf: 1.2,
        temperature: 17.5,
        tempTrend: 'stable',
        audioDb: -48,
        audioFrequencyHz: 320,
        motionDetected: false,
        spiritBoxPhrase: null,
        remPodDistance: null,
        paranormalActivityScore: 28
      },
      investigator: {
        floor: 1,
        x: 50,
        y: 75,
        currentRoomId: 'f1_foyer',
        name: 'Agent Vance'
      },
      activeEntity: {
        currentRoomId: 'f1_library',
        floor: 1,
        x: 24,
        y: 28,
        activityLevel: 45,
        isHunting: false,
        ghostType: GHOST_ENTITIES[0],
        lastManifestation: Date.now()
      },
      investigatorSanity: 82,
      smudgeActive: false
    })
  );

  // Live Telemetry
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    emf: 1.2,
    temperature: 17.5,
    tempTrend: 'stable',
    audioDb: -48,
    audioFrequencyHz: 320,
    motionDetected: false,
    spiritBoxPhrase: null,
    remPodDistance: null,
    paranormalActivityScore: 28
  });

  // Telemetry Logs Stream
  const [logs, setLogs] = useState<SensorLogEntry[]>([
    {
      id: 'log_01',
      timestamp: Date.now() - 300000,
      location: 'Grand Foyer',
      floor: 1,
      sensorType: 'emf',
      value: '0.8',
      unit: 'mG',
      severity: 'baseline',
      message: 'Initial baseline calibration reading logged.',
      isFlagged: false
    },
    {
      id: 'log_02',
      timestamp: Date.now() - 240000,
      location: 'Drawing Room',
      floor: 1,
      sensorType: 'audio_evp',
      value: '-32',
      unit: 'dB',
      severity: 'low',
      message: 'Low frequency resonance captured near antique piano.',
      isFlagged: false
    },
    {
      id: 'log_03',
      timestamp: Date.now() - 150000,
      location: "Lord Blackwood's Library",
      floor: 1,
      sensorType: 'emf',
      value: '22.8',
      unit: 'mG',
      severity: 'critical',
      message: 'EMF surge past 20 mG! Level 5 paranormal surge confirmed.',
      isFlagged: true
    },
    {
      id: 'log_04',
      timestamp: Date.now() - 90000,
      location: "Lord Blackwood's Library",
      floor: 1,
      sensorType: 'temperature',
      value: '-1.4',
      unit: '°C',
      severity: 'high',
      message: 'Sudden temperature drop to sub-zero. Freezing breath recorded.',
      isFlagged: true
    }
  ]);

  // Audio mute sync
  useEffect(() => {
    ghostAudio.setMuted(audioMuted);
  }, [audioMuted]);

  // Smudge stick countdown
  useEffect(() => {
    if (!smudgeActive) return;
    const timer = setInterval(() => {
      setSmudgeTimer((t) => {
        if (t <= 1) {
          setSmudgeActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [smudgeActive]);

  const handleUseSmudgeStick = () => {
    setSmudgeActive(true);
    setSmudgeTimer(30);
    setActiveEntity((prev) => ({
      ...prev,
      isHunting: false,
      activityLevel: Math.max(10, prev.activityLevel - 30)
    }));

    addLog({
      location: selectedRoom?.name || 'Grand Foyer',
      floor: currentFloor,
      sensorType: 'uv_optical',
      value: 'PURIFIED',
      unit: 'Ward',
      severity: 'moderate',
      message: 'Sacred Sage smudge lit. Entity activity pacified and repelled.',
      isFlagged: true
    });
  };

  // Add Log helper
  const addLog = useCallback((entry: Omit<SensorLogEntry, 'id' | 'timestamp'>) => {
    const newLog: SensorLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now()
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]); // keep latest 100
  }, []);

  // Move Investigator handler
  const handleMoveInvestigator = (x: number, y: number, roomId: string | null) => {
    setInvestigator((prev) => ({
      ...prev,
      x,
      y,
      floor: currentFloor,
      currentRoomId: roomId
    }));
  };

  // Add Sensor handler
  const handleAddSensor = (newSensor: PlacedSensor) => {
    setSensors((prev) => [...prev, newSensor]);
    const roomName =
      selectedSite.rooms.find((r) => r.id === newSensor.roomId)?.name || 'Corridor';
    addLog({
      location: roomName,
      floor: newSensor.floor,
      sensorType: newSensor.type,
      value: 'ACTIVE',
      unit: 'POD',
      severity: 'low',
      message: `Equipment deployed: ${newSensor.label} synchronized to telemetry bus.`
    });
  };

  // Remove Sensor handler
  const handleRemoveSensor = (id: string) => {
    setSensors((prev) => prev.filter((s) => s.id !== id));
  };

  // Toggle Evidence
  const handleToggleEvidence = (id: string) => {
    setConfirmedEvidence((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Toggle Flag on Log
  const handleToggleFlag = (id: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFlagged: !l.isFlagged } : l))
    );
  };

  // Reset Session
  const handleResetSession = () => {
    setSessionTimeSeconds(0);
    setInvestigatorSanity(100);
    setConfirmedEvidence([]);
    setIdentifiedGhost(null);
    setLogs([]);
    const randomEntity = GHOST_ENTITIES[Math.floor(Math.random() * GHOST_ENTITIES.length)];
    setActiveEntity({
      currentRoomId: selectedSite.rooms[0].id,
      floor: selectedSite.rooms[0].floor,
      x: 30,
      y: 30,
      activityLevel: 25,
      isHunting: false,
      ghostType: randomEntity,
      lastManifestation: Date.now()
    });
  };

  // Provoke / Manifest Entity Event
  const triggerManifestation = () => {
    const isLevel5Candidate = activeEntity.ghostType.evidence.includes('emf_5');
    const isFreezingCandidate = activeEntity.ghostType.evidence.includes('freezing_temps');

    const spikeEmf = isLevel5Candidate ? 21.4 + Math.random() * 3.5 : 8.5 + Math.random() * 4.0;
    const spikeTemp = isFreezingCandidate ? -3.2 + Math.random() * 2.0 : 4.5 + Math.random() * 3.0;

    setActiveEntity((prev) => ({
      ...prev,
      activityLevel: 92,
      isHunting: !smudgeActive && Math.random() > 0.4,
      lastManifestation: Date.now()
    }));

    // Generate Spirit Box response if active
    let spokenPhrase: string | null = null;
    if (isSpiritBoxActive || activeEntity.ghostType.evidence.includes('spirit_box')) {
      spokenPhrase =
        SPIRIT_BOX_PHRASES[Math.floor(Math.random() * SPIRIT_BOX_PHRASES.length)];
      ghostAudio.playGhostSpeechChime();
    }

    const spikeTelemetry: LiveTelemetry = {
      emf: spikeEmf,
      temperature: spikeTemp,
      tempTrend: 'falling',
      audioDb: -12,
      audioFrequencyHz: 840,
      motionDetected: true,
      spiritBoxPhrase: spokenPhrase,
      remPodDistance: 0.6,
      paranormalActivityScore: 94
    };

    setTelemetry(spikeTelemetry);

    setThreatState((prev) =>
      calculateThreatState({
        telemetry: spikeTelemetry,
        investigator,
        activeEntity: {
          ...activeEntity,
          activityLevel: 92,
          isHunting: !smudgeActive
        },
        investigatorSanity,
        smudgeActive,
        deviceMotionDelta: deviceSensors.isEnabled ? deviceSensors.motionScore : 0,
        previousScore: prev.score,
        history: prev.history
      })
    );

    // Add high severity logs
    const roomName =
      selectedSite.rooms.find((r) => r.id === activeEntity.currentRoomId)?.name ||
      'Current Chamber';

    addLog({
      location: roomName,
      floor: activeEntity.floor,
      sensorType: 'emf',
      value: spikeEmf.toFixed(1),
      unit: 'mG',
      severity: spikeEmf >= 20 ? 'critical' : 'high',
      message: `Violent magnetic disturbance detected in ${roomName}!`,
      isFlagged: true
    });

    if (spikeTemp <= 0) {
      addLog({
        location: roomName,
        floor: activeEntity.floor,
        sensorType: 'temperature',
        value: spikeTemp.toFixed(1),
        unit: '°C',
        severity: 'high',
        message: 'Cryogenic cold spot manifestation! Temperature dropped below 0°C.',
        isFlagged: true
      });
    }

    if (spokenPhrase) {
      addLog({
        location: roomName,
        floor: activeEntity.floor,
        sensorType: 'spirit_box',
        value: spokenPhrase,
        unit: 'EVP',
        severity: 'critical',
        message: `Entity vocalization received through radio scan: "${spokenPhrase}"`,
        isFlagged: true
      });
    }

    // Sanity drop
    setInvestigatorSanity((s) => Math.max(0, s - 12));
  };

  // Simulation Game Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalTime = 1000 / simulationSpeed;
    const timer = setInterval(() => {
      setSessionTimeSeconds((s) => s + 1);

      // Sanity passive drain (faster in dark or during activity)
      if (Math.random() > 0.7) {
        setInvestigatorSanity((s) => Math.max(5, s - (activeEntity.isHunting ? 2 : 0.3)));
      }

      // Entity ghost roaming behavior
      if (Math.random() < 0.15 * simulationSpeed) {
        const roomsOnFloor = selectedSite.rooms.filter((r) => r.floor === activeEntity.floor);
        if (roomsOnFloor.length > 0) {
          const nextRoom = roomsOnFloor[Math.floor(Math.random() * roomsOnFloor.length)];
          setActiveEntity((prev) => ({
            ...prev,
            currentRoomId: nextRoom.id,
            x: nextRoom.x + nextRoom.width * (0.2 + Math.random() * 0.6),
            y: nextRoom.y + nextRoom.height * (0.2 + Math.random() * 0.6),
            activityLevel: Math.max(
              15,
              Math.min(95, prev.activityLevel + (Math.random() * 20 - 10))
            )
          }));
        }
      }

      // Proximity calculation: Investigator to Entity
      const isSameFloor = investigator.floor === activeEntity.floor;
      const dist = isSameFloor
        ? Math.hypot(investigator.x - activeEntity.x, investigator.y - activeEntity.y)
        : 100;

      const currentRoom = selectedSite.rooms.find((r) => r.id === investigator.currentRoomId);
      const baseRoomTemp = currentRoom ? currentRoom.baseTemp : 18.0;
      const baseRoomEmf = currentRoom ? currentRoom.baseEmf : 0.8;

      // Calculate localized readings based on proximity
      const proximityFactor = Math.max(0, (50 - dist) / 50); // 1.0 when on top of ghost, 0 when far
      const hasEmf5Evidence = activeEntity.ghostType.evidence.includes('emf_5');
      const hasFreezingEvidence = activeEntity.ghostType.evidence.includes('freezing_temps');

      let targetEmf = baseRoomEmf + proximityFactor * (hasEmf5Evidence ? 22.0 : 7.0);
      targetEmf += (Math.random() - 0.5) * 0.8;
      targetEmf = Math.max(0.2, targetEmf);

      let targetTemp =
        baseRoomTemp - proximityFactor * (hasFreezingEvidence ? 22.0 : 6.0);
      targetTemp += (Math.random() - 0.5) * 0.4;

      // Audio cues
      if (targetEmf > 2.0 && Math.random() > 0.4) {
        ghostAudio.playEmfClick(targetEmf);
      }

      // REM Pod Proximity
      const remDistance = dist < 25 ? (dist / 25) * 3.0 : null;
      if (remDistance && remDistance < 1.5 && Math.random() > 0.5) {
        ghostAudio.playRemPodTone(remDistance);
      }

      // Spirit box occasional phrase
      let spiritBoxText: string | null = null;
      if (isSpiritBoxActive && proximityFactor > 0.4 && Math.random() < 0.12) {
        spiritBoxText =
          SPIRIT_BOX_PHRASES[Math.floor(Math.random() * SPIRIT_BOX_PHRASES.length)];
        ghostAudio.playGhostSpeechChime();

        addLog({
          location: currentRoom?.name || 'Active Zone',
          floor: investigator.floor,
          sensorType: 'spirit_box',
          value: spiritBoxText,
          unit: 'EVP',
          severity: 'high',
          message: `Spectral radio frequency response captured: "${spiritBoxText}"`,
          isFlagged: true
        });
      }

      // Periodic anomalous log generator
      if (proximityFactor > 0.6 && Math.random() < 0.1) {
        if (targetEmf >= 20.0) {
          addLog({
            location: currentRoom?.name || 'Local Area',
            floor: investigator.floor,
            sensorType: 'emf',
            value: targetEmf.toFixed(1),
            unit: 'mG',
            severity: 'critical',
            message: 'Anomalous electromagnetic spike past 20.0 mG (EMF Level 5)!',
            isFlagged: true
          });
        } else if (targetTemp <= 0) {
          addLog({
            location: currentRoom?.name || 'Local Area',
            floor: investigator.floor,
            sensorType: 'temperature',
            value: targetTemp.toFixed(1),
            unit: '°C',
            severity: 'high',
            message: 'Freezing temperature anomaly detected in current chamber.',
            isFlagged: true
          });
        }
      }

      // Update state telemetry
      const prevTelemetry = telemetryRef.current;
      const nextTelemetry: LiveTelemetry = {
        emf: targetEmf,
        temperature: targetTemp,
        tempTrend: targetTemp < prevTelemetry.temperature ? 'falling' : 'stable',
        audioDb: -60 + proximityFactor * 45 + (Math.random() - 0.5) * 8,
        audioFrequencyHz: 200 + proximityFactor * 600 + Math.random() * 50,
        motionDetected: proximityFactor > 0.7,
        spiritBoxPhrase: spiritBoxText || (Math.random() > 0.8 ? null : prevTelemetry.spiritBoxPhrase),
        remPodDistance: remDistance,
        paranormalActivityScore: Math.min(
          100,
          Math.round(proximityFactor * 80 + (activeEntity.isHunting ? 20 : 0) + Math.random() * 10)
        )
      };

      telemetryRef.current = nextTelemetry;
      setTelemetry(nextTelemetry);

      // Recalculate Paranormal Threat Meter
      setThreatState((prevThreat) =>
        calculateThreatState({
          telemetry: nextTelemetry,
          investigator,
          activeEntity,
          investigatorSanity,
          smudgeActive,
          deviceMotionDelta: deviceSensors.isEnabled ? deviceSensors.motionScore : 0,
          previousScore: prevThreat.score,
          history: prevThreat.history
        })
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [
    isRunning,
    simulationSpeed,
    investigator,
    activeEntity,
    selectedSite,
    isSpiritBoxActive,
    smudgeActive,
    addLog
  ]);

  // Current room name
  const currentRoomName =
    selectedSite.rooms.find((r) => r.id === investigator.currentRoomId)?.name ||
    'Perimeter Corridor';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header & Investigation Mission Bar */}
      <InvestigationControls
        selectedSite={selectedSite}
        onSelectSite={(site) => {
          setSelectedSite(site);
          setCurrentFloor(site.floors[0].level);
          setSelectedRoom(null);
          setInvestigator((prev) => ({
            ...prev,
            floor: site.floors[0].level,
            currentRoomId: site.rooms[0]?.id || null,
            x: 50,
            y: 50
          }));
          setActiveEntity((prev) => ({
            ...prev,
            currentRoomId: site.rooms[0]?.id || '',
            floor: site.floors[0].level,
            x: 40,
            y: 40
          }));
        }}
        sessionTimeSeconds={sessionTimeSeconds}
        investigatorSanity={Math.round(investigatorSanity)}
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning(!isRunning)}
        simulationSpeed={simulationSpeed}
        onCycleSpeed={() => {
          const speeds = [1, 2, 5];
          const nextIdx = (speeds.indexOf(simulationSpeed) + 1) % speeds.length;
          setSimulationSpeed(speeds[nextIdx]);
        }}
        audioMuted={audioMuted}
        onToggleAudioMuted={() => setAudioMuted(!audioMuted)}
        onUseSmudgeStick={handleUseSmudgeStick}
        smudgeActive={smudgeActive}
        onResetSession={handleResetSession}
        threatScore={threatState.score}
        threatLevel={threatState.level}
        onOpenMobileApk={() => setIsMobileApkOpen(true)}
      />

      {/* Main Investigation Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 space-y-4">
        {/* Real-time Threat Meter (Dynamic Visual Indicator fluctuating with paranormal spikes) */}
        <ThreatMeter
          threat={threatState}
          audioMuted={audioMuted}
          onToggleAudioMuted={() => setAudioMuted(!audioMuted)}
          onUseSmudgeStick={handleUseSmudgeStick}
          smudgeActive={smudgeActive}
          deviceSensorsEnabled={deviceSensors.isEnabled}
          onToggleDeviceSensors={() => deviceSensors.toggleEnabled()}
        />

        {/* Real-time Handheld & Pod Sensor Readouts */}
        <SensorSuite
          telemetry={telemetry}
          currentRoomName={currentRoomName}
          isSpiritBoxActive={isSpiritBoxActive}
          onToggleSpiritBox={() => setIsSpiritBoxActive(!isSpiritBoxActive)}
          tempUnit={tempUnit}
          onToggleTempUnit={() => setTempUnit((u) => (u === 'C' ? 'F' : 'C'))}
          audioMuted={audioMuted}
          onToggleAudioMuted={() => setAudioMuted(!audioMuted)}
          onTriggerManifestation={triggerManifestation}
          isHunting={activeEntity.isHunting}
        />

        {/* Tactical Navigation Tabs (Tactical Map, Sensor Logs, Evidence Dossier) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => {
                setActiveTab('tactical');
                ghostAudio.playUiClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                activeTab === 'tactical'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Interactive Tactical Map
            </button>

            <button
              onClick={() => {
                setActiveTab('logs');
                ghostAudio.playUiClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Sensor Logs ({logs.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('dossier');
                ghostAudio.playUiClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-all ${
                activeTab === 'dossier'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Evidence Dossier ({confirmedEvidence.length}/3)
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Sensors Online
            </span>
            <span>•</span>
            <span>Target: {selectedSite.name}</span>
          </div>
        </div>

        {/* Tab View Content */}
        {activeTab === 'tactical' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Interactive Map (takes 8 cols on large screens) */}
            <div className="lg:col-span-8">
              <TacticalMap
                site={selectedSite}
                currentFloor={currentFloor}
                onFloorChange={setCurrentFloor}
                investigator={investigator}
                onMoveInvestigator={handleMoveInvestigator}
                sensors={sensors}
                onAddSensor={handleAddSensor}
                onRemoveSensor={handleRemoveSensor}
                activeEntity={activeEntity}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                nightVisionMode={nightVisionMode}
                showEmfOverlay={showEmfOverlay}
                showThermalOverlay={showThermalOverlay}
                onToggleEmfOverlay={() => setShowEmfOverlay(!showEmfOverlay)}
                onToggleThermalOverlay={() => setShowThermalOverlay(!showThermalOverlay)}
                onToggleNightVision={() => setNightVisionMode(!nightVisionMode)}
                liveEmf={telemetry.emf}
                liveTemp={telemetry.temperature}
              />
            </div>

            {/* Quick Live Logs & Room Intel Sidebar (takes 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Site Dossier Brief Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg font-mono text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    INVESTIGATION BRIEF
                  </h3>
                  <span className="text-[10px] text-slate-400">{selectedSite.type}</span>
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed mb-3">
                  {selectedSite.history}
                </p>

                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Zone:</span>
                    <span className="text-amber-300 font-semibold">{currentRoomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deployed Sensors:</span>
                    <span className="text-slate-200">{sensors.length} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Haunt Intensity:</span>
                    <span
                      className={
                        activeEntity.activityLevel > 60
                          ? 'text-red-400 font-bold animate-pulse'
                          : 'text-emerald-400'
                      }
                    >
                      {activeEntity.activityLevel}% ({activeEntity.isHunting ? 'HUNT' : 'IDLE'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Streamlined Live Logs feed inside tactical tab */}
              <div className="flex-1 min-h-[260px]">
                <SensorLogs
                  logs={logs}
                  onAddManualLog={addLog}
                  onClearLogs={() => setLogs([])}
                  onToggleFlag={handleToggleFlag}
                  roomsList={selectedSite.rooms.map((r) => ({ id: r.id, name: r.name }))}
                  currentRoomId={investigator.currentRoomId}
                  siteName={selectedSite.name}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-[600px]">
            <SensorLogs
              logs={logs}
              onAddManualLog={addLog}
              onClearLogs={() => setLogs([])}
              onToggleFlag={handleToggleFlag}
              roomsList={selectedSite.rooms.map((r) => ({ id: r.id, name: r.name }))}
              currentRoomId={investigator.currentRoomId}
              siteName={selectedSite.name}
            />
          </div>
        )}

        {activeTab === 'dossier' && (
          <div className="min-h-[500px]">
            <EvidenceDossier
              confirmedEvidence={confirmedEvidence}
              onToggleEvidence={handleToggleEvidence}
              identifiedGhost={identifiedGhost}
              onSelectIdentifiedGhost={setIdentifiedGhost}
              telemetryEmf={telemetry.emf}
              telemetryTemp={telemetry.temperature}
            />
          </div>
        )}
      </main>

      {/* Atmospheric Screen-Edge Threat Perimeter Vignette (Alerts hunter of imminent danger) */}
      {threatState.score >= 45 && (
        <div
          className={`fixed inset-0 pointer-events-none z-20 transition-all duration-700 ${
            threatState.level === 'hunt'
              ? 'ring-[16px] ring-inset ring-red-600/40 animate-pulse shadow-[inset_0_0_90px_rgba(220,38,38,0.55)]'
              : threatState.level === 'critical'
              ? 'ring-[10px] ring-inset ring-rose-500/25 shadow-[inset_0_0_55px_rgba(244,63,94,0.35)]'
              : threatState.level === 'high'
              ? 'ring-[8px] ring-inset ring-orange-500/20 shadow-[inset_0_0_35px_rgba(249,115,22,0.25)]'
              : 'ring-[5px] ring-inset ring-amber-500/15 shadow-[inset_0_0_20px_rgba(245,158,11,0.15)]'
          }`}
        />
      )}

      {/* Mobile Phone APK & PWA Installation Modal */}
      <MobileApkModal
        isOpen={isMobileApkOpen}
        onClose={() => setIsMobileApkOpen(false)}
      />
    </div>
  );
}
