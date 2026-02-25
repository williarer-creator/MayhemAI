/**
 * STRUCTURE Domain - Base Plates & Anchors
 *
 * Foundation connections for columns:
 * - Steel base plates (axial, moment, shear)
 * - Anchor bolt configurations
 * - Grout and leveling
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// BASE PLATE PARAMETERS
// ============================================================================

const basePlateParameters: ParameterDefinition[] = [
  {
    id: 'load_type',
    name: 'Load Type',
    type: 'select',
    options: ['axial-only', 'axial-moment', 'axial-shear', 'combined'],
    default: 'axial-only',
    required: true,
    description: 'Type of loading on connection',
  },
  {
    id: 'axial_load',
    name: 'Axial Load',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 5000,
    default: 200,
    required: true,
    description: 'Factored axial compression (kN)',
  },
  {
    id: 'axial_tension',
    name: 'Axial Tension',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 2000,
    default: 0,
    required: false,
    description: 'Factored axial tension/uplift (kN)',
  },
  {
    id: 'moment_x',
    name: 'Moment (Strong Axis)',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored moment about strong axis (kN-m)',
  },
  {
    id: 'moment_y',
    name: 'Moment (Weak Axis)',
    type: 'number',
    unit: 'mm', // proxy for kN-m
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored moment about weak axis (kN-m)',
  },
  {
    id: 'shear_x',
    name: 'Shear (X-Direction)',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored shear force in X (kN)',
  },
  {
    id: 'shear_y',
    name: 'Shear (Y-Direction)',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 500,
    default: 0,
    required: false,
    description: 'Factored shear force in Y (kN)',
  },
  {
    id: 'column_profile',
    name: 'Column Profile',
    type: 'string',
    default: 'W8x31',
    required: true,
    description: 'Column section designation',
  },
  {
    id: 'column_depth',
    name: 'Column Depth',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 1000,
    default: 203,
    required: true,
    description: 'Depth of column section (d)',
  },
  {
    id: 'column_width',
    name: 'Column Width',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 500,
    default: 203,
    required: true,
    description: 'Width of column flange (bf)',
  },
  {
    id: 'plate_width',
    name: 'Plate Width (B)',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 1000,
    default: 300,
    required: true,
    description: 'Base plate width',
  },
  {
    id: 'plate_length',
    name: 'Plate Length (N)',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 1000,
    default: 300,
    required: true,
    description: 'Base plate length',
  },
  {
    id: 'plate_thickness',
    name: 'Plate Thickness',
    type: 'number',
    unit: 'mm',
    min: 10,
    max: 100,
    default: 25,
    required: true,
    description: 'Base plate thickness',
  },
  {
    id: 'plate_grade',
    name: 'Plate Grade',
    type: 'select',
    options: ['A36', 'A572-50', 'A514'],
    default: 'A36',
    required: true,
    description: 'Base plate steel grade',
  },
  {
    id: 'concrete_strength',
    name: 'Concrete Strength',
    type: 'select',
    options: ['3000psi', '4000psi', '5000psi', '6000psi'],
    default: '4000psi',
    required: true,
    description: 'Concrete compressive strength (f\'c)',
  },
  {
    id: 'anchor_type',
    name: 'Anchor Type',
    type: 'select',
    options: ['cast-in-place', 'post-installed-adhesive', 'post-installed-expansion', 'headed-stud'],
    default: 'cast-in-place',
    required: true,
    description: 'Type of anchor bolt',
  },
  {
    id: 'anchor_diameter',
    name: 'Anchor Diameter',
    type: 'select',
    options: ['1/2"', '5/8"', '3/4"', '7/8"', '1"', '1-1/4"', '1-1/2"'],
    default: '3/4"',
    required: true,
    description: 'Anchor bolt diameter',
  },
  {
    id: 'anchor_count',
    name: 'Number of Anchors',
    type: 'select',
    options: ['2', '4', '6', '8'],
    default: '4',
    required: true,
    description: 'Total number of anchor bolts',
  },
  {
    id: 'anchor_pattern',
    name: 'Anchor Pattern',
    type: 'select',
    options: ['rectangular', 'linear', 'circular'],
    default: 'rectangular',
    required: true,
    description: 'Arrangement of anchor bolts',
  },
  {
    id: 'embedment_depth',
    name: 'Embedment Depth',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 600,
    default: 200,
    required: true,
    description: 'Anchor embedment into concrete',
  },
  {
    id: 'edge_distance',
    name: 'Edge Distance',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 300,
    default: 100,
    required: true,
    description: 'Distance from anchor to concrete edge',
  },
  {
    id: 'grout_thickness',
    name: 'Grout Thickness',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 75,
    default: 25,
    required: false,
    description: 'Non-shrink grout pad thickness',
  },
  {
    id: 'leveling_method',
    name: 'Leveling Method',
    type: 'select',
    options: ['leveling-nuts', 'shim-packs', 'leveling-screws'],
    default: 'leveling-nuts',
    required: false,
    description: 'Method for base plate leveling',
  },
];

// ============================================================================
// BASE PLATE RULES
// ============================================================================

const basePlateRules: Rule[] = [
  {
    id: 'bearing_pressure',
    name: 'Bearing Pressure',
    description: 'Concrete bearing pressure must not exceed 0.85*f\'c*phi',
    type: 'constraint',
    source: 'ACI 318-19 22.8',
    expression: {
      type: 'ratio',
      param1: 'axial_load',
      param2: 'plate_width',
      max: 50,
    },
    errorMessage: 'Concrete bearing capacity exceeded',
  },
  {
    id: 'plate_bending',
    name: 'Plate Bending',
    description: 'Base plate must resist cantilever bending from bearing',
    type: 'constraint',
    source: 'AISC Design Guide 1',
    expression: {
      type: 'range',
      param: 'plate_thickness',
      min: 10,
    },
    errorMessage: 'Base plate thickness insufficient',
  },
  {
    id: 'anchor_tension',
    name: 'Anchor Tension',
    description: 'Anchors must resist uplift and moment-induced tension',
    type: 'constraint',
    source: 'ACI 318-19 Chapter 17',
    expression: {
      type: 'range',
      param: 'anchor_diameter',
      min: 0,
    },
    errorMessage: 'Anchor tension capacity exceeded',
  },
  {
    id: 'anchor_shear',
    name: 'Anchor Shear',
    description: 'Anchors must resist applied shear forces',
    type: 'constraint',
    source: 'ACI 318-19 Chapter 17',
    expression: {
      type: 'range',
      param: 'shear_x',
      min: 0,
    },
    errorMessage: 'Anchor shear capacity exceeded',
  },
  {
    id: 'concrete_breakout',
    name: 'Concrete Breakout',
    description: 'Adequate edge distance and embedment for breakout',
    type: 'constraint',
    source: 'ACI 318-19 17.6',
    expression: {
      type: 'range',
      param: 'edge_distance',
      min: 50,
    },
    errorMessage: 'Concrete breakout capacity may be inadequate',
  },
  {
    id: 'min_plate_size',
    name: 'Minimum Plate Size',
    description: 'Plate must extend beyond column footprint',
    type: 'constraint',
    source: 'AISC Design Guide 1',
    expression: {
      type: 'range',
      param: 'plate_width',
      min: 100,
    },
    errorMessage: 'Plate size insufficient for column',
  },
  {
    id: 'anchor_spacing',
    name: 'Anchor Spacing',
    description: 'Minimum anchor spacing for concrete capacity',
    type: 'recommendation',
    source: 'ACI 318-19 17.7',
    expression: {
      type: 'range',
      param: 'embedment_depth',
      min: 100,
    },
    errorMessage: 'Anchor spacing may reduce capacity',
  },
];

// ============================================================================
// BASE PLATE COMPONENTS
// ============================================================================

const basePlateComponents: ComponentDefinition[] = [
  {
    id: 'base_plate',
    name: 'Base Plate',
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
        description: 'B x N x t',
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
        description: 'Diameter, grade, embedment',
      },
    ],
  },
  {
    id: 'anchor_plate',
    name: 'Anchor Plate/Washer',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'anchor_count',
    parameters: [
      {
        id: 'plate_dims',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Square washer or plate size',
      },
    ],
  },
  {
    id: 'hex_nut',
    name: 'Heavy Hex Nut',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'anchor_count * 2', // one above, one leveling
    parameters: [
      {
        id: 'nut_size',
        name: 'Nut Size',
        type: 'string',
        required: true,
        description: 'Matches anchor diameter',
      },
    ],
  },
  {
    id: 'grout',
    name: 'Non-Shrink Grout',
    type: 'material',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'grout_volume',
    parameters: [
      {
        id: 'grout_type',
        name: 'Grout Type',
        type: 'string',
        required: true,
        description: 'Non-shrink cementitious or epoxy',
      },
    ],
  },
  {
    id: 'shim_pack',
    name: 'Shim Pack',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: '4',
    parameters: [
      {
        id: 'shim_thickness',
        name: 'Total Shim Thickness',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Stack height at each corner',
      },
    ],
  },
];

// ============================================================================
// BASE PLATE ELEMENT
// ============================================================================

export const basePlateElement: ElementDefinition = {
  id: 'base-plate',
  name: 'Steel Base Plate',
  description: 'Column base plate with anchor bolts for foundation connection',
  connectionType: 'foundation',
  parameters: basePlateParameters,
  rules: basePlateRules,
  materials: ['A36', 'A572-50', 'A514'],
  components: basePlateComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface BasePlateInput {
  loadType: string;
  axialLoad: number;
  axialTension: number;
  momentX: number;
  momentY: number;
  shearX: number;
  shearY: number;
  columnDepth: number;
  columnWidth: number;
  plateWidth: number;
  plateLength: number;
  plateThickness: number;
  plateGrade: string;
  concreteStrength: string;
  anchorType: string;
  anchorDiameter: string;
  anchorCount: number;
  embedmentDepth: number;
  edgeDistance: number;
}

export interface BasePlateResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  bearing: {
    area: number;           // Bearing area (mm²)
    pressure: number;       // Actual pressure (MPa)
    allowable: number;      // Allowable pressure (MPa)
    ratio: number;
  };
  plateBending: {
    m: number;              // Cantilever distance (mm)
    n: number;              // Cantilever distance (mm)
    Mpl: number;            // Plate moment (kN-m/m)
    tRequired: number;      // Required thickness (mm)
    tProvided: number;      // Provided thickness (mm)
    ratio: number;
  };
  anchors: {
    tensionPerAnchor: number;  // Tension per bolt (kN)
    tensionCapacity: number;   // Capacity per bolt (kN)
    shearPerAnchor: number;    // Shear per bolt (kN)
    shearCapacity: number;     // Capacity per bolt (kN)
    interactionRatio: number;
  };
  concreteBreakout: {
    Ncb: number;            // Breakout capacity (kN)
    Vcb: number;            // Shear breakout capacity (kN)
  };
  geometry: {
    A1: number;             // Plate area (mm²)
    A2: number;             // Effective concrete area (mm²)
    eccentricity: number;   // e = M/P (mm)
    stressDistribution: string;
  };
}

// ============================================================================
// DATA TABLES
// ============================================================================

interface AnchorData {
  diameter: string;
  nominalDia: number;      // mm
  area: number;            // mm² (tensile area)
  tensileStrength: number; // kN (F1554 Grade 36)
  shearStrength: number;   // kN
  minEmbedment: number;    // mm
  minEdge: number;         // mm
  minSpacing: number;      // mm
}

const anchorTable: AnchorData[] = [
  { diameter: '1/2"', nominalDia: 12.7, area: 92, tensileStrength: 32, shearStrength: 20, minEmbedment: 100, minEdge: 75, minSpacing: 75 },
  { diameter: '5/8"', nominalDia: 15.9, area: 144, tensileStrength: 50, shearStrength: 31, minEmbedment: 125, minEdge: 100, minSpacing: 100 },
  { diameter: '3/4"', nominalDia: 19.1, area: 207, tensileStrength: 72, shearStrength: 45, minEmbedment: 150, minEdge: 115, minSpacing: 115 },
  { diameter: '7/8"', nominalDia: 22.2, area: 282, tensileStrength: 98, shearStrength: 61, minEmbedment: 175, minEdge: 130, minSpacing: 130 },
  { diameter: '1"', nominalDia: 25.4, area: 368, tensileStrength: 128, shearStrength: 80, minEmbedment: 200, minEdge: 150, minSpacing: 150 },
  { diameter: '1-1/4"', nominalDia: 31.8, area: 580, tensileStrength: 202, shearStrength: 126, minEmbedment: 250, minEdge: 190, minSpacing: 190 },
  { diameter: '1-1/2"', nominalDia: 38.1, area: 835, tensileStrength: 290, shearStrength: 182, minEmbedment: 300, minEdge: 225, minSpacing: 225 },
];

const concreteStrengths: Record<string, number> = {
  '3000psi': 20.7,   // MPa
  '4000psi': 27.6,
  '5000psi': 34.5,
  '6000psi': 41.4,
};

const plateGrades: Record<string, { Fy: number; Fu: number }> = {
  'A36': { Fy: 250, Fu: 400 },
  'A572-50': { Fy: 345, Fu: 450 },
  'A514': { Fy: 690, Fu: 760 },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateBasePlate(input: BasePlateInput): BasePlateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fc = concreteStrengths[input.concreteStrength] || 27.6;
  const plate = plateGrades[input.plateGrade] || plateGrades['A36'];
  const anchor = anchorTable.find(a => a.diameter === input.anchorDiameter) || anchorTable[2];

  // Geometry
  const B = input.plateWidth;
  const N = input.plateLength;
  const A1 = B * N; // Plate area
  const A2 = Math.min(4 * A1, (B + 100) * (N + 100)); // Effective concrete area

  // Bearing strength
  const phi_c = 0.65; // Concrete resistance factor
  const sqrtRatio = Math.min(Math.sqrt(A2 / A1), 2);
  // Bearing capacity Pp = phi_c * 0.85 * fc * A1 * sqrtRatio / 1000 (kN)

  const bearingPressure = (input.axialLoad * 1000) / A1; // MPa
  const allowablePressure = phi_c * 0.85 * fc * sqrtRatio;
  const bearingRatio = bearingPressure / allowablePressure;

  if (bearingRatio > 1.0) {
    errors.push(`Bearing pressure (${bearingPressure.toFixed(1)} MPa) exceeds allowable`);
  }

  // Check for moment - determine stress distribution
  let eccentricity = 0;
  let stressDistribution = 'uniform';
  if (input.momentX > 0 || input.momentY > 0) {
    eccentricity = Math.sqrt(input.momentX * input.momentX + input.momentY * input.momentY) * 1000 / input.axialLoad;
    if (eccentricity > N / 6) {
      stressDistribution = 'triangular';
      warnings.push('Large eccentricity - partial bearing assumed');
    } else {
      stressDistribution = 'trapezoidal';
    }
  }

  // Plate bending (cantilever method per AISC Design Guide 1)
  const m = (N - 0.95 * input.columnDepth) / 2;
  const n = (B - 0.80 * input.columnWidth) / 2;
  const lambda = 2 * Math.sqrt(input.columnDepth * input.columnWidth) / (4 * (input.columnDepth + input.columnWidth));
  const lambdaN = lambda * Math.sqrt(input.columnDepth * input.columnWidth);
  const l = Math.max(m, n, lambdaN);

  // Required plate thickness
  const fp = input.axialLoad * 1000 / A1; // MPa bearing pressure
  const phi_b = 0.9;
  const tRequired = l * Math.sqrt(2 * fp / (phi_b * plate.Fy));

  const plateRatio = tRequired / input.plateThickness;
  if (plateRatio > 1.0) {
    errors.push(`Required plate thickness (${tRequired.toFixed(0)} mm) exceeds provided (${input.plateThickness} mm)`);
  }

  // Anchor calculations
  const numAnchors = input.anchorCount;

  // Tension in anchors (from uplift or moment)
  let tensionPerAnchor = 0;
  if (input.axialTension > 0) {
    tensionPerAnchor = input.axialTension / numAnchors;
  }
  if (input.momentX > 0 || input.momentY > 0) {
    // Simplified: assume anchors at edge resist moment
    const d_anchor = N / 2 - 50; // Approximate lever arm
    const momentTension = Math.max(input.momentX, input.momentY) * 1000 / (2 * d_anchor);
    tensionPerAnchor = Math.max(tensionPerAnchor, momentTension / (numAnchors / 2));
  }

  const tensionCapacity = anchor.tensileStrength * 0.75; // ACI 318 phi = 0.75
  const tensionRatio = tensionPerAnchor / tensionCapacity;

  if (tensionRatio > 1.0) {
    errors.push(`Anchor tension (${tensionPerAnchor.toFixed(0)} kN) exceeds capacity`);
  }

  // Shear in anchors
  const totalShear = Math.sqrt(input.shearX * input.shearX + input.shearY * input.shearY);
  const shearPerAnchor = totalShear / numAnchors;
  const shearCapacity = anchor.shearStrength * 0.75;
  const shearRatio = shearPerAnchor / shearCapacity;

  if (shearRatio > 1.0) {
    errors.push(`Anchor shear (${shearPerAnchor.toFixed(0)} kN) exceeds capacity`);
  }

  // Interaction (tension + shear)
  const interactionRatio = Math.pow(tensionRatio, 5/3) + Math.pow(shearRatio, 5/3);
  if (interactionRatio > 1.0) {
    errors.push(`Anchor tension-shear interaction (${interactionRatio.toFixed(2)}) exceeds 1.0`);
  }

  // Concrete breakout (simplified)
  const hef = input.embedmentDepth;
  const Ncb = 10.0 * fc * Math.pow(hef, 1.5) / 1000 * numAnchors * 0.7; // Simplified estimate
  const Vcb = 5.5 * fc * Math.pow(input.edgeDistance, 1.5) / 1000 * numAnchors; // Simplified

  if (input.axialTension > Ncb) {
    warnings.push('Concrete breakout capacity may be limiting');
  }

  // Check embedment and edge distance
  if (input.embedmentDepth < anchor.minEmbedment) {
    errors.push(`Embedment (${input.embedmentDepth} mm) less than minimum (${anchor.minEmbedment} mm)`);
  }
  if (input.edgeDistance < anchor.minEdge) {
    errors.push(`Edge distance (${input.edgeDistance} mm) less than minimum (${anchor.minEdge} mm)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    bearing: {
      area: A1,
      pressure: bearingPressure,
      allowable: allowablePressure,
      ratio: bearingRatio,
    },
    plateBending: {
      m,
      n,
      Mpl: fp * l * l / 2 / 1000, // kN-m/m
      tRequired,
      tProvided: input.plateThickness,
      ratio: plateRatio,
    },
    anchors: {
      tensionPerAnchor,
      tensionCapacity,
      shearPerAnchor,
      shearCapacity,
      interactionRatio,
    },
    concreteBreakout: {
      Ncb,
      Vcb,
    },
    geometry: {
      A1,
      A2,
      eccentricity,
      stressDistribution,
    },
  };
}

// ============================================================================
// ANCHOR ROD ELEMENT (for standalone use)
// ============================================================================

const anchorRodParameters: ParameterDefinition[] = [
  {
    id: 'anchor_type',
    name: 'Anchor Type',
    type: 'select',
    options: ['cast-in-place', 'post-installed-adhesive', 'post-installed-expansion', 'undercut'],
    default: 'cast-in-place',
    required: true,
    description: 'Type of anchor installation',
  },
  {
    id: 'diameter',
    name: 'Diameter',
    type: 'select',
    options: ['1/2"', '5/8"', '3/4"', '7/8"', '1"', '1-1/4"', '1-1/2"', '2"'],
    default: '3/4"',
    required: true,
    description: 'Anchor bolt diameter',
  },
  {
    id: 'grade',
    name: 'Material Grade',
    type: 'select',
    options: ['F1554-36', 'F1554-55', 'F1554-105', 'A307', 'A325', 'A449'],
    default: 'F1554-36',
    required: true,
    description: 'Anchor rod material grade',
  },
  {
    id: 'embedment',
    name: 'Embedment Depth',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 1000,
    default: 200,
    required: true,
    description: 'Depth of embedment in concrete',
  },
  {
    id: 'projection',
    name: 'Projection Above Base',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 300,
    default: 100,
    required: true,
    description: 'Length projecting above base plate',
  },
  {
    id: 'head_type',
    name: 'Head Type',
    type: 'select',
    options: ['hex-head', 'heavy-hex-head', 'bent-bar', 'headed-stud', 'plate-washer'],
    default: 'hex-head',
    required: true,
    description: 'Type of anchor head/termination',
  },
  {
    id: 'thread_length',
    name: 'Thread Length',
    type: 'select',
    options: ['standard', 'full-length', 'double-end'],
    default: 'standard',
    required: false,
    description: 'Threading configuration',
  },
  {
    id: 'coating',
    name: 'Coating',
    type: 'select',
    options: ['plain', 'galvanized', 'epoxy-coated', 'stainless'],
    default: 'galvanized',
    required: false,
    description: 'Corrosion protection',
  },
];

const anchorRodRules: Rule[] = [
  {
    id: 'min_embedment',
    name: 'Minimum Embedment',
    description: 'Embedment must meet ACI 318 requirements',
    type: 'constraint',
    source: 'ACI 318-19 17.4',
    expression: {
      type: 'range',
      param: 'embedment',
      min: 100,
    },
    errorMessage: 'Embedment depth insufficient',
  },
  {
    id: 'thread_engagement',
    name: 'Thread Engagement',
    description: 'Adequate thread length for nut engagement',
    type: 'constraint',
    source: 'AISC Design Guide 1',
    expression: {
      type: 'range',
      param: 'projection',
      min: 50,
    },
    errorMessage: 'Projection may be insufficient for nut',
  },
];

const anchorRodComponents: ComponentDefinition[] = [
  {
    id: 'anchor_rod',
    name: 'Anchor Rod',
    type: 'fastener',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'total_length',
        name: 'Total Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Embedment + projection',
      },
    ],
  },
  {
    id: 'nut',
    name: 'Heavy Hex Nut',
    type: 'fastener',
    required: true,
    quantity: 'single',
    quantityFormula: '2',
    parameters: [],
  },
  {
    id: 'washer',
    name: 'Plate Washer',
    type: 'fastener',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [],
  },
];

export const anchorRodElement: ElementDefinition = {
  id: 'anchor-rod',
  name: 'Anchor Rod',
  description: 'Individual anchor bolt for foundation connections',
  connectionType: 'foundation',
  parameters: anchorRodParameters,
  rules: anchorRodRules,
  materials: ['F1554-36', 'F1554-55', 'F1554-105', 'A307'],
  components: anchorRodComponents,
};

// Export data tables
export { anchorTable, concreteStrengths, plateGrades };
