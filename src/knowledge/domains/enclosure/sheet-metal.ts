/**
 * ENCLOSURE Domain - Sheet Metal Fabrication Rules
 *
 * Engineering knowledge for sheet metal design and fabrication:
 * - Bend calculations (K-factor, bend allowance, bend deduction)
 * - Material properties and gauges
 * - Minimum features (hole sizes, edge distances, spacing)
 * - Fabrication capabilities and tolerances
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// SHEET METAL PART PARAMETERS
// ============================================================================

const sheetMetalPartParameters: ParameterDefinition[] = [
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['CRS', 'HRS', 'aluminum-5052', 'aluminum-6061', 'stainless-304', 'stainless-316', 'galvanized', 'copper', 'brass'],
    default: 'CRS',
    required: true,
    description: 'Sheet metal material type',
  },
  {
    id: 'thickness',
    name: 'Material Thickness',
    type: 'number',
    unit: 'mm',
    min: 0.5,
    max: 10,
    default: 1.5,
    required: true,
    description: 'Sheet metal gauge/thickness',
  },
  {
    id: 'flat_length',
    name: 'Flat Pattern Length',
    type: 'number',
    unit: 'mm',
    min: 10,
    max: 3000,
    default: 200,
    required: true,
    description: 'Length of flat pattern blank',
  },
  {
    id: 'flat_width',
    name: 'Flat Pattern Width',
    type: 'number',
    unit: 'mm',
    min: 10,
    max: 1500,
    default: 100,
    required: true,
    description: 'Width of flat pattern blank',
  },
  {
    id: 'num_bends',
    name: 'Number of Bends',
    type: 'number',
    unit: 'mm', // proxy for count
    min: 0,
    max: 20,
    default: 2,
    required: true,
    description: 'Total number of bend lines',
  },
  {
    id: 'bend_angle',
    name: 'Primary Bend Angle',
    type: 'number',
    unit: 'mm', // proxy for degrees
    min: 0,
    max: 180,
    default: 90,
    required: true,
    description: 'Most common bend angle (degrees)',
  },
  {
    id: 'inside_radius',
    name: 'Inside Bend Radius',
    type: 'number',
    unit: 'mm',
    min: 0.5,
    max: 25,
    default: 1.5,
    required: true,
    description: 'Inside radius of bend',
  },
  {
    id: 'bend_direction',
    name: 'Bend Direction Convention',
    type: 'select',
    options: ['up', 'down'],
    default: 'up',
    required: false,
    description: 'Reference for bend direction',
  },
  {
    id: 'grain_direction',
    name: 'Grain Direction',
    type: 'select',
    options: ['parallel', 'perpendicular', 'any'],
    default: 'perpendicular',
    required: false,
    description: 'Grain orientation relative to bend',
  },
  {
    id: 'surface_finish',
    name: 'Surface Finish',
    type: 'select',
    options: ['mill', '2B', '4', 'brushed', 'mirror', 'embossed'],
    default: 'mill',
    required: false,
    description: 'Surface finish requirement',
  },
  {
    id: 'finish',
    name: 'Post-Fabrication Finish',
    type: 'select',
    options: ['none', 'paint', 'powder-coat', 'anodize', 'plate', 'passivate'],
    default: 'powder-coat',
    required: false,
    description: 'Final surface treatment',
  },
  {
    id: 'tolerance_class',
    name: 'Tolerance Class',
    type: 'select',
    options: ['commercial', 'precision', 'high-precision'],
    default: 'commercial',
    required: false,
    description: 'Dimensional tolerance class',
  },
];

// ============================================================================
// SHEET METAL RULES
// ============================================================================

const sheetMetalRules: Rule[] = [
  {
    id: 'min_bend_radius',
    name: 'Minimum Bend Radius',
    description: 'Inside radius must be at least material thickness',
    type: 'constraint',
    source: 'Sheet Metal Design Guide',
    expression: {
      type: 'ratio',
      param1: 'inside_radius',
      param2: 'thickness',
      min: 1.0,
    },
    errorMessage: 'Bend radius too small - risk of cracking',
  },
  {
    id: 'min_flange_length',
    name: 'Minimum Flange Length',
    description: 'Flange must be at least 4x material thickness',
    type: 'constraint',
    source: 'Press Brake Limitations',
    expression: {
      type: 'range',
      param: 'thickness',
      min: 0.5,
    },
    errorMessage: 'Flange too short for press brake tooling',
  },
  {
    id: 'bend_near_edge',
    name: 'Bend Near Edge',
    description: 'Minimum distance from bend to edge',
    type: 'constraint',
    source: 'Fabrication Standards',
    expression: {
      type: 'range',
      param: 'inside_radius',
      min: 0.5,
    },
    errorMessage: 'Bend too close to edge',
  },
  {
    id: 'hole_near_bend',
    name: 'Hole Near Bend',
    description: 'Minimum distance from hole to bend line',
    type: 'constraint',
    source: 'Sheet Metal Design',
    expression: {
      type: 'range',
      param: 'thickness',
      min: 0.5,
    },
    errorMessage: 'Hole too close to bend - may deform',
  },
  {
    id: 'grain_orientation',
    name: 'Grain Orientation',
    description: 'Bend perpendicular to grain for best results',
    type: 'recommendation',
    source: 'Material Science',
    expression: {
      type: 'conditional',
      condition: 'grain_direction == "parallel"',
      then: { type: 'range', param: 'inside_radius', min: 2 },
    },
    errorMessage: 'Increase bend radius when bending parallel to grain',
  },
  {
    id: 'springback',
    name: 'Springback Consideration',
    description: 'Account for springback in high-strength materials',
    type: 'recommendation',
    source: 'Press Brake Operation',
    expression: {
      type: 'conditional',
      condition: 'material == "stainless-304" || material == "stainless-316"',
      then: { type: 'range', param: 'inside_radius', min: 1.5 },
    },
    errorMessage: 'Stainless steel requires larger radius due to springback',
  },
];

// ============================================================================
// SHEET METAL COMPONENTS
// ============================================================================

const sheetMetalComponents: ComponentDefinition[] = [
  {
    id: 'flat_blank',
    name: 'Flat Blank',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'blank_dims',
        name: 'Blank Dimensions',
        type: 'string',
        required: true,
        description: 'L x W x t',
      },
    ],
  },
  {
    id: 'hardware',
    name: 'PEM Hardware',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'hardware_count',
    parameters: [],
  },
];

// ============================================================================
// SHEET METAL PART ELEMENT
// ============================================================================

export const sheetMetalPartElement: ElementDefinition = {
  id: 'sheet-metal-part',
  name: 'Sheet Metal Part',
  description: 'Custom fabricated sheet metal component',
  connectionType: 'surface-mount',
  parameters: sheetMetalPartParameters,
  rules: sheetMetalRules,
  materials: ['CRS', 'HRS', 'aluminum', 'stainless', 'galvanized'],
  components: sheetMetalComponents,
};

// ============================================================================
// MATERIAL PROPERTIES DATABASE
// ============================================================================

export interface SheetMetalMaterial {
  id: string;
  name: string;
  density: number;           // kg/m³
  yieldStrength: number;     // MPa
  tensileStrength: number;   // MPa
  elasticModulus: number;    // GPa
  kFactor: number;           // Typical K-factor for bending
  minBendRadiusRatio: number; // Minimum R/t ratio
  springbackFactor: number;  // Typical springback multiplier
  weldability: 'poor' | 'fair' | 'good' | 'excellent';
  costFactor: number;        // Relative cost (CRS = 1.0)
}

export const sheetMetalMaterials: SheetMetalMaterial[] = [
  {
    id: 'CRS',
    name: 'Cold Rolled Steel',
    density: 7850,
    yieldStrength: 280,
    tensileStrength: 340,
    elasticModulus: 200,
    kFactor: 0.44,
    minBendRadiusRatio: 0.5,
    springbackFactor: 1.02,
    weldability: 'excellent',
    costFactor: 1.0,
  },
  {
    id: 'HRS',
    name: 'Hot Rolled Steel',
    density: 7850,
    yieldStrength: 250,
    tensileStrength: 400,
    elasticModulus: 200,
    kFactor: 0.42,
    minBendRadiusRatio: 0.8,
    springbackFactor: 1.01,
    weldability: 'excellent',
    costFactor: 0.9,
  },
  {
    id: 'galvanized',
    name: 'Galvanized Steel',
    density: 7850,
    yieldStrength: 250,
    tensileStrength: 340,
    elasticModulus: 200,
    kFactor: 0.44,
    minBendRadiusRatio: 1.0,
    springbackFactor: 1.02,
    weldability: 'fair',
    costFactor: 1.15,
  },
  {
    id: 'stainless-304',
    name: 'Stainless Steel 304',
    density: 8000,
    yieldStrength: 215,
    tensileStrength: 505,
    elasticModulus: 193,
    kFactor: 0.45,
    minBendRadiusRatio: 1.0,
    springbackFactor: 1.08,
    weldability: 'good',
    costFactor: 3.5,
  },
  {
    id: 'stainless-316',
    name: 'Stainless Steel 316',
    density: 8000,
    yieldStrength: 205,
    tensileStrength: 515,
    elasticModulus: 193,
    kFactor: 0.45,
    minBendRadiusRatio: 1.0,
    springbackFactor: 1.10,
    weldability: 'good',
    costFactor: 4.5,
  },
  {
    id: 'aluminum-5052',
    name: 'Aluminum 5052-H32',
    density: 2680,
    yieldStrength: 193,
    tensileStrength: 228,
    elasticModulus: 70,
    kFactor: 0.40,
    minBendRadiusRatio: 1.0,
    springbackFactor: 1.04,
    weldability: 'good',
    costFactor: 2.0,
  },
  {
    id: 'aluminum-6061',
    name: 'Aluminum 6061-T6',
    density: 2700,
    yieldStrength: 276,
    tensileStrength: 310,
    elasticModulus: 69,
    kFactor: 0.38,
    minBendRadiusRatio: 2.0,
    springbackFactor: 1.06,
    weldability: 'fair',
    costFactor: 2.2,
  },
  {
    id: 'copper',
    name: 'Copper (soft)',
    density: 8940,
    yieldStrength: 69,
    tensileStrength: 220,
    elasticModulus: 117,
    kFactor: 0.35,
    minBendRadiusRatio: 0.3,
    springbackFactor: 1.01,
    weldability: 'excellent',
    costFactor: 5.0,
  },
  {
    id: 'brass',
    name: 'Brass (CuZn30)',
    density: 8530,
    yieldStrength: 124,
    tensileStrength: 324,
    elasticModulus: 110,
    kFactor: 0.38,
    minBendRadiusRatio: 0.5,
    springbackFactor: 1.02,
    weldability: 'poor',
    costFactor: 4.0,
  },
];

// ============================================================================
// GAUGE TABLE
// ============================================================================

export interface GaugeData {
  gauge: number;
  steelMm: number;
  aluminumMm: number;
  stainlessMm: number;
}

export const gaugeTable: GaugeData[] = [
  { gauge: 28, steelMm: 0.38, aluminumMm: 0.35, stainlessMm: 0.38 },
  { gauge: 26, steelMm: 0.46, aluminumMm: 0.41, stainlessMm: 0.46 },
  { gauge: 24, steelMm: 0.61, aluminumMm: 0.51, stainlessMm: 0.61 },
  { gauge: 22, steelMm: 0.76, aluminumMm: 0.64, stainlessMm: 0.76 },
  { gauge: 20, steelMm: 0.91, aluminumMm: 0.81, stainlessMm: 0.89 },
  { gauge: 18, steelMm: 1.21, aluminumMm: 1.02, stainlessMm: 1.21 },
  { gauge: 16, steelMm: 1.52, aluminumMm: 1.29, stainlessMm: 1.52 },
  { gauge: 14, steelMm: 1.90, aluminumMm: 1.63, stainlessMm: 1.90 },
  { gauge: 12, steelMm: 2.66, aluminumMm: 2.05, stainlessMm: 2.66 },
  { gauge: 11, steelMm: 3.04, aluminumMm: 2.31, stainlessMm: 3.04 },
  { gauge: 10, steelMm: 3.42, aluminumMm: 2.59, stainlessMm: 3.40 },
  { gauge: 8, steelMm: 4.17, aluminumMm: 3.26, stainlessMm: 4.17 },
  { gauge: 7, steelMm: 4.55, aluminumMm: 3.67, stainlessMm: 4.55 },
  { gauge: 6, steelMm: 4.94, aluminumMm: 4.12, stainlessMm: 4.94 },
  { gauge: 5, steelMm: 5.31, aluminumMm: 4.62, stainlessMm: 5.31 },
  { gauge: 4, steelMm: 5.95, aluminumMm: 5.19, stainlessMm: 5.95 },
  { gauge: 3, steelMm: 6.35, aluminumMm: 5.83, stainlessMm: 6.35 },
];

// ============================================================================
// FABRICATION TOLERANCE TABLE
// ============================================================================

export interface ToleranceData {
  toleranceClass: string;
  linearUpTo100mm: number;
  linearUpTo500mm: number;
  linearUpTo1000mm: number;
  angularDeg: number;
  bendAngleDeg: number;
  holeLocation: number;
}

export const toleranceTable: ToleranceData[] = [
  {
    toleranceClass: 'commercial',
    linearUpTo100mm: 0.8,
    linearUpTo500mm: 1.2,
    linearUpTo1000mm: 2.0,
    angularDeg: 1.0,
    bendAngleDeg: 1.5,
    holeLocation: 0.5,
  },
  {
    toleranceClass: 'precision',
    linearUpTo100mm: 0.3,
    linearUpTo500mm: 0.5,
    linearUpTo1000mm: 0.8,
    angularDeg: 0.5,
    bendAngleDeg: 0.75,
    holeLocation: 0.25,
  },
  {
    toleranceClass: 'high-precision',
    linearUpTo100mm: 0.1,
    linearUpTo500mm: 0.2,
    linearUpTo1000mm: 0.4,
    angularDeg: 0.25,
    bendAngleDeg: 0.5,
    holeLocation: 0.1,
  },
];

// ============================================================================
// MINIMUM FEATURE RULES
// ============================================================================

export interface MinFeatureRules {
  minHoleDiameter: number;        // Relative to thickness (ratio)
  minHoleEdgeDistance: number;    // Relative to thickness
  minHoleToHole: number;          // Relative to thickness
  minHoleToBend: number;          // Relative to thickness + radius
  minFlange: number;              // Relative to thickness
  minBendSpacing: number;         // Relative to thickness
  minNotchWidth: number;          // Absolute mm
  minTabWidth: number;            // Relative to thickness
  maxAspectRatio: number;         // Length / width
}

export const minFeatureRules: MinFeatureRules = {
  minHoleDiameter: 1.0,           // Hole diameter >= 1x thickness
  minHoleEdgeDistance: 2.0,       // Distance to edge >= 2x thickness
  minHoleToHole: 2.0,             // Hole-to-hole spacing >= 2x thickness
  minHoleToBend: 3.0,             // Add bend radius to this
  minFlange: 4.0,                 // Minimum flange = 4x thickness
  minBendSpacing: 8.0,            // Between parallel bends
  minNotchWidth: 1.5,             // Absolute minimum notch
  minTabWidth: 3.0,               // Relative to thickness
  maxAspectRatio: 10.0,           // L/W ratio
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface BendCalculationInput {
  material: string;
  thickness: number;        // mm
  bendAngle: number;        // degrees
  insideRadius: number;     // mm
  kFactor?: number;         // Override default K-factor
}

export interface BendCalculationResult {
  kFactor: number;
  bendAllowance: number;    // mm - material added at bend
  bendDeduction: number;    // mm - subtract from outside dimensions
  outsideSetback: number;   // mm - OSSB
  insideSetback: number;    // mm - ISSB
  arcLength: number;        // mm - neutral axis arc length
  minimumFlange: number;    // mm - minimum flange for this setup
  estimatedSpringback: number; // degrees
}

export interface FlatPatternInput {
  finishedDimensions: Array<{
    length: number;         // mm - leg length to outside
    angle: number;          // degrees - bend angle at end of this leg
    radius: number;         // mm - inside radius of bend
  }>;
  material: string;
  thickness: number;
}

export interface FlatPatternResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  flatLength: number;       // mm - total flat pattern length
  blankDimensions: {
    length: number;
    width: number;
    area: number;           // mm²
  };
  bendDetails: Array<{
    bendNumber: number;
    angle: number;
    bendAllowance: number;
    bendDeduction: number;
  }>;
  weight: number;           // kg
  materialUtilization?: number; // % if nesting info available
}

export interface MinFeaturesInput {
  thickness: number;
  insideRadius: number;
  holeDiameters: number[];
  holeEdgeDistances: number[];
  holeToHoleDistances: number[];
  holeToBendDistances: number[];
  flangeLengths: number[];
  bendSpacings: number[];
}

export interface MinFeaturesResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// BEND CALCULATIONS
// ============================================================================

/**
 * Calculate bend allowance and related values
 * Uses the K-factor method per industry standards
 */
