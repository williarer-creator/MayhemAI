/**
 * STRUCTURE Domain - Individual Beams
 *
 * Standalone beam elements for spanning distances:
 * - Steel beams (W-shapes, S-shapes, channels, angles)
 * - HSS beams (rectangular, square, round)
 * - Aluminum beams
 * - Wood beams (dimensional lumber, glulam, LVL)
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// STEEL BEAM PARAMETERS
// ============================================================================

const steelBeamParameters: ParameterDefinition[] = [
  {
    id: 'span_length',
    name: 'Span Length',
    type: 'number',
    unit: 'mm',
    min: 300,
    max: 20000,
    default: 3000,
    required: true,
    description: 'Clear span between supports',
  },
  {
    id: 'support_type',
    name: 'Support Conditions',
    type: 'select',
    options: ['simple', 'fixed-fixed', 'fixed-pinned', 'cantilever', 'continuous-2', 'continuous-3'],
    default: 'simple',
    required: true,
    description: 'End support conditions',
  },
  {
    id: 'profile_type',
    name: 'Profile Type',
    type: 'select',
    options: ['W-beam', 'S-beam', 'C-channel', 'MC-channel', 'HSS-rect', 'HSS-square', 'HSS-round', 'angle', 'WT'],
    default: 'W-beam',
    required: true,
    description: 'Cross-sectional shape',
  },
  {
    id: 'profile_size',
    name: 'Profile Size',
    type: 'string',
    default: 'W8x31',
    required: true,
    description: 'Standard designation (e.g., W8x31, HSS6x4x1/4)',
  },
  {
    id: 'steel_grade',
    name: 'Steel Grade',
    type: 'select',
    options: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C', 'A53-B'],
    default: 'A36',
    required: true,
    description: 'Material grade',
  },
  {
    id: 'load_type',
    name: 'Load Type',
    type: 'select',
    options: ['uniform', 'point-center', 'point-third', 'point-quarter', 'triangular', 'trapezoidal'],
    default: 'uniform',
    required: true,
    description: 'Load distribution pattern',
  },
  {
    id: 'dead_load',
    name: 'Dead Load',
    type: 'number',
    unit: 'mm', // proxy for kN/m
    min: 0,
    max: 500,
    default: 5,
    required: true,
    description: 'Dead load (kN/m for uniform, kN for point)',
  },
  {
    id: 'live_load',
    name: 'Live Load',
    type: 'number',
    unit: 'mm', // proxy for kN/m
    min: 0,
    max: 500,
    default: 10,
    required: true,
    description: 'Live load (kN/m for uniform, kN for point)',
  },
  {
    id: 'deflection_limit',
    name: 'Deflection Limit',
    type: 'select',
    options: ['L/180', 'L/240', 'L/360', 'L/480', 'L/600'],
    default: 'L/360',
    required: true,
    description: 'Maximum allowable deflection ratio',
  },
  {
    id: 'lateral_support',
    name: 'Lateral Support',
    type: 'select',
    options: ['continuous', 'at-points', 'compression-flange', 'none'],
    default: 'continuous',
    required: true,
    description: 'Lateral bracing condition',
  },
  {
    id: 'unbraced_length',
    name: 'Unbraced Length',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 20000,
    default: 0,
    required: false,
    description: 'Length between lateral supports (0 = continuous)',
  },
  {
    id: 'camber',
    name: 'Camber',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 100,
    default: 0,
    required: false,
    description: 'Upward camber to offset deflection',
  },
  {
    id: 'copes_notches',
    name: 'End Treatment',
    type: 'select',
    options: ['none', 'cope-top', 'cope-bottom', 'cope-both', 'notch'],
    default: 'none',
    required: false,
    description: 'End coping or notching',
  },
  {
    id: 'holes',
    name: 'Bolt Holes',
    type: 'select',
    options: ['none', 'standard', 'oversized', 'slotted'],
    default: 'standard',
    required: false,
    description: 'Type of bolt holes',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'primer', 'galvanized', 'powder-coat', 'paint'],
    default: 'primer',
    required: false,
    description: 'Surface treatment',
  },
];

// ============================================================================
// STEEL BEAM RULES
// ============================================================================

const steelBeamRules: Rule[] = [
  {
    id: 'moment_capacity',
    name: 'Flexural Capacity',
    description: 'Beam must have adequate moment capacity for applied loads',
    type: 'constraint',
    source: 'AISC 360 Chapter F',
    expression: {
      type: 'range',
      param: 'span_length',
      min: 300,
      max: 20000,
    },
    errorMessage: 'Beam moment capacity exceeded',
  },
  {
    id: 'shear_capacity',
    name: 'Shear Capacity',
    description: 'Beam must have adequate shear capacity at supports',
    type: 'constraint',
    source: 'AISC 360 Chapter G',
    expression: {
      type: 'range',
      param: 'dead_load',
      min: 0,
    },
    errorMessage: 'Beam shear capacity exceeded',
  },
  {
    id: 'deflection_check',
    name: 'Deflection Check',
    description: 'Deflection must not exceed serviceability limits',
    type: 'constraint',
    source: 'IBC, AISC Design Guide 3',
    expression: {
      type: 'ratio',
      param1: 'span_length',
      param2: 'dead_load',
      max: 500,
    },
    errorMessage: 'Deflection exceeds allowable limit',
  },
  {
    id: 'lateral_torsional_buckling',
    name: 'Lateral-Torsional Buckling',
    description: 'Compression flange must be adequately braced',
    type: 'constraint',
    source: 'AISC 360 F2',
    expression: {
      type: 'range',
      param: 'unbraced_length',
      max: 10000,
    },
    errorMessage: 'Lateral-torsional buckling capacity reduced',
  },
  {
    id: 'web_crippling',
    name: 'Web Crippling',
    description: 'Web must resist concentrated loads at supports',
    type: 'recommendation',
    source: 'AISC 360 J10',
    expression: {
      type: 'range',
      param: 'dead_load',
      max: 200,
    },
    errorMessage: 'Web stiffeners may be required',
  },
  {
    id: 'compact_section',
    name: 'Compact Section',
    description: 'Prefer compact sections for full plastic capacity',
    type: 'recommendation',
    source: 'AISC 360 Table B4.1b',
    expression: {
      type: 'range',
      param: 'span_length',
      min: 0,
    },
    errorMessage: 'Section may not be compact for specified grade',
  },
];

// ============================================================================
// STEEL BEAM COMPONENTS
// ============================================================================

const steelBeamComponents: ComponentDefinition[] = [
  {
    id: 'beam_member',
    name: 'Steel Beam',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'cut_length',
        name: 'Cut Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total length including bearing',
      },
    ],
  },
  {
    id: 'stiffener_plates',
    name: 'Bearing Stiffener',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'stiffener_count',
    parameters: [
      {
        id: 'stiffener_size',
        name: 'Plate Size',
        type: 'string',
        required: true,
        description: 'Stiffener plate dimensions',
      },
    ],
  },
  {
    id: 'connection_angles',
    name: 'Connection Angle',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: '4',
    parameters: [
      {
        id: 'angle_size',
        name: 'Angle Size',
        type: 'string',
        required: true,
        description: 'Connection angle dimensions',
      },
    ],
  },
  {
    id: 'bolts',
    name: 'Connection Bolts',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'bolt_count',
    parameters: [
      {
        id: 'bolt_spec',
        name: 'Bolt Specification',
        type: 'string',
        required: true,
        description: 'A325 or A490 bolt',
      },
    ],
  },
];

// ============================================================================
// STEEL BEAM ELEMENT
// ============================================================================

export const steelBeamElement: ElementDefinition = {
  id: 'steel-beam',
  name: 'Steel Beam',
  description: 'Individual steel beam for spanning between supports',
  connectionType: 'horizontal-span',
  parameters: steelBeamParameters,
  rules: steelBeamRules,
  materials: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C'],
  components: steelBeamComponents,
};

// ============================================================================
// WOOD BEAM PARAMETERS
// ============================================================================

const woodBeamParameters: ParameterDefinition[] = [
  {
    id: 'span_length',
    name: 'Span Length',
    type: 'number',
    unit: 'mm',
    min: 300,
    max: 12000,
    default: 3000,
    required: true,
    description: 'Clear span between supports',
  },
  {
    id: 'support_type',
    name: 'Support Conditions',
    type: 'select',
    options: ['simple', 'continuous-2', 'continuous-3', 'cantilever'],
    default: 'simple',
    required: true,
    description: 'End support conditions',
  },
  {
    id: 'wood_type',
    name: 'Wood Type',
    type: 'select',
    options: ['dimensional-lumber', 'glulam', 'LVL', 'PSL', 'LSL', 'timber'],
    default: 'dimensional-lumber',
    required: true,
    description: 'Type of wood product',
  },
  {
    id: 'species_grade',
    name: 'Species/Grade',
    type: 'select',
    options: ['SPF-2', 'SPF-1', 'DF-2', 'DF-1', 'SYP-2', 'SYP-1', '24F-V4', '24F-V8'],
    default: 'SPF-2',
    required: true,
    description: 'Species and grade',
  },
  {
    id: 'nominal_width',
    name: 'Nominal Width',
    type: 'select',
    options: ['2x', '3x', '4x', '6x'],
    default: '2x',
    required: true,
    description: 'Nominal width (actual dimension differs)',
  },
  {
    id: 'nominal_depth',
    name: 'Nominal Depth',
    type: 'select',
    options: ['4', '6', '8', '10', '12', '14', '16'],
    default: '10',
    required: true,
    description: 'Nominal depth in inches',
  },
  {
    id: 'ply_count',
    name: 'Number of Plies',
    type: 'number',
    unit: 'mm', // proxy for count
    min: 1,
    max: 4,
    default: 1,
    required: true,
    description: 'Number of members laminated together',
  },
  {
    id: 'dead_load',
    name: 'Dead Load',
    type: 'number',
    unit: 'mm', // proxy for kN/m
    min: 0,
    max: 100,
    default: 2,
    required: true,
    description: 'Dead load (kN/m)',
  },
  {
    id: 'live_load',
    name: 'Live Load',
    type: 'number',
    unit: 'mm', // proxy for kN/m
    min: 0,
    max: 100,
    default: 5,
    required: true,
    description: 'Live load (kN/m)',
  },
  {
    id: 'load_duration',
    name: 'Load Duration',
    type: 'select',
    options: ['permanent', 'ten-years', 'two-months', 'seven-days', 'ten-minutes', 'impact'],
    default: 'ten-years',
    required: true,
    description: 'Duration of maximum load',
  },
  {
    id: 'moisture_condition',
    name: 'Moisture Condition',
    type: 'select',
    options: ['dry', 'wet'],
    default: 'dry',
    required: true,
    description: 'Service moisture condition',
  },
  {
    id: 'temperature',
    name: 'Temperature',
    type: 'select',
    options: ['normal', 'elevated'],
    default: 'normal',
    required: false,
    description: 'Service temperature (>37°C = elevated)',
  },
  {
    id: 'bearing_length',
    name: 'Bearing Length',
    type: 'number',
    unit: 'mm',
    min: 38,
    max: 300,
    default: 89,
    required: true,
    description: 'Length of bearing at supports',
  },
  {
    id: 'fire_rating',
    name: 'Fire Rating',
    type: 'select',
    options: ['none', '1-hour', '2-hour'],
    default: 'none',
    required: false,
    description: 'Required fire resistance',
  },
];

// ============================================================================
// WOOD BEAM RULES
// ============================================================================

const woodBeamRules: Rule[] = [
  {
    id: 'bending_stress',
    name: 'Bending Stress',
    description: 'Actual bending stress must not exceed adjusted allowable',
    type: 'constraint',
    source: 'NDS Chapter 3',
    expression: {
      type: 'range',
      param: 'span_length',
      min: 300,
    },
    errorMessage: 'Bending stress exceeds allowable',
  },
  {
    id: 'shear_stress',
    name: 'Shear Stress',
    description: 'Actual shear stress must not exceed adjusted allowable',
    type: 'constraint',
    source: 'NDS Chapter 3',
    expression: {
      type: 'range',
      param: 'dead_load',
      min: 0,
    },
    errorMessage: 'Shear stress exceeds allowable',
  },
  {
    id: 'deflection',
    name: 'Deflection',
    description: 'Deflection must not exceed L/360 for live load, L/240 total',
    type: 'constraint',
    source: 'NDS, IBC',
    expression: {
      type: 'ratio',
      param1: 'span_length',
      param2: 'nominal_depth',
      max: 30,
    },
    errorMessage: 'Deflection exceeds allowable',
  },
  {
    id: 'bearing_stress',
    name: 'Bearing Stress',
    description: 'Compression perpendicular to grain at supports',
    type: 'constraint',
    source: 'NDS 3.10',
    expression: {
      type: 'range',
      param: 'bearing_length',
      min: 38,
    },
    errorMessage: 'Bearing stress exceeds allowable',
  },
  {
    id: 'notch_limit',
    name: 'Notch Limit',
    description: 'Notches in beams should be limited in depth',
    type: 'recommendation',
    source: 'NDS 3.2.3',
    expression: {
      type: 'range',
      param: 'nominal_depth',
      min: 4,
    },
    errorMessage: 'Notching may reduce capacity significantly',
  },
];

// ============================================================================
// WOOD BEAM COMPONENTS
// ============================================================================

const woodBeamComponents: ComponentDefinition[] = [
  {
    id: 'beam_member',
    name: 'Wood Beam',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: 'ply_count',
    parameters: [
      {
        id: 'cut_length',
        name: 'Cut Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total length including bearing',
      },
    ],
  },
  {
    id: 'hanger',
    name: 'Joist Hanger',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: '2',
    parameters: [
      {
        id: 'hanger_model',
        name: 'Hanger Model',
        type: 'string',
        required: true,
        description: 'Simpson Strong-Tie or equivalent',
      },
    ],
  },
  {
    id: 'fasteners',
    name: 'Nails/Screws',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'fastener_count',
    parameters: [
      {
        id: 'fastener_spec',
        name: 'Fastener Specification',
        type: 'string',
        required: true,
        description: 'Nail or screw size',
      },
    ],
  },
  {
    id: 'bearing_plate',
    name: 'Steel Bearing Plate',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: '2',
    parameters: [
      {
        id: 'plate_size',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Plate width x length x thickness',
      },
    ],
  },
];

// ============================================================================
// WOOD BEAM ELEMENT
// ============================================================================

export const woodBeamElement: ElementDefinition = {
  id: 'wood-beam',
  name: 'Wood Beam',
  description: 'Wood beam for floor and roof framing',
  connectionType: 'horizontal-span',
  parameters: woodBeamParameters,
  rules: woodBeamRules,
  materials: ['SPF', 'Douglas-Fir', 'Southern-Pine', 'Glulam', 'LVL'],
  components: woodBeamComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface SteelBeamInput {
  spanLength: number;
  supportType: string;
  profileType: string;
  profileSize: string;
  steelGrade: string;
  loadType: string;
  deadLoad: number;
  liveLoad: number;
  deflectionLimit: string;
  lateralSupport: string;
  unbracedLength: number;
}

export interface SteelBeamResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  flexure: {
    Mu: number;       // Factored moment demand (kN-m)
    phiMn: number;    // Design moment capacity (kN-m)
    ratio: number;    // Demand/capacity ratio
  };
  shear: {
    Vu: number;       // Factored shear demand (kN)
    phiVn: number;    // Design shear capacity (kN)
    ratio: number;    // Demand/capacity ratio
  };
  deflection: {
    actual: number;   // Calculated deflection (mm)
    allowable: number;// Allowable deflection (mm)
    ratio: number;    // Actual/allowable ratio
  };
  weight: number;     // Total weight (kg)
  reactions: {
    left: number;     // Left reaction (kN)
    right: number;    // Right reaction (kN)
  };
}

export interface WoodBeamInput {
  spanLength: number;
  supportType: string;
  woodType: string;
  speciesGrade: string;
  nominalWidth: string;
  nominalDepth: string;
  plyCount: number;
  deadLoad: number;
  liveLoad: number;
  loadDuration: string;
  moistureCondition: string;
  bearingLength: number;
}

export interface WoodBeamResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  bending: {
    fb_actual: number;  // Actual bending stress (MPa)
    Fb_adjusted: number;// Adjusted allowable (MPa)
    ratio: number;
  };
  shear: {
    fv_actual: number;  // Actual shear stress (MPa)
    Fv_adjusted: number;// Adjusted allowable (MPa)
    ratio: number;
  };
  deflection: {
    live: number;       // Live load deflection (mm)
    total: number;      // Total deflection (mm)
    allowable_live: number;
    allowable_total: number;
  };
  bearing: {
    fc_perp: number;    // Actual bearing stress (MPa)
    Fc_perp_adjusted: number;
    ratio: number;
  };
  adjustmentFactors: {
    CD: number;         // Load duration
    CM: number;         // Wet service
    Ct: number;         // Temperature
    CL: number;         // Beam stability
    CF: number;         // Size factor
    Cr: number;         // Repetitive member
  };
}

// ============================================================================
// STEEL SECTION DATABASE (expanded)
// ============================================================================

interface SteelSectionProps {
  designation: string;
  type: string;
  d: number;    // depth (mm)
  bf: number;   // flange width (mm)
  tw: number;   // web thickness (mm)
  tf: number;   // flange thickness (mm)
  A: number;    // area (mm²)
  W: number;    // weight (kg/m)
  Ix: number;   // moment of inertia x-axis (10^6 mm^4)
  Sx: number;   // section modulus x-axis (10^3 mm³)
  Zx: number;   // plastic modulus x-axis (10^3 mm³)
  rx: number;   // radius of gyration x-axis (mm)
  Iy: number;   // moment of inertia y-axis (10^6 mm^4)
  ry: number;   // radius of gyration y-axis (mm)
}

const steelBeamSections: SteelSectionProps[] = [
  // W-beams (wide flange)
  { designation: 'W6x12', type: 'W-beam', d: 152, bf: 102, tw: 5.8, tf: 6.9, A: 1520, W: 17.9, Ix: 8.7, Sx: 115, Zx: 131, rx: 62, Iy: 1.6, ry: 25 },
  { designation: 'W6x15', type: 'W-beam', d: 152, bf: 152, tw: 5.8, tf: 6.6, A: 1910, W: 22.3, Ix: 12.1, Sx: 159, Zx: 178, rx: 64, Iy: 4.5, ry: 38 },
  { designation: 'W8x18', type: 'W-beam', d: 207, bf: 133, tw: 5.8, tf: 7.2, A: 2290, W: 26.8, Ix: 25.4, Sx: 245, Zx: 275, rx: 86, Iy: 3.0, ry: 32 },
  { designation: 'W8x24', type: 'W-beam', d: 201, bf: 165, tw: 6.2, tf: 10.2, A: 3060, W: 35.7, Ix: 34.4, Sx: 342, Zx: 382, rx: 84, Iy: 8.4, ry: 42 },
  { designation: 'W8x31', type: 'W-beam', d: 203, bf: 203, tw: 7.2, tf: 11.0, A: 3950, W: 46.1, Ix: 43.3, Sx: 427, Zx: 487, rx: 86, Iy: 14.6, ry: 51 },
  { designation: 'W10x22', type: 'W-beam', d: 254, bf: 146, tw: 6.1, tf: 9.1, A: 2800, W: 32.7, Ix: 49.5, Sx: 390, Zx: 439, rx: 107, Iy: 4.7, ry: 33 },
  { designation: 'W10x33', type: 'W-beam', d: 247, bf: 202, tw: 7.4, tf: 11.6, A: 4190, W: 49.1, Ix: 71.1, Sx: 576, Zx: 650, rx: 107, Iy: 14.5, ry: 51 },
  { designation: 'W10x49', type: 'W-beam', d: 254, bf: 254, tw: 8.6, tf: 14.2, A: 6260, W: 72.9, Ix: 113, Sx: 890, Zx: 1010, rx: 109, Iy: 38.8, ry: 65 },
  { designation: 'W12x26', type: 'W-beam', d: 310, bf: 165, tw: 5.8, tf: 9.7, A: 3310, W: 38.7, Ix: 85.1, Sx: 549, Zx: 614, rx: 127, Iy: 7.1, ry: 37 },
  { designation: 'W12x40', type: 'W-beam', d: 304, bf: 203, tw: 7.5, tf: 13.0, A: 5090, W: 59.5, Ix: 130, Sx: 856, Zx: 966, rx: 131, Iy: 17.9, ry: 49 },
  { designation: 'W12x53', type: 'W-beam', d: 306, bf: 254, tw: 8.8, tf: 14.6, A: 6770, W: 78.9, Ix: 177, Sx: 1157, Zx: 1300, rx: 132, Iy: 39.5, ry: 61 },
  { designation: 'W14x30', type: 'W-beam', d: 351, bf: 171, tw: 6.9, tf: 9.8, A: 3810, W: 44.6, Ix: 127, Sx: 724, Zx: 816, rx: 147, Iy: 7.5, ry: 38 },
  { designation: 'W14x48', type: 'W-beam', d: 351, bf: 203, tw: 7.9, tf: 13.5, A: 6130, W: 71.4, Ix: 201, Sx: 1145, Zx: 1290, rx: 150, Iy: 18.9, ry: 50 },
  // HSS sections (rectangular/square)
  { designation: 'HSS4x4x1/4', type: 'HSS-square', d: 102, bf: 102, tw: 5.8, tf: 5.8, A: 2150, W: 17.3, Ix: 5.8, Sx: 114, Zx: 139, rx: 39, Iy: 5.8, ry: 39 },
  { designation: 'HSS6x4x1/4', type: 'HSS-rect', d: 152, bf: 102, tw: 5.8, tf: 5.8, A: 2760, W: 22.2, Ix: 14.4, Sx: 190, Zx: 226, rx: 57, Iy: 7.5, ry: 41 },
  { designation: 'HSS6x6x3/8', type: 'HSS-square', d: 152, bf: 152, tw: 9.5, tf: 9.5, A: 5100, W: 40.0, Ix: 28.7, Sx: 377, Zx: 459, rx: 57, Iy: 28.7, ry: 57 },
  { designation: 'HSS8x4x1/4', type: 'HSS-rect', d: 203, bf: 102, tw: 5.8, tf: 5.8, A: 3360, W: 27.0, Ix: 27.9, Sx: 275, Zx: 327, rx: 76, Iy: 9.1, ry: 41 },
  { designation: 'HSS8x8x1/2', type: 'HSS-square', d: 203, bf: 203, tw: 11.8, tf: 11.8, A: 8710, W: 69.8, Ix: 80.0, Sx: 788, Zx: 966, rx: 76, Iy: 80.0, ry: 76 },
  // Channels
  { designation: 'C6x13', type: 'C-channel', d: 152, bf: 56, tw: 8.1, tf: 10.5, A: 1650, W: 19.4, Ix: 7.4, Sx: 98, Zx: 116, rx: 55, Iy: 0.5, ry: 14 },
  { designation: 'C8x18.75', type: 'C-channel', d: 203, bf: 64, tw: 9.0, tf: 12.4, A: 2380, W: 27.9, Ix: 17.4, Sx: 172, Zx: 202, rx: 73, Iy: 1.0, ry: 16 },
  { designation: 'C10x25', type: 'C-channel', d: 254, bf: 73, tw: 10.5, tf: 13.4, A: 3180, W: 37.2, Ix: 35.6, Sx: 280, Zx: 329, rx: 91, Iy: 1.8, ry: 19 },
];

const steelGradeProps: Record<string, { Fy: number; Fu: number; E: number }> = {
  'A36': { Fy: 250, Fu: 400, E: 200000 },
  'A572-50': { Fy: 345, Fu: 450, E: 200000 },
  'A992': { Fy: 345, Fu: 450, E: 200000 },
  'A500-B': { Fy: 290, Fu: 400, E: 200000 },
  'A500-C': { Fy: 317, Fu: 427, E: 200000 },
  'A53-B': { Fy: 240, Fu: 415, E: 200000 },
};

// ============================================================================
// WOOD SECTION DATABASE
// ============================================================================

interface WoodSectionProps {
  nominal: string;
  actual_b: number;  // actual width (mm)
  actual_d: number;  // actual depth (mm)
  A: number;         // area (mm²)
  Sx: number;        // section modulus (10³ mm³)
  Ix: number;        // moment of inertia (10⁶ mm⁴)
}

const woodSections: WoodSectionProps[] = [
  { nominal: '2x4', actual_b: 38, actual_d: 89, A: 3382, Sx: 50.2, Ix: 2.23 },
  { nominal: '2x6', actual_b: 38, actual_d: 140, A: 5320, Sx: 124.1, Ix: 8.69 },
  { nominal: '2x8', actual_b: 38, actual_d: 184, A: 6992, Sx: 214.3, Ix: 19.7 },
  { nominal: '2x10', actual_b: 38, actual_d: 235, A: 8930, Sx: 349.8, Ix: 41.1 },
  { nominal: '2x12', actual_b: 38, actual_d: 286, A: 10868, Sx: 518.2, Ix: 74.1 },
  { nominal: '2x14', actual_b: 38, actual_d: 337, A: 12806, Sx: 719.0, Ix: 121.2 },
  { nominal: '2x16', actual_b: 38, actual_d: 387, A: 14706, Sx: 948.4, Ix: 183.5 },
  { nominal: '4x4', actual_b: 89, actual_d: 89, A: 7921, Sx: 117.6, Ix: 5.23 },
  { nominal: '4x6', actual_b: 89, actual_d: 140, A: 12460, Sx: 290.7, Ix: 20.4 },
  { nominal: '4x8', actual_b: 89, actual_d: 184, A: 16376, Sx: 502.2, Ix: 46.2 },
  { nominal: '4x10', actual_b: 89, actual_d: 235, A: 20915, Sx: 819.2, Ix: 96.3 },
  { nominal: '4x12', actual_b: 89, actual_d: 286, A: 25454, Sx: 1213.6, Ix: 173.5 },
  { nominal: '6x6', actual_b: 140, actual_d: 140, A: 19600, Sx: 457.3, Ix: 32.0 },
  { nominal: '6x8', actual_b: 140, actual_d: 184, A: 25760, Sx: 790.0, Ix: 72.7 },
  { nominal: '6x10', actual_b: 140, actual_d: 235, A: 32900, Sx: 1288.3, Ix: 151.4 },
  { nominal: '6x12', actual_b: 140, actual_d: 286, A: 40040, Sx: 1909.0, Ix: 273.0 },
];

interface WoodGradeProps {
  Fb: number;    // Bending (MPa)
  Ft: number;    // Tension parallel (MPa)
  Fv: number;    // Shear (MPa)
  Fc_perp: number; // Compression perpendicular (MPa)
  Fc: number;    // Compression parallel (MPa)
  E: number;     // Modulus of elasticity (MPa)
  Emin: number;  // Minimum E (MPa)
}

const woodGrades: Record<string, WoodGradeProps> = {
  'SPF-2': { Fb: 6.0, Ft: 3.5, Fv: 1.0, Fc_perp: 3.1, Fc: 6.5, E: 9500, Emin: 3450 },
  'SPF-1': { Fb: 8.6, Ft: 5.2, Fv: 1.0, Fc_perp: 3.1, Fc: 9.3, E: 10500, Emin: 3800 },
  'DF-2': { Fb: 6.9, Ft: 4.1, Fv: 1.3, Fc_perp: 4.3, Fc: 7.6, E: 11000, Emin: 4000 },
  'DF-1': { Fb: 10.3, Ft: 6.2, Fv: 1.3, Fc_perp: 4.3, Fc: 11.4, E: 12500, Emin: 4550 },
  'SYP-2': { Fb: 7.6, Ft: 4.5, Fv: 1.2, Fc_perp: 4.0, Fc: 8.3, E: 11000, Emin: 4000 },
  'SYP-1': { Fb: 11.0, Ft: 6.6, Fv: 1.2, Fc_perp: 4.0, Fc: 12.1, E: 12500, Emin: 4550 },
  '24F-V4': { Fb: 16.5, Ft: 9.0, Fv: 1.7, Fc_perp: 4.6, Fc: 11.0, E: 12400, Emin: 6500 },
  '24F-V8': { Fb: 16.5, Ft: 9.0, Fv: 1.7, Fc_perp: 4.6, Fc: 11.0, E: 13100, Emin: 6900 },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateSteelBeam(input: SteelBeamInput): SteelBeamResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find section properties
  const section = steelBeamSections.find(s => s.designation === input.profileSize);
  if (!section) {
    errors.push(`Section ${input.profileSize} not found in database`);
    return {
      isValid: false,
      errors,
      warnings,
      flexure: { Mu: 0, phiMn: 0, ratio: 0 },
      shear: { Vu: 0, phiVn: 0, ratio: 0 },
      deflection: { actual: 0, allowable: 0, ratio: 0 },
      weight: 0,
      reactions: { left: 0, right: 0 },
    };
  }

  const grade = steelGradeProps[input.steelGrade] || steelGradeProps['A36'];
  const L = input.spanLength;
  const w = input.deadLoad + input.liveLoad; // kN/m
  const wFactored = 1.2 * input.deadLoad + 1.6 * input.liveLoad;

  // Calculate moment and shear based on support type and load
  let Mu: number; // factored moment (kN-m)
  let Vu: number; // factored shear (kN)
  let leftReaction: number;
  let rightReaction: number;
  let deflectionCoeff: number;

  switch (input.supportType) {
    case 'simple':
      if (input.loadType === 'uniform') {
        Mu = (wFactored * L * L) / 8 / 1e6;
        Vu = (wFactored * L) / 2 / 1e3;
        leftReaction = rightReaction = (w * L) / 2 / 1e3;
        deflectionCoeff = 5 / 384;
      } else { // point-center
        Mu = (wFactored * L) / 4 / 1e3;
        Vu = wFactored / 2;
        leftReaction = rightReaction = w / 2;
        deflectionCoeff = 1 / 48;
      }
      break;
    case 'fixed-fixed':
      if (input.loadType === 'uniform') {
        Mu = (wFactored * L * L) / 12 / 1e6;
        Vu = (wFactored * L) / 2 / 1e3;
        leftReaction = rightReaction = (w * L) / 2 / 1e3;
        deflectionCoeff = 1 / 384;
      } else {
        Mu = (wFactored * L) / 8 / 1e3;
        Vu = wFactored / 2;
        leftReaction = rightReaction = w / 2;
        deflectionCoeff = 1 / 192;
      }
      break;
    case 'cantilever':
      if (input.loadType === 'uniform') {
        Mu = (wFactored * L * L) / 2 / 1e6;
        Vu = (wFactored * L) / 1e3;
        leftReaction = (w * L) / 1e3;
        rightReaction = 0;
        deflectionCoeff = 1 / 8;
      } else {
        Mu = (wFactored * L) / 1e3;
        Vu = wFactored;
        leftReaction = w;
        rightReaction = 0;
        deflectionCoeff = 1 / 3;
      }
      break;
    default:
      // Default to simple span
      Mu = (wFactored * L * L) / 8 / 1e6;
      Vu = (wFactored * L) / 2 / 1e3;
      leftReaction = rightReaction = (w * L) / 2 / 1e3;
      deflectionCoeff = 5 / 384;
  }

  // Moment capacity (phi = 0.9 for flexure)
  const Zx = section.Zx * 1e3; // mm³
  const Mn = (grade.Fy * Zx) / 1e6; // kN-m
  const phiMn = 0.9 * Mn;
  const flexureRatio = Mu / phiMn;

  if (flexureRatio > 1.0) {
    errors.push(`Flexural demand (${Mu.toFixed(1)} kN-m) exceeds capacity (${phiMn.toFixed(1)} kN-m)`);
  } else if (flexureRatio > 0.9) {
    warnings.push(`Flexural utilization at ${(flexureRatio * 100).toFixed(0)}%`);
  }

  // Shear capacity (phi = 1.0 for shear)
  const Aw = section.d * section.tw; // mm²
  const Cv = 1.0; // assuming no web buckling
  const Vn = 0.6 * grade.Fy * Aw * Cv / 1e3; // kN
  const phiVn = 1.0 * Vn;
  const shearRatio = Vu / phiVn;

  if (shearRatio > 1.0) {
    errors.push(`Shear demand (${Vu.toFixed(1)} kN) exceeds capacity (${phiVn.toFixed(1)} kN)`);
  }

  // Deflection (service loads)
  const Ix = section.Ix * 1e6; // mm⁴
  const wService = w * 1e3 / 1e6; // N/mm for uniform
  let deflection: number;
  if (input.loadType === 'uniform') {
    deflection = (deflectionCoeff * wService * Math.pow(L, 4)) / (grade.E * Ix);
  } else {
    const P = w * 1e3; // N
    deflection = (deflectionCoeff * P * Math.pow(L, 3)) / (grade.E * Ix);
  }

  const deflectionLimitRatio = parseInt(input.deflectionLimit.split('/')[1]);
  const allowableDeflection = L / deflectionLimitRatio;
  const deflectionRatio = deflection / allowableDeflection;

  if (deflectionRatio > 1.0) {
    errors.push(`Deflection (${deflection.toFixed(1)} mm) exceeds ${input.deflectionLimit} limit`);
  }

  // Weight
  const weight = (section.W * L) / 1000;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    flexure: {
      Mu,
      phiMn,
      ratio: flexureRatio,
    },
    shear: {
      Vu,
      phiVn,
      ratio: shearRatio,
    },
    deflection: {
      actual: deflection,
      allowable: allowableDeflection,
      ratio: deflectionRatio,
    },
    weight,
    reactions: {
      left: leftReaction,
      right: rightReaction,
    },
  };
}

export function calculateWoodBeam(input: WoodBeamInput): WoodBeamResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find section
  const nominalStr = `${input.nominalWidth}${input.nominalDepth}`;
  const section = woodSections.find(s => s.nominal === nominalStr);
  if (!section) {
    errors.push(`Section ${nominalStr} not found`);
  }

  const grade = woodGrades[input.speciesGrade] || woodGrades['SPF-2'];
  const sec = section || woodSections[4]; // default 2x10

  // Adjustment factors
  const CD = {
    'permanent': 0.9,
    'ten-years': 1.0,
    'two-months': 1.15,
    'seven-days': 1.25,
    'ten-minutes': 1.6,
    'impact': 2.0,
  }[input.loadDuration] || 1.0;

  const CM = input.moistureCondition === 'wet' ? 0.85 : 1.0;
  const Ct = 1.0; // normal temperature
  const CF = sec.actual_d <= 89 ? 1.5 : (sec.actual_d <= 140 ? 1.3 : 1.0);
  const CL = 1.0; // assuming laterally supported
  const Cr = input.plyCount >= 3 ? 1.15 : 1.0;

  // Adjusted allowables
  const Fb_adj = grade.Fb * CD * CM * Ct * CL * CF * Cr;
  const Fv_adj = grade.Fv * CD * CM * Ct;
  const Fc_perp_adj = grade.Fc_perp * CM * Ct;

  const L = input.spanLength;
  const w = input.deadLoad + input.liveLoad; // kN/m
  const w_live = input.liveLoad;

  // Bending
  const M = (w * L * L) / 8 / 1e6; // kN-m
  const Sx = sec.Sx * 1e3 * input.plyCount; // mm³
  const fb_actual = (M * 1e6) / Sx; // MPa

  const bendingRatio = fb_actual / Fb_adj;
  if (bendingRatio > 1.0) {
    errors.push(`Bending stress (${fb_actual.toFixed(1)} MPa) exceeds allowable (${Fb_adj.toFixed(1)} MPa)`);
  }

  // Shear
  const V = (w * L) / 2 / 1e3; // kN
  const A = sec.A * input.plyCount;
  const fv_actual = (1.5 * V * 1e3) / A; // MPa

  const shearRatio = fv_actual / Fv_adj;
  if (shearRatio > 1.0) {
    errors.push(`Shear stress (${fv_actual.toFixed(1)} MPa) exceeds allowable (${Fv_adj.toFixed(1)} MPa)`);
  }

  // Deflection
  const Ix = sec.Ix * 1e6 * input.plyCount; // mm⁴
  const E = grade.E;
  const w_mm = w * 1e3 / 1e6; // N/mm
  const wL_mm = w_live * 1e3 / 1e6;

  const totalDeflection = (5 * w_mm * Math.pow(L, 4)) / (384 * E * Ix);
  const liveDeflection = (5 * wL_mm * Math.pow(L, 4)) / (384 * E * Ix);
  const allowableLive = L / 360;
  const allowableTotal = L / 240;

  if (liveDeflection > allowableLive) {
    errors.push(`Live load deflection (${liveDeflection.toFixed(1)} mm) exceeds L/360`);
  }
  if (totalDeflection > allowableTotal) {
    warnings.push(`Total deflection (${totalDeflection.toFixed(1)} mm) exceeds L/240`);
  }

  // Bearing
  const R = (w * L) / 2 / 1e3; // kN reaction
  const bearingArea = sec.actual_b * input.plyCount * input.bearingLength; // mm²
  const fc_perp = (R * 1e3) / bearingArea; // MPa

  const bearingRatio = fc_perp / Fc_perp_adj;
  if (bearingRatio > 1.0) {
    errors.push(`Bearing stress (${fc_perp.toFixed(1)} MPa) exceeds allowable`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    bending: {
      fb_actual,
      Fb_adjusted: Fb_adj,
      ratio: bendingRatio,
    },
    shear: {
      fv_actual,
      Fv_adjusted: Fv_adj,
      ratio: shearRatio,
    },
    deflection: {
      live: liveDeflection,
      total: totalDeflection,
      allowable_live: allowableLive,
      allowable_total: allowableTotal,
    },
    bearing: {
      fc_perp,
      Fc_perp_adjusted: Fc_perp_adj,
      ratio: bearingRatio,
    },
    adjustmentFactors: {
      CD,
      CM,
      Ct,
      CL,
      CF,
      Cr,
    },
  };
}

// Export section databases for reference
export { steelBeamSections, steelGradeProps, woodSections, woodGrades };
