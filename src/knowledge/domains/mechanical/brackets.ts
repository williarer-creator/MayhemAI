/**
 * MECHANICAL Domain - Brackets and Mounts
 *
 * Knowledge for mounting and support hardware:
 * - L-brackets and angle brackets
 * - Gussets and stiffeners
 * - Equipment mounts and bases
 * - Vibration isolation mounts
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// BRACKET PARAMETERS
// ============================================================================

const bracketParameters: ParameterDefinition[] = [
  {
    id: 'bracket_type',
    name: 'Bracket Type',
    type: 'select',
    options: ['l-bracket', 'angle-bracket', 'gusset', 'corner-brace', 't-bracket', 'z-bracket'],
    default: 'l-bracket',
    required: true,
    description: 'Type of bracket configuration',
  },
  {
    id: 'leg_a_length',
    name: 'Leg A Length',
    type: 'number',
    unit: 'mm',
    min: 20,
    max: 500,
    default: 75,
    required: true,
    description: 'Length of first leg',
  },
  {
    id: 'leg_b_length',
    name: 'Leg B Length',
    type: 'number',
    unit: 'mm',
    min: 20,
    max: 500,
    default: 75,
    required: true,
    description: 'Length of second leg (equal legs for symmetric)',
  },
  {
    id: 'leg_width',
    name: 'Leg Width',
    type: 'number',
    unit: 'mm',
    min: 15,
    max: 200,
    default: 40,
    required: true,
    description: 'Width of bracket legs',
  },
  {
    id: 'material_thickness',
    name: 'Material Thickness',
    type: 'number',
    unit: 'mm',
    min: 1.5,
    max: 12,
    default: 3,
    required: true,
    description: 'Thickness of bracket material',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['mild-steel', 'stainless-304', 'stainless-316', 'aluminum-6061', 'galvanized'],
    default: 'mild-steel',
    required: true,
    description: 'Bracket material',
  },
  {
    id: 'load_capacity',
    name: 'Load Capacity Required',
    type: 'number',
    unit: 'mm', // Using mm as proxy, actual is kg
    min: 1,
    max: 5000,
    default: 50,
    required: true,
    description: 'Maximum load the bracket must support (kg)',
  },
  {
    id: 'hole_pattern',
    name: 'Hole Pattern',
    type: 'select',
    options: ['single', 'double', 'slotted', 'none'],
    default: 'double',
    required: true,
    description: 'Mounting hole configuration per leg',
  },
  {
    id: 'hole_diameter',
    name: 'Hole Diameter',
    type: 'number',
    unit: 'mm',
    min: 4,
    max: 20,
    default: 8,
    required: false,
    description: 'Diameter of mounting holes',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['none', 'powder-coat', 'zinc-plate', 'hot-dip-galv', 'anodize'],
    default: 'zinc-plate',
    required: false,
    description: 'Surface finish/coating',
  },
  {
    id: 'include_gusset',
    name: 'Include Gusset',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Add triangular gusset for reinforcement',
  },
  {
    id: 'quantity',
    name: 'Quantity',
    type: 'number',
    min: 1,
    max: 1000,
    default: 4,
    required: true,
    description: 'Number of brackets required',
  },
];

// ============================================================================
// BRACKET RULES
// ============================================================================

const bracketRules: Rule[] = [
  {
    id: 'thickness_load_ratio',
    name: 'Thickness-Load Ratio',
    description: 'Material thickness must be adequate for load capacity',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: { type: 'range', param: 'material_thickness', min: 2 },
    errorMessage: 'Thickness may be inadequate for specified load',
  },
  {
    id: 'hole_edge_distance',
    name: 'Hole Edge Distance',
    description: 'Hole must be at least 1.5x diameter from edge',
    type: 'constraint',
    source: 'AISC Steel Manual',
    expression: {
      type: 'ratio',
      param1: 'leg_width',
      param2: 'hole_diameter',
      min: 3.5, // Needs width > 3.5 × hole_diameter for 1.5d edge distance both sides
    },
    errorMessage: 'Leg width insufficient for hole edge distance requirements',
  },
  {
    id: 'leg_width_ratio',
    name: 'Leg Width-Length Ratio',
    description: 'Leg width should be at least 1/3 of leg length for stability',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: {
      type: 'ratio',
      param1: 'leg_width',
      param2: 'leg_a_length',
      min: 0.33,
    },
    errorMessage: 'Leg width less than 1/3 of leg length - may be unstable',
  },
  {
    id: 'bend_radius_minimum',
    name: 'Minimum Bend Radius',
    description: 'Minimum inside bend radius equals material thickness',
    type: 'constraint',
    source: 'Sheet Metal Fabrication',
    expression: { type: 'range', param: 'material_thickness', max: 10 },
    errorMessage: 'Material thickness may exceed standard bending capability',
  },
];

// ============================================================================
// BRACKET COMPONENTS
// ============================================================================

const bracketComponents: ComponentDefinition[] = [
  {
    id: 'bracket_body',
    name: 'Bracket Body',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'quantity',
    parameters: [
      {
        id: 'flat_pattern_length',
        name: 'Flat Pattern Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Unfolded length of bracket blank',
      },
      {
        id: 'flat_pattern_width',
        name: 'Flat Pattern Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Width of bracket blank',
      },
    ],
  },
  {
    id: 'gusset_plate',
    name: 'Gusset Plate',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'include_gusset ? quantity : 0',
    parameters: [
      {
        id: 'gusset_size',
        name: 'Gusset Size',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Leg length of triangular gusset',
      },
    ],
  },
  {
    id: 'mounting_hardware',
    name: 'Mounting Hardware Set',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'quantity * holes_per_bracket',
    parameters: [
      {
        id: 'bolt_size',
        name: 'Bolt Size',
        type: 'string',
        required: true,
        description: 'Bolt specification (e.g., M8x25)',
      },
    ],
  },
];

// ============================================================================
// BRACKET ELEMENT DEFINITION
// ============================================================================

export const bracketElement: ElementDefinition = {
  id: 'bracket',
  name: 'Mounting Bracket',
  description: 'L-brackets, angle brackets, and gussets for mounting equipment and structural connections',
  connectionType: 'surface-mount',
  parameters: bracketParameters,
  rules: bracketRules,
  materials: ['mild-steel', 'stainless-304', 'stainless-316', 'aluminum-6061', 'galvanized'],
  components: bracketComponents,
};

// ============================================================================
// EQUIPMENT MOUNT PARAMETERS
// ============================================================================

const mountParameters: ParameterDefinition[] = [
  {
    id: 'mount_type',
    name: 'Mount Type',
    type: 'select',
    options: ['base-plate', 'adjustable-foot', 'vibration-isolator', 'leveling-pad', 'anchor-plate'],
    default: 'base-plate',
    required: true,
    description: 'Type of equipment mount',
  },
  {
    id: 'equipment_weight',
    name: 'Equipment Weight',
    type: 'number',
    unit: 'mm', // Using mm as proxy, actual is kg
    min: 1,
    max: 50000,
    default: 500,
    required: true,
    description: 'Total weight of equipment being mounted (kg)',
  },
  {
    id: 'mount_count',
    name: 'Number of Mount Points',
    type: 'number',
    min: 3,
    max: 12,
    default: 4,
    required: true,
    description: 'Number of mounting points',
  },
  {
    id: 'base_width',
    name: 'Base Plate Width',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 500,
    default: 150,
    required: true,
    description: 'Width of each base plate',
  },
  {
    id: 'base_length',
    name: 'Base Plate Length',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 500,
    default: 150,
    required: true,
    description: 'Length of each base plate',
  },
  {
    id: 'plate_thickness',
    name: 'Plate Thickness',
    type: 'number',
    unit: 'mm',
    min: 6,
    max: 50,
    default: 12,
    required: true,
    description: 'Thickness of base plate',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['mild-steel', 'stainless-304', 'stainless-316', 'cast-iron'],
    default: 'mild-steel',
    required: true,
    description: 'Mount material',
  },
  {
    id: 'anchor_type',
    name: 'Anchor Type',
    type: 'select',
    options: ['expansion', 'wedge', 'epoxy', 'through-bolt', 'weld-to-embed'],
    default: 'wedge',
    required: true,
    description: 'Type of floor anchoring',
  },
  {
    id: 'anchor_diameter',
    name: 'Anchor Diameter',
    type: 'number',
    unit: 'mm',
    min: 8,
    max: 30,
    default: 12,
    required: true,
    description: 'Diameter of anchor bolts',
  },
  {
    id: 'vibration_isolation',
    name: 'Vibration Isolation',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Include vibration isolation pads/mounts',
  },
  {
    id: 'adjustment_range',
    name: 'Height Adjustment Range',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 100,
    default: 25,
    required: false,
    description: 'Leveling adjustment range (0 for fixed)',
  },
  {
    id: 'seismic_zone',
    name: 'Seismic Zone',
    type: 'select',
    options: ['none', 'zone-1', 'zone-2', 'zone-3', 'zone-4'],
    default: 'none',
    required: false,
    description: 'Seismic design category',
  },
];

// ============================================================================
// EQUIPMENT MOUNT RULES
// ============================================================================

const mountRules: Rule[] = [
  {
    id: 'min_mount_points',
    name: 'Minimum Mount Points',
    description: 'Minimum 3 mount points for stability, 4 recommended',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: { type: 'range', param: 'mount_count', min: 3 },
    errorMessage: 'Minimum 3 mount points required for stability',
  },
  {
    id: 'plate_thickness_ratio',
    name: 'Plate Thickness Ratio',
    description: 'Base plate thickness based on load and span',
    type: 'constraint',
    source: 'AISC Base Plate Design',
    expression: { type: 'range', param: 'plate_thickness', min: 6 },
    errorMessage: 'Plate thickness may be insufficient for load',
  },
  {
    id: 'anchor_embedment',
    name: 'Anchor Embedment Depth',
    description: 'Anchor embedment depth minimum 8x diameter',
    type: 'constraint',
    source: 'ACI 318 Appendix D',
    expression: { type: 'range', param: 'anchor_diameter', min: 8, max: 30 },
    errorMessage: 'Anchor diameter outside standard range',
  },
  {
    id: 'edge_distance_concrete',
    name: 'Edge Distance Concrete',
    description: 'Anchor edge distance minimum 6x diameter',
    type: 'constraint',
    source: 'ACI 318',
    expression: {
      type: 'ratio',
      param1: 'base_width',
      param2: 'anchor_diameter',
      min: 12, // 6d edge distance on each side
    },
    errorMessage: 'Base plate width insufficient for anchor edge distances',
  },
];

// ============================================================================
// EQUIPMENT MOUNT COMPONENTS
// ============================================================================

const mountComponents: ComponentDefinition[] = [
  {
    id: 'base_plate',
    name: 'Base Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'mount_count',
    parameters: [
      {
        id: 'plate_dimensions',
        name: 'Plate Dimensions',
        type: 'string',
        required: true,
        description: 'Width x Length x Thickness',
      },
    ],
  },
  {
    id: 'anchor_bolt',
    name: 'Anchor Bolt Assembly',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'mount_count * anchors_per_plate',
    parameters: [
      {
        id: 'anchor_spec',
        name: 'Anchor Specification',
        type: 'string',
        required: true,
        description: 'Anchor type and size',
      },
    ],
  },
  {
    id: 'isolator_pad',
    name: 'Vibration Isolator Pad',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'vibration_isolation ? mount_count : 0',
    parameters: [
      {
        id: 'durometer',
        name: 'Durometer Rating',
        type: 'number',
        required: true,
        description: 'Shore A hardness of isolator',
      },
    ],
  },
  {
    id: 'leveling_nut',
    name: 'Leveling Nut Assembly',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'adjustment_range > 0 ? mount_count * anchors_per_plate : 0',
    parameters: [
      {
        id: 'nut_size',
        name: 'Nut Size',
        type: 'string',
        required: true,
        description: 'Thread size matching anchor',
      },
    ],
  },
];

// ============================================================================
// EQUIPMENT MOUNT ELEMENT DEFINITION
// ============================================================================

export const mountElement: ElementDefinition = {
  id: 'equipment-mount',
  name: 'Equipment Mount',
  description: 'Base plates, vibration isolators, and anchoring systems for equipment installation',
  connectionType: 'surface-mount',
  parameters: mountParameters,
  rules: mountRules,
  materials: ['mild-steel', 'stainless-304', 'stainless-316', 'cast-iron'],
  components: mountComponents,
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

// Material densities in kg/mm³
const materialDensities: Record<string, number> = {
  'mild-steel': 7.85e-6,
  'stainless-304': 8.0e-6,
  'stainless-316': 8.0e-6,
  'aluminum-6061': 2.7e-6,
  'galvanized': 7.85e-6,
  'cast-iron': 7.2e-6,
};

// Material yield strengths in MPa
const yieldStrengths: Record<string, number> = {
  'mild-steel': 250,
  'stainless-304': 215,
  'stainless-316': 205,
  'aluminum-6061': 276,
  'galvanized': 250,
  'cast-iron': 130,
};

export interface BracketCalculationInput {
  bracketType: string;
  legALength: number;
  legBLength: number;
  legWidth: number;
  materialThickness: number;
  material: string;
  loadCapacity: number;
  holePattern: string;
  holeDiameter: number;
  includeGusset: boolean;
  quantity: number;
}

export interface BracketCalculationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  flatPatternLength: number;
  flatPatternWidth: number;
  bendAllowance: number;
  holesPerBracket: number;
  componentCounts: {
    bracketBodies: number;
    gussetPlates: number;
    bolts: number;
    nuts: number;
    washers: number;
  };
  materialArea: number;
  estimatedWeight: number;
  loadCapacityActual: number;
}

export function calculateBracket(input: BracketCalculationInput): BracketCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // K-factor bend allowance calculation
  const kFactor = 0.4;
  const bendAllowance = (Math.PI / 180) * 90 * (input.materialThickness * kFactor + input.materialThickness / 2);

  // Flat pattern calculation
  let flatPatternLength: number;
  switch (input.bracketType) {
    case 'l-bracket':
    case 'angle-bracket':
      flatPatternLength = input.legALength + input.legBLength - bendAllowance;
      break;
    case 'z-bracket':
      flatPatternLength = input.legALength + input.legBLength + input.legALength - 2 * bendAllowance;
      break;
    case 't-bracket':
      flatPatternLength = input.legALength + 2 * input.legBLength - 2 * bendAllowance;
      break;
    default:
      flatPatternLength = input.legALength + input.legBLength - bendAllowance;
  }

  // Hole count
  let holesPerBracket: number;
  switch (input.holePattern) {
    case 'single': holesPerBracket = 2; break;
    case 'double': holesPerBracket = 4; break;
    case 'slotted': holesPerBracket = 2; break;
    default: holesPerBracket = 0;
  }

  // Validate hole edge distance
  const minEdgeDistance = input.holeDiameter * 1.5;
  if (input.holePattern !== 'none' && input.legWidth < input.holeDiameter + 2 * minEdgeDistance) {
    errors.push(`Leg width ${input.legWidth}mm insufficient for ${input.holeDiameter}mm holes`);
  }

  // Validate leg width ratio
  const maxLegLength = Math.max(input.legALength, input.legBLength);
  if (input.legWidth < maxLegLength / 3) {
    warnings.push('Leg width less than 1/3 of leg length - may be unstable');
  }

  // Load capacity calculation
  const yieldStrength = yieldStrengths[input.material] || 250;
  const sectionModulus = (input.legWidth * input.materialThickness * input.materialThickness) / 6;
  const momentCapacity = sectionModulus * yieldStrength;
  const loadCapacityActual = (momentCapacity / maxLegLength) / 9.81;

  // Gusset recommendation
  if (input.loadCapacity > 100 && !input.includeGusset) {
    warnings.push('Consider adding gusset for loads over 100kg');
  }

  // Material area
  let materialArea = flatPatternLength * input.legWidth;
  if (input.includeGusset) {
    const gussetSize = Math.min(input.legALength, input.legBLength) * 0.5;
    materialArea += 0.5 * gussetSize * gussetSize;
  }

  // Weight
  const density = materialDensities[input.material] || 7.85e-6;
  const volume = materialArea * input.materialThickness;
  const estimatedWeight = volume * density;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    flatPatternLength,
    flatPatternWidth: input.legWidth,
    bendAllowance,
    holesPerBracket,
    componentCounts: {
      bracketBodies: input.quantity,
      gussetPlates: input.includeGusset ? input.quantity : 0,
      bolts: holesPerBracket * input.quantity,
      nuts: holesPerBracket * input.quantity,
      washers: holesPerBracket * input.quantity * 2,
    },
    materialArea,
    estimatedWeight,
    loadCapacityActual,
  };
}

export interface MountCalculationInput {
  mountType: string;
  equipmentWeight: number;
  mountCount: number;
  baseWidth: number;
  baseLength: number;
  plateThickness: number;
  material: string;
  anchorType: string;
  anchorDiameter: number;
  vibrationIsolation: boolean;
  adjustmentRange: number;
  seismicZone: string;
}

export interface MountCalculationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  loadPerMount: number;
  anchorCapacity: number;
  anchorsPerPlate: number;
  componentCounts: {
    basePlates: number;
    anchorBolts: number;
    isolatorPads: number;
    levelingNuts: number;
  };
  estimatedWeight: number;
}

export function calculateMount(input: MountCalculationInput): MountCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.mountCount < 3) {
    errors.push('Minimum 3 mount points required for stability');
  }

  const loadPerMount = input.equipmentWeight / input.mountCount;
  const designLoad = loadPerMount * 1.5;

  const anchorsPerPlate = input.anchorDiameter >= 16 ? 2 : 4;
  const anchorCapacity = (800 * input.anchorDiameter * input.anchorDiameter * anchorsPerPlate) / 9810;

  if (anchorCapacity < designLoad) {
    errors.push(`Anchor capacity ${anchorCapacity.toFixed(0)}kg insufficient for ${designLoad.toFixed(0)}kg design load`);
  }

  const seismicLevel = parseInt(input.seismicZone.replace('zone-', '') || '0');
  if (seismicLevel >= 3 && !['epoxy', 'weld-to-embed'].includes(input.anchorType)) {
    errors.push('Seismic zone 3+ requires epoxy or welded anchors');
  }

  const totalAnchors = input.mountCount * anchorsPerPlate;
  const levelingNuts = input.adjustmentRange > 0 ? totalAnchors : 0;

  const density = materialDensities[input.material] || 7.85e-6;
  const plateArea = input.baseWidth * input.baseLength;
  const plateWeight = plateArea * input.plateThickness * density * input.mountCount;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    loadPerMount,
    anchorCapacity,
    anchorsPerPlate,
    componentCounts: {
      basePlates: input.mountCount,
      anchorBolts: totalAnchors,
      isolatorPads: input.vibrationIsolation ? input.mountCount : 0,
      levelingNuts,
    },
    estimatedWeight: plateWeight,
  };
}

// Standard bracket sizes
export const standardBrackets = [
  { name: '50×50×3', legA: 50, legB: 50, width: 30, thickness: 3, loadKg: 25 },
  { name: '75×75×3', legA: 75, legB: 75, width: 40, thickness: 3, loadKg: 40 },
  { name: '100×100×4', legA: 100, legB: 100, width: 50, thickness: 4, loadKg: 75 },
  { name: '150×150×5', legA: 150, legB: 150, width: 60, thickness: 5, loadKg: 150 },
  { name: '200×200×6', legA: 200, legB: 200, width: 75, thickness: 6, loadKg: 250 },
  { name: '250×250×8', legA: 250, legB: 250, width: 100, thickness: 8, loadKg: 500 },
];

// Standard anchor bolt specs
export const anchorBoltSizes = [
  { diameter: 8, embedment: 65, tensionCapacity: 6.5, shearCapacity: 8.2 },
  { diameter: 10, embedment: 80, tensionCapacity: 10.3, shearCapacity: 13.0 },
  { diameter: 12, embedment: 95, tensionCapacity: 15.0, shearCapacity: 18.8 },
  { diameter: 16, embedment: 125, tensionCapacity: 27.0, shearCapacity: 33.5 },
  { diameter: 20, embedment: 160, tensionCapacity: 42.5, shearCapacity: 52.5 },
  { diameter: 24, embedment: 190, tensionCapacity: 61.0, shearCapacity: 75.5 },
];