export function calculateBend(input: BendCalculationInput): BendCalculationResult {
  const material = sheetMetalMaterials.find(m => m.id === input.material);
  const kFactor = input.kFactor || material?.kFactor || 0.44;
  const t = input.thickness;
  const R = input.insideRadius;
  const A = input.bendAngle;
  const radians = (A * Math.PI) / 180;

  // Neutral axis position
  const neutralAxis = R + kFactor * t;

  // Bend allowance = arc length at neutral axis
  const bendAllowance = radians * neutralAxis;

  // Outside setback (OSSB)
  const outsideSetback = Math.tan(radians / 2) * (R + t);

  // Inside setback (ISSB)
  const insideSetback = Math.tan(radians / 2) * R;

  // Bend deduction = 2 * OSSB - BA
  const bendDeduction = 2 * outsideSetback - bendAllowance;

  // Arc length at neutral axis
  const arcLength = bendAllowance;

  // Minimum flange (typically 4x thickness + radius for 90° bends)
  const minimumFlange = 4 * t + R;

  // Springback estimate
  const springbackFactor = material?.springbackFactor || 1.02;
  const estimatedSpringback = A * (springbackFactor - 1);

  return {
    kFactor,
    bendAllowance: Math.round(bendAllowance * 1000) / 1000,
    bendDeduction: Math.round(bendDeduction * 1000) / 1000,
    outsideSetback: Math.round(outsideSetback * 1000) / 1000,
    insideSetback: Math.round(insideSetback * 1000) / 1000,
    arcLength: Math.round(arcLength * 1000) / 1000,
    minimumFlange: Math.round(minimumFlange * 10) / 10,
    estimatedSpringback: Math.round(estimatedSpringback * 10) / 10,
  };
}

