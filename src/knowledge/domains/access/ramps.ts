/**
 * Ramps Knowledge Definition
 *
 * Engineering knowledge for ramp design and fabrication.
 * Implements ADA, IBC, and industrial standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// RAMP PARAMETERS
// =============================================================================

const rampParameters: ParameterDefinition[] = [
  // Primary inputs
  {
    id: 'total_rise',
    name: 'Total Rise',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total vertical height change',
  },
  {
    id: 'width',
    name: 'Ramp Width',
    type: 'number',
    unit: 'mm',
    default: 1200,
    min: 914,    // 36" minimum ADA
    required: true,
    description: 'Clear width of ramp',
  },
  {
    id: 'ramp_type',
    name: 'Ramp Type',
    type: 'select',
    options: ['straight', 'switchback', 'l-shape', 'spiral'],
    default: 'straight',
    required: true,
    description: 'Ramp configuration',
  },
  {
    id: 'use_type',
    name: 'Use Type',
    type: 'select',
    options: ['pedestrian', 'wheelchair-accessible', 'vehicle', 'industrial'],
    default: 'wheelchair-accessible',
    required: true,
    description: 'Primary use for the ramp',
  },

  // Slope
  {
    id: 'slope_ratio',
    name: 'Slope Ratio',
    type: 'number',
    default: 12,
    min: 8,      // Steeper requires special consideration
    max: 20,
    required: false,
    description: 'Slope as 1:X (e.g., 12 means 1:12)',
  },
  {
    id: 'slope_percent',
    name: 'Slope Percent',
    type: 'number',
    required: false,
    description: 'Calculated slope percentage',
  },

  // Calculated dimensions
  {
    id: 'total_run',
    name: 'Total Run',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Calculated horizontal distance (rise × slope ratio)',
  },
  {
    id: 'ramp_length',
    name: 'Ramp Length',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Actual ramp surface length (along slope)',
  },

  // Landings
  {
    id: 'landing_interval',
    name: 'Landing Interval',
    type: 'number',
    unit: 'mm',
    default: 9144,   // 30" rise maximum between landings (ADA)
    required: false,
    description: 'Maximum rise between landings',
  },
  {
    id: 'top_landing_depth',
    name: 'Top Landing Depth',
    type: 'number',
    unit: 'mm',
    default: 1524,   // 60" minimum
    required: false,
    description: 'Depth of top landing',
  },
  {
    id: 'bottom_landing_depth',
    name: 'Bottom Landing Depth',
    type: 'number',
    unit: 'mm',
    default: 1524,
    required: false,
    description: 'Depth of bottom landing',
  },

  // Edge protection
  {
    id: 'edge_protection',
    name: 'Edge Protection Type',
    type: 'select',
    options: ['curb', 'rail', 'wall', 'none'],
    default: 'curb',
    required: true,
    description: 'Type of edge protection',
  },
  {
    id: 'curb_height',
    name: 'Curb Height',
    type: 'number',
    unit: 'mm',
    default: 50,
    min: 50,     // 2" minimum
    required: false,
    description: 'Height of edge curb',
  },

  // Handrails
  {
    id: 'handrails_required',
    name: 'Handrails Required',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Whether handrails are required (rises > 150mm)',
  },
  {
    id: 'handrail_height',
    name: 'Handrail Height',
    type: 'number',
    unit: 'mm',
    default: 900,
    min: 864,    // 34" minimum
    max: 965,    // 38" maximum
    required: false,
    description: 'Height of handrails',
  },
  {
    id: 'handrail_extension',
    name: 'Handrail Extension',
    type: 'number',
    unit: 'mm',
    default: 305,  // 12" minimum
    required: false,
    description: 'Horizontal extension beyond ramp ends',
  },

  // Surface
  {
    id: 'surface_type',
    name: 'Surface Type',
    type: 'select',
    options: ['checkered-plate', 'grip-strut', 'grating', 'concrete', 'non-slip-coating'],
    default: 'checkered-plate',
    required: true,
    description: 'Ramp surface material',
  },

  // Construction
  {
    id: 'construction_type',
    name: 'Construction Type',
    type: 'select',
    options: ['steel-frame', 'aluminum-frame', 'concrete', 'wood'],
    default: 'steel-frame',
    required: true,
    description: 'Primary construction method',
  },
];

// =============================================================================
// RAMP RULES
// =============================================================================

const rampRules: Rule[] = [
  // ADA slope requirements
  {
    id: 'ada_slope_max',
    name: 'ADA Maximum Slope',
    description: 'Wheelchair ramps shall not exceed 1:12 slope (8.33%)',
    type: 'constraint',
    source: 'ADA 405.2',
    expression: {
      type: 'conditional',
      condition: 'use_type == "wheelchair-accessible"',
      then: { type: 'range', param: 'slope_ratio', min: 12 },
    },
    errorMessage: 'ADA ramps must be 1:12 or gentler',
  },

  // Rise limit per run
  {
    id: 'rise_per_run_max',
    name: 'Maximum Rise Per Run',
    description: 'Maximum rise of 30 inches (762mm) between landings',
    type: 'constraint',
    source: 'ADA 405.6',
    expression: { type: 'range', param: 'landing_interval', max: 762 },
    errorMessage: 'Landing required every 762mm of rise',
  },

  // Width requirements
  {
    id: 'width_ada_min',
    name: 'ADA Minimum Width',
    description: 'Clear width shall be minimum 36 inches (914mm)',
    type: 'constraint',
    source: 'ADA 405.5',
    expression: {
      type: 'conditional',
      condition: 'use_type == "wheelchair-accessible"',
      then: { type: 'range', param: 'width', min: 914 },
    },
    errorMessage: 'ADA ramp width must be at least 914mm',
  },

  // Landing size
  {
    id: 'landing_size_min',
    name: 'Minimum Landing Size',
    description: 'Landings shall be at least as wide as ramp and 60" (1524mm) long',
    type: 'constraint',
    source: 'ADA 405.7',
    expression: { type: 'range', param: 'top_landing_depth', min: 1524 },
    errorMessage: 'Landing depth must be at least 1524mm',
  },

  // Handrail requirements
  {
    id: 'handrails_when_required',
    name: 'Handrails Required',
    description: 'Handrails required when rise exceeds 6 inches (150mm)',
    type: 'constraint',
    source: 'ADA 405.8',
    expression: {
      type: 'conditional',
      condition: 'total_rise > 150',
      then: { type: 'required-if', param: 'handrails_required', condition: 'true' },
    },
    errorMessage: 'Handrails required for rise > 150mm',
  },

  // Handrail height
  {
    id: 'handrail_height_range',
    name: 'Handrail Height',
    description: 'Handrails shall be 34-38 inches (864-965mm) high',
    type: 'constraint',
    source: 'ADA 505.4',
    expression: { type: 'range', param: 'handrail_height', min: 864, max: 965 },
    errorMessage: 'Handrail height must be 864-965mm',
  },

  // Handrail extension
  {
    id: 'handrail_extension_min',
    name: 'Handrail Extension',
    description: 'Handrails shall extend 12 inches (305mm) beyond ramp',
    type: 'constraint',
    source: 'ADA 505.10',
    expression: { type: 'range', param: 'handrail_extension', min: 305 },
    errorMessage: 'Handrail extension must be at least 305mm',
  },

  // Edge protection
  {
    id: 'edge_protection_required',
    name: 'Edge Protection',
    description: 'Edge protection required on open sides',
    type: 'constraint',
    source: 'ADA 405.9',
    expression: { type: 'range', param: 'curb_height', min: 50 },
    errorMessage: 'Edge curb must be at least 50mm',
  },

  // Vehicle ramp slopes
  {
    id: 'vehicle_ramp_slope',
    name: 'Vehicle Ramp Slope',
    description: 'Vehicle ramps typically 1:8 to 1:10 slope',
    type: 'recommendation',
    expression: {
      type: 'conditional',
      condition: 'use_type == "vehicle"',
      then: { type: 'range', param: 'slope_ratio', min: 8, max: 12 },
    },
    errorMessage: 'Vehicle ramp slope outside typical range',
  },
];

// =============================================================================
// RAMP COMPONENTS
// =============================================================================

const rampComponents: ComponentDefinition[] = [
  // Frame beams (stringers)
  {
    id: 'stringer',
    name: 'Stringer',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'width <= 1200 ? 2 : (width <= 2400 ? 3 : 4)',
    parameters: [
      {
        id: 'stringer_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Stringer length along slope',
      },
      {
        id: 'stringer_profile',
        name: 'Profile',
        type: 'string',
        required: true,
        description: 'Channel or beam size',
      },
    ],
  },

  // Decking
  {
    id: 'deck_plate',
    name: 'Deck Plate/Grating',
    type: 'surface',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(ramp_length / 2000)',  // Sections
    parameters: [
      {
        id: 'deck_thickness',
        name: 'Thickness',
        type: 'number',
        unit: 'mm',
        default: 6,
        required: true,
        description: 'Deck plate thickness',
      },
    ],
  },

  // Cross members
  {
    id: 'cross_member',
    name: 'Cross Member',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(ramp_length / 600) + 1',
    parameters: [],
  },

  // Handrails
  {
    id: 'handrail',
    name: 'Handrail',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: '2',
    parameters: [
      {
        id: 'handrail_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total handrail length including extensions',
      },
    ],
  },

  // Posts
  {
    id: 'post',
    name: 'Post',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(ramp_length / 1200) * 2 + 4',
    parameters: [],
  },

  // Edge curbs
  {
    id: 'curb',
    name: 'Edge Curb',
    type: 'accessory',
    required: true,
    quantity: 'single',
    quantityFormula: '2',
    parameters: [
      {
        id: 'curb_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total curb length',
      },
    ],
  },

  // Landings
  {
    id: 'landing',
    name: 'Landing Platform',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_rise / 762) + 1',  // Top + intermediates
    parameters: [
      {
        id: 'landing_width',
        name: 'Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Landing width (matches ramp)',
      },
      {
        id: 'landing_depth',
        name: 'Depth',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Landing depth (1524mm minimum)',
      },
    ],
  },
];

// =============================================================================
// EXPORT RAMP ELEMENT
// =============================================================================

export const rampElement: ElementDefinition = {
  id: 'ramp',
  name: 'Ramp',
  description: 'Inclined walking surface for accessibility or vehicle access',
  connectionType: 'elevation-change',
  parameters: rampParameters,
  rules: rampRules,
  materials: ['steel', 'aluminum', 'concrete', 'wood'],
  components: rampComponents,
};

// =============================================================================
// RAMP CALCULATOR
// =============================================================================

export interface RampCalculationInput {
  totalRise: number;        // mm
  width: number;            // mm
  useType: 'pedestrian' | 'wheelchair-accessible' | 'vehicle' | 'industrial';
  slopeRatio?: number;      // 1:X (default 12 for ADA)
  rampType?: 'straight' | 'switchback' | 'l-shape';
  availableRun?: number;    // mm (space available)
}

export interface RampCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  totalRise: number;
  totalRun: number;
  rampLength: number;       // Along slope
  slopeRatio: number;
  slopePercent: number;
  slopeAngle: number;       // Degrees

  // Landings
  numLandings: number;
  landingPositions: number[];
  landingWidth: number;
  landingDepth: number;

  // For switchback
  numRuns?: number;
  runLength?: number;
  runRise?: number;

  // Handrails
  handrailsRequired: boolean;
  handrailLength: number;

  // Components
  components: {
    stringers: number;
    deckPlates: number;
    crossMembers: number;
    posts: number;
    landings: number;
  };
}

/**
 * Calculate ramp parameters
 */
