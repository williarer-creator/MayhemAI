/**
 * Stairs Knowledge Definition
 *
 * Complete engineering knowledge for stair design and fabrication.
 * Implements IBC (International Building Code) and OSHA requirements.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// STAIR PARAMETERS
// =============================================================================

const stairParameters: ParameterDefinition[] = [
  // Primary inputs
  {
    id: 'total_rise',
    name: 'Total Rise',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total vertical height from bottom landing to top landing',
  },
  {
    id: 'total_run',
    name: 'Total Run',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Total horizontal distance available (calculated if not provided)',
  },
  {
    id: 'width',
    name: 'Stair Width',
    type: 'number',
    unit: 'mm',
    default: 1100,
    min: 914,   // 36" minimum per IBC
    max: 3000,
    required: true,
    description: 'Clear width between handrails',
  },
  {
    id: 'occupancy_type',
    name: 'Occupancy Type',
    type: 'select',
    options: ['residential', 'commercial', 'industrial', 'assembly', 'utility'],
    default: 'commercial',
    required: true,
    description: 'Building occupancy classification',
  },
  {
    id: 'stair_type',
    name: 'Stair Type',
    type: 'select',
    options: ['straight', 'l-shape', 'u-shape', 'switchback', 'spiral'],
    default: 'straight',
    required: true,
    description: 'Stair configuration',
  },

  // Calculated/derived
  {
    id: 'riser_height',
    name: 'Riser Height',
    type: 'number',
    unit: 'mm',
    min: 102,   // 4" minimum
    max: 178,   // 7" maximum per IBC
    required: false,
    description: 'Height of each step (calculated to optimize)',
  },
  {
    id: 'tread_depth',
    name: 'Tread Depth',
    type: 'number',
    unit: 'mm',
    min: 279,   // 11" minimum per IBC
    max: 356,   // 14" typical maximum
    required: false,
    description: 'Depth of each tread (calculated to optimize)',
  },
  {
    id: 'num_risers',
    name: 'Number of Risers',
    type: 'number',
    required: false,
    description: 'Total number of risers (calculated)',
  },
  {
    id: 'num_treads',
    name: 'Number of Treads',
    type: 'number',
    required: false,
    description: 'Total number of treads (risers - 1)',
  },

  // Nosing
  {
    id: 'nosing_projection',
    name: 'Nosing Projection',
    type: 'number',
    unit: 'mm',
    default: 25,
    min: 19,    // 3/4" minimum
    max: 38,    // 1.5" maximum per IBC
    required: false,
    description: 'How far the tread projects over the riser',
  },

  // Landing
  {
    id: 'landing_required',
    name: 'Landing Required',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether intermediate landing is required (auto-calculated)',
  },
  {
    id: 'landing_depth',
    name: 'Landing Depth',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Depth of landing (minimum = stair width)',
  },

  // Handrails
  {
    id: 'handrail_height',
    name: 'Handrail Height',
    type: 'number',
    unit: 'mm',
    default: 915,  // 36" nominal
    min: 864,      // 34"
    max: 965,      // 38"
    required: false,
    description: 'Height of handrail above tread nosing',
  },
  {
    id: 'handrail_sides',
    name: 'Handrail Sides',
    type: 'select',
    options: ['both', 'left', 'right', 'none'],
    default: 'both',
    required: true,
    description: 'Which sides have handrails',
  },

  // Guardrails (if open side)
  {
    id: 'guardrail_required',
    name: 'Guardrail Required',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Whether guardrails are needed on open sides',
  },
  {
    id: 'guardrail_height',
    name: 'Guardrail Height',
    type: 'number',
    unit: 'mm',
    default: 1067,  // 42"
    min: 1067,
    required: false,
    description: 'Height of guardrail above walking surface',
  },

  // Construction
  {
    id: 'construction_type',
    name: 'Construction Type',
    type: 'select',
    options: ['steel-pan', 'steel-open', 'concrete', 'wood', 'aluminum'],
    default: 'steel-pan',
    required: true,
    description: 'Primary construction method',
  },
  {
    id: 'stringer_type',
    name: 'Stringer Type',
    type: 'select',
    options: ['channel', 'plate', 'tube'],
    default: 'channel',
    required: false,
    description: 'Type of stringer to use',
  },
];

// =============================================================================
// STAIR RULES (IBC & OSHA)
// =============================================================================

const stairRules: Rule[] = [
  // Riser height limits
  {
    id: 'riser_height_max',
    name: 'Maximum Riser Height',
    description: 'Riser height shall not exceed 7 inches (178mm)',
    type: 'constraint',
    source: 'IBC 1011.5.2',
    expression: { type: 'range', param: 'riser_height', max: 178 },
    errorMessage: 'Riser height exceeds 178mm (7") maximum',
  },
  {
    id: 'riser_height_min',
    name: 'Minimum Riser Height',
    description: 'Riser height shall not be less than 4 inches (102mm)',
    type: 'constraint',
    source: 'IBC 1011.5.2',
    expression: { type: 'range', param: 'riser_height', min: 102 },
    errorMessage: 'Riser height below 102mm (4") minimum',
  },

  // Tread depth limits
  {
    id: 'tread_depth_min',
    name: 'Minimum Tread Depth',
    description: 'Tread depth shall not be less than 11 inches (279mm)',
    type: 'constraint',
    source: 'IBC 1011.5.2',
    expression: { type: 'range', param: 'tread_depth', min: 279 },
    errorMessage: 'Tread depth below 279mm (11") minimum',
  },

  // Riser/tread relationship (comfort formula)
  {
    id: 'riser_tread_formula',
    name: 'Riser-Tread Comfort Formula',
    description: '2R + T should be between 610mm and 660mm (24-26 inches)',
    type: 'recommendation',
    source: 'Industry Standard',
    expression: {
      type: 'formula',
      formula: '2 * riser_height + tread_depth',
      result: 'comfort_factor',
    },
    errorMessage: 'Stair may be uncomfortable (2R+T should be 610-660mm)',
  },

  // Width requirements
  {
    id: 'width_min_commercial',
    name: 'Minimum Width (Commercial)',
    description: 'Stairs serving occupant load > 50 shall be minimum 44 inches',
    type: 'constraint',
    source: 'IBC 1005.1',
    expression: {
      type: 'conditional',
      condition: 'occupancy_type == "commercial" || occupancy_type == "assembly"',
      then: { type: 'range', param: 'width', min: 1118 },
    },
    errorMessage: 'Commercial/assembly stairs must be minimum 1118mm (44") wide',
  },

  // Headroom
  {
    id: 'headroom_min',
    name: 'Minimum Headroom',
    description: 'Minimum headroom shall be 6 feet 8 inches (2032mm)',
    type: 'constraint',
    source: 'IBC 1011.3',
    expression: { type: 'range', param: 'headroom', min: 2032 },
    errorMessage: 'Headroom below 2032mm (6\'8") minimum',
  },

  // Landing requirements
  {
    id: 'landing_vertical_rise',
    name: 'Landing Required Every 12 Feet',
    description: 'Landing required where vertical rise exceeds 12 feet (3658mm)',
    type: 'constraint',
    source: 'IBC 1011.8',
    expression: {
      type: 'conditional',
      condition: 'total_rise > 3658',
      then: { type: 'required-if', param: 'landing_required', condition: 'true' },
    },
    errorMessage: 'Landing required - vertical rise exceeds 3658mm (12\')',
  },
  {
    id: 'landing_depth_min',
    name: 'Landing Depth Minimum',
    description: 'Landing depth shall not be less than stair width',
    type: 'constraint',
    source: 'IBC 1011.6',
    expression: {
      type: 'conditional',
      condition: 'landing_required == true',
      then: { type: 'range', param: 'landing_depth', min: 0 }, // Will be set to width
    },
    errorMessage: 'Landing depth must be at least equal to stair width',
  },

  // Uniformity
  {
    id: 'riser_uniformity',
    name: 'Riser Height Uniformity',
    description: 'Riser heights shall not vary more than 3/8 inch (9.5mm)',
    type: 'constraint',
    source: 'IBC 1011.5.4',
    expression: { type: 'range', param: 'riser_variance', max: 9.5 },
    errorMessage: 'Riser heights vary by more than 9.5mm',
  },

  // Nosing
  {
    id: 'nosing_max',
    name: 'Maximum Nosing Projection',
    description: 'Nosing projection shall not exceed 1.25 inches (32mm)',
    type: 'constraint',
    source: 'IBC 1011.5.5',
    expression: { type: 'range', param: 'nosing_projection', max: 32 },
    errorMessage: 'Nosing projection exceeds 32mm maximum',
  },

  // Handrail
  {
    id: 'handrail_height_range',
    name: 'Handrail Height',
    description: 'Handrail height shall be 34-38 inches (864-965mm)',
    type: 'constraint',
    source: 'IBC 1014.2',
    expression: { type: 'range', param: 'handrail_height', min: 864, max: 965 },
    errorMessage: 'Handrail height must be between 864mm and 965mm',
  },

  // Guardrail
  {
    id: 'guardrail_height_min',
    name: 'Guardrail Height Minimum',
    description: 'Guardrails shall be minimum 42 inches (1067mm)',
    type: 'constraint',
    source: 'IBC 1015.3',
    expression: { type: 'range', param: 'guardrail_height', min: 1067 },
    errorMessage: 'Guardrail height below 1067mm (42") minimum',
  },

  // OSHA industrial requirements
  {
    id: 'osha_stair_angle',
    name: 'OSHA Stair Angle',
    description: 'Industrial stairs shall have angle between 30-50 degrees',
    type: 'constraint',
    source: 'OSHA 1910.25(c)(2)',
    expression: {
      type: 'conditional',
      condition: 'occupancy_type == "industrial"',
      then: { type: 'range', param: 'stair_angle', min: 30, max: 50 },
    },
    errorMessage: 'Industrial stair angle must be 30-50 degrees',
  },
];

// =============================================================================
// STAIR COMPONENTS
// =============================================================================

const stairComponents: ComponentDefinition[] = [
  // Stringers
  {
    id: 'stringer',
    name: 'Stringer',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'width <= 1100 ? 2 : (width <= 1800 ? 3 : 4)',
    parameters: [
      {
        id: 'stringer_length',
        name: 'Stringer Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total length of stringer (calculated from rise/run)',
      },
      {
        id: 'stringer_profile',
        name: 'Profile Size',
        type: 'string',
        required: true,
        description: 'Channel or plate size',
      },
    ],
  },

  // Treads
  {
    id: 'tread',
    name: 'Tread',
    type: 'surface',
    required: true,
    quantity: 'per-unit',
    quantityFormula: 'num_treads',
    parameters: [
      {
        id: 'tread_width',
        name: 'Tread Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Width of tread (matches stair width)',
      },
      {
        id: 'tread_thickness',
        name: 'Tread Thickness',
        type: 'number',
        unit: 'mm',
        default: 6,
        required: true,
        description: 'Thickness of tread plate',
      },
      {
        id: 'tread_pattern',
        name: 'Surface Pattern',
        type: 'select',
        options: ['checkered-plate', 'grating', 'solid', 'grip-strut'],
        default: 'checkered-plate',
        required: true,
        description: 'Slip-resistant surface pattern',
      },
    ],
  },

  // Risers
  {
    id: 'riser',
    name: 'Riser',
    type: 'surface',
    required: false,  // Open risers allowed in some cases
    quantity: 'per-unit',
    quantityFormula: 'num_risers',
    parameters: [
      {
        id: 'riser_type',
        name: 'Riser Type',
        type: 'select',
        options: ['closed', 'open', 'perforated'],
        default: 'closed',
        required: true,
        description: 'Type of riser',
      },
    ],
  },

  // Handrails
  {
    id: 'handrail',
    name: 'Handrail',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'handrail_sides == "both" ? 2 : (handrail_sides == "none" ? 0 : 1)',
    parameters: [
      {
        id: 'handrail_profile',
        name: 'Profile',
        type: 'select',
        options: ['round-pipe', 'square-tube', 'channel'],
        default: 'round-pipe',
        required: true,
        description: 'Handrail profile shape',
      },
      {
        id: 'handrail_diameter',
        name: 'Diameter/Size',
        type: 'number',
        unit: 'mm',
        default: 42,
        min: 32,
        max: 51,
        required: true,
        description: 'Gripping diameter (32-51mm per IBC)',
      },
    ],
  },

  // Posts
  {
    id: 'post',
    name: 'Post',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(stringer_length / 1200) * num_handrails + 2',
    parameters: [
      {
        id: 'post_profile',
        name: 'Profile',
        type: 'select',
        options: ['square-tube', 'round-pipe', 'angle'],
        default: 'square-tube',
        required: true,
        description: 'Post profile shape',
      },
      {
        id: 'post_size',
        name: 'Size',
        type: 'string',
        default: '50x50x3',
        required: true,
        description: 'Post dimensions',
      },
    ],
  },

  // Base plates
  {
    id: 'base_plate',
    name: 'Base Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_stringers',
    parameters: [
      {
        id: 'base_plate_size',
        name: 'Size',
        type: 'string',
        default: '150x150x10',
        required: true,
        description: 'Base plate dimensions (WxLxT)',
      },
      {
        id: 'anchor_pattern',
        name: 'Anchor Pattern',
        type: 'select',
        options: ['4-bolt', '2-bolt', 'weld'],
        default: '4-bolt',
        required: true,
        description: 'How base plate attaches to floor',
      },
    ],
  },

  // Top connection
  {
    id: 'top_plate',
    name: 'Top Connection Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_stringers',
    parameters: [
      {
        id: 'top_plate_size',
        name: 'Size',
        type: 'string',
        default: '150x100x10',
        required: true,
        description: 'Top plate dimensions',
      },
    ],
  },
];

// =============================================================================
// EXPORT STAIRS ELEMENT
// =============================================================================

export const stairsElement: ElementDefinition = {
  id: 'stairs',
  name: 'Stairs',
  description: 'Fixed stairway for vertical circulation between floor levels',
  connectionType: 'elevation-change',
  parameters: stairParameters,
  rules: stairRules,
  materials: ['steel', 'aluminum', 'concrete', 'wood'],
  components: stairComponents,
};

// =============================================================================
// STAIR CALCULATOR
// =============================================================================

export interface StairCalculationInput {
  totalRise: number;        // mm
  availableRun?: number;    // mm (optional)
  width: number;            // mm
  occupancyType: 'residential' | 'commercial' | 'industrial' | 'assembly' | 'utility';
  stairType: 'straight' | 'l-shape' | 'u-shape' | 'switchback';
  constructionType: 'steel-pan' | 'steel-open' | 'concrete' | 'wood' | 'aluminum';
}

export interface StairCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Calculated dimensions
  numRisers: number;
  numTreads: number;
  riserHeight: number;      // mm
  treadDepth: number;       // mm
  totalRun: number;         // mm
  stairAngle: number;       // degrees
  stringerLength: number;   // mm

  // Comfort metrics
  comfortFactor: number;    // 2R + T (ideal: 610-660)
  isComfortable: boolean;

  // Landing
  landingRequired: boolean;
  landingPosition?: number; // riser number where landing occurs

  // Components summary
  components: {
    stringers: number;
    treads: number;
    risers: number;
    posts: number;
    handrailLength: number;  // mm
  };
}

/**
 * Calculate optimal stair geometry
 */