/**
 * Calculate flat pattern from finished dimensions
 * Each dimension is the outside length of a leg, ending at a bend
 */
export function calculateFlatPattern(input: FlatPatternInput): FlatPatternResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const bendDetails: FlatPatternResult['bendDetails'] = [];

  const material = sheetMetalMaterials.find(m => m.id === input.material);
  const t = input.thickness;
  const density = material?.density || 7850;

  let flatLength = 0;

  // Process each leg
  for (let i = 0; i < input.finishedDimensions.length; i++) {
    const leg = input.finishedDimensions[i];

    // Add leg length (from outside)
    flatLength += leg.length;

    // If there's a bend after this leg
    if (leg.angle > 0 && i < input.finishedDimensions.length - 1) {
      const bendCalc = calculateBend({
        material: input.material,
        thickness: t,
        bendAngle: leg.angle,
        insideRadius: leg.radius,
      });

      // Subtract bend deduction (or add negative)
      flatLength -= bendCalc.bendDeduction;

      bendDetails.push({
        bendNumber: i + 1,
        angle: leg.angle,
        bendAllowance: bendCalc.bendAllowance,
        bendDeduction: bendCalc.bendDeduction,
      });

      // Check minimum flange
      const nextLeg = input.finishedDimensions[i + 1];
      if (nextLeg && nextLeg.length < bendCalc.minimumFlange) {
        warnings.push(`Leg ${i + 2} (${nextLeg.length}mm) is less than minimum flange (${bendCalc.minimumFlange}mm)`);
      }
    }
  }

  // Check minimum bend radius
  const minRadiusRatio = material?.minBendRadiusRatio || 1.0;
  for (const leg of input.finishedDimensions) {
    if (leg.radius < t * minRadiusRatio && leg.angle > 0) {
      errors.push(`Bend radius ${leg.radius}mm is less than minimum ${(t * minRadiusRatio).toFixed(1)}mm for ${input.material}`);
    }
  }

  // Calculate weight (assuming rectangular blank)
  // In real world, would need width information
  const area = flatLength * 100; // Assume 100mm width for estimate
  const volume = area * t / 1e9; // m³
  const weight = volume * density;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    flatLength: Math.round(flatLength * 100) / 100,
    blankDimensions: {
      length: Math.round(flatLength * 10) / 10,
      width: 100, // Placeholder - would need actual input
      area: Math.round(area),
    },
    bendDetails,
    weight: Math.round(weight * 1000) / 1000,
  };
}

