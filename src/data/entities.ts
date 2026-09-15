import { GhostEntity, GhostEvidence } from '../types';

export const GHOST_EVIDENCES: GhostEvidence[] = [
  {
    id: 'emf_5',
    name: 'EMF Level 5 (≥ 20 mG)',
    description: 'Electromagnetic Field radiation surges past 20.0 milliGauss, indicating direct paranormal manifestation energy.',
    sensorType: 'emf'
  },
  {
    id: 'freezing_temps',
    name: 'Freezing Temperatures (< 0°C / 32°F)',
    description: 'Ambient temperature plunges below zero Celsius, causing visible condensation breath and frost formation.',
    sensorType: 'temperature'
  },
  {
    id: 'spirit_box',
    name: 'Spirit Box Audio Response (EVP)',
    description: 'Direct radio frequency modulation captures distinct synthetic phonetic replies (e.g. "BEHIND", "DEATH", "COLD").',
    sensorType: 'spirit_box'
  },
  {
    id: 'ghost_orbs',
    name: 'Ghost Orbs / Light Anomalies',
    description: 'Luminescent hovering particulate detected on infrared night vision cameras.',
    sensorType: 'uv_optical'
  },
  {
    id: 'fingerprints',
    name: 'UV Fingerprints / Ectoplasm',
    description: 'Bioluminescent occult markings or fingerprints left on doors, windows, and light switches visible under 395nm UV.',
    sensorType: 'uv_optical'
  },
  {
    id: 'motion_rem',
    name: 'REM Pod Proximity Alert',
    description: 'Electromagnetic antenna disturbance indicating a solid disembodied mass crossing sensor perimeter.',
    sensorType: 'motion'
  },
  {
    id: 'spectral_audio',
    name: 'Low Frequency EVP Audio Spikes',
    description: 'Inaudible infrasound (< 20Hz) or ultrasonic screams captured on audio recorder spectrogram.',
    sensorType: 'audio_evp'
  }
];

export const GHOST_ENTITIES: GhostEntity[] = [
  {
    id: 'poltergeist',
    name: 'Poltergeist',
    category: 'Kinetic Manifestation',
    description: 'A boisterous spirit capable of manipulating physical objects, slamming doors, and creating sudden kinetic disturbances.',
    evidence: ['spirit_box', 'fingerprints', 'motion_rem'],
    behaviorNotes: 'Throws multiple objects at once. Calms down when no investigators are in the room.',
    dangerLevel: 'Moderate'
  },
  {
    id: 'wraith',
    name: 'Wraith',
    category: 'Ethereal Apparition',
    description: 'One of the most dangerous entities known. Capable of flight and has been known to travel through solid walls without tripping floor sensors.',
    evidence: ['emf_5', 'spirit_box', 'spectral_audio'],
    behaviorNotes: 'Never touches the ground. Reacts violently to salt lines and leaves zero footstep impressions.',
    dangerLevel: 'High'
  },
  {
    id: 'banshee',
    name: 'Banshee',
    category: 'Screaming Wailer',
    description: 'A sorrowful predator known for targeting a single investigator until they succumb to hysteria.',
    evidence: ['fingerprints', 'ghost_orbs', 'spectral_audio'],
    behaviorNotes: 'Produces piercing ultrasonic shriek on parabolic audio sensors when stalking its designated target.',
    dangerLevel: 'Extreme'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    category: 'Visual Phantasm',
    description: 'A ghost that can possess the living and cause deep sanity drains. Looking directly at a Phantom induces disorientation.',
    evidence: ['spirit_box', 'fingerprints', 'emf_5'],
    behaviorNotes: 'Fades away when photographed. Drops investigator sanity twice as fast when line-of-sight is maintained.',
    dangerLevel: 'High'
  },
  {
    id: 'revenant',
    name: 'Revenant',
    category: 'Relentless Stalker',
    description: 'A slow, sluggish entity while idle that moves with ferocious, terrifying speed once an investigator is spotted.',
    evidence: ['ghost_orbs', 'freezing_temps', 'motion_rem'],
    behaviorNotes: 'Moves at triple speed when chasing line-of-sight targets, but crawls slowly when searching.',
    dangerLevel: 'Extreme'
  },
  {
    id: 'shade',
    name: 'Shade',
    category: 'Timid Entity',
    description: 'A shy ghost that refrains from activity when multiple investigators are present in the same room.',
    evidence: ['emf_5', 'freezing_temps', 'ghost_orbs'],
    behaviorNotes: 'Very elusive. Rarely performs manifestations or hunts if people travel in groups.',
    dangerLevel: 'Low'
  },
  {
    id: 'demon',
    name: 'Demon',
    category: 'Malevolent Infernal',
    description: 'The most aggressive paranormal entity known to paranormal science. Attacks indiscriminately without provocation.',
    evidence: ['freezing_temps', 'fingerprints', 'motion_rem'],
    behaviorNotes: 'Can initiate hunts regardless of investigator sanity. Hates crucifixes and religious wardings.',
    dangerLevel: 'Extreme'
  },
  {
    id: 'yurei',
    name: 'Yūrei',
    category: 'Vengeful Spirit',
    description: 'A Japanese ghost bound to the physical plane by tragic unfinished business or sudden grief.',
    evidence: ['ghost_orbs', 'freezing_temps', 'spectral_audio'],
    behaviorNotes: 'Can rapidly extinguish smudges and candles. Trapped in a specific room when incensed.',
    dangerLevel: 'Moderate'
  },
  {
    id: 'oni',
    name: 'Oni',
    category: 'Demonic Brute',
    description: 'Loves being observed and becomes intensely active when investigators congregate near its domain.',
    evidence: ['emf_5', 'freezing_temps', 'spectral_audio'],
    behaviorNotes: 'Constantly manifests physically and drains sanity rapidly through aggressive physical appearances.',
    dangerLevel: 'High'
  }
];

export const SPIRIT_BOX_PHRASES = [
  'BEHIND YOU',
  'LEAVE NOW',
  'COLD',
  'HELP ME',
  'DEATH',
  'KILL',
  'WATCHING',
  'HERE',
  'ALONE',
  'DARK',
  'BURN',
  '1912',
  'HIDE',
  'TRAPPED',
  'FAR',
  'CLOSE'
];
