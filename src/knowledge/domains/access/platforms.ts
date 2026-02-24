/**
 * Platforms Knowledge Definition
 *
 * Engineering knowledge for platform/mezzanine design and fabrication.
 * Implements IBC and OSHA requirements for elevated work platforms.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// PLATFORM PARAMETERS
// =============================================================================

const platformParameters: ParameterDefinition[] = [
  // Primary dimensions
  {
    id: 'length',
    name: 'Platform Length',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Length of platform',
  },
  {
    id: 'width',
    name: 'Platform Width',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Width of platform',
  },
  {
    id: 'height',
    name: 'Platform Height',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Height above floor',
  },

  // Type and use
  {
    id: 'platform_type',
    name: 'Platform Type',
    type: 'select',
    options: ['mezzanine', 'equipment-platform', 'work-platform', 'landing', 'observation'],
    default: 'work-platform',
    required: true,
    description: 'Type of platform',
  },
  {
    id: 'use_type',
    name: 'Use Type',
    type: 'select',
    options: ['personnel', 'light-storage', 'heavy-storage', 'equipment', 'mixed'],
    default: 'personnel',
    required: true,
    description: 'Primary use for load calculation',
  },

  // Load requirements
  {
    id: 'live_load',
    name: 'Live Load',
    type: 'number',
    unit: 'mm',
    default: 4.8,     // 100 psf typical industrial
    min: 2.4,         // 50 psf minimum
    required: true,
    description: 'Design live load (kN/m²)',
  },
  {
    id: 'point_load',
    name: 'Point Load',
    type: 'number',
    unit: 'mm',
    default: 4.5,     // 1000 lbs typical
    required: false,
    description: 'Concentrated point load (kN)',
  },

  // Decking
  {
    id: 'deck_type',
    name: 'Deck Type',
    type: 'select',
    options: ['checkered-plate', 'bar-grating', 'plank-grating', 'concrete', 'wood'],
    default: 'bar-grating',
    required: true,
    description: 'Deck surface type',
  },
  {
    id: 'deck_thickness',
    name: 'Deck Thickness',
    type: 'number',
    unit: 'mm',
    default: 6,
    required: false,
    description: 'Deck plate thickness or grating depth',
  },

  // Support
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: ['columns', 'wall-mounted', 'cantilevered', 'suspended'],
    default: 'columns',
    required: true,
    description: 'Primary support method',
  },
  {
    id: 'column_spacing_x',
    name: 'Column Spacing (X)',
    type: 'number',
    unit: 'mm',
    default: 3000,
    max: 6000,
    required: false,
    description: 'Spacing between columns in X direction',
  },
  {
    id: 'column_spacing_y',
    name: 'Column Spacing (Y)',
    type: 'number',
    unit: 'mm',
    default: 3000,
    max: 6000,
    required: false,
    description: 'Spacing between columns in Y direction',
  },

  // Edge protection
  {
    id: 'guardrail_required',
    name: 'Guardrails Required',
    type: 'boolean',
    default: true,
    required: true,
    description: 'Whether guardrails are required (auto: height > 1200mm)',
  },
  {
    id: 'guardrail_height',
    name: 'Guardrail Height',
    type: 'number',
    unit: 'mm',
    default: 1067,    // 42" OSHA
    min: 1067,
    required: false,
    description: 'Height of guardrails',
  },
  {
    id: 'toeboard_height',
    name: 'Toeboard Height',
    type: 'number',
    unit: 'mm',
    default: 100,
    min: 89,          // 3.5" minimum
    required: false,
    description: 'Height of toeboard',
  },

  // Access
  {
    id: 'access_type',
    name: 'Access Type',
    type: 'select',
    options: ['stairs', 'ladder', 'ramp', 'multiple'],
    default: 'stairs',
    required: true,
    description: 'Primary access method',
  },
  {
    id: 'access_location',
    name: 'Access Location',
    type: 'select',
    options: ['corner', 'side-center', 'end', 'through-floor'],
    default: 'corner',
    required: false,
    description: 'Where access point is located',
  },

  // Openings
  {
    id: 'has_floor_openings',
    name: 'Has Floor Openings',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether platform has holes for equipment, etc.',
  },

  // Construction
  {
    id: 'construction_type',
    name: 'Construction Type',
    type: 'select',
    options: ['steel-frame', 'aluminum-frame', 'wood-frame'],
    default: 'steel-frame',
    required: true,
    description: 'Primary construction material',
  },
];

// =============================================================================
// PLATFORM RULES
// =============================================================================

const platformRules: Rule[] = [
  // Guardrail requirements
  {
    id: 'guardrail_height_requirement',
    name: 'Guardrail Required Above 1200mm',
    description: 'Guardrails required when platform height exceeds 4 feet (1219mm)',
    type: 'constraint',
    source: 'OSHA 1910.28(b)(1)',
    expression: {
      type: 'conditional',
      condition: 'height > 1219',
      then: { type: 'required-if', param: 'guardrail_required', condition: 'true' },
    },
    errorMessage: 'Guardrails required for height > 1219mm',
  },

  // Guardrail height
  {
    id: 'guardrail_height_min',
    name: 'Minimum Guardrail Height',
    description: 'Guardrails shall be at least 42 inches (1067mm) high',
    type: 'constraint',
    source: 'OSHA 1910.29(b)(1)',
    expression: { type: 'range', param: 'guardrail_height', min: 1067 },
    errorMessage: 'Guardrail height must be at least 1067mm',
  },

  // Toeboard
  {
    id: 'toeboard_height_min',
    name: 'Minimum Toeboard Height',
    description: 'Toeboards shall be at least 3.5 inches (89mm) high',
    type: 'constraint',
    source: 'OSHA 1910.29(k)(1)',
    expression: { type: 'range', param: 'toeboard_height', min: 89 },
    errorMessage: 'Toeboard must be at least 89mm',
  },

  // Load requirements
  {
    id: 'live_load_minimum',
    name: 'Minimum Live Load',
    description: 'Industrial platforms minimum 50 psf (2.4 kN/m²)',
    type: 'constraint',
    source: 'IBC 1607.5',
    expression: { type: 'range', param: 'live_load', min: 2.4 },
    errorMessage: 'Live load below 2.4 kN/m² minimum',
  },

  // Grating bearing bar spacing
  {
    id: 'grating_opening_size',
    name: 'Grating Opening Size',
    description: 'Grating openings shall not permit passage of 1.25" sphere',
    type: 'constraint',
    source: 'OSHA 1910.25(b)(3)',
    expression: { type: 'range', param: 'grating_opening', max: 32 },
    errorMessage: 'Grating openings exceed 32mm maximum',
  },

  // Column spacing
  {
    id: 'column_spacing_max',
    name: 'Maximum Column Spacing',
    description: 'Column spacing should not exceed practical limits for beam sizes',
    type: 'recommendation',
    expression: { type: 'range', param: 'column_spacing_x', max: 6000 },
    errorMessage: 'Column spacing may require heavy beams',
  },

  // Headroom under platform
  {
    id: 'headroom_under',
    name: 'Headroom Under Platform',
    description: 'Minimum 7 ft (2134mm) headroom under mezzanines',
    type: 'constraint',
    source: 'IBC 1003.2',
    expression: {
      type: 'conditional',
      condition: 'platform_type == "mezzanine"',
      then: { type: 'range', param: 'height', min: 2134 },
    },
    errorMessage: 'Mezzanine height below 2134mm headroom requirement',
  },

  // Gate requirements at access
  {
    id: 'swing_gate_required',
    name: 'Swing Gate at Ladder Access',
    description: 'Self-closing gate required at ladder access points',
    type: 'constraint',
    source: 'OSHA 1910.29(b)(4)',
    expression: {
      type: 'conditional',
      condition: 'access_type == "ladder"',
      then: { type: 'required-if', param: 'swing_gate', condition: 'true' },
    },
    errorMessage: 'Self-closing gate required at ladder access',
  },
];

// =============================================================================
// PLATFORM COMPONENTS
// =============================================================================

const platformComponents: ComponentDefinition[] = [
  // Columns
  {
    id: 'column',
    name: 'Column',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(length / column_spacing_x + 1) * Math.ceil(width / column_spacing_y + 1)',
    parameters: [
      {
        id: 'column_height',
        name: 'Height',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Column height to underside of beam',
      },
      {
        id: 'column_profile',
        name: 'Profile',
        type: 'string',
        required: true,
        description: 'Column section (HSS, W-section, etc.)',
      },
    ],
  },

  // Main beams
  {
    id: 'main_beam',
    name: 'Main Beam',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(width / column_spacing_y + 1)',
    parameters: [
      {
        id: 'beam_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Beam span',
      },
      {
        id: 'beam_profile',
        name: 'Profile',
        type: 'string',
        required: true,
        description: 'Beam section',
      },
    ],
  },

  // Secondary beams (joists)
  {
    id: 'joist',
    name: 'Joist/Secondary Beam',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(length / 600) * Math.ceil(width / column_spacing_y)',
    parameters: [],
  },

  // Decking
  {
    id: 'deck',
    name: 'Deck Plate/Grating',
    type: 'surface',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil((length * width) / (1000 * 6000))',  // Standard panel size
    parameters: [
      {
        id: 'deck_area',
        name: 'Area',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total deck area',
      },
    ],
  },

  // Guardrails
  {
    id: 'guardrail',
    name: 'Guardrail',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: '(length * 2 + width * 2) - 1200',  // Perimeter minus access
    parameters: [
      {
        id: 'guardrail_length',
        name: 'Total Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Total linear guardrail',
      },
    ],
  },

  // Posts
  {
    id: 'post',
    name: 'Guardrail Post',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil((length * 2 + width * 2) / 2400)',
    parameters: [],
  },

  // Toeboards
  {
    id: 'toeboard',
    name: 'Toeboard',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: '(length * 2 + width * 2) - 1200',
    parameters: [],
  },

  // Base plates
  {
    id: 'base_plate',
    name: 'Column Base Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_columns',
    parameters: [
      {
        id: 'base_plate_size',
        name: 'Size',
        type: 'string',
        default: '300x300x20',
        required: true,
        description: 'Base plate dimensions',
      },
    ],
  },

  // Bracing
  {
    id: 'bracing',
    name: 'Column Bracing',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'height > 3000 ? num_columns * 2 : 0',
    parameters: [],
  },

  // Access components
  {
    id: 'access_gate',
    name: 'Access Gate',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'gate_width',
        name: 'Width',
        type: 'number',
        unit: 'mm',
        default: 900,
        required: true,
        description: 'Gate opening width',
      },
    ],
  },
];

// =============================================================================
// EXPORT PLATFORM ELEMENT
// =============================================================================

export const platformElement: ElementDefinition = {
  id: 'platform',
  name: 'Platform/Mezzanine',
  description: 'Elevated work platform or mezzanine floor',
  connectionType: 'horizontal-span',
  parameters: platformParameters,
  rules: platformRules,
  materials: ['steel', 'aluminum', 'wood'],
  components: platformComponents,
};

// =============================================================================
// PLATFORM CALCULATOR
// =============================================================================

export interface PlatformCalculationInput {
  length: number;           // mm
  width: number;            // mm
  height: number;           // mm
  platformType: 'mezzanine' | 'equipment-platform' | 'work-platform' | 'landing';
  useType: 'personnel' | 'light-storage' | 'heavy-storage' | 'equipment';
  liveLoad?: number;        // kN/m²
  deckType?: 'checkered-plate' | 'bar-grating' | 'plank-grating';
  material?: 'steel' | 'aluminum';
}

export interface PlatformCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  length: number;
  width: number;
  height: number;
  area: number;             // m²

  // Structural
  columnSpacingX: number;
  columnSpacingY: number;
  numColumns: number;
  mainBeamSpan: number;
  joistSpan: number;

  // Sizing (based on load)
  suggestedColumnSize: string;
  suggestedBeamSize: string;
  suggestedJoistSize: string;
  suggestedJoistSpacing: number;

  // Safety
  guardrailsRequired: boolean;
  guardrailLength: number;
  numPosts: number;

  // Components
  components: {
    columns: number;
    mainBeams: number;
    joists: number;
    deckPanels: number;
    guardrailPosts: number;
    basePlates: number;
  };

  // Weight estimate
  estimatedWeight: number;  // kg
}

/**
 * Calculate platform parameters
 */