/**
 * Validate minimum feature rules
 */
export function validateMinFeatures(input: MinFeaturesInput): MinFeaturesResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const t = input.thickness;
  const R = input.insideRadius;
  const rules = minFeatureRules;

  // Check hole diameters
  for (let i = 0; i < input.holeDiameters.length; i++) {
    const d = input.holeDiameters[i];
    if (d < t * rules.minHoleDiameter) {
      violations.push(`Hole ${i + 1}: Diameter ${d}mm is less than minimum ${(t * rules.minHoleDiameter).toFixed(1)}mm`);
    }
  }

  // Check hole edge distances
  for (let i = 0; i < input.holeEdgeDistances.length; i++) {
    const dist = input.holeEdgeDistances[i];
    if (dist < t * rules.minHoleEdgeDistance) {
      violations.push(`Hole ${i + 1}: Edge distance ${dist}mm is less than minimum ${(t * rules.minHoleEdgeDistance).toFixed(1)}mm`);
    }
  }

  // Check hole-to-hole spacing
  for (let i = 0; i < input.holeToHoleDistances.length; i++) {
    const dist = input.holeToHoleDistances[i];
    if (dist < t * rules.minHoleToHole) {
      violations.push(`Hole spacing ${i + 1}: ${dist}mm is less than minimum ${(t * rules.minHoleToHole).toFixed(1)}mm`);
    }
  }

  // Check hole-to-bend distances
  const minHoleToBend = t * rules.minHoleToBend + R;
  for (let i = 0; i < input.holeToBendDistances.length; i++) {
    const dist = input.holeToBendDistances[i];
    if (dist < minHoleToBend) {
      violations.push(`Hole ${i + 1}: Distance to bend ${dist}mm is less than minimum ${minHoleToBend.toFixed(1)}mm`);
    }
  }

  // Check flange lengths
  const minFlange = t * rules.minFlange;
  for (let i = 0; i < input.flangeLengths.length; i++) {
    const flange = input.flangeLengths[i];
    if (flange < minFlange) {
      violations.push(`Flange ${i + 1}: Length ${flange}mm is less than minimum ${minFlange.toFixed(1)}mm`);
    }
  }

  // Check bend spacing
  const minBendSpacing = t * rules.minBendSpacing;
  for (let i = 0; i < input.bendSpacings.length; i++) {
    const spacing = input.bendSpacings[i];
    if (spacing < minBendSpacing) {
      warnings.push(`Bend spacing ${i + 1}: ${spacing}mm is tight (recommended ${minBendSpacing.toFixed(1)}mm)`);
    }
  }

  // General recommendations
  if (t > 3) {
    recommendations.push('Consider using larger bend radii for thick material');
  }
  if (input.insideRadius < t) {
    recommendations.push('Increase inside radius to reduce cracking risk');
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    recommendations,
  };
}

/**
 * Get material by ID
 */
export function getMaterial(id: string): SheetMetalMaterial | undefined {
  return sheetMetalMaterials.find(m => m.id === id);
}

/**
 * Get gauge thickness for material type
 */
export function getGaugeThickness(gauge: number, materialType: 'steel' | 'aluminum' | 'stainless'): number | undefined {
  const row = gaugeTable.find(g => g.gauge === gauge);
  if (!row) return undefined;

  switch (materialType) {
    case 'steel': return row.steelMm;
    case 'aluminum': return row.aluminumMm;
    case 'stainless': return row.stainlessMm;
    default: return undefined;
  }
}

/**
 * Get tolerance for dimension
 */
export function getTolerance(dimension: number, toleranceClass: string): number {
  const row = toleranceTable.find(t => t.toleranceClass === toleranceClass);
  if (!row) return 1.0; // Default commercial tolerance

  if (dimension <= 100) return row.linearUpTo100mm;
  if (dimension <= 500) return row.linearUpTo500mm;
  return row.linearUpTo1000mm;
}
