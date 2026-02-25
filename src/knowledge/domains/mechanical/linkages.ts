/**
 * Linkages Knowledge Definition
 *
 * Engineering knowledge for mechanical linkages and motion systems.
 * Implements kinematics analysis and component selection.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// LINKAGE PARAMETERS
// =============================================================================

const linkageParameters: ParameterDefinition[] = [
  // Linkage type
  {
    id: 'linkage_type',
    name: 'Linkage Type',
    type: 'select',
    options: [
      'four-bar',
      'slider-crank',
      'quick-return',
      'parallel-motion',
      'toggle',
      'bell-crank',
      'rocker-arm',
    ],
    default: 'four-bar',
    required: true,
    description: 'Type of linkage mechanism',
  },

  // Motion parameters
  {
    id: 'input_motion',
    name: 'Input Motion Type',
    type: 'select',
    options: ['continuous-rotation', 'oscillating', 'linear'],
    default: 'continuous-rotation',
    required: true,
    description: 'Type of input motion',
  },
  {
    id: 'output_motion',
    name: 'Output Motion Type',
    type: 'select',
    options: ['rotation', 'oscillation', 'linear', 'complex-path'],
    default: 'oscillation',
    required: true,
    description: 'Desired output motion',
  },

  // Link lengths (for four-bar)
  {
    id: 'ground_link',
    name: 'Ground Link Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Fixed frame link length (four-bar)',
  },
  {
    id: 'crank_length',
    name: 'Crank Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Input crank length',
  },
  {
    id: 'coupler_length',
    name: 'Coupler Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Connecting link length',
  },
  {
    id: 'rocker_length',
    name: 'Rocker Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Output rocker length',
  },

  // Range of motion
  {
    id: 'input_angle_range',
    name: 'Input Angle Range',
    type: 'number',
    unit: 'mm',  // Actually degrees
    default: 360,
    required: false,
    description: 'Input rotation range (degrees)',
  },
  {
    id: 'output_angle_range',
    name: 'Output Angle Range',
    type: 'number',
    unit: 'mm',  // Actually degrees
    required: false,
    description: 'Required output swing angle (degrees)',
  },
  {
    id: 'stroke_length',
    name: 'Stroke Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Linear output stroke (slider-crank)',
  },

  // Loading
  {
    id: 'output_force',
    name: 'Output Force',
    type: 'number',
    unit: 'mm',  // Actually N
    required: true,
    description: 'Required output force (N)',
  },
  {
    id: 'operating_speed',
    name: 'Operating Speed',
    type: 'number',
    unit: 'mm',  // Actually RPM
    default: 60,
    required: false,
    description: 'Input rotation speed (RPM)',
  },
  {
    id: 'cycles_per_year',
    name: 'Cycles Per Year',
    type: 'number',
    default: 100000,
    required: false,
    description: 'Expected annual cycle count',
  },

  // Materials and joints
  {
    id: 'link_material',
    name: 'Link Material',
    type: 'select',
    options: ['steel', 'aluminum', 'stainless', 'cast-iron'],
    default: 'steel',
    required: true,
    description: 'Link material',
  },
  {
    id: 'pivot_type',
    name: 'Pivot Type',
    type: 'select',
    options: ['plain-bushing', 'ball-bearing', 'needle-bearing', 'spherical', 'rod-end'],
    default: 'ball-bearing',
    required: true,
    description: 'Joint/pivot bearing type',
  },
  {
    id: 'pivot_diameter',
    name: 'Pivot Diameter',
    type: 'number',
    unit: 'mm',
    min: 6,
    max: 50,
    default: 12,
    required: true,
    description: 'Pivot pin diameter',
  },

  // Environment
  {
    id: 'environment',
    name: 'Environment',
    type: 'select',
    options: ['indoor-clean', 'indoor-dusty', 'outdoor', 'wash-down', 'corrosive'],
    default: 'indoor-clean',
    required: true,
    description: 'Operating environment',
  },
  {
    id: 'lubrication',
    name: 'Lubrication',
    type: 'select',
    options: ['grease', 'oil', 'dry', 'sealed'],
    default: 'grease',
    required: true,
    description: 'Lubrication method',
  },
];

// =============================================================================
// LINKAGE RULES
// =============================================================================

const linkageRules: Rule[] = [
  // Grashof criterion for four-bar
  {
    id: 'grashof-criterion',
    name: 'Grashof Criterion',
    type: 'constraint',
    source: 'Kinematics',
    description: 'Four-bar must satisfy Grashof criterion for continuous rotation',
    expression: {
      type: 'conditional',
      condition: 'linkage_type == "four-bar" && input_motion == "continuous-rotation"',
      then: {
        type: 'formula',
        formula: 'shortest + longest <= sum_others',
        result: 'grashof_satisfied',
      },
    },
    errorMessage: 'Link lengths do not satisfy Grashof criterion for full rotation',
  },

  // Toggle position avoidance
  {
    id: 'toggle-avoidance',
    name: 'Toggle Position Check',
    type: 'recommendation',
    description: 'Avoid toggle positions in normal operation range',
    expression: {
      type: 'conditional',
      condition: 'linkage_type == "four-bar"',
      then: {
        type: 'formula',
        formula: 'transmission_angle >= 30 && transmission_angle <= 150',
        result: 'good_transmission',
      },
    },
    errorMessage: 'Linkage may pass through toggle position - poor force transmission',
  },

  // Bearing life
  {
    id: 'bearing-life',
    name: 'Bearing Life Check',
    type: 'recommendation',
    source: 'ISO 281',
    description: 'Pivot bearings should have adequate life',
    expression: {
      type: 'conditional',
      condition: 'cycles_per_year > 500000',
      then: {
        type: 'required-if',
        param: 'pivot_type',
        condition: 'pivot_type == "ball-bearing" || pivot_type == "needle-bearing"',
      },
    },
    errorMessage: 'High cycle count - use anti-friction bearings',
  },

  // Environment sealing
  {
    id: 'environment-sealing',
    name: 'Environment Protection',
    type: 'constraint',
    description: 'Harsh environments require sealed bearings',
    expression: {
      type: 'conditional',
      condition: 'environment == "outdoor" || environment == "wash-down" || environment == "corrosive"',
      then: {
        type: 'required-if',
        param: 'lubrication',
        condition: 'lubrication == "sealed"',
      },
    },
    errorMessage: 'Harsh environment requires sealed bearings',
  },

  // Pin stress
  {
    id: 'pin-shear-stress',
    name: 'Pin Shear Stress',
    type: 'constraint',
    description: 'Pivot pin must handle shear load',
    expression: {
      type: 'formula',
      formula: 'pin_shear_stress = output_force / (0.785 * pivot_diameter^2)',
      result: 'pin_shear_stress < allowable_shear',
    },
    errorMessage: 'Pivot pin diameter insufficient for load',
  },

  // Link buckling
  {
    id: 'link-buckling',
    name: 'Link Buckling Check',
    type: 'constraint',
    description: 'Compression links must not buckle',
    expression: {
      type: 'formula',
      formula: 'slenderness_ratio < 120',
      result: 'no_buckling',
    },
    errorMessage: 'Link may buckle under compression - increase section',
  },
];

// =============================================================================
// LINKAGE COMPONENTS
// =============================================================================

const linkageComponents: ComponentDefinition[] = [
  {
    id: 'crank-link',
    name: 'Crank Link',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'coupler-link',
    name: 'Coupler Link',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'rocker-link',
    name: 'Rocker/Output Link',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'ground-frame',
    name: 'Ground Frame/Mount',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'pivot-bearing',
    name: 'Pivot Bearing',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_pivots',
    parameters: [],
  },
  {
    id: 'pivot-pin',
    name: 'Pivot Pin',
    type: 'connector',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_pivots',
    parameters: [],
  },
  {
    id: 'retaining-ring',
    name: 'Retaining Ring',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_pivots * 2',
    parameters: [],
  },
  {
    id: 'grease-fitting',
    name: 'Grease Fitting',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'lubrication == "grease" ? num_pivots : 0',
    parameters: [],
  },
];

// =============================================================================
// LINKAGE ELEMENT DEFINITION
// =============================================================================

export const linkageElement: ElementDefinition = {
  id: 'linkage',
  name: 'Mechanical Linkage',
  description: 'Linkage mechanisms for motion transmission (four-bar, slider-crank, etc.)',
  connectionType: 'point-to-point',
  parameters: linkageParameters,
  rules: linkageRules,
  materials: ['steel', 'aluminum', 'stainless', 'cast-iron'],
  components: linkageComponents,
};

// =============================================================================
// BELL CRANK ELEMENT
// =============================================================================

const bellCrankParameters: ParameterDefinition[] = [
  {
    id: 'arm_angle',
    name: 'Arm Angle',
    type: 'number',
    unit: 'mm',  // Actually degrees
    default: 90,
    min: 30,
    max: 150,
    required: true,
    description: 'Angle between input and output arms (degrees)',
  },
  {
    id: 'input_arm_length',
    name: 'Input Arm Length',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 20,
    max: 500,
    description: 'Length of input arm',
  },
  {
    id: 'output_arm_length',
    name: 'Output Arm Length',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 20,
    max: 500,
    description: 'Length of output arm',
  },
  {
    id: 'input_force',
    name: 'Input Force',
    type: 'number',
    unit: 'mm',  // Actually N
    required: true,
    description: 'Force applied to input arm (N)',
  },
  {
    id: 'arm_width',
    name: 'Arm Width',
    type: 'number',
    unit: 'mm',
    default: 25,
    required: true,
    description: 'Width of crank arms',
  },
  {
    id: 'arm_thickness',
    name: 'Arm Thickness',
    type: 'number',
    unit: 'mm',
    default: 6,
    required: true,
    description: 'Thickness of crank arms',
  },
  {
    id: 'pivot_bore',
    name: 'Pivot Bore',
    type: 'number',
    unit: 'mm',
    default: 10,
    required: true,
    description: 'Diameter of pivot bore',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['steel', 'aluminum', 'stainless', 'cast-iron'],
    default: 'steel',
    required: true,
    description: 'Bell crank material',
  },
  {
    id: 'end_connection',
    name: 'End Connection Type',
    type: 'select',
    options: ['clevis', 'rod-end', 'plain-hole', 'threaded'],
    default: 'clevis',
    required: true,
    description: 'Connection type at arm ends',
  },
];

const bellCrankRules: Rule[] = [
  {
    id: 'mechanical-advantage',
    name: 'Mechanical Advantage',
    type: 'calculation',
    description: 'Output force = Input force × (input arm / output arm)',
    expression: {
      type: 'formula',
      formula: 'mechanical_advantage = input_arm_length / output_arm_length',
      result: 'mechanical_advantage',
    },
  },
  {
    id: 'arm-stress',
    name: 'Arm Bending Stress',
    type: 'constraint',
    description: 'Arm must handle bending moment from force',
    expression: {
      type: 'formula',
      formula: 'bending_stress = (input_force * input_arm_length * 6) / (arm_width * arm_thickness^2)',
      result: 'bending_stress < allowable_stress',
    },
    errorMessage: 'Arm section insufficient for applied load',
  },
];

const bellCrankComponents: ComponentDefinition[] = [
  {
    id: 'bell-crank-body',
    name: 'Bell Crank Body',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'pivot-bushing',
    name: 'Pivot Bushing',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'pivot-bolt',
    name: 'Pivot Bolt',
    type: 'fastener',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'clevis-pin',
    name: 'Clevis Pin',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'end_connection == "clevis" ? 2 : 0',
    parameters: [],
  },
  {
    id: 'rod-end',
    name: 'Rod End Bearing',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'end_connection == "rod-end" ? 2 : 0',
    parameters: [],
  },
];

export const bellCrankElement: ElementDefinition = {
  id: 'bell-crank',
  name: 'Bell Crank',
  description: 'Bell crank lever for direction/force change',
  connectionType: 'point-to-point',
  parameters: bellCrankParameters,
  rules: bellCrankRules,
  materials: ['steel', 'aluminum', 'stainless', 'cast-iron'],
  components: bellCrankComponents,
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

export interface FourBarInput {
  groundLink: number;     // mm
  crankLink: number;      // mm
  couplerLink: number;    // mm
  rockerLink: number;     // mm
}

export interface FourBarResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Classification
  grashofType: 'crank-rocker' | 'double-crank' | 'double-rocker' | 'change-point' | 'non-grashof';
  shortestLink: string;

  // Motion range
  rockerSwingAngle: number;  // degrees
  crankRotationPossible: boolean;

  // Transmission quality
  minTransmissionAngle: number;  // degrees
  maxTransmissionAngle: number;  // degrees
  transmissionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export function analyzeFourBar(input: FourBarInput): FourBarResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const links = [
    { name: 'ground', length: input.groundLink },
    { name: 'crank', length: input.crankLink },
    { name: 'coupler', length: input.couplerLink },
    { name: 'rocker', length: input.rockerLink },
  ];

  // Sort to find shortest and longest
  const sorted = [...links].sort((a, b) => a.length - b.length);
  const shortest = sorted[0];
  const longest = sorted[3];
  const middle = sorted[1].length + sorted[2].length;

  // Grashof criterion
  const grashofSum = shortest.length + longest.length;
  const isGrashof = grashofSum <= middle;
  const isChangePoint = Math.abs(grashofSum - middle) < 0.1;

  // Determine mechanism type
  let grashofType: FourBarResult['grashofType'];
  let crankRotationPossible = false;

  if (isChangePoint) {
    grashofType = 'change-point';
    warnings.push('Change-point mechanism - may have indeterminate positions');
  } else if (!isGrashof) {
    grashofType = 'non-grashof';
    warnings.push('Non-Grashof linkage - no link can fully rotate');
  } else if (shortest.name === 'ground') {
    grashofType = 'double-crank';
    crankRotationPossible = true;
  } else if (shortest.name === 'crank') {
    grashofType = 'crank-rocker';
    crankRotationPossible = true;
  } else {
    grashofType = 'double-rocker';
  }

  // Calculate rocker swing angle (simplified)
  let rockerSwingAngle = 0;
  if (grashofType === 'crank-rocker' || grashofType === 'double-rocker') {
    // Approximate swing angle using law of cosines at extreme positions
    const r1 = input.groundLink;
    const r2 = input.crankLink;
    const r3 = input.couplerLink;
    const r4 = input.rockerLink;

    // Extended position
    const d1 = r2 + r3;
    const cosTheta1 = (r1 * r1 + r4 * r4 - d1 * d1) / (2 * r1 * r4);

    // Folded position
    const d2 = Math.abs(r3 - r2);
    const cosTheta2 = (r1 * r1 + r4 * r4 - d2 * d2) / (2 * r1 * r4);

    if (Math.abs(cosTheta1) <= 1 && Math.abs(cosTheta2) <= 1) {
      const theta1 = Math.acos(Math.max(-1, Math.min(1, cosTheta1))) * 180 / Math.PI;
      const theta2 = Math.acos(Math.max(-1, Math.min(1, cosTheta2))) * 180 / Math.PI;
      rockerSwingAngle = Math.abs(theta2 - theta1);
    }
  }

  // Transmission angle analysis (simplified - at horizontal crank position)
  // Real analysis would compute for all crank positions
  const minTransmissionAngle = 30;  // Placeholder - would need full kinematic analysis
  const maxTransmissionAngle = 150;

  let transmissionQuality: FourBarResult['transmissionQuality'];
  if (minTransmissionAngle >= 40) {
    transmissionQuality = 'excellent';
  } else if (minTransmissionAngle >= 30) {
    transmissionQuality = 'good';
  } else if (minTransmissionAngle >= 20) {
    transmissionQuality = 'fair';
    warnings.push('Transmission angle approaches minimum - may have poor force transmission');
  } else {
    transmissionQuality = 'poor';
    errors.push('Very low transmission angle - mechanism will jam or have poor efficiency');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    grashofType,
    shortestLink: shortest.name,
    rockerSwingAngle: Math.round(rockerSwingAngle * 10) / 10,
    crankRotationPossible,
    minTransmissionAngle,
    maxTransmissionAngle,
    transmissionQuality,
  };
}

export interface SliderCrankInput {
  crankLength: number;      // mm
  connectingRodLength: number;  // mm
  offset?: number;          // mm (offset from crank center, 0 for inline)
}

export interface SliderCrankResult {
  valid: boolean;
  errors: string[];

  stroke: number;           // mm
  deadCenterTop: number;    // mm from crank center
  deadCenterBottom: number; // mm from crank center

  // Velocity ratio at crank angle
  quickReturnRatio: number;  // >1 means quick return exists
}

export function analyzeSliderCrank(input: SliderCrankInput): SliderCrankResult {
  const errors: string[] = [];

  const r = input.crankLength;
  const l = input.connectingRodLength;
  const e = input.offset || 0;

  // Connecting rod must be longer than crank
  if (l < r) {
    errors.push('Connecting rod must be longer than crank');
  }

  // For offset mechanism, check geometry
  if (e > 0 && e >= l - r) {
    errors.push('Offset too large for mechanism geometry');
  }

  // Stroke calculation
  // For inline: stroke = 2 * r
  // For offset: slightly less
  let stroke: number;
  let deadCenterTop: number;
  let deadCenterBottom: number;

  if (e === 0) {
    // Inline slider-crank
    stroke = 2 * r;
    deadCenterTop = r + l;
    deadCenterBottom = l - r;
  } else {
    // Offset slider-crank
    deadCenterTop = Math.sqrt((l + r) ** 2 - e ** 2);
    deadCenterBottom = Math.sqrt((l - r) ** 2 - e ** 2);
    stroke = deadCenterTop - deadCenterBottom;
  }

  // Quick return ratio
  // For inline = 1 (symmetric motion)
  // For offset > 1 (quick return)
  let quickReturnRatio = 1;
  if (e > 0) {
    const alpha1 = Math.asin(e / (l + r));
    const alpha2 = Math.asin(e / (l - r));
    const advanceAngle = Math.PI + alpha1 - alpha2;
    const returnAngle = Math.PI - alpha1 + alpha2;
    quickReturnRatio = advanceAngle / returnAngle;
  }

  return {
    valid: errors.length === 0,
    errors,
    stroke: Math.round(stroke * 10) / 10,
    deadCenterTop: Math.round(deadCenterTop * 10) / 10,
    deadCenterBottom: Math.round(deadCenterBottom * 10) / 10,
    quickReturnRatio: Math.round(quickReturnRatio * 100) / 100,
  };
}

export interface BellCrankInput {
  inputArmLength: number;   // mm
  outputArmLength: number;  // mm
  armAngle: number;         // degrees
  inputForce: number;       // N
}

export interface BellCrankResult {
  mechanicalAdvantage: number;
  outputForce: number;      // N
  pivotReaction: number;    // N
  pivotReactionAngle: number;  // degrees from input direction
}

export function analyzeBellCrank(input: BellCrankInput): BellCrankResult {
  const MA = input.inputArmLength / input.outputArmLength;
  const outputForce = input.inputForce * MA;

  // Pivot reaction is vector sum of input and output forces
  const angleRad = input.armAngle * Math.PI / 180;
  const Fx = input.inputForce - outputForce * Math.cos(angleRad);
  const Fy = outputForce * Math.sin(angleRad);
  const pivotReaction = Math.sqrt(Fx ** 2 + Fy ** 2);
  const pivotReactionAngle = Math.atan2(Fy, Fx) * 180 / Math.PI;

  return {
    mechanicalAdvantage: Math.round(MA * 100) / 100,
    outputForce: Math.round(outputForce * 10) / 10,
    pivotReaction: Math.round(pivotReaction * 10) / 10,
    pivotReactionAngle: Math.round(pivotReactionAngle * 10) / 10,
  };
}

// =============================================================================
// PIVOT BEARING DATABASE
// =============================================================================

export interface PivotBearingData {
  type: string;
  boreSizes: number[];    // mm
  dynamicCapacity: number;  // N per mm² bore
  staticCapacity: number;   // N per mm² bore
  maxSpeed: number;         // RPM
  sealedAvailable: boolean;
}

export const pivotBearings: PivotBearingData[] = [
  {
    type: 'plain-bushing',
    boreSizes: [6, 8, 10, 12, 16, 20, 25, 30],
    dynamicCapacity: 15,
    staticCapacity: 40,
    maxSpeed: 500,
    sealedAvailable: true,
  },
  {
    type: 'ball-bearing',
    boreSizes: [6, 8, 10, 12, 15, 17, 20, 25, 30, 35, 40],
    dynamicCapacity: 200,
    staticCapacity: 150,
    maxSpeed: 10000,
    sealedAvailable: true,
  },
  {
    type: 'needle-bearing',
    boreSizes: [8, 10, 12, 15, 17, 20, 22, 25, 30],
    dynamicCapacity: 300,
    staticCapacity: 400,
    maxSpeed: 8000,
    sealedAvailable: true,
  },
  {
    type: 'spherical',
    boreSizes: [6, 8, 10, 12, 14, 16, 20, 25, 30],
    dynamicCapacity: 100,
    staticCapacity: 200,
    maxSpeed: 2000,
    sealedAvailable: true,
  },
  {
    type: 'rod-end',
    boreSizes: [5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25],
    dynamicCapacity: 80,
    staticCapacity: 150,
    maxSpeed: 1000,
    sealedAvailable: true,
  },
];

export function selectPivotBearing(
  boreSize: number,
  radialLoad: number,
  oscillating: boolean,
  speedRPM: number
): { type: string; suitable: boolean; note: string }[] {
  const results: { type: string; suitable: boolean; note: string }[] = [];

  for (const bearing of pivotBearings) {
    if (!bearing.boreSizes.includes(boreSize)) {
      results.push({ type: bearing.type, suitable: false, note: 'Bore size not available' });
      continue;
    }

    const capacity = boreSize * boreSize * bearing.dynamicCapacity;
    if (capacity < radialLoad) {
      results.push({ type: bearing.type, suitable: false, note: 'Insufficient load capacity' });
      continue;
    }

    if (speedRPM > bearing.maxSpeed) {
      results.push({ type: bearing.type, suitable: false, note: 'Speed exceeds rating' });
      continue;
    }

    // Suitable
    let note = `Capacity: ${Math.round(capacity)}N`;
    if (oscillating && bearing.type === 'plain-bushing') {
      note += ' - Good for oscillating motion';
    }
    if (bearing.type === 'spherical' || bearing.type === 'rod-end') {
      note += ' - Allows misalignment';
    }

    results.push({ type: bearing.type, suitable: true, note });
  }

  return results;
}