export function calculateStairs(input: StairCalculationInput): StairCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Target riser height (middle of allowed range for comfort)
  const targetRiser = 178;  // 7" - maximum allowed, typical preference
  const minRiser = 102;     // 4" minimum
  const maxRiser = 178;     // 7" maximum
  const minTread = 279;     // 11" minimum

  // Calculate number of risers
  let numRisers = Math.round(input.totalRise / targetRiser);

  // Ensure we have at least 1 riser
  if (numRisers < 1) numRisers = 1;

  // Calculate actual riser height
  let riserHeight = input.totalRise / numRisers;

  // Adjust if outside limits
  if (riserHeight > maxRiser) {
    numRisers = Math.ceil(input.totalRise / maxRiser);
    riserHeight = input.totalRise / numRisers;
  } else if (riserHeight < minRiser) {
    numRisers = Math.floor(input.totalRise / minRiser);
    if (numRisers < 1) numRisers = 1;
    riserHeight = input.totalRise / numRisers;
  }

  const numTreads = numRisers - 1;

  // Calculate tread depth for comfort (2R + T = 635mm target)
  const targetComfort = 635;
  let treadDepth = targetComfort - (2 * riserHeight);

  // Ensure minimum tread depth
  if (treadDepth < minTread) {
    treadDepth = minTread;
    warnings.push('Tread depth set to minimum; stair may be steep');
  }

  // Calculate total run
  const totalRun = numTreads * treadDepth;

  // Check if available run is sufficient
  if (input.availableRun && totalRun > input.availableRun) {
    errors.push(`Required run (${totalRun}mm) exceeds available space (${input.availableRun}mm)`);
  }

  // Calculate stair angle
  const stairAngle = Math.atan(input.totalRise / totalRun) * (180 / Math.PI);

  // Calculate stringer length
  const stringerLength = Math.sqrt(
    Math.pow(input.totalRise, 2) + Math.pow(totalRun, 2)
  );

  // Comfort factor
  const comfortFactor = (2 * riserHeight) + treadDepth;
  const isComfortable = comfortFactor >= 610 && comfortFactor <= 660;

  if (!isComfortable) {
    warnings.push(`Comfort factor ${comfortFactor.toFixed(0)}mm outside ideal range (610-660mm)`);
  }

  // Check if landing is required (every 3658mm / 12ft of rise)
  const landingRequired = input.totalRise > 3658;
  let landingPosition: number | undefined;

  if (landingRequired) {
    // Place landing at midpoint
    landingPosition = Math.floor(numRisers / 2);
    warnings.push('Landing required due to total rise exceeding 3658mm');
  }

  // Industrial angle check (OSHA)
  if (input.occupancyType === 'industrial') {
    if (stairAngle < 30 || stairAngle > 50) {
      errors.push(`Industrial stair angle ${stairAngle.toFixed(1)}° outside OSHA range (30-50°)`);
    }
  }

  // Validate riser height
  if (riserHeight < minRiser) {
    errors.push(`Riser height ${riserHeight.toFixed(1)}mm below minimum ${minRiser}mm`);
  }
  if (riserHeight > maxRiser) {
    errors.push(`Riser height ${riserHeight.toFixed(1)}mm exceeds maximum ${maxRiser}mm`);
  }

  // Calculate number of stringers based on width
  let numStringers = 2;
  if (input.width > 1100) numStringers = 3;
  if (input.width > 1800) numStringers = 4;

  // Calculate number of posts (approximately every 1200mm + ends)
  const numPosts = Math.ceil(stringerLength / 1200) * 2 + 4;

  // Handrail length (stringer length + returns at top and bottom)
  const handrailLength = stringerLength + 600;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    numRisers,
    numTreads,
    riserHeight: Math.round(riserHeight * 10) / 10,
    treadDepth: Math.round(treadDepth * 10) / 10,
    totalRun: Math.round(totalRun),
    stairAngle: Math.round(stairAngle * 10) / 10,
    stringerLength: Math.round(stringerLength),
    comfortFactor: Math.round(comfortFactor),
    isComfortable,
    landingRequired,
    landingPosition,
    components: {
      stringers: numStringers,
      treads: numTreads,
      risers: numRisers,
      posts: numPosts,
      handrailLength: Math.round(handrailLength),
    },
  };
}