export function calculateRamp(input: RampCalculationInput): RampCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Default slope ratio based on use
  let slopeRatio = input.slopeRatio;
  if (!slopeRatio) {
    switch (input.useType) {
      case 'wheelchair-accessible':
        slopeRatio = 12;  // 1:12 ADA max
        break;
      case 'vehicle':
        slopeRatio = 10;  // Steeper OK for vehicles
        break;
      default:
        slopeRatio = 12;
    }
  }

  // Validate ADA compliance
  if (input.useType === 'wheelchair-accessible' && slopeRatio < 12) {
    errors.push('ADA ramps must be 1:12 or gentler');
  }

  // Calculate total run
  const totalRun = input.totalRise * slopeRatio;

  // Check available space
  if (input.availableRun && totalRun > input.availableRun) {
    if (input.rampType !== 'switchback') {
      warnings.push(`Straight ramp requires ${totalRun}mm run, only ${input.availableRun}mm available. Consider switchback.`);
    }
  }

  // Calculate ramp length (along slope)
  const rampLength = Math.sqrt(input.totalRise ** 2 + totalRun ** 2);

  // Slope calculations
  const slopePercent = (input.totalRise / totalRun) * 100;
  const slopeAngle = Math.atan(input.totalRise / totalRun) * (180 / Math.PI);

  // Landing requirements (every 762mm rise for ADA)
  const maxRisePerRun = input.useType === 'wheelchair-accessible' ? 762 : 1500;
  const numLandings = Math.ceil(input.totalRise / maxRisePerRun);
  const landingPositions: number[] = [];

  for (let i = 1; i < numLandings; i++) {
    landingPositions.push(i * maxRisePerRun);
  }
  landingPositions.push(input.totalRise); // Top landing

  const landingWidth = input.width;
  const landingDepth = 1524;  // 60" minimum

  // Switchback calculation
  let numRuns: number | undefined;
  let runLength: number | undefined;
  let runRise: number | undefined;

  if (input.rampType === 'switchback' && numLandings > 1) {
    numRuns = numLandings;
    runRise = input.totalRise / numRuns;
    runLength = runRise * slopeRatio;
  }

  // Handrails
  const handrailsRequired = input.totalRise > 150;
  const handrailExtension = 305;  // 12"
  const handrailLength = rampLength + (2 * handrailExtension);

  // Validate width
  if (input.useType === 'wheelchair-accessible' && input.width < 914) {
    errors.push('ADA ramps must be at least 914mm wide');
  }

  // Components
  const stringers = input.width <= 1200 ? 2 : input.width <= 2400 ? 3 : 4;
  const deckPlates = Math.ceil(rampLength / 2000);
  const crossMembers = Math.ceil(rampLength / 600) + 1;
  const posts = Math.ceil(rampLength / 1200) * 2 + 4;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalRise: input.totalRise,
    totalRun,
    rampLength: Math.round(rampLength),
    slopeRatio,
    slopePercent: Math.round(slopePercent * 100) / 100,
    slopeAngle: Math.round(slopeAngle * 100) / 100,
    numLandings,
    landingPositions,
    landingWidth,
    landingDepth,
    numRuns,
    runLength: runLength ? Math.round(runLength) : undefined,
    runRise,
    handrailsRequired,
    handrailLength: Math.round(handrailLength),
    components: {
      stringers,
      deckPlates,
      crossMembers,
      posts,
      landings: numLandings,
    },
  };
}
