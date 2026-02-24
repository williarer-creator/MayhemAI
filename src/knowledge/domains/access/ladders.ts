/**
 * Ladders Knowledge Definition
 *
 * Engineering knowledge for fixed ladder design and fabrication.
 * Implements OSHA 1910.23 and IBC requirements.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// LADDER PARAMETERS
// =============================================================================

const ladderParameters: ParameterDefinition[] = [
  // Primary inputs
  {
    id: 'total_height',
    name: 'Total Height',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total vertical climb height',
  },
  {
    id: 'ladder_type',
    name: 'Ladder Type',
    type: 'select',
    options: ['fixed-vertical', 'fixed-offset', 'ships-ladder', 'step-ladder'],
    default: 'fixed-vertical',
    required: true,
    description: 'Type of ladder',
  },
  {
    id: 'width',
    name: 'Width (Between Rails)',
    type: 'number',
    unit: 'mm',
    default: 450,
    min: 406,    // 16" minimum per OSHA
    max: 762,    // 30" maximum typical
    required: true,
    description: 'Clear width between side rails',
  },
  {
    id: 'rung_spacing',
    name: 'Rung Spacing',
    type: 'number',
    unit: 'mm',
    default: 305,
    min: 254,    // 10" minimum
    max: 356,    // 14" maximum per OSHA
    required: false,
    description: 'Vertical distance between rungs',
  },
  {
    id: 'angle',
    name: 'Ladder Angle',
    type: 'number',
    unit: 'mm',
    default: 90,   // Vertical
    min: 60,
    max: 90,
    required: false,
    description: 'Angle from horizontal (90 = vertical)',
  },

  // Cage requirements
  {
    id: 'cage_required',
    name: 'Cage Required',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether safety cage is required (auto-calculated for height > 6.1m)',
  },
  {
    id: 'cage_start_height',
    name: 'Cage Start Height',
    type: 'number',
    unit: 'mm',
    default: 2134,  // 7 ft per OSHA
    required: false,
    description: 'Height above base where cage begins',
  },

  // Landing platforms
  {
    id: 'landing_interval',
    name: 'Landing Interval',
    type: 'number',
    unit: 'mm',
    default: 9144,  // 30 ft maximum
    required: false,
    description: 'Maximum climb between rest platforms',
  },

  // Rail extension
  {
    id: 'rail_extension',
    name: 'Rail Extension at Top',
    type: 'number',
    unit: 'mm',
    default: 1067,  // 42" per OSHA
    min: 1067,
    required: false,
    description: 'How far rails extend above landing',
  },

  // Construction
  {
    id: 'rail_type',
    name: 'Side Rail Type',
    type: 'select',
    options: ['channel', 'angle', 'flat-bar', 'tube-round', 'tube-square'],
    default: 'channel',
    required: true,
    description: 'Profile type for side rails',
  },
  {
    id: 'rung_type',
    name: 'Rung Type',
    type: 'select',
    options: ['round-bar', 'square-bar', 'serrated', 'tube'],
    default: 'round-bar',
    required: true,
    description: 'Type of rungs',
  },
  {
    id: 'rung_diameter',
    name: 'Rung Diameter',
    type: 'number',
    unit: 'mm',
    default: 25,
    min: 19,    // 3/4" minimum
    max: 32,    // Comfort maximum
    required: false,
    description: 'Diameter or width of rungs',
  },
];

// =============================================================================
// LADDER RULES (OSHA 1910.23)
// =============================================================================

const ladderRules: Rule[] = [
  // Rung spacing
  {
    id: 'rung_spacing_uniform',
    name: 'Uniform Rung Spacing',
    description: 'Rungs must be uniformly spaced, 10-14 inches (254-356mm) apart',
    type: 'constraint',
    source: 'OSHA 1910.23(b)(1)',
    expression: { type: 'range', param: 'rung_spacing', min: 254, max: 356 },
    errorMessage: 'Rung spacing must be 254-356mm',
  },

  // Width
  {
    id: 'width_minimum',
    name: 'Minimum Width',
    description: 'Clear width between rails minimum 16 inches (406mm)',
    type: 'constraint',
    source: 'OSHA 1910.23(b)(2)',
    expression: { type: 'range', param: 'width', min: 406 },
    errorMessage: 'Ladder width below 406mm minimum',
  },

  // Cage requirements
  {
    id: 'cage_height_requirement',
    name: 'Cage Required Above 24 ft',
    description: 'Fixed ladders over 24 feet (7315mm) must have cage or ladder safety system',
    type: 'constraint',
    source: 'OSHA 1910.23(d)(1)',
    expression: {
      type: 'conditional',
      condition: 'total_height > 7315',
      then: { type: 'required-if', param: 'cage_required', condition: 'true' },
    },
    errorMessage: 'Cage or safety system required for ladders > 7315mm',
  },

  // Cage start
  {
    id: 'cage_start_position',
    name: 'Cage Start Height',
    description: 'Cage must begin 7 feet (2134mm) above base',
    type: 'constraint',
    source: 'OSHA 1910.23(d)(2)',
    expression: {
      type: 'conditional',
      condition: 'cage_required == true',
      then: { type: 'range', param: 'cage_start_height', min: 2134, max: 2438 },
    },
    errorMessage: 'Cage start height must be approximately 2134mm (7 ft)',
  },

  // Landing platforms
  {
    id: 'landing_interval_max',
    name: 'Maximum Unbroken Length',
    description: 'Maximum ladder length without landing is 30 feet (9144mm)',
    type: 'constraint',
    source: 'OSHA 1910.23(d)(4)',
    expression: { type: 'range', param: 'landing_interval', max: 9144 },
    errorMessage: 'Landing required every 9144mm',
  },

  // Rail extension
  {
    id: 'rail_extension_min',
    name: 'Rail Extension at Top',
    description: 'Side rails must extend 42 inches (1067mm) above landing',
    type: 'constraint',
    source: 'OSHA 1910.23(b)(4)',
    expression: { type: 'range', param: 'rail_extension', min: 1067 },
    errorMessage: 'Rail extension must be at least 1067mm',
  },

  // Rung diameter
  {
    id: 'rung_diameter_min',
    name: 'Minimum Rung Diameter',
    description: 'Round rungs minimum 3/4 inch (19mm) diameter',
    type: 'constraint',
    source: 'OSHA 1910.23(b)(5)',
    expression: { type: 'range', param: 'rung_diameter', min: 19 },
    errorMessage: 'Rung diameter below 19mm minimum',
  },

  // Clearance behind ladder
  {
    id: 'clearance_behind',
    name: 'Climbing Clearance',
    description: 'Minimum 7 inch (178mm) clearance behind ladder',
    type: 'constraint',
    source: 'OSHA 1910.23(b)(3)',
    expression: { type: 'range', param: 'clearance_behind', min: 178 },
    errorMessage: 'Insufficient clearance behind ladder',
  },
];

// =============================================================================
// LADDER COMPONENTS
// =============================================================================

const ladderComponents: ComponentDefinition[] = [
  // Side rails
  {
    id: 'side_rail',
    name: 'Side Rail',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: '2',
    parameters: [
      {
        id: 'rail_length',
        name: 'Rail Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total length including extension',
      },
      {
        id: 'rail_profile',
        name: 'Profile',
        type: 'string',
        required: true,
        description: 'Channel, angle, or bar size',
      },
    ],
  },

  // Rungs
  {
    id: 'rung',
    name: 'Rung',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.floor(total_height / rung_spacing) + 1',
    parameters: [
      {
        id: 'rung_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total rung length (width + rail penetration)',
      },
    ],
  },

  // Cage hoops
  {
    id: 'cage_hoop',
    name: 'Cage Hoop',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'cage_required ? Math.ceil((total_height - cage_start_height) / 762) : 0',
    parameters: [
      {
        id: 'hoop_diameter',
        name: 'Inside Diameter',
        type: 'number',
        unit: 'mm',
        default: 686,  // 27" min per OSHA
        required: true,
        description: 'Inside diameter of cage hoop',
      },
    ],
  },

  // Cage vertical bars
  {
    id: 'cage_vertical',
    name: 'Cage Vertical Bar',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'cage_required ? 5 : 0',  // Typical: 5 verticals
    parameters: [],
  },

  // Mounting brackets
  {
    id: 'mounting_bracket',
    name: 'Wall Bracket',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_height / 3048) + 1',  // Every 10 ft
    parameters: [
      {
        id: 'bracket_standoff',
        name: 'Standoff',
        type: 'number',
        unit: 'mm',
        default: 178,  // 7" minimum clearance
        required: true,
        description: 'Distance from wall to ladder',
      },
    ],
  },
];

// =============================================================================
// EXPORT LADDER ELEMENT
// =============================================================================

export const ladderElement: ElementDefinition = {
  id: 'ladder',
  name: 'Fixed Ladder',
  description: 'Permanently attached ladder for vertical access',
  connectionType: 'elevation-change',
  parameters: ladderParameters,
  rules: ladderRules,
  materials: ['steel', 'aluminum', 'stainless'],
  components: ladderComponents,
};

// =============================================================================
// LADDER CALCULATOR
// =============================================================================

export interface LadderCalculationInput {
  totalHeight: number;      // mm
  ladderType: 'fixed-vertical' | 'fixed-offset' | 'ships-ladder';
  width?: number;           // mm
  rungSpacing?: number;     // mm
  includesCage?: boolean;
  material?: 'steel' | 'aluminum';
}

export interface LadderCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  totalHeight: number;
  width: number;
  rungSpacing: number;
  rungCount: number;
  railLength: number;       // Including extension

  // Cage
  cageRequired: boolean;
  cageStartHeight?: number;
  cageHoopCount?: number;

  // Landings
  landingsRequired: number;
  landingPositions: number[];

  // Components
  components: {
    sideRails: number;
    rungs: number;
    cageHoops: number;
    cageVerticals: number;
    mountingBrackets: number;
  };
}

/**
 * Calculate ladder parameters
 */