export function calculatePlatform(input: PlatformCalculationInput): PlatformCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const area = (input.length * input.width) / 1e6;  // m²

  // Default live load based on use
  let liveLoad = input.liveLoad;
  if (!liveLoad) {
    switch (input.useType) {
      case 'personnel': liveLoad = 4.8; break;        // 100 psf
      case 'light-storage': liveLoad = 6.0; break;    // 125 psf
      case 'heavy-storage': liveLoad = 12.0; break;   // 250 psf
      case 'equipment': liveLoad = 7.2; break;        // 150 psf
    }
  }

  // Determine column spacing (optimize for standard beam sizes)
  let columnSpacingX = 3000;  // Default 3m
  let columnSpacingY = 3000;

  // Adjust for platform size
  if (input.length <= 3000) columnSpacingX = input.length;
  else if (input.length <= 6000) columnSpacingX = input.length / 2;
  else columnSpacingX = Math.ceil(input.length / Math.ceil(input.length / 3000));

  if (input.width <= 3000) columnSpacingY = input.width;
  else if (input.width <= 6000) columnSpacingY = input.width / 2;
  else columnSpacingY = Math.ceil(input.width / Math.ceil(input.width / 3000));

  // Calculate number of columns
  const columnsX = Math.ceil(input.length / columnSpacingX) + 1;
  const columnsY = Math.ceil(input.width / columnSpacingY) + 1;
  const numColumns = columnsX * columnsY;

  // Beam and joist spans
  const mainBeamSpan = columnSpacingX;
  const joistSpan = columnSpacingY;

  // Suggest sizes based on load and span
  // This is simplified - real engineering would use span tables
  const suggestedColumnSize = input.height > 4000 ? 'HSS150x150x6' : 'HSS100x100x6';
  const suggestedBeamSize = mainBeamSpan > 4000 ? 'W250x49' : 'W200x36';
  const suggestedJoistSize = 'C150x19';
  const suggestedJoistSpacing = 600;

  // Number of joists
  const joistsPerBay = Math.ceil(columnSpacingY / suggestedJoistSpacing);
  const numJoists = joistsPerBay * (columnsX - 1) * (columnsY - 1);

  // Main beams
  const numMainBeams = columnsY * (columnsX - 1);

  // Deck panels (assuming 1000x6000 standard)
  const deckPanels = Math.ceil(area / 6);

  // Guardrails
  const guardrailsRequired = input.height > 1219;
  const perimeter = 2 * (input.length + input.width);
  const accessWidth = 1200;
  const guardrailLength = perimeter - accessWidth;
  const numPosts = Math.ceil(guardrailLength / 2400);

  // Validate headroom for mezzanines
  if (input.platformType === 'mezzanine' && input.height < 2134) {
    errors.push('Mezzanine requires minimum 2134mm headroom underneath');
  }

  // Estimate weight (very rough)
  // steelDensity: 7850 kg/m³ (used for reference)
  const estimatedWeight =
    numColumns * 30 +                          // Columns ~30kg each
    numMainBeams * (mainBeamSpan / 1000) * 50 + // Beams ~50kg/m
    numJoists * (joistSpan / 1000) * 20 +       // Joists ~20kg/m
    area * (input.deckType === 'bar-grating' ? 20 : 50);  // Deck 20-50 kg/m²

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    length: input.length,
    width: input.width,
    height: input.height,
    area: Math.round(area * 100) / 100,
    columnSpacingX: Math.round(columnSpacingX),
    columnSpacingY: Math.round(columnSpacingY),
    numColumns,
    mainBeamSpan,
    joistSpan,
    suggestedColumnSize,
    suggestedBeamSize,
    suggestedJoistSize,
    suggestedJoistSpacing,
    guardrailsRequired,
    guardrailLength: Math.round(guardrailLength),
    numPosts,
    components: {
      columns: numColumns,
      mainBeams: numMainBeams,
      joists: numJoists,
      deckPanels,
      guardrailPosts: numPosts,
      basePlates: numColumns,
    },
    estimatedWeight: Math.round(estimatedWeight),
  };
}
