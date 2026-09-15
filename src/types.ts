/**
 * Type definitions for Ghost Hunting Activity Tracker
 */

export type AnomalySeverity = 'baseline' | 'low' | 'moderate' | 'high' | 'critical';

export type SensorType = 'emf' | 'temperature' | 'audio_evp' | 'motion' | 'spirit_box' | 'uv_optical';

export interface RoomDefinition {
  id: string;
  name: string;
  floor: number; // 0 = basement/cellar, 1 = ground floor, 2 = 1st floor / attic
  x: number; // percentage coordinates 0-100
  y: number;
  width: number;
  height: number;
  baseTemp: number; // Celsius, e.g. 18.5
  baseEmf: number;  // mG, e.g. 0.8
  description: string;
  features?: string[];
}

export interface PlacedSensor {
  id: string;
  type: SensorType;
  roomId: string;
  floor: number;
  x: number; // map coordinates 0-100
  y: number;
  label: string;
  battery: number;
  active: boolean;
  lastReading?: number;
  lastUnit?: string;
  placedAt: number;
}

export interface InvestigatorPosition {
  floor: number;
  x: number;
  y: number;
  currentRoomId: string | null;
  name: string;
}

export interface SensorLogEntry {
  id: string;
  timestamp: number;
  location: string;
  floor: number;
  sensorType: SensorType;
  value: number | string;
  unit: string;
  severity: AnomalySeverity;
  message: string;
  isFlagged?: boolean;
}

export interface GhostEvidence {
  id: string;
  name: string;
  description: string;
  sensorType: SensorType;
}

export interface GhostEntity {
  id: string;
  name: string;
  category: string;
  description: string;
  evidence: string[]; // array of evidence IDs required
  behaviorNotes: string;
  dangerLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
}

export interface LocationSite {
  id: string;
  name: string;
  type: string;
  history: string;
  floors: {
    level: number;
    name: string;
  }[];
  rooms: RoomDefinition[];
}

export interface ActiveEntityState {
  currentRoomId: string;
  floor: number;
  x: number;
  y: number;
  activityLevel: number; // 0-100
  isHunting: boolean;
  ghostType: GhostEntity;
  lastManifestation: number;
}

export interface LiveTelemetry {
  emf: number; // 0 - 25 mG
  temperature: number; // Celsius -10 to +25
  tempTrend: 'falling' | 'stable' | 'rising';
  audioDb: number; // -80 to 0 dB
  audioFrequencyHz: number;
  motionDetected: boolean;
  spiritBoxPhrase: string | null;
  remPodDistance: number | null; // meters, 0.1 to 3.0 or null
  paranormalActivityScore: number; // 0 - 100%
}

export type ThreatLevel = 'calm' | 'elevated' | 'high' | 'critical' | 'hunt';

export interface ThreatFactorItem {
  id: string;
  name: string;
  contribution: number; // 0 - 100%
  value: string;
  severity: AnomalySeverity;
  description: string;
}

export interface ThreatHistoryPoint {
  timestamp: number;
  score: number;
  level: ThreatLevel;
}

export interface ThreatState {
  score: number; // 0 - 100%
  level: ThreatLevel;
  trend: 'rising' | 'falling' | 'stable';
  factors: ThreatFactorItem[];
  emfScore: number;
  tempScore: number;
  audioScore: number;
  proximityScore: number;
  sanityScore: number;
  deviceSensorScore: number;
  heartbeatBpm: number;
  recommendedAction: string;
  activeHunt: boolean;
  history: ThreatHistoryPoint[];
}
