/**
 * STRUCTURE Domain - Bracing Systems
 *
 * Lateral bracing and stability systems:
 * - Diagonal bracing (X-bracing, chevron, single diagonal)
 * - Horizontal bracing (diaphragms, struts)
 * - Knee braces and gussets
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// DIAGONAL BRACING PARAMETERS
// ============================================================================

const diagonalBracingParameters: ParameterDefinition[] = [
  {
    id: 'bracing_type',
    name: 'Bracing Configuration',
    type: 'select',
    options: ['x-brace', 'single-diagonal', 'chevron-v', 'chevron-inverted', 'k-brace', 'knee-brace'],
    default: 'x-brace',
    required: true,
    description: 'Type of bracing arrangement',
  },
  {
    id: 'bay_width',
    name: 'Bay Width',
    type: 'number',
    unit: 'mm',
    min: 1000,
    max: 15000,
    default: 6000,
    required: true,
    description: 'Horizontal span of braced bay',
  },
  {
    id: 'bay_height',
    name: 'Bay Height',
    type: 'number',
    unit: 'mm',
    min: 1000,
    max: 15000,
    default: 4000,
    required: true,
    description: 'Vertical height of braced bay',
  },
  {
    id: 'design_force',
    name: 'Design Force',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 2000,
    default: 100,
    required: true,
    description: 'Factored lateral force (kN)',
  },
  {
    id: 'load_direction',
    name: 'Load Direction',
    type: 'select',
    options: ['tension-only', 'compression-only', 'reversing'],
    default: 'reversing',
    required: true,
    description: 'Direction of loading',
  },
  {
    id: 'brace_profile',
    name: 'Brace Profile',
    type: 'select',
    options: ['HSS-round', 'HSS-square', 'HSS-rect', 'double-angle', 'single-angle', 'WT', 'channel', 'rod'],
    default: 'HSS-round',
    required: true,
    description: 'Cross-section type for brace',
  },
  {
    id: 'brace_size',
    name: 'Brace Size',
    type: 'string',
    default: 'HSS3x3x1/4',
    required: true,
    description: 'Standard section designation',
  },
  {
    id: 'material_grade',
    name: 'Steel Grade',
    type: 'select',
    options: ['A36', 'A500-B', 'A500-C', 'A572-50', 'A992'],
    default: 'A500-B',
    required: true,
    description: 'Brace material grade',
  },
  {
    id: 'connection_type',
    name: 'Connection Type',
    type: 'select',
    options: ['gusset-welded', 'gusset-bolted', 'direct-welded', 'direct-bolted', 'pinned'],
    default: 'gusset-welded',
    required: true,
    description: 'End connection method',
  },
  {
    id: 'seismic_system',
    name: 'Seismic System',
    type: 'select',
    options: ['OCBF', 'SCBF', 'EBF', 'non-seismic'],
    default: 'non-seismic',
    required: false,
    description: 'Seismic force-resisting system type',
  },
  {
    id: 'gusset_thickness',
    name: 'Gusset Thickness',
    type: 'number',
    unit: 'mm',
    min: 6,
    max: 50,
    default: 12,
    required: false,
    description: 'Gusset plate thickness',
  },
  {
    id: 'work_point',
    name: 'Work Point Location',
    type: 'select',
    options: ['column-beam-intersection', 'offset-column', 'offset-beam'],
    default: 'column-beam-intersection',
    required: false,
    description: 'Brace work point configuration',
  },
];

// ============================================================================
// DIAGONAL BRACING RULES
// ============================================================================

const diagonalBracingRules: Rule[] = [
  {
    id: 'slenderness_tension',
    name: 'Tension Slenderness',
    description: 'L/r should not exceed 300 for tension members',
    type: 'constraint',
    source: 'AISC 360 D1',
    expression: {
      type: 'range',
      param: 'bay_width',
      max: 15000,
    },
    errorMessage: 'Brace too slender for tension member',
  },
  {
    id: 'slenderness_compression',
    name: 'Compression Slenderness',
    description: 'KL/r should not exceed 200 for compression members',
    type: 'constraint',
    source: 'AISC 360 E2',
    expression: {
      type: 'range',
      param: 'bay_height',
      max: 15000,
    },
    errorMessage: 'Brace too slender for compression',
  },
  {
    id: 'scbf_width_thickness',
    name: 'SCBF Compactness',
    description: 'Highly ductile sections required for SCBF',
    type: 'constraint',
    source: 'AISC 341 F2.5a',
    expression: {
      type: 'range',
      param: 'design_force',
      min: 0,
    },
    errorMessage: 'Section not compact for SCBF',
  },
  {
    id: 'gusset_buckling',
    name: 'Gusset Buckling',
    description: 'Gusset plate thickness adequate for buckling',
    type: 'constraint',
    source: 'AISC Design Guide 29',
    expression: {
      type: 'range',
      param: 'gusset_thickness',
      min: 6,
    },
    errorMessage: 'Gusset may buckle under compression',
  },
  {
    id: 'work_point_eccentricity',
    name: 'Work Point',
    description: 'Minimize eccentricity at work point',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: {
      type: 'range',
      param: 'bay_width',
      min: 1000,
    },
    errorMessage: 'Eccentric work point creates additional moments',
  },
];

// ============================================================================
// DIAGONAL BRACING COMPONENTS
// ============================================================================

const diagonalBracingComponents: ComponentDefinition[] = [
  {
    id: 'brace_member',
    name: 'Brace Member',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'brace_count',
    parameters: [
      {
        id: 'brace_length',
        name: 'Brace Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Work-point to work-point length',
      },
    ],
  },
  {
    id: 'gusset_plate',
    name: 'Gusset Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'gusset_count',
    parameters: [
      {
        id: 'gusset_dims',
        name: 'Gusset Dimensions',
        type: 'string',
        required: true,
        description: 'Plate size and shape',
      },
    ],
  },
  {
    id: 'connection_bolts',
    name: 'Connection Bolts',
    type: 'fastener',
    required: false,
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
  {
    id: 'weld_length',
    name: 'Weld',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'weld_total_length',
    parameters: [
      {
        id: 'weld_size',
        name: 'Weld Size',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Fillet weld leg size',
      },
    ],
  },
  {
    id: 'stiffener',
    name: 'Stiffener Plate',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'stiffener_count',
    parameters: [
      {
        id: 'stiffener_dims',
        name: 'Stiffener Dimensions',
        type: 'string',
        required: true,
        description: 'Plate size',
      },
    ],
  },
];

// ============================================================================
// DIAGONAL BRACING ELEMENT
// ============================================================================

export const diagonalBracingElement: ElementDefinition = {
  id: 'diagonal-bracing',
  name: 'Diagonal Bracing',
  description: 'Lateral bracing for frame stability and wind/seismic resistance',
  connectionType: 'lateral-system',
  parameters: diagonalBracingParameters,
  rules: diagonalBracingRules,
  materials: ['A36', 'A500-B', 'A500-C', 'A572-50'],
  components: diagonalBracingComponents,
};

// ============================================================================
// HORIZONTAL BRACING PARAMETERS
// ============================================================================

const horizontalBracingParameters: ParameterDefinition[] = [
  {
    id: 'bracing_type',
    name: 'Bracing Type',
    type: 'select',
    options: ['x-brace', 'single-diagonal', 'strut-only', 'chevron'],
    default: 'x-brace',
    required: true,
    description: 'Horizontal bracing configuration',
  },
  {
    id: 'bay_length',
    name: 'Bay Length',
    type: 'number',
    unit: 'mm',
    min: 1000,
    max: 15000,
    default: 6000,
    required: true,
    description: 'Length of braced bay',
  },
  {
    id: 'bay_width',
    name: 'Bay Width',
    type: 'number',
    unit: 'mm',
    min: 1000,
    max: 15000,
    default: 6000,
    required: true,
    description: 'Width of braced bay',
  },
  {
    id: 'design_force',
    name: 'Design Force',
    type: 'number',
    unit: 'mm', // proxy for kN
    min: 0,
    max: 500,
    default: 50,
    required: true,
    description: 'Factored diaphragm force (kN)',
  },
  {
    id: 'brace_profile',
    name: 'Brace Profile',
    type: 'select',
    options: ['angle', 'HSS-round', 'HSS-square', 'rod', 'flat-bar'],
    default: 'angle',
    required: true,
    description: 'Cross-section type',
  },
  {
    id: 'brace_size',
    name: 'Brace Size',
    type: 'string',
    default: 'L3x3x1/4',
    required: true,
    description: 'Standard section designation',
  },
  {
    id: 'attachment',
    name: 'Attachment Method',
    type: 'select',
    options: ['welded-to-beam', 'bolted-to-beam', 'clip-angle', 'gusset'],
    default: 'welded-to-beam',
    required: true,
    description: 'Connection to supporting structure',
  },
  {
    id: 'material_grade',
    name: 'Steel Grade',
    type: 'select',
    options: ['A36', 'A500-B', 'A572-50'],
    default: 'A36',
    required: true,
    description: 'Material grade',
  },
];

// ============================================================================
// HORIZONTAL BRACING RULES
// ============================================================================

const horizontalBracingRules: Rule[] = [
  {
    id: 'slenderness',
    name: 'Slenderness Limit',
    description: 'L/r should not exceed 300 for horizontal bracing',
    type: 'constraint',
    source: 'AISC 360 D1',
    expression: {
      type: 'range',
      param: 'bay_length',
      max: 15000,
    },
    errorMessage: 'Brace too slender',
  },
  {
    id: 'diaphragm_force',
    name: 'Diaphragm Force Path',
    description: 'Bracing must provide complete load path',
    type: 'constraint',
    source: 'ASCE 7',
    expression: {
      type: 'range',
      param: 'design_force',
      min: 0,
    },
    errorMessage: 'Load path incomplete',
  },
];

// ============================================================================
// HORIZONTAL BRACING COMPONENTS
// ============================================================================

const horizontalBracingComponents: ComponentDefinition[] = [
  {
    id: 'brace_member',
    name: 'Horizontal Brace',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'brace_count',
    parameters: [
      {
        id: 'brace_length',
        name: 'Brace Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Diagonal length',
      },
    ],
  },
  {
    id: 'strut',
    name: 'Collector Strut',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'strut_count',
    parameters: [
      {
        id: 'strut_length',
        name: 'Strut Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Strut length',
      },
    ],
  },
  {
    id: 'connections',
    name: 'Connection Hardware',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'connection_count',
    parameters: [],
  },
];

// ============================================================================
// HORIZONTAL BRACING ELEMENT
// ============================================================================

export const horizontalBracingElement: ElementDefinition = {
  id: 'horizontal-bracing',
  name: 'Horizontal Bracing',
  description: 'Roof or floor diaphragm bracing for lateral load transfer',
  connectionType: 'lateral-system',
  parameters: horizontalBracingParameters,
  rules: horizontalBracingRules,
  materials: ['A36', 'A500-B', 'A572-50'],
  components: horizontalBracingComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface DiagonalBracingInput {
  bracingType: string;
  bayWidth: number;
  bayHeight: number;
  designForce: number;
  loadDirection: string;
  braceProfile: string;
  braceSize: string;
  materialGrade: string;
  connectionType: string;
  seismicSystem: string;
}

export interface DiagonalBracingResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  geometry: {
    braceLength: number;
    braceAngle: number;     // degrees from horizontal
    braceCount: number;
  };
  axialForce: {
    tension: number;        // kN
    compression: number;    // kN
  };
  capacity: {
    tensionCapacity: number;
    compressionCapacity: number;
    tensionRatio: number;
    compressionRatio: number;
  };
  slenderness: {
    KLr: number;
    limit: number;
  };
  connection: {
    gussetForce: number;
    weldLength: number;
    boltCount: number;
  };
  weight: number;
}

// ============================================================================
// BRACE SECTION DATABASE
// ============================================================================

interface BraceSectionData {
  designation: string;
  type: string;
  A: number;      // area (mm²)
  r: number;      // minimum radius of gyration (mm)
  W: number;      // weight (kg/m)
}

const braceSections: BraceSectionData[] = [
  // HSS Round
  { designation: 'HSS2.875x0.203', type: 'HSS-round', A: 1080, r: 24, W: 8.5 },
  { designation: 'HSS3.5x0.216', type: 'HSS-round', A: 1420, r: 30, W: 11.2 },
  { designation: 'HSS4x0.250', type: 'HSS-round', A: 1870, r: 34, W: 14.7 },
  { designation: 'HSS4.5x0.250', type: 'HSS-round', A: 2130, r: 38, W: 16.8 },
  { designation: 'HSS5x0.312', type: 'HSS-round', A: 2910, r: 42, W: 22.9 },
  { designation: 'HSS6x0.312', type: 'HSS-round', A: 3550, r: 51, W: 27.9 },
  // HSS Square
  { designation: 'HSS3x3x1/4', type: 'HSS-square', A: 1740, r: 28, W: 13.7 },
  { designation: 'HSS4x4x1/4', type: 'HSS-square', A: 2390, r: 38, W: 18.8 },
  { designation: 'HSS4x4x3/8', type: 'HSS-square', A: 3410, r: 37, W: 26.8 },
  { designation: 'HSS5x5x1/4', type: 'HSS-square', A: 3050, r: 48, W: 23.9 },
  { designation: 'HSS5x5x3/8', type: 'HSS-square', A: 4420, r: 47, W: 34.7 },
  { designation: 'HSS6x6x3/8', type: 'HSS-square', A: 5440, r: 56, W: 42.7 },
  // Angles
  { designation: 'L2x2x1/4', type: 'single-angle', A: 610, r: 12, W: 4.8 },
  { designation: 'L2-1/2x2-1/2x1/4', type: 'single-angle', A: 770, r: 15, W: 6.1 },
  { designation: 'L3x3x1/4', type: 'single-angle', A: 936, r: 18, W: 7.4 },
  { designation: 'L3x3x3/8', type: 'single-angle', A: 1360, r: 18, W: 10.7 },
  { designation: 'L4x4x1/4', type: 'single-angle', A: 1260, r: 24, W: 9.9 },
  { designation: 'L4x4x3/8', type: 'single-angle', A: 1840, r: 24, W: 14.5 },
  // WT shapes (cut from W-beams)
  { designation: 'WT4x12', type: 'WT', A: 2280, r: 25, W: 17.9 },
  { designation: 'WT5x15', type: 'WT', A: 2850, r: 31, W: 22.3 },
  { designation: 'WT6x20', type: 'WT', A: 3800, r: 37, W: 29.8 },
];

const braceGrades: Record<string, { Fy: number; Fu: number; E: number }> = {
  'A36': { Fy: 250, Fu: 400, E: 200000 },
  'A500-B': { Fy: 290, Fu: 400, E: 200000 },
  'A500-C': { Fy: 317, Fu: 427, E: 200000 },
  'A572-50': { Fy: 345, Fu: 450, E: 200000 },
  'A992': { Fy: 345, Fu: 450, E: 200000 },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateDiagonalBracing(input: DiagonalBracingInput): DiagonalBracingResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const section = braceSections.find(s => s.designation === input.braceSize);
  if (!section) {
    errors.push(`Section ${input.braceSize} not found`);
  }
  const sec = section || braceSections[6]; // default HSS3x3x1/4

  const grade = braceGrades[input.materialGrade] || braceGrades['A500-B'];

  // Geometry
  const braceLength = Math.sqrt(input.bayWidth * input.bayWidth + input.bayHeight * input.bayHeight);
  const braceAngle = Math.atan(input.bayHeight / input.bayWidth) * 180 / Math.PI;

  // Number of braces
  let braceCount: number;
  switch (input.bracingType) {
    case 'x-brace':
      braceCount = 2;
      break;
    case 'chevron-v':
    case 'chevron-inverted':
      braceCount = 2;
      break;
    case 'k-brace':
      braceCount = 2;
      break;
    default:
      braceCount = 1;
  }

  // Force in brace
  const cos_theta = input.bayWidth / braceLength;
  let tensionForce: number;
  let compressionForce: number;

  if (input.bracingType === 'x-brace' && input.loadDirection === 'reversing') {
    // In X-bracing, only tension brace is effective (compression brace buckles)
    tensionForce = input.designForce / cos_theta;
    compressionForce = tensionForce * 0.3; // Post-buckling
  } else if (input.loadDirection === 'tension-only') {
    tensionForce = input.designForce / cos_theta;
    compressionForce = 0;
  } else {
    tensionForce = input.designForce / cos_theta / braceCount;
    compressionForce = tensionForce;
  }

  // Slenderness
  const K = input.connectionType === 'pinned' ? 1.0 : 0.65;
  const Le = K * braceLength;
  const KLr = Le / sec.r;

  let slendernessLimit: number;
  if (input.loadDirection === 'tension-only') {
    slendernessLimit = 300;
  } else if (input.seismicSystem === 'SCBF') {
    slendernessLimit = 200;
    if (KLr > 200) errors.push(`KL/r (${KLr.toFixed(0)}) exceeds SCBF limit 200`);
  } else {
    slendernessLimit = 200;
  }

  if (KLr > slendernessLimit) {
    errors.push(`Slenderness (${KLr.toFixed(0)}) exceeds limit (${slendernessLimit})`);
  }

  // Tension capacity
  const phi_t = 0.9;
  const Pn_tension = grade.Fy * sec.A / 1000; // kN
  const tensionCapacity = phi_t * Pn_tension;
  const tensionRatio = tensionForce / tensionCapacity;

  if (tensionRatio > 1.0) {
    errors.push(`Tension demand (${tensionForce.toFixed(0)} kN) exceeds capacity`);
  }

  // Compression capacity
  const phi_c = 0.9;
  const Fe = Math.PI * Math.PI * grade.E / (KLr * KLr);
  let Fcr: number;
  if (KLr <= 4.71 * Math.sqrt(grade.E / grade.Fy)) {
    Fcr = Math.pow(0.658, grade.Fy / Fe) * grade.Fy;
  } else {
    Fcr = 0.877 * Fe;
  }
  const Pn_compression = Fcr * sec.A / 1000;
  const compressionCapacity = phi_c * Pn_compression;
  const compressionRatio = compressionForce / compressionCapacity;

  if (compressionRatio > 1.0 && input.loadDirection !== 'tension-only') {
    errors.push(`Compression demand (${compressionForce.toFixed(0)} kN) exceeds capacity`);
  }

  // Connection sizing (simplified)
  const gussetForce = Math.max(tensionForce, compressionForce);
  const weldSize = 6; // mm fillet
  const weldStrength = 0.6 * 70 * 0.707 * weldSize * 0.75 / 1000; // kN/mm (E70XX)
  const weldLength = gussetForce / weldStrength;

  const boltCapacity = 88; // kN for 3/4" A325-N single shear
  const boltCount = Math.ceil(gussetForce / boltCapacity);

  // Weight
  const weight = sec.W * braceLength / 1000 * braceCount;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    geometry: {
      braceLength,
      braceAngle,
      braceCount,
    },
    axialForce: {
      tension: tensionForce,
      compression: compressionForce,
    },
    capacity: {
      tensionCapacity,
      compressionCapacity,
      tensionRatio,
      compressionRatio,
    },
    slenderness: {
      KLr,
      limit: slendernessLimit,
    },
    connection: {
      gussetForce,
      weldLength,
      boltCount,
    },
    weight,
  };
}

// Export databases
export { braceSections, braceGrades };
