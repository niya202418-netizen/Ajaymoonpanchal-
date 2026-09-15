import { LocationSite } from '../types';

export const INVESTIGATION_SITES: LocationSite[] = [
  {
    id: 'blackwood_manor',
    name: 'Blackwood Victorian Manor',
    type: 'Historic Estate (Built 1884)',
    history: 'Former residence of the reclusive industrialist Lord Percival Blackwood. Multiple residents vanished during the winter of 1912.',
    floors: [
      { level: 0, name: 'Cellar & Catacombs' },
      { level: 1, name: 'Ground Floor' },
      { level: 2, name: 'Upper Quarters & Attic' }
    ],
    rooms: [
      // Ground Floor (Floor 1)
      {
        id: 'f1_foyer',
        name: 'Grand Foyer',
        floor: 1,
        x: 38,
        y: 65,
        width: 24,
        height: 30,
        baseTemp: 18.2,
        baseEmf: 0.6,
        description: 'Main entrance with winding mahogany staircase and shattered chandelier.',
        features: ['Front Double Doors', 'Staircase Base', 'Coat Rack']
      },
      {
        id: 'f1_living',
        name: 'Drawing Room',
        floor: 1,
        x: 10,
        y: 50,
        width: 26,
        height: 45,
        baseTemp: 17.8,
        baseEmf: 0.8,
        description: 'Velvet armchairs around a cold hearth; piano keys reported playing by themselves.',
        features: ['Fireplace', 'Grand Piano', 'Bay Windows']
      },
      {
        id: 'f1_dining',
        name: 'Formal Dining Hall',
        floor: 1,
        x: 64,
        y: 50,
        width: 28,
        height: 45,
        baseTemp: 18.0,
        baseEmf: 0.7,
        description: 'Long banquet table covered with tarnished silverware and dust sheets.',
        features: ['Oak Dining Table', 'China Cabinet', 'Candelabra']
      },
      {
        id: 'f1_library',
        name: 'Lord Blackwood’s Library',
        floor: 1,
        x: 10,
        y: 10,
        width: 32,
        height: 38,
        baseTemp: 16.5,
        baseEmf: 1.1,
        description: 'Floor-to-ceiling occult tomes; books frequently fly off the third-tier shelves.',
        features: ['Bookcases', 'Reading Desk', 'Hidden Doorway']
      },
      {
        id: 'f1_kitchen',
        name: 'Victorian Kitchen',
        floor: 1,
        x: 60,
        y: 10,
        width: 32,
        height: 38,
        baseTemp: 17.1,
        baseEmf: 0.9,
        description: 'Old cast-iron stove, walk-in scullery, and meat hooks hanging from rafters.',
        features: ['Iron Stove', 'Scullery Sink', 'Cellar Access Trapdoor']
      },
      {
        id: 'f1_corridor',
        name: 'Central Gallery Hall',
        floor: 1,
        x: 44,
        y: 10,
        width: 14,
        height: 53,
        baseTemp: 17.5,
        baseEmf: 0.5,
        description: 'Lined with family portraits whose eyes appear to track moving visitors.',
        features: ['Portrait Gallery', 'Rune Rug']
      },

      // Upper Quarters (Floor 2)
      {
        id: 'f2_master',
        name: 'Master Suite',
        floor: 2,
        x: 10,
        y: 12,
        width: 36,
        height: 40,
        baseTemp: 16.0,
        baseEmf: 1.2,
        description: 'Four-poster canopy bed draped in tattered lace; persistent cold spot near closet.',
        features: ['Canopy Bed', 'Vanity Mirror', 'Walk-in Wardrobe']
      },
      {
        id: 'f2_nursery',
        name: 'The Nursery',
        floor: 2,
        x: 54,
        y: 12,
        width: 38,
        height: 38,
        baseTemp: 14.8,
        baseEmf: 1.8,
        description: 'Rocking chair gently sways without wind; child whispers picked up on audio sweeps.',
        features: ['Rocking Horse', 'Antique Crib', 'Music Box']
      },
      {
        id: 'f2_hall',
        name: 'Upper Mezzanine',
        floor: 2,
        x: 36,
        y: 45,
        width: 28,
        height: 25,
        baseTemp: 17.0,
        baseEmf: 0.7,
        description: 'Balcony overlooking grand foyer with heavy shadows.',
        features: ['Staircase Landing', 'Grand Clock']
      },
      {
        id: 'f2_attic_room',
        name: 'Seance Room & Attic',
        floor: 2,
        x: 20,
        y: 72,
        width: 60,
        height: 24,
        baseTemp: 13.5,
        baseEmf: 2.1,
        description: 'Dusty attic space with round table, spirit board, and antique mirrors.',
        features: ['Ouija Table', 'Old Trunks', 'Skylight']
      },

      // Cellar & Catacombs (Floor 0)
      {
        id: 'f0_wine',
        name: 'Wine Vault',
        floor: 0,
        x: 12,
        y: 15,
        width: 34,
        height: 42,
        baseTemp: 11.2,
        baseEmf: 1.4,
        description: 'Arched brick vaults lined with rotted wine casks; heavy EMF interference.',
        features: ['Wine Racks', 'Cobwebs', 'Broken Bottles']
      },
      {
        id: 'f0_boiler',
        name: 'Furnace / Boiler Chamber',
        floor: 0,
        x: 52,
        y: 15,
        width: 36,
        height: 42,
        baseTemp: 14.0,
        baseEmf: 2.8,
        description: 'Huge rusted steel furnace from 1890 with anomalous magnetic spikes.',
        features: ['Coal Chute', 'Industrial Boiler', 'Water Pipes']
      },
      {
        id: 'f0_crypt',
        name: 'Sealed Ritual Crypt',
        floor: 0,
        x: 25,
        y: 60,
        width: 50,
        height: 35,
        baseTemp: 7.5,
        baseEmf: 3.5,
        description: 'Chiseled flagstones with ritual markings; temperatures drop below zero during activity.',
        features: ['Stone Altar', 'Iron Grate', 'Carved Sigil']
      }
    ]
  },

  {
    id: 'st_jude_asylum',
    name: 'St. Jude Abandoned Sanitarium',
    type: 'Medical Facility (Condemned 1974)',
    history: 'Closed following severe medical controversies. Former patients and orderlies are reported roaming the sterile corridors.',
    floors: [
      { level: 0, name: 'Basement Morgue' },
      { level: 1, name: 'Main Ward & Triage' }
    ],
    rooms: [
      // Ground Floor (Floor 1)
      {
        id: 'sj_reception',
        name: 'Intake & Waiting Hall',
        floor: 1,
        x: 35,
        y: 65,
        width: 30,
        height: 30,
        baseTemp: 15.5,
        baseEmf: 0.8,
        description: 'Shattered glass reception desk with discarded patient admission files.',
        features: ['Reception Desk', 'Security Gate']
      },
      {
        id: 'sj_ward_east',
        name: 'Ward Block East (Secluded)',
        floor: 1,
        x: 10,
        y: 20,
        width: 32,
        height: 50,
        baseTemp: 13.2,
        baseEmf: 1.6,
        description: 'Padded solitary isolation rooms; distinct rhythmic banging on iron doors.',
        features: ['Padded Cell', 'Observation Slit', 'Restraint Bed']
      },
      {
        id: 'sj_ward_west',
        name: 'Hydrotherapy Suite',
        floor: 1,
        x: 58,
        y: 20,
        width: 32,
        height: 50,
        baseTemp: 12.0,
        baseEmf: 1.9,
        description: 'Cast-iron immersion tubs with discolored water that occasionally drips.',
        features: ['Immersion Tubs', 'Tile Drain', 'Steam Pipes']
      },
      {
        id: 'sj_pharmacy',
        name: 'Secured Dispensary',
        floor: 1,
        x: 35,
        y: 20,
        width: 30,
        height: 40,
        baseTemp: 16.0,
        baseEmf: 1.1,
        description: 'Barred medicine dispensary; pill bottles rattle without physical vibration.',
        features: ['Iron Safe', 'Medicine Cabinets', 'Record Cabinets']
      },

      // Floor 0: Morgue
      {
        id: 'sj_morgue',
        name: 'Autopsy Theater & Freezers',
        floor: 0,
        x: 20,
        y: 20,
        width: 60,
        height: 60,
        baseTemp: 6.2,
        baseEmf: 3.2,
        description: 'Cold stainless steel autopsy slab and numbered pull-out refrigeration bays.',
        features: ['Autopsy Slab', 'Stainless Drawers', 'Drain Trough', 'Drain Basin']
      }
    ]
  }
];
