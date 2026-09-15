import {
  LiveTelemetry,
  InvestigatorPosition,
  ActiveEntityState,
  ThreatState,
  ThreatLevel,
  ThreatFactorItem,
  ThreatHistoryPoint,
  AnomalySeverity
} from '../types';

export interface ThreatInput {
  telemetry: LiveTelemetry;
  investigator: InvestigatorPosition;
  activeEntity: ActiveEntityState;
  investigatorSanity: number; // 0 - 100
  smudgeActive: boolean;
  deviceMotionDelta?: number; // 0 - 100 from phone accelerometer
  deviceMicLevel?: number; // 0 - 100 from phone microphone
  previousScore?: number;
  history?: ThreatHistoryPoint[];
}

/**
 * Calculate multi-vector paranormal threat level
 * Reacts dynamically to real-time EMF, temperature drops, acoustic spikes, proximity, and sanity.
 */
export function calculateThreatState({
  telemetry,
  investigator,
  activeEntity,
  investigatorSanity,
  smudgeActive,
  deviceMotionDelta = 0,
  deviceMicLevel = 0,
  previousScore = 15,
  history = []
}: ThreatInput): ThreatState {
  const factors: ThreatFactorItem[] = [];

  // 1. EMF Vector (0 - 100)
  // Baseline is ~0.8 mG; 5 mG is notable, 20 mG+ is Level 5
  let emfScore = 0;
  if (telemetry.emf >= 20.0) {
    emfScore = Math.min(100, 85 + ((telemetry.emf - 20) / 5) * 15);
    factors.push({
      id: 'emf_critical',
      name: 'EMF Level 5 Spike',
      contribution: Math.round(emfScore),
      value: `${telemetry.emf.toFixed(1)} mG`,
      severity: 'critical',
      description: 'Violent electromagnetic field distortion indicative of active manifestation.'
    });
  } else if (telemetry.emf >= 10.0) {
    emfScore = 55 + ((telemetry.emf - 10) / 10) * 30;
    factors.push({
      id: 'emf_high',
      name: 'Strong Magnetic Surge',
      contribution: Math.round(emfScore),
      value: `${telemetry.emf.toFixed(1)} mG`,
      severity: 'high',
      description: 'Elevated magnetic eddy radiating near investigator.'
    });
  } else if (telemetry.emf >= 3.0) {
    emfScore = 20 + ((telemetry.emf - 3) / 7) * 35;
    factors.push({
      id: 'emf_elevated',
      name: 'EMF Anomaly Detected',
      contribution: Math.round(emfScore),
      value: `${telemetry.emf.toFixed(1)} mG`,
      severity: 'moderate',
      description: 'Fluctuation above baseline ambient threshold.'
    });
  } else {
    emfScore = Math.max(0, (telemetry.emf / 3) * 15);
  }

  // 2. Temperature Vector (0 - 100)
  // Ambient ~18°C; <= 3°C cold spot, <= 0°C freezing
  let tempScore = 0;
  if (telemetry.temperature <= 0) {
    tempScore = Math.min(100, 85 + Math.abs(telemetry.temperature) * 5);
    factors.push({
      id: 'temp_freezing',
      name: 'Freezing Temperature',
      contribution: Math.round(tempScore),
      value: `${telemetry.temperature.toFixed(1)}°C`,
      severity: 'critical',
      description: 'Sub-zero thermal vortex. Freezing breath and frost manifest.'
    });
  } else if (telemetry.temperature <= 5.0) {
    tempScore = 55 + ((5 - telemetry.temperature) / 5) * 30;
    factors.push({
      id: 'temp_cold_spot',
      name: 'Rapid Cryogenic Cold Spot',
      contribution: Math.round(tempScore),
      value: `${telemetry.temperature.toFixed(1)}°C`,
      severity: 'high',
      description: 'Atmospheric warmth being siphoned by paranormal presence.'
    });
  } else if (telemetry.temperature <= 12.0) {
    tempScore = 15 + ((12 - telemetry.temperature) / 7) * 40;
    factors.push({
      id: 'temp_cool',
      name: 'Chilling Ambient Draft',
      contribution: Math.round(tempScore),
      value: `${telemetry.temperature.toFixed(1)}°C`,
      severity: 'low',
      description: 'Mild thermal variance registered in chamber.'
    });
  } else {
    tempScore = Math.max(0, (1 - telemetry.temperature / 20) * 10);
  }

  // 3. Proximity Vector (0 - 100)
  const isSameFloor = investigator.floor === activeEntity.floor;
  const spatialDist = isSameFloor
    ? Math.hypot(investigator.x - activeEntity.x, investigator.y - activeEntity.y)
    : 100;

  let proximityScore = 0;
  if (telemetry.remPodDistance !== null && telemetry.remPodDistance < 2.0) {
    proximityScore = Math.min(100, 70 + (2.0 - telemetry.remPodDistance) * 15);
    factors.push({
      id: 'rem_pod_breach',
      name: 'REM Pod Proximity Alert',
      contribution: Math.round(proximityScore),
      value: `${telemetry.remPodDistance.toFixed(1)}m`,
      severity: 'critical',
      description: 'Entity has breached the immediate antenna perimeter.'
    });
  } else if (isSameFloor) {
    if (spatialDist < 15) {
      proximityScore = Math.min(100, 80 + (15 - spatialDist) * 1.3);
      factors.push({
        id: 'entity_stalking',
        name: 'Close Stalking Vector',
        contribution: Math.round(proximityScore),
        value: `${Math.round(spatialDist)}% dist`,
        severity: 'high',
        description: 'Paranormal entity is lurking directly inside the same room/zone.'
      });
    } else if (spatialDist < 35) {
      proximityScore = 40 + ((35 - spatialDist) / 20) * 35;
      factors.push({
        id: 'entity_nearby',
        name: 'Entity Vicinity',
        contribution: Math.round(proximityScore),
        value: `${Math.round(spatialDist)}% dist`,
        severity: 'moderate',
        description: 'Entity roaming in adjacent corridor or doorway.'
      });
    } else {
      proximityScore = Math.max(5, (1 - spatialDist / 100) * 25);
    }
  } else {
    proximityScore = 5;
  }

  // 4. Acoustic & Spirit Box Vector (0 - 100)
  let audioScore = 0;
  if (telemetry.spiritBoxPhrase) {
    audioScore = 85;
    factors.push({
      id: 'spirit_box_vocal',
      name: 'EVP Vocal Manifestation',
      contribution: 85,
      value: `"${telemetry.spiritBoxPhrase}"`,
      severity: 'critical',
      description: 'Disembodied radio response captured on spirit frequencies.'
    });
  } else if (telemetry.audioDb > -25) {
    audioScore = Math.min(80, 50 + (telemetry.audioDb + 25) * 2);
    factors.push({
      id: 'audio_spike',
      name: 'Acoustic Resonance Surge',
      contribution: Math.round(audioScore),
      value: `${telemetry.audioDb.toFixed(0)} dB`,
      severity: 'moderate',
      description: 'Sonic disturbance, footsteps, or poltergeist knocking.'
    });
  } else {
    audioScore = Math.max(0, ((telemetry.audioDb + 80) / 60) * 30);
  }

  // 5. Sanity Stress Vector (0 - 100)
  // Low sanity increases investigator vulnerability and psychological threat
  const sanityScore = Math.max(0, (100 - investigatorSanity) * 0.85);
  if (investigatorSanity < 40) {
    factors.push({
      id: 'sanity_low',
      name: 'Investigator Sanity Depleted',
      contribution: Math.round(sanityScore),
      value: `${Math.round(investigatorSanity)}%`,
      severity: investigatorSanity < 20 ? 'critical' : 'high',
      description: 'Psychological wards collapsed; increased vulnerability to hunt.'
    });
  }

  // 6. Device Physical Sensor Impact (Actual phone movement / ambient mic)
  const deviceSensorScore = Math.min(100, Math.max(0, deviceMotionDelta * 0.6 + deviceMicLevel * 0.4));
  if (deviceSensorScore > 35) {
    factors.push({
      id: 'device_sensor_movement',
      name: 'Physical Phone Sensor Agitation',
      contribution: Math.round(deviceSensorScore),
      value: `Active (${Math.round(deviceSensorScore)}%)`,
      severity: 'moderate',
      description: 'Phone accelerometer detected rapid investigator motion or physical disturbance.'
    });
  }

  // 7. Base Weighted Combination
  let rawScore =
    emfScore * 0.28 +
    tempScore * 0.22 +
    proximityScore * 0.20 +
    audioScore * 0.12 +
    sanityScore * 0.10 +
    deviceSensorScore * 0.08;

  // Active Ghost Activity Level boost
  rawScore += (activeEntity.activityLevel / 100) * 8;

  // Active Hunt Override
  if (activeEntity.isHunting && !smudgeActive) {
    rawScore = Math.max(rawScore, 93 + (Math.random() * 6));
    factors.unshift({
      id: 'active_hunt',
      name: 'ACTIVE PARANORMAL HUNT',
      contribution: 100,
      value: 'IN PROGRESS',
      severity: 'critical',
      description: 'Entity has manifested physical form and is actively pursuing investigators!'
    });
  }

  // Smudge Stick Suppression (Dampens threat significantly)
  if (smudgeActive) {
    rawScore = Math.max(5, rawScore * 0.35);
    factors.unshift({
      id: 'smudge_protection',
      name: 'Sacred Sage Protection Active',
      contribution: 10,
      value: 'WARD ENGAGED',
      severity: 'baseline',
      description: 'Smoke aura repelling entity and suppressing spectral malice.'
    });
  }

  // Organic micro-fluctuation (gives analog meter gauge needle realism)
  const microJitter = (Math.random() - 0.5) * 2.2;
  rawScore = Math.max(2, Math.min(100, rawScore + microJitter));

  // Exponential moving average for smooth needle motion and natural decay
  const smoothingFactor = rawScore > previousScore ? 0.65 : 0.25; // Rises faster than it decays
  const finalScore = Math.round(
    Math.max(2, Math.min(100, previousScore * (1 - smoothingFactor) + rawScore * smoothingFactor))
  );

  // Determine Tier
  let level: ThreatLevel = 'calm';
  if (activeEntity.isHunting && !smudgeActive) {
    level = 'hunt';
  } else if (finalScore >= 90) {
    level = 'hunt';
  } else if (finalScore >= 70) {
    level = 'critical';
  } else if (finalScore >= 45) {
    level = 'high';
  } else if (finalScore >= 20) {
    level = 'elevated';
  } else {
    level = 'calm';
  }

  // Heartbeat calculation
  let heartbeatBpm = 65;
  if (level === 'hunt') heartbeatBpm = 145;
  else if (level === 'critical') heartbeatBpm = 120;
  else if (level === 'high') heartbeatBpm = 98;
  else if (level === 'elevated') heartbeatBpm = 80;
  else heartbeatBpm = 64;

  // Trend detection
  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (finalScore > previousScore + 1.5) trend = 'rising';
  else if (finalScore < previousScore - 1.5) trend = 'falling';

  // Recommended Protocol
  let recommendedAction = 'Calm baseline. Safe to deploy sensors and gather room telemetry.';
  if (level === 'hunt') {
    recommendedAction = 'ACTIVE HUNT! Break line of sight, hide in closet, or light Sage Smudge!';
  } else if (level === 'critical') {
    recommendedAction = 'CRITICAL DISTURBANCE: Entity manifestation imminent. Prepare warding items.';
  } else if (level === 'high') {
    recommendedAction = 'HIGH THREAT: Entity in immediate perimeter. Check sanity and hold defense.';
  } else if (level === 'elevated') {
    recommendedAction = 'ELEVATED ACTIVITY: Monitor EMF meter and thermal pods for evidence drops.';
  }

  // Rolling 60-point history
  const now = Date.now();
  const updatedHistory: ThreatHistoryPoint[] = [
    ...history.slice(-59),
    { timestamp: now, score: finalScore, level }
  ];

  return {
    score: finalScore,
    level,
    trend,
    factors: factors.slice(0, 5), // top 5 most critical factors
    emfScore: Math.round(emfScore),
    tempScore: Math.round(tempScore),
    audioScore: Math.round(audioScore),
    proximityScore: Math.round(proximityScore),
    sanityScore: Math.round(sanityScore),
    deviceSensorScore: Math.round(deviceSensorScore),
    heartbeatBpm,
    recommendedAction,
    activeHunt: activeEntity.isHunting && !smudgeActive,
    history: updatedHistory
  };
}
