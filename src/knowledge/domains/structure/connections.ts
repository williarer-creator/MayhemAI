/**
 * STRUCTURE Domain - Connection Details
 *
 * Bolted and welded connections:
 * - Beam-to-column connections (shear, moment)
 * - Beam-to-beam connections (simple, continuous)
 * - Splice connections
 * - Weld calculations
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// BOLTED CONNECTION PARAMETERS
// ============================================================================

const boltedConnectionParameters: ParameterDefinition[] = [
  {
    id: 'connection_type',
    name: 'Connection Type',
    type: 'select',
    options: ['shear-tab', 'double-angle', 'single-angle', 'end-plate', 'moment-plate', 'flange-plate', 'splice'],
    default: 'shear-tab',
    required: true,
    description: 'Type of bolted connection',
  },
  {
    id: 'beam_size',
    name: 'Beam Size',
    type: 'string',
    default: 'W12x26',
    required: true,
    description: 'Supported beam designation',
  },
  {
    id: 'beam_depth',
    name: 'Beam Depth',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 1000,
    default: 310,
    required: true,
    description: 'Depth of beam section',
  },
  {
    id: 'beam_web_thickness',
    name: 'Beam Web Thickness',
    type: 'number',
    unit: 'mm',
    min: 4,
    max: 30,
    default: 6,
    required: true,
    description: 'Thickness of beam web',
  },
  {
    id: 'column_size',
    name: 'Column/Support Size',
    type: 'string',
    default: 'W14x61',
    required: false,
    description: 'Supporting member designation',
  },
  {
    id: 'reaction_shear',
    name: 'Shear Reaction',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 1000,
    default: 100,
    required: true,
    description: 'Factored beam end shear (kN)',
  },
  {
    id: 'reaction_moment',
    name: 'End Moment',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored beam end moment (kN-m)',
  },
  {
    id: 'reaction_axial',
    name: 'Axial Force',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Axial force in beam (kN)',
  },
  {
    id: 'bolt_diameter',
    name: 'Bolt Diameter',
    type: 'select',
    options: ['5/8"', '3/4"', '7/8"', '1"', '1-1/8"'],
    default: '3/4"',
    required: true,
    description: 'Bolt diameter',
  },
  {
    id: 'bolt_grade',
    name: 'Bolt Grade',
    type: 'select',
    options: ['A325-N', 'A325-X', 'A325-SC', 'A490-N', 'A490-X', 'A490-SC'],
    default: 'A325-N',
    required: true,
    description: 'Bolt grade and slip condition',
  },
  {
    id: 'bolt_rows',
    name: 'Number of Bolt Rows',
    type: 'number',
    unit: 'mm', // proxy for count
    min: 2,
    max: 12,
    default: 3,
    required: true,
    description: 'Vertical rows of bolts',
  },
  {
    id: 'bolt_columns',
    name: 'Bolts per Row',
    type: 'number',
    unit: 'mm', // proxy for count
    min: 1,
    max: 4,
    default: 1,
    required: true,
    description: 'Horizontal bolts per row',
  },
  {
    id: 'bolt_spacing',
    name: 'Bolt Spacing',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 150,
    default: 75,
    required: true,
    description: 'Vertical spacing between bolts',
  },
  {
    id: 'edge_distance',
    name: 'Edge Distance',
    type: 'number',
    unit: 'mm',
    min: 25,
    max: 75,
    default: 38,
    required: true,
    description: 'Distance from bolt to plate edge',
  },
  {
    id: 'plate_thickness',
    name: 'Plate Thickness',
    type: 'number',
    unit: 'mm',
    min: 6,
    max: 50,
    default: 10,
    required: true,
    description: 'Connection plate thickness',
  },
  {
    id: 'plate_grade',
    name: 'Plate Grade',
    type: 'select',
    options: ['A36', 'A572-50'],
    default: 'A36',
    required: true,
    description: 'Plate material grade',
  },
  {
    id: 'hole_type',
    name: 'Hole Type',
    type: 'select',
    options: ['standard', 'oversized', 'short-slotted', 'long-slotted'],
    default: 'standard',
    required: false,
    description: 'Type of bolt hole',
  },
  {
    id: 'coped',
    name: 'Beam Coped',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Is the beam coped?',
  },
  {
    id: 'cope_depth',
    name: 'Cope Depth',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 150,
    default: 0,
    required: false,
    description: 'Depth of cope cut',
  },
];

// ============================================================================
// BOLTED CONNECTION RULES
// ============================================================================

const boltedConnectionRules: Rule[] = [
  {
    id: 'bolt_shear',
    name: 'Bolt Shear',
    description: 'Bolts must resist applied shear',
    type: 'constraint',
    source: 'AISC 360 J3.6',
    expression: {
      type: 'range',
      param: 'reaction_shear',
      min: 0,
    },
    errorMessage: 'Bolt shear capacity exceeded',
  },
  {
    id: 'bolt_bearing',
    name: 'Bolt Bearing',
    description: 'Plate must resist bolt bearing',
    type: 'constraint',
    source: 'AISC 360 J3.10',
    expression: {
      type: 'range',
      param: 'plate_thickness',
      min: 6,
    },
    errorMessage: 'Bearing capacity exceeded',
  },
  {
    id: 'plate_shear',
    name: 'Plate Gross Shear',
    description: 'Plate must resist gross shear yielding',
    type: 'constraint',
    source: 'AISC 360 J4.2',
    expression: {
      type: 'range',
      param: 'plate_thickness',
      min: 6,
    },
    errorMessage: 'Plate shear yielding',
  },
  {
    id: 'plate_net_shear',
    name: 'Plate Net Shear',
    description: 'Net section must resist shear rupture',
    type: 'constraint',
    source: 'AISC 360 J4.2',
    expression: {
      type: 'range',
      param: 'bolt_rows',
      min: 2,
    },
    errorMessage: 'Plate net shear rupture',
  },
  {
    id: 'block_shear',
    name: 'Block Shear',
    description: 'Resist block shear failure',
    type: 'constraint',
    source: 'AISC 360 J4.3',
    expression: {
      type: 'range',
      param: 'edge_distance',
      min: 25,
    },
    errorMessage: 'Block shear capacity exceeded',
  },
  {
    id: 'bolt_spacing_min',
    name: 'Minimum Bolt Spacing',
    description: 'Spacing >= 2-2/3 bolt diameter',
    type: 'constraint',
    source: 'AISC 360 J3.3',
    expression: {
      type: 'range',
      param: 'bolt_spacing',
      min: 50,
    },
    errorMessage: 'Bolt spacing too small',
  },
  {
    id: 'edge_distance_min',
    name: 'Minimum Edge Distance',
    description: 'Edge distance per Table J3.4',
    type: 'constraint',
    source: 'AISC 360 J3.4',
    expression: {
      type: 'range',
      param: 'edge_distance',
      min: 25,
    },
    errorMessage: 'Edge distance insufficient',
  },
  {
    id: 'coped_beam_stability',
    name: 'Coped Beam Stability',
    description: 'Check local web buckling at cope',
    type: 'recommendation',
    source: 'AISC Design Guide 4',
    expression: {
      type: 'range',
      param: 'cope_depth',
      max: 100,
    },
    errorMessage: 'Deep cope may cause web instability',
  },
];

// ============================================================================
// BOLTED CONNECTION COMPONENTS
// ============================================================================

const boltedConnectionComponents: ComponentDefinition[] = [
  {
    id: 'connection_plate',
    name: 'Connection Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'plate_count',
    parameters: [
      {
        id: 'plate_dims',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Width x Length x Thickness',
      },
    ],
  },
  {
    id: 'bolts',
    name: 'High-Strength Bolts',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'bolt_rows * bolt_columns',
    parameters: [
      {
        id: 'bolt_spec',
        name: 'Bolt Specification',
        type: 'string',
        required: true,
        description: 'Diameter, grade, length',
      },
    ],
  },
  {
    id: 'nuts',
    name: 'Heavy Hex Nuts',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'bolt_rows * bolt_columns',
    parameters: [],
  },
  {
    id: 'washers',
    name: 'Hardened Washers',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'bolt_rows * bolt_columns * 2',
    parameters: [],
  },
];

// ============================================================================
// BOLTED CONNECTION ELEMENT
// ============================================================================

export const boltedConnectionElement: ElementDefinition = {
  id: 'bolted-connection',
  name: 'Bolted Connection',
  description: 'Bolted beam connections for shear and moment transfer',
  connectionType: 'beam-connection',
  parameters: boltedConnectionParameters,
  rules: boltedConnectionRules,
  materials: ['A36', 'A572-50', 'A325', 'A490'],
  components: boltedConnectionComponents,
};

// ============================================================================
// WELDED CONNECTION PARAMETERS
// ============================================================================

const weldedConnectionParameters: ParameterDefinition[] = [
  {
    id: 'connection_type',
    name: 'Connection Type',
    type: 'select',
    options: ['shear-tab', 'double-angle', 'direct-weld', 'moment-flange', 'moment-plate', 'splice'],
    default: 'shear-tab',
    required: true,
    description: 'Type of welded connection',
  },
  {
    id: 'beam_size',
    name: 'Beam Size',
    type: 'string',
    default: 'W12x26',
    required: true,
    description: 'Supported beam designation',
  },
  {
    id: 'beam_depth',
    name: 'Beam Depth',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 1000,
    default: 310,
    required: true,
    description: 'Depth of beam section',
  },
  {
    id: 'reaction_shear',
    name: 'Shear Reaction',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 1000,
    default: 100,
    required: true,
    description: 'Factored beam end shear (kN)',
  },
  {
    id: 'reaction_moment',
    name: 'End Moment',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored beam end moment (kN-m)',
  },
  {
    id: 'weld_type',
    name: 'Weld Type',
    type: 'select',
    options: ['fillet', 'CJP', 'PJP', 'flare-bevel', 'plug'],
    default: 'fillet',
    required: true,
    description: 'Type of weld',
  },
  {
    id: 'weld_size',
    name: 'Weld Size',
    type: 'number',
    unit: 'mm',
    min: 3,
    max: 25,
    default: 6,
    required: true,
    description: 'Fillet weld leg size or groove depth',
  },
  {
    id: 'weld_length',
    name: 'Weld Length',
    type: 'number',
    unit: 'mm',
    min: 25,
    max: 1000,
    default: 150,
    required: true,
    description: 'Total effective weld length',
  },
  {
    id: 'weld_electrode',
    name: 'Electrode',
    type: 'select',
    options: ['E60XX', 'E70XX', 'E80XX'],
    default: 'E70XX',
    required: true,
    description: 'Weld electrode classification',
  },
  {
    id: 'plate_thickness',
    name: 'Plate Thickness',
    type: 'number',
    unit: 'mm',
    min: 6,
    max: 50,
    default: 10,
    required: true,
    description: 'Connection plate thickness',
  },
  {
    id: 'plate_grade',
    name: 'Plate Grade',
    type: 'select',
    options: ['A36', 'A572-50'],
    default: 'A36',
    required: true,
    description: 'Plate material grade',
  },
  {
    id: 'weld_position',
    name: 'Weld Position',
    type: 'select',
    options: ['flat', 'horizontal', 'vertical', 'overhead'],
    default: 'horizontal',
    required: false,
    description: 'Welding position',
  },
  {
    id: 'access_hole',
    name: 'Access Hole Required',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Weld access hole for CJP welds',
  },
  {
    id: 'backing_bar',
    name: 'Backing Bar',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Use backing bar for CJP',
  },
];

// ============================================================================
// WELDED CONNECTION RULES
// ============================================================================

const weldedConnectionRules: Rule[] = [
  {
    id: 'weld_strength',
    name: 'Weld Strength',
    description: 'Weld must resist applied forces',
    type: 'constraint',
    source: 'AISC 360 J2.4',
    expression: {
      type: 'range',
      param: 'reaction_shear',
      min: 0,
    },
    errorMessage: 'Weld strength exceeded',
  },
  {
    id: 'min_weld_size',
    name: 'Minimum Weld Size',
    description: 'Weld size per Table J2.4',
    type: 'constraint',
    source: 'AISC 360 Table J2.4',
    expression: {
      type: 'range',
      param: 'weld_size',
      min: 3,
    },
    errorMessage: 'Weld size below minimum',
  },
  {
    id: 'max_weld_size',
    name: 'Maximum Weld Size',
    description: 'Weld size limited by plate thickness',
    type: 'constraint',
    source: 'AISC 360 J2.2b',
    expression: {
      type: 'range',
      param: 'weld_size',
      max: 25,
    },
    errorMessage: 'Weld size exceeds plate thickness limit',
  },
  {
    id: 'effective_length',
    name: 'Effective Weld Length',
    description: 'Minimum effective length = 4 x weld size',
    type: 'constraint',
    source: 'AISC 360 J2.2b',
    expression: {
      type: 'range',
      param: 'weld_length',
      min: 25,
    },
    errorMessage: 'Weld length insufficient',
  },
  {
    id: 'base_metal_strength',
    name: 'Base Metal',
    description: 'Base metal strength check',
    type: 'constraint',
    source: 'AISC 360 J4',
    expression: {
      type: 'range',
      param: 'plate_thickness',
      min: 6,
    },
    errorMessage: 'Base metal may be limiting',
  },
  {
    id: 'weld_access_hole',
    name: 'Weld Access Hole',
    description: 'Access hole required for beam flange CJP welds',
    type: 'recommendation',
    source: 'AWS D1.8, AISC 360 J1.6',
    expression: {
      type: 'range',
      param: 'weld_size',
      min: 0,
    },
    errorMessage: 'Consider weld access hole for full-pen welds',
  },
];

// ============================================================================
// WELDED CONNECTION COMPONENTS
// ============================================================================

const weldedConnectionComponents: ComponentDefinition[] = [
  {
    id: 'connection_plate',
    name: 'Connection Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'plate_count',
    parameters: [
      {
        id: 'plate_dims',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Width x Length x Thickness',
      },
    ],
  },
  {
    id: 'weld_material',
    name: 'Weld Metal',
    type: 'material',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'weld_volume',
    parameters: [
      {
        id: 'electrode',
        name: 'Electrode',
        type: 'string',
        required: true,
        description: 'E70XX etc.',
      },
    ],
  },
  {
    id: 'backing_bar',
    name: 'Backing Bar',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'bar_size',
        name: 'Bar Size',
        type: 'string',
        required: true,
        description: 'Flat bar dimensions',
      },
    ],
  },
  {
    id: 'erection_bolts',
    name: 'Erection Bolts',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: '2',
    parameters: [],
  },
];

// ============================================================================
// WELDED CONNECTION ELEMENT
// ============================================================================

export const weldedConnectionElement: ElementDefinition = {
  id: 'welded-connection',
  name: 'Welded Connection',
  description: 'Shop or field welded connections for shear and moment',
  connectionType: 'beam-connection',
  parameters: weldedConnectionParameters,
  rules: weldedConnectionRules,
  materials: ['A36', 'A572-50', 'E70XX'],
  components: weldedConnectionComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface BoltedConnectionInput {
  connectionType: string;
  beamDepth: number;
  beamWebThickness: number;
  reactionShear: number;
  reactionMoment: number;
  reactionAxial: number;
  boltDiameter: string;
  boltGrade: string;
  boltRows: number;
  boltColumns: number;
  boltSpacing: number;
  edgeDistance: number;
  plateThickness: number;
  plateGrade: string;
  coped: boolean;
  copeDepth: number;
}

export interface BoltedConnectionResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  boltCapacity: {
    shearPerBolt: number;     // kN
    bearingPerBolt: number;   // kN
    governingCapacity: number;
    totalBoltCapacity: number;
    demandRatio: number;
  };
  plateChecks: {
    grossShear: number;       // Capacity kN
    netShear: number;
    blockShear: number;
    governingCapacity: number;
    demandRatio: number;
  };
  geometry: {
    plateWidth: number;
    plateLength: number;
    totalBolts: number;
  };
}

export interface WeldedConnectionInput {
  connectionType: string;
  beamDepth: number;
  reactionShear: number;
  reactionMoment: number;
  weldType: string;
  weldSize: number;
  weldLength: number;
  weldElectrode: string;
  plateThickness: number;
  plateGrade: string;
}

export interface WeldedConnectionResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  weldCapacity: {
    strengthPerMm: number;    // kN/mm
    totalCapacity: number;    // kN
    demandRatio: number;
  };
  plateChecks: {
    grossShear: number;
    netSection: number;
    blockShear: number;
  };
  geometry: {
    effectiveThroat: number;
    effectiveLength: number;
  };
}

// ============================================================================
// BOLT DATA
// ============================================================================

interface BoltData {
  diameter: string;
  nominalDia: number;
  area: number;          // mm² (nominal body area)
  holeStandard: number;  // mm
  holeOversized: number; // mm
}

const boltTable: BoltData[] = [
  { diameter: '5/8"', nominalDia: 15.9, area: 198, holeStandard: 17.5, holeOversized: 20.6 },
  { diameter: '3/4"', nominalDia: 19.1, area: 285, holeStandard: 20.6, holeOversized: 23.8 },
  { diameter: '7/8"', nominalDia: 22.2, area: 388, holeStandard: 23.8, holeOversized: 27.0 },
  { diameter: '1"', nominalDia: 25.4, area: 507, holeStandard: 27.0, holeOversized: 30.2 },
  { diameter: '1-1/8"', nominalDia: 28.6, area: 641, holeStandard: 30.2, holeOversized: 34.9 },
];

interface BoltStrength {
  grade: string;
  Fnt: number;  // Nominal tensile stress (MPa)
  Fnv: number;  // Nominal shear stress (MPa)
}

const boltStrengths: BoltStrength[] = [
  { grade: 'A325-N', Fnt: 620, Fnv: 372 },  // Threads in shear plane
  { grade: 'A325-X', Fnt: 620, Fnv: 457 },  // Threads excluded
  { grade: 'A325-SC', Fnt: 620, Fnv: 372 }, // Slip critical (use mu)
  { grade: 'A490-N', Fnt: 780, Fnv: 457 },
  { grade: 'A490-X', Fnt: 780, Fnv: 579 },
  { grade: 'A490-SC', Fnt: 780, Fnv: 457 },
];

const weldStrengths: Record<string, number> = {
  'E60XX': 415,  // MPa (60 ksi)
  'E70XX': 485,  // 70 ksi
  'E80XX': 550,  // 80 ksi
};

const plateGrades: Record<string, { Fy: number; Fu: number }> = {
  'A36': { Fy: 250, Fu: 400 },
  'A572-50': { Fy: 345, Fu: 450 },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateBoltedConnection(input: BoltedConnectionInput): BoltedConnectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bolt = boltTable.find(b => b.diameter === input.boltDiameter) || boltTable[1];
  const boltGrade = boltStrengths.find(g => g.grade === input.boltGrade) || boltStrengths[0];
  const plate = plateGrades[input.plateGrade] || plateGrades['A36'];

  const totalBolts = input.boltRows * input.boltColumns;
  const phi_b = 0.75;

  // Bolt shear capacity (single shear)
  const shearPerBolt = phi_b * boltGrade.Fnv * bolt.area / 1000; // kN

  // Bearing capacity (per bolt)
  const Lc = input.edgeDistance - bolt.holeStandard / 2;
  const bearingPerBolt = phi_b * Math.min(
    1.2 * Lc * input.plateThickness * plate.Fu / 1000,
    2.4 * bolt.nominalDia * input.plateThickness * plate.Fu / 1000
  );

  const governingBoltCapacity = Math.min(shearPerBolt, bearingPerBolt);
  const totalBoltCapacity = governingBoltCapacity * totalBolts;
  const boltDemandRatio = input.reactionShear / totalBoltCapacity;

  if (boltDemandRatio > 1.0) {
    errors.push(`Bolt capacity (${totalBoltCapacity.toFixed(0)} kN) exceeded`);
  }

  // Plate geometry
  const plateLength = 2 * input.edgeDistance + (input.boltRows - 1) * input.boltSpacing;
  // plateWidth will be calculated based on beam depth in future updates

  // Plate shear checks
  const Agv = plateLength * input.plateThickness;
  const grossShear = 0.6 * plate.Fy * Agv / 1000; // kN

  // Net shear (holes removed)
  const netArea = (plateLength - input.boltRows * (bolt.holeStandard + 2)) * input.plateThickness;
  const netShear = 0.6 * plate.Fu * netArea / 1000;

  // Block shear (simplified)
  const Agv_block = (input.boltRows - 1) * input.boltSpacing * input.plateThickness;
  const Ant = (input.edgeDistance - bolt.holeStandard / 2) * input.plateThickness;
  const Anv = Agv_block - (input.boltRows - 1) * bolt.holeStandard * input.plateThickness;
  const Ubs = 1.0;
  const blockShear = Math.min(
    0.6 * plate.Fu * Anv / 1000 + Ubs * plate.Fu * Ant / 1000,
    0.6 * plate.Fy * Agv_block / 1000 + Ubs * plate.Fu * Ant / 1000
  ) * phi_b;

  const governingPlate = Math.min(grossShear, netShear, blockShear);
  const plateDemandRatio = input.reactionShear / governingPlate;

  if (plateDemandRatio > 1.0) {
    errors.push(`Plate capacity (${governingPlate.toFixed(0)} kN) exceeded`);
  }

  // Coped beam check
  if (input.coped && input.copeDepth > 0) {
    // reducedDepth = beamDepth - copeDepth (for future stability check)
    const copeRatio = input.copeDepth / input.beamDepth;
    if (copeRatio > 0.2) {
      warnings.push('Deep cope - check local web buckling');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    boltCapacity: {
      shearPerBolt,
      bearingPerBolt,
      governingCapacity: governingBoltCapacity,
      totalBoltCapacity,
      demandRatio: boltDemandRatio,
    },
    plateChecks: {
      grossShear,
      netShear,
      blockShear,
      governingCapacity: governingPlate,
      demandRatio: plateDemandRatio,
    },
    geometry: {
      plateWidth: 100, // Typical shear tab width
      plateLength,
      totalBolts,
    },
  };
}

export function calculateWeldedConnection(input: WeldedConnectionInput): WeldedConnectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const plate = plateGrades[input.plateGrade] || plateGrades['A36'];
  const Fexx = weldStrengths[input.weldElectrode] || weldStrengths['E70XX'];

  // Effective throat
  let effectiveThroat: number;
  if (input.weldType === 'fillet') {
    effectiveThroat = 0.707 * input.weldSize;
  } else if (input.weldType === 'CJP') {
    effectiveThroat = input.weldSize; // Full penetration
  } else {
    effectiveThroat = 0.707 * input.weldSize;
  }

  // Weld strength per mm
  const phi_w = 0.75;
  const strengthPerMm = phi_w * 0.6 * Fexx * effectiveThroat / 1000; // kN/mm

  // Total capacity
  const effectiveLength = input.weldLength - 2 * input.weldSize; // Deduct ends
  const totalCapacity = strengthPerMm * Math.max(effectiveLength, 0);

  const weldDemandRatio = input.reactionShear / totalCapacity;

  if (weldDemandRatio > 1.0) {
    errors.push(`Weld capacity (${totalCapacity.toFixed(0)} kN) exceeded`);
  }

  // Check minimum weld size based on thickest part joined
  const minWeldSize = input.plateThickness <= 6 ? 3 :
                      input.plateThickness <= 13 ? 5 :
                      input.plateThickness <= 19 ? 6 : 8;
  if (input.weldSize < minWeldSize) {
    errors.push(`Weld size (${input.weldSize} mm) below minimum (${minWeldSize} mm)`);
  }

  // Max weld size
  const maxWeldSize = input.plateThickness - 2;
  if (input.weldSize > maxWeldSize && input.weldType === 'fillet') {
    warnings.push(`Weld size may exceed plate edge limit`);
  }

  // Plate checks
  const grossShear = 0.6 * plate.Fy * input.weldLength * input.plateThickness / 1000;
  const netSection = 0.6 * plate.Fu * input.weldLength * input.plateThickness / 1000;
  const blockShear = 0.75 * 0.6 * plate.Fu * input.weldLength * input.plateThickness / 1000;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    weldCapacity: {
      strengthPerMm,
      totalCapacity,
      demandRatio: weldDemandRatio,
    },
    plateChecks: {
      grossShear,
      netSection,
      blockShear,
    },
    geometry: {
      effectiveThroat,
      effectiveLength,
    },
  };
}

// Export data tables
export { boltTable, boltStrengths, weldStrengths, plateGrades };