export function calculateLadder(input: LadderCalculationInput): LadderCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const width = input.width || 450;
  const rungSpacing = input.rungSpacing || 305;

  // Validate rung spacing
  if (rungSpacing < 254 || rungSpacing > 356) {
    errors.push('Rung spacing must be 254-356mm');
  }

  // Validate width
  if (width < 406) {
    errors.push('Width must be at least 406mm');
  }

  // Calculate rung count
  const rungCount = Math.floor(input.totalHeight / rungSpacing) + 1;

  // Rail length (height + extension)
  const railExtension = 1067;  // 42" per code
  const railLength = input.totalHeight + railExtension;

  // Cage requirements
  const cageRequired = input.includesCage ?? input.totalHeight > 7315;
  const cageStartHeight = cageRequired ? 2134 : undefined;
  const cageHeight = cageRequired ? input.totalHeight - cageStartHeight! : 0;
  const cageHoopCount = cageRequired ? Math.ceil(cageHeight / 762) + 1 : 0;

  // Landing requirements
  const landingInterval = 9144;  // 30 ft
  const landingsRequired = Math.floor(input.totalHeight / landingInterval);
  const landingPositions: number[] = [];

  for (let i = 1; i <= landingsRequired; i++) {
    landingPositions.push(i * landingInterval);
  }

  if (landingsRequired > 0) {
    warnings.push(`${landingsRequired} intermediate landing(s) required`);
  }

  // Mounting brackets (every 3048mm / 10 ft)
  const mountingBrackets = Math.ceil(input.totalHeight / 3048) + 1;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalHeight: input.totalHeight,
    width,
    rungSpacing,
    rungCount,
    railLength,
    cageRequired,
    cageStartHeight,
    cageHoopCount,
    landingsRequired,
    landingPositions,
    components: {
      sideRails: 2,
      rungs: rungCount,
      cageHoops: cageHoopCount,
      cageVerticals: cageRequired ? 5 : 0,
      mountingBrackets,
    },
  };
}
