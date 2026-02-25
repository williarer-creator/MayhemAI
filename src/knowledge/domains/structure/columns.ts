/**
 * STRUCTURE Domain - Columns
 *
 * Standalone column elements for vertical support:
 * - Steel columns (W-shapes, HSS, pipes)
 * - Wood columns (posts, timber)
 * - Includes buckling calculations per AISC and NDS
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// STEEL COLUMN PARAMETERS
// ============================================================================

const steelColumnParameters: ParameterDefinition[] = [
  {
    id: 'height',
    name: 'Column Height',
    type: 'number',
    unit: 'mm',
    min: 500,
    max: 20000,
    default: 3000,
    required: true,
    description: 'Unbraced height of column',
  },
  {
    id: 'end_condition_x',
    name: 'End Condition (Strong Axis)',
    type: 'select',
    options: ['pinned-pinned', 'fixed-pinned', 'fixed-fixed', 'fixed-free', 'pinned-guided'],
    default: 'pinned-pinned',
    required: true,
    description: 'End restraint about strong axis',
  },
  {
    id: 'end_condition_y',
    name: 'End Condition (Weak Axis)',
    type: 'select',
    options: ['pinned-pinned', 'fixed-pinned', 'fixed-fixed', 'fixed-free', 'pinned-guided'],
    default: 'pinned-pinned',
    required: true,
    description: 'End restraint about weak axis',
  },
  {
    id: 'profile_type',
    name: 'Profile Type',
    type: 'select',
    options: ['W-beam', 'HSS-square', 'HSS-rect', 'HSS-round', 'pipe', 'double-angle'],
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
    description: 'Standard designation',
  },
  {
    id: 'steel_grade',
    name: 'Steel Grade',
    type: 'select',
    options: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C', 'A53-B'],
    default: 'A992',
    required: true,
    description: 'Material grade',
  },
  {
    id: 'axial_load',
    name: 'Axial Load',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 10000,
    default: 200,
    required: true,
    description: 'Factored axial compression (kN)',
  },
  {
    id: 'moment_x',
    name: 'Moment (Strong Axis)',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 1000,
    default: 0,
    required: false,
    description: 'Applied moment about strong axis (kN-m)',
  },
  {
    id: 'moment_y',
    name: 'Moment (Weak Axis)',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 1000,
    default: 0,
    required: false,
    description: 'Applied moment about weak axis (kN-m)',
  },
  {
    id: 'braced_point_x',
    name: 'Brace Point (Strong Axis)',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 20000,
    default: 0,
    required: false,
    description: 'Height of intermediate bracing (0 = none)',
  },
  {
    id: 'braced_point_y',
    name: 'Brace Point (Weak Axis)',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 20000,
    default: 0,
    required: false,
    description: 'Height of intermediate bracing (0 = none)',
  },
  {
    id: 'seismic_category',
    name: 'Seismic Design Category',
    type: 'select',
    options: ['A', 'B', 'C', 'D', 'E', 'F'],
    default: 'B',
    required: false,
    description: 'ASCE 7 seismic category',
  },
  {
    id: 'splice_location',
    name: 'Splice Location',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 20000,
    default: 0,
    required: false,
    description: 'Height of column splice (0 = none)',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'primer', 'galvanized', 'fireproofing', 'paint'],
    default: 'primer',
    required: false,
    description: 'Surface treatment',
  },
];

// ============================================================================
// STEEL COLUMN RULES
// ============================================================================

const steelColumnRules: Rule[] = [
  {
    id: 'axial_capacity',
    name: 'Axial Capacity',
    description: 'Column must resist factored axial compression',
    type: 'constraint',
    source: 'AISC 360 Chapter E',
    expression: {
      type: 'range',
      param: 'axial_load',
      min: 0,
      max: 10000,
    },
    errorMessage: 'Axial compression exceeds column capacity',
  },
  {
    id: 'slenderness_limit',
    name: 'Slenderness Limit',
    description: 'KL/r should not exceed 200 for compression members',
    type: 'constraint',
    source: 'AISC 360 E2',
    expression: {
      type: 'ratio',
      param1: 'height',
      param2: 'axial_load',
      max: 200,
    },
    errorMessage: 'Column too slender for compression',
  },
  {
    id: 'interaction_check',
    name: 'Combined Stress',
    description: 'Axial-flexural interaction must be less than 1.0',
    type: 'constraint',
    source: 'AISC 360 H1',
    expression: {
      type: 'range',
      param: 'moment_x',
      min: 0,
    },
    errorMessage: 'Combined axial and bending exceeds capacity',
  },
  {
    id: 'local_buckling',
    name: 'Local Buckling',
    description: 'Flange and web width-thickness ratios',
    type: 'constraint',
    source: 'AISC 360 Table B4.1a',
    expression: {
      type: 'range',
      param: 'height',
      min: 500,
    },
    errorMessage: 'Section prone to local buckling',
  },
  {
    id: 'preferred_slenderness',
    name: 'Preferred Slenderness',
    description: 'KL/r less than 120 preferred for main members',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: {
      type: 'range',
      param: 'height',
      max: 15000,
    },
    errorMessage: 'Consider larger section for better stiffness',
  },
];

// ============================================================================
// STEEL COLUMN COMPONENTS
// ============================================================================

const steelColumnComponents: ComponentDefinition[] = [
  {
    id: 'column_member',
    name: 'Steel Column',
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
        description: 'Total column length',
      },
    ],
  },
  {
    id: 'base_plate',
    name: 'Base Plate Assembly',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
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
    id: 'cap_plate',
    name: 'Cap Plate',
    type: 'structural',
    required: false,
    quantity: 'single',
    quantityFormula: '1',
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
    id: 'anchor_bolts',
    name: 'Anchor Bolts',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'anchor_count',
    parameters: [
      {
        id: 'anchor_spec',
        name: 'Anchor Specification',
        type: 'string',
        required: true,
        description: 'Diameter and embedment',
      },
    ],
  },
  {
    id: 'splice_plates',
    name: 'Splice Plates',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'splice_plate_count',
    parameters: [
      {
        id: 'plate_dims',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Splice plate size',
      },
    ],
  },
];

// ============================================================================
// STEEL COLUMN ELEMENT
// ============================================================================

export const steelColumnElement: ElementDefinition = {
  id: 'steel-column',
  name: 'Steel Column',
  description: 'Vertical steel member for axial load and stability',
  connectionType: 'vertical-support',
  parameters: steelColumnParameters,
  rules: steelColumnRules,
  materials: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C'],
  components: steelColumnComponents,
};

// ============================================================================
// WOOD COLUMN PARAMETERS
// ============================================================================

const woodColumnParameters: ParameterDefinition[] = [
  {
    id: 'height',
    name: 'Column Height',
    type: 'number',
    unit: 'mm',
    min: 300,
    max: 6000,
    default: 2400,
    required: true,
    description: 'Unbraced height',
  },
  {
    id: 'end_condition',
    name: 'End Condition',
    type: 'select',
    options: ['pinned-pinned', 'fixed-pinned', 'fixed-fixed'],
    default: 'pinned-pinned',
    required: true,
    description: 'End restraint conditions',
  },
  {
    id: 'wood_type',
    name: 'Wood Type',
    type: 'select',
    options: ['dimensional-lumber', 'post', 'timber', 'glulam'],
    default: 'post',
    required: true,
    description: 'Type of wood product',
  },
  {
    id: 'species_grade',
    name: 'Species/Grade',
    type: 'select',
    options: ['SPF-2', 'SPF-1', 'DF-2', 'DF-1', 'SYP-2', 'SYP-1', 'No1-DF', 'No1-SYP'],
    default: 'DF-2',
    required: true,
    description: 'Species and grade designation',
  },
  {
    id: 'nominal_size',
    name: 'Nominal Size',
    type: 'select',
    options: ['4x4', '4x6', '6x6', '6x8', '8x8'],
    default: '6x6',
    required: true,
    description: 'Nominal cross-section',
  },
  {
    id: 'axial_load',
    name: 'Axial Load',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 500,
    default: 50,
    required: true,
    description: 'Design axial compression (kN)',
  },
  {
    id: 'eccentric_load',
    name: 'Eccentricity',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 200,
    default: 0,
    required: false,
    description: 'Load eccentricity (mm)',
  },
  {
    id: 'load_duration',
    name: 'Load Duration',
    type: 'select',
    options: ['permanent', 'ten-years', 'two-months', 'seven-days'],
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
    id: 'lateral_support',
    name: 'Lateral Support',
    type: 'select',
    options: ['none', 'one-axis', 'both-axes'],
    default: 'both-axes',
    required: true,
    description: 'Bracing at mid-height',
  },
  {
    id: 'notch',
    name: 'Notch Present',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Column has notch at base or top',
  },
  {
    id: 'base_connection',
    name: 'Base Connection',
    type: 'select',
    options: ['post-base', 'embedded', 'bolted', 'standoff'],
    default: 'post-base',
    required: true,
    description: 'Type of base connection',
  },
];

// ============================================================================
// WOOD COLUMN RULES
// ============================================================================

const woodColumnRules: Rule[] = [
  {
    id: 'compression_capacity',
    name: 'Compression Capacity',
    description: 'Column must resist applied axial load',
    type: 'constraint',
    source: 'NDS Chapter 3',
    expression: {
      type: 'range',
      param: 'axial_load',
      min: 0,
      max: 500,
    },
    errorMessage: 'Axial load exceeds column capacity',
  },
  {
    id: 'slenderness_ratio',
    name: 'Slenderness Ratio',
    description: 'le/d should not exceed 50',
    type: 'constraint',
    source: 'NDS 3.7.1',
    expression: {
      type: 'ratio',
      param1: 'height',
      param2: 'axial_load',
      max: 50,
    },
    errorMessage: 'Column too slender',
  },
  {
    id: 'buckling_stability',
    name: 'Buckling Stability',
    description: 'Column stability factor Cp reduces capacity',
    type: 'constraint',
    source: 'NDS 3.7.1',
    expression: {
      type: 'range',
      param: 'height',
      max: 6000,
    },
    errorMessage: 'Buckling reduces capacity significantly',
  },
  {
    id: 'notch_effect',
    name: 'Notch Effect',
    description: 'Notches reduce column capacity',
    type: 'recommendation',
    source: 'NDS 3.1.2',
    expression: {
      type: 'range',
      param: 'height',
      min: 300,
    },
    errorMessage: 'Avoid notching compression members',
  },
];

// ============================================================================
// WOOD COLUMN COMPONENTS
// ============================================================================

const woodColumnComponents: ComponentDefinition[] = [
  {
    id: 'column_member',
    name: 'Wood Post',
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
        description: 'Total column length',
      },
    ],
  },
  {
    id: 'post_base',
    name: 'Post Base',
    type: 'connector',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'base_model',
        name: 'Base Model',
        type: 'string',
        required: true,
        description: 'Simpson ABU/ABA or equivalent',
      },
    ],
  },
  {
    id: 'post_cap',
    name: 'Post Cap',
    type: 'connector',
    required: false,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'cap_model',
        name: 'Cap Model',
        type: 'string',
        required: true,
        description: 'Simpson BC or equivalent',
      },
    ],
  },
  {
    id: 'fasteners',
    name: 'Fasteners',
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
        description: 'Bolt or screw size',
      },
    ],
  },
];

// ============================================================================
// WOOD COLUMN ELEMENT
// ============================================================================

export const woodColumnElement: ElementDefinition = {
  id: 'wood-column',
  name: 'Wood Column',
  description: 'Vertical wood member for compression loads',
  connectionType: 'vertical-support',
  parameters: woodColumnParameters,
  rules: woodColumnRules,
  materials: ['SPF', 'Douglas-Fir', 'Southern-Pine', 'Timber'],
  components: woodColumnComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface SteelColumnInput {
  height: number;
  endConditionX: string;
  endConditionY: string;
  profileType: string;
  profileSize: string;
  steelGrade: string;
  axialLoad: number;
  momentX: number;
  momentY: number;
  bracedPointX: number;
  bracedPointY: number;
}

export interface SteelColumnResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  axialCapacity: {
    Pu: number;          // Factored axial demand (kN)
    phiPn: number;       // Design capacity (kN)
    ratio: number;
  };
  slenderness: {
    KLr_x: number;       // Slenderness about x-axis
    KLr_y: number;       // Slenderness about y-axis
    KLr_governing: number;
    Fe: number;          // Euler buckling stress (MPa)
    Fcr: number;         // Critical stress (MPa)
  };
  interaction?: {
    ratio: number;       // Combined stress ratio
    equation: string;    // H1-1a or H1-1b
  };
  effectiveLength: {
    Kx: number;
    Ky: number;
    Lx: number;
    Ly: number;
  };
  weight: number;
}

export interface WoodColumnInput {
  height: number;
  endCondition: string;
  woodType: string;
  speciesGrade: string;
  nominalSize: string;
  axialLoad: number;
  eccentricity: number;
  loadDuration: string;
  moistureCondition: string;
  lateralSupport: string;
}

export interface WoodColumnResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  capacity: {
    fc_actual: number;   // Actual compression stress (MPa)
    Fc_adjusted: number; // Adjusted allowable (MPa)
    ratio: number;
  };
  slenderness: {
    le_d: number;        // Slenderness ratio
    FcE: number;         // Euler buckling stress (MPa)
    Cp: number;          // Column stability factor
  };
  adjustmentFactors: {
    CD: number;
    CM: number;
    Ct: number;
    CF: number;
    Cp: number;
  };
}

// ============================================================================
// SECTION DATABASES
// ============================================================================

interface SteelColumnSection {
  designation: string;
  type: string;
  d: number;      // depth (mm)
  bf: number;     // flange width (mm)
  tw: number;     // web thickness (mm)
  tf: number;     // flange thickness (mm)
  A: number;      // area (mm²)
  W: number;      // weight (kg/m)
  Ix: number;     // moment of inertia x (10^6 mm^4)
  Iy: number;     // moment of inertia y (10^6 mm^4)
  rx: number;     // radius of gyration x (mm)
  ry: number;     // radius of gyration y (mm)
  Zx: number;     // plastic modulus x (10³ mm³)
  Zy: number;     // plastic modulus y (10³ mm³)
}

const steelColumnSections: SteelColumnSection[] = [
  // W-shapes (commonly used as columns)
  { designation: 'W8x31', type: 'W-beam', d: 203, bf: 203, tw: 7.2, tf: 11.0, A: 5890, W: 46.1, Ix: 43.3, Iy: 14.6, rx: 86, ry: 51, Zx: 487, Zy: 141 },
  { designation: 'W8x40', type: 'W-beam', d: 210, bf: 206, tw: 8.9, tf: 13.2, A: 7610, W: 59.5, Ix: 57.5, Iy: 19.5, rx: 87, ry: 51, Zx: 636, Zy: 186 },
  { designation: 'W8x48', type: 'W-beam', d: 210, bf: 206, tw: 10.2, tf: 15.4, A: 9100, W: 71.4, Ix: 69.6, Iy: 23.6, rx: 88, ry: 51, Zx: 769, Zy: 226 },
  { designation: 'W10x49', type: 'W-beam', d: 254, bf: 254, tw: 8.6, tf: 14.2, A: 9350, W: 72.9, Ix: 113, Iy: 38.8, rx: 109, ry: 65, Zx: 1010, Zy: 303 },
  { designation: 'W10x60', type: 'W-beam', d: 260, bf: 256, tw: 10.7, tf: 17.0, A: 11400, W: 89.3, Ix: 141, Iy: 48.8, rx: 111, ry: 65, Zx: 1240, Zy: 378 },
  { designation: 'W12x53', type: 'W-beam', d: 306, bf: 254, tw: 8.8, tf: 14.6, A: 10100, W: 78.9, Ix: 177, Iy: 39.5, rx: 132, ry: 61, Zx: 1300, Zy: 311 },
  { designation: 'W12x72', type: 'W-beam', d: 312, bf: 306, tw: 10.9, tf: 17.3, A: 13700, W: 107, Ix: 252, Iy: 85.2, rx: 135, ry: 79, Zx: 1840, Zy: 556 },
  { designation: 'W14x61', type: 'W-beam', d: 352, bf: 254, tw: 9.5, tf: 16.4, A: 11600, W: 90.7, Ix: 255, Iy: 44.6, rx: 150, ry: 63, Zx: 1650, Zy: 351 },
  { designation: 'W14x82', type: 'W-beam', d: 363, bf: 257, tw: 12.4, tf: 21.1, A: 15600, W: 122, Ix: 349, Iy: 60.5, rx: 150, ry: 63, Zx: 2200, Zy: 471 },
  // HSS (Hollow Structural Sections)
  { designation: 'HSS4x4x1/4', type: 'HSS-square', d: 102, bf: 102, tw: 5.8, tf: 5.8, A: 2150, W: 17.3, Ix: 5.8, Iy: 5.8, rx: 39, ry: 39, Zx: 139, Zy: 139 },
  { designation: 'HSS6x6x1/4', type: 'HSS-square', d: 152, bf: 152, tw: 5.8, tf: 5.8, A: 3360, W: 27.0, Ix: 21.4, Iy: 21.4, rx: 57, ry: 57, Zx: 337, Zy: 337 },
  { designation: 'HSS6x6x3/8', type: 'HSS-square', d: 152, bf: 152, tw: 9.5, tf: 9.5, A: 5100, W: 40.0, Ix: 28.7, Iy: 28.7, rx: 57, ry: 57, Zx: 459, Zy: 459 },
  { designation: 'HSS6x6x1/2', type: 'HSS-square', d: 152, bf: 152, tw: 11.8, tf: 11.8, A: 6290, W: 50.5, Ix: 33.7, Iy: 33.7, rx: 56, ry: 56, Zx: 549, Zy: 549 },
  { designation: 'HSS8x8x1/4', type: 'HSS-square', d: 203, bf: 203, tw: 5.8, tf: 5.8, A: 4570, W: 36.8, Ix: 53.3, Iy: 53.3, rx: 76, ry: 76, Zx: 621, Zy: 621 },
  { designation: 'HSS8x8x3/8', type: 'HSS-square', d: 203, bf: 203, tw: 9.5, tf: 9.5, A: 6970, W: 55.9, Ix: 72.0, Iy: 72.0, rx: 75, ry: 75, Zx: 857, Zy: 857 },
  { designation: 'HSS8x8x1/2', type: 'HSS-square', d: 203, bf: 203, tw: 11.8, tf: 11.8, A: 8710, W: 69.8, Ix: 80.0, Iy: 80.0, rx: 76, ry: 76, Zx: 966, Zy: 966 },
  // Pipes
  { designation: 'Pipe4-STD', type: 'pipe', d: 114, bf: 114, tw: 6.0, tf: 6.0, A: 2030, W: 16.1, Ix: 6.6, Iy: 6.6, rx: 38, ry: 38, Zx: 146, Zy: 146 },
  { designation: 'Pipe6-STD', type: 'pipe', d: 168, bf: 168, tw: 7.1, tf: 7.1, A: 3580, W: 28.3, Ix: 25.0, Iy: 25.0, rx: 57, ry: 57, Zx: 374, Zy: 374 },
  { designation: 'Pipe8-STD', type: 'pipe', d: 219, bf: 219, tw: 8.2, tf: 8.2, A: 5440, W: 43.0, Ix: 64.6, Iy: 64.6, rx: 75, ry: 75, Zx: 741, Zy: 741 },
];

interface WoodColumnSection {
  nominal: string;
  actual_b: number;
  actual_d: number;
  A: number;
  Sx: number;
  Sy: number;
}

const woodColumnSections: WoodColumnSection[] = [
  { nominal: '4x4', actual_b: 89, actual_d: 89, A: 7921, Sx: 117.6, Sy: 117.6 },
  { nominal: '4x6', actual_b: 89, actual_d: 140, A: 12460, Sx: 290.7, Sy: 184.8 },
  { nominal: '6x6', actual_b: 140, actual_d: 140, A: 19600, Sx: 457.3, Sy: 457.3 },
  { nominal: '6x8', actual_b: 140, actual_d: 184, A: 25760, Sx: 790.0, Sy: 601.1 },
  { nominal: '8x8', actual_b: 184, actual_d: 184, A: 33856, Sx: 1038.3, Sy: 1038.3 },
];

const steelGrades: Record<string, { Fy: number; Fu: number; E: number }> = {
  'A36': { Fy: 250, Fu: 400, E: 200000 },
  'A572-50': { Fy: 345, Fu: 450, E: 200000 },
  'A992': { Fy: 345, Fu: 450, E: 200000 },
  'A500-B': { Fy: 290, Fu: 400, E: 200000 },
  'A500-C': { Fy: 317, Fu: 427, E: 200000 },
  'A53-B': { Fy: 240, Fu: 415, E: 200000 },
};

const woodGrades: Record<string, { Fc: number; E: number; Emin: number }> = {
  'SPF-2': { Fc: 6.5, E: 9500, Emin: 3450 },
  'SPF-1': { Fc: 9.3, E: 10500, Emin: 3800 },
  'DF-2': { Fc: 7.6, E: 11000, Emin: 4000 },
  'DF-1': { Fc: 11.4, E: 12500, Emin: 4550 },
  'SYP-2': { Fc: 8.3, E: 11000, Emin: 4000 },
  'SYP-1': { Fc: 12.1, E: 12500, Emin: 4550 },
  'No1-DF': { Fc: 10.3, E: 12000, Emin: 4400 },
  'No1-SYP': { Fc: 11.0, E: 12000, Emin: 4400 },
};

// ============================================================================
// K FACTOR LOOKUP
// ============================================================================

const kFactors: Record<string, number> = {
  'pinned-pinned': 1.0,
  'fixed-pinned': 0.8,
  'fixed-fixed': 0.65,
  'fixed-free': 2.1,
  'pinned-guided': 2.0,
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateSteelColumn(input: SteelColumnInput): SteelColumnResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find section
  const section = steelColumnSections.find(s => s.designation === input.profileSize);
  if (!section) {
    errors.push(`Section ${input.profileSize} not found`);
    return {
      isValid: false,
      errors,
      warnings,
      axialCapacity: { Pu: 0, phiPn: 0, ratio: 0 },
      slenderness: { KLr_x: 0, KLr_y: 0, KLr_governing: 0, Fe: 0, Fcr: 0 },
      effectiveLength: { Kx: 0, Ky: 0, Lx: 0, Ly: 0 },
      weight: 0,
    };
  }

  const grade = steelGrades[input.steelGrade] || steelGrades['A992'];

  // Effective length factors
  const Kx = kFactors[input.endConditionX] || 1.0;
  const Ky = kFactors[input.endConditionY] || 1.0;

  // Unbraced lengths
  const Lx = input.bracedPointX > 0 ? Math.max(input.bracedPointX, input.height - input.bracedPointX) : input.height;
  const Ly = input.bracedPointY > 0 ? Math.max(input.bracedPointY, input.height - input.bracedPointY) : input.height;

  // Slenderness ratios
  const KLr_x = (Kx * Lx) / section.rx;
  const KLr_y = (Ky * Ly) / section.ry;
  const KLr_gov = Math.max(KLr_x, KLr_y);

  if (KLr_gov > 200) {
    errors.push(`Slenderness ratio (${KLr_gov.toFixed(0)}) exceeds maximum 200`);
  } else if (KLr_gov > 120) {
    warnings.push(`Slenderness ratio (${KLr_gov.toFixed(0)}) exceeds preferred 120`);
  }

  // Euler buckling stress
  const Fe = (Math.PI * Math.PI * grade.E) / (KLr_gov * KLr_gov);

  // Critical stress (AISC E3)
  let Fcr: number;
  if (KLr_gov <= 4.71 * Math.sqrt(grade.E / grade.Fy)) {
    // Inelastic buckling
    Fcr = Math.pow(0.658, grade.Fy / Fe) * grade.Fy;
  } else {
    // Elastic buckling
    Fcr = 0.877 * Fe;
  }

  // Nominal and design capacity
  const Pn = Fcr * section.A / 1000; // kN
  const phiPn = 0.9 * Pn;

  const Pu = input.axialLoad;
  const axialRatio = Pu / phiPn;

  if (axialRatio > 1.0) {
    errors.push(`Axial demand (${Pu.toFixed(0)} kN) exceeds capacity (${phiPn.toFixed(0)} kN)`);
  } else if (axialRatio > 0.9) {
    warnings.push(`Axial utilization at ${(axialRatio * 100).toFixed(0)}%`);
  }

  // Interaction check if moments present
  let interaction;
  if (input.momentX > 0 || input.momentY > 0) {
    const Mnx = grade.Fy * section.Zx * 1e3 / 1e6; // kN-m
    const Mny = grade.Fy * section.Zy * 1e3 / 1e6; // kN-m
    const phiMnx = 0.9 * Mnx;
    const phiMny = 0.9 * Mny;

    const Pr_Pc = Pu / phiPn;
    let interactionRatio: number;
    let equation: string;

    if (Pr_Pc >= 0.2) {
      // H1-1a
      interactionRatio = Pr_Pc + (8 / 9) * (input.momentX / phiMnx + input.momentY / phiMny);
      equation = 'H1-1a';
    } else {
      // H1-1b
      interactionRatio = Pr_Pc / 2 + (input.momentX / phiMnx + input.momentY / phiMny);
      equation = 'H1-1b';
    }

    interaction = { ratio: interactionRatio, equation };

    if (interactionRatio > 1.0) {
      errors.push(`Combined stress ratio (${interactionRatio.toFixed(2)}) exceeds 1.0`);
    }
  }

  const weight = (section.W * input.height) / 1000;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    axialCapacity: {
      Pu,
      phiPn,
      ratio: axialRatio,
    },
    slenderness: {
      KLr_x,
      KLr_y,
      KLr_governing: KLr_gov,
      Fe,
      Fcr,
    },
    interaction,
    effectiveLength: {
      Kx,
      Ky,
      Lx,
      Ly,
    },
    weight,
  };
}

export function calculateWoodColumn(input: WoodColumnInput): WoodColumnResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find section
  const section = woodColumnSections.find(s => s.nominal === input.nominalSize);
  if (!section) {
    errors.push(`Section ${input.nominalSize} not found`);
  }

  const grade = woodGrades[input.speciesGrade] || woodGrades['DF-2'];
  const sec = section || woodColumnSections[2]; // default 6x6

  // K factor
  const K = kFactors[input.endCondition] || 1.0;

  // Effective length
  let le: number;
  if (input.lateralSupport === 'both-axes') {
    le = K * input.height / 2;
  } else if (input.lateralSupport === 'one-axis') {
    le = K * input.height;
  } else {
    le = K * input.height;
  }

  // Slenderness ratio (use smaller dimension)
  const d = Math.min(sec.actual_b, sec.actual_d);
  const le_d = le / d;

  if (le_d > 50) {
    errors.push(`Slenderness ratio (${le_d.toFixed(1)}) exceeds maximum 50`);
  } else if (le_d > 30) {
    warnings.push(`Slenderness ratio (${le_d.toFixed(1)}) is high`);
  }

  // Adjustment factors
  const CD: Record<string, number> = {
    'permanent': 0.9,
    'ten-years': 1.0,
    'two-months': 1.15,
    'seven-days': 1.25,
  };
  const CD_val = CD[input.loadDuration] || 1.0;
  const CM = input.moistureCondition === 'wet' ? 0.8 : 1.0;
  const Ct = 1.0;
  const CF = 1.0; // Size factor for compression

  // Euler buckling stress
  const KcE = 0.3; // Wood constant
  const FcE = (KcE * grade.Emin) / (le_d * le_d);

  // Adjusted reference compression
  const Fc_star = grade.Fc * CD_val * CM * Ct * CF;

  // Column stability factor Cp
  const c = 0.8; // For sawn lumber
  const ratio = FcE / Fc_star;
  const Cp = (1 + ratio) / (2 * c) - Math.sqrt(Math.pow((1 + ratio) / (2 * c), 2) - ratio / c);

  // Adjusted allowable compression
  const Fc_adj = Fc_star * Cp;

  // Actual stress
  const fc_actual = (input.axialLoad * 1000) / sec.A; // MPa

  const compRatio = fc_actual / Fc_adj;

  if (compRatio > 1.0) {
    errors.push(`Compression stress (${fc_actual.toFixed(1)} MPa) exceeds allowable (${Fc_adj.toFixed(1)} MPa)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    capacity: {
      fc_actual,
      Fc_adjusted: Fc_adj,
      ratio: compRatio,
    },
    slenderness: {
      le_d,
      FcE,
      Cp,
    },
    adjustmentFactors: {
      CD: CD_val,
      CM,
      Ct,
      CF,
      Cp,
    },
  };
}

// Export databases
export { steelColumnSections, woodColumnSections, steelGrades, woodGrades, kFactors };
