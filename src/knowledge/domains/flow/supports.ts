/**
 * Supports and Hangers Knowledge Definition
 *
 * Engineering knowledge for pipe supports, duct hangers, and cable tray supports.
 * Implements MSS SP-58, SMACNA, and NEMA standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// PIPE SUPPORT PARAMETERS
// =============================================================================

const pipeSupportParameters: ParameterDefinition[] = [
  // Support type
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: [
      'clevis-hanger',
      'pipe-clamp',
      'riser-clamp',
      'roller-support',
      'spring-hanger',
      'trapeze',
      'u-bolt',
      'pipe-shoe',
      'guide',
      'anchor',
    ],
    default: 'clevis-hanger',
    required: true,
    description: 'Type of pipe support',
  },

  // Pipe data
  {
    id: 'pipe_od',
    name: 'Pipe Outside Diameter',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Pipe outside diameter',
  },
  {
    id: 'pipe_material',
    name: 'Pipe Material',
    type: 'select',
    options: ['carbon-steel', 'stainless', 'copper', 'pvc', 'fiberglass'],
    default: 'carbon-steel',
    required: true,
    description: 'Pipe material',
  },
  {
    id: 'insulation_thickness',
    name: 'Insulation Thickness',
    type: 'number',
    unit: 'mm',
    default: 0,
    required: false,
    description: 'Pipe insulation thickness',
  },

  // Loading
  {
    id: 'pipe_weight',
    name: 'Pipe Weight',
    type: 'number',
    unit: 'mm',  // Actually kg/m
    required: false,
    description: 'Pipe weight per meter (kg/m)',
  },
  {
    id: 'contents_weight',
    name: 'Contents Weight',
    type: 'number',
    unit: 'mm',  // Actually kg/m
    required: false,
    description: 'Weight of contents per meter (kg/m)',
  },
  {
    id: 'support_spacing',
    name: 'Support Spacing',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Distance between supports',
  },

  // Service conditions
  {
    id: 'operating_temperature',
    name: 'Operating Temperature',
    type: 'number',
    unit: 'mm',  // Actually °C
    default: 20,
    required: false,
    description: 'Operating temperature (°C)',
  },
  {
    id: 'thermal_movement',
    name: 'Thermal Movement',
    type: 'number',
    unit: 'mm',
    default: 0,
    required: false,
    description: 'Expected thermal expansion/contraction',
  },

  // Attachment
  {
    id: 'attachment_type',
    name: 'Attachment Type',
    type: 'select',
    options: ['ceiling-hung', 'wall-bracket', 'floor-stand', 'beam-clamp', 'embedded'],
    default: 'ceiling-hung',
    required: true,
    description: 'How support attaches to structure',
  },

  // Material
  {
    id: 'support_material',
    name: 'Support Material',
    type: 'select',
    options: ['carbon-steel', 'galvanized', 'stainless-304', 'stainless-316', 'plastic'],
    default: 'galvanized',
    required: true,
    description: 'Support material',
  },
];

// =============================================================================
// PIPE SUPPORT RULES
// =============================================================================

const pipeSupportRules: Rule[] = [
  // Support spacing per MSS SP-58
  {
    id: 'mss-sp58-spacing-steel',
    name: 'MSS SP-58 Spacing - Steel Pipe',
    type: 'recommendation',
    source: 'MSS SP-58',
    description: 'Maximum support spacing for steel pipe',
    expression: {
      type: 'conditional',
      condition: 'pipe_material == "carbon-steel" || pipe_material == "stainless"',
      then: { type: 'range', param: 'support_spacing', max: 4500 },
    },
    errorMessage: 'Support spacing exceeds MSS SP-58 recommendation for steel',
  },
  {
    id: 'mss-sp58-spacing-copper',
    name: 'MSS SP-58 Spacing - Copper Pipe',
    type: 'recommendation',
    source: 'MSS SP-58',
    description: 'Maximum support spacing for copper pipe',
    expression: {
      type: 'conditional',
      condition: 'pipe_material == "copper"',
      then: { type: 'range', param: 'support_spacing', max: 2400 },
    },
    errorMessage: 'Support spacing exceeds recommendation for copper',
  },
  {
    id: 'mss-sp58-spacing-plastic',
    name: 'MSS SP-58 Spacing - Plastic Pipe',
    type: 'constraint',
    source: 'MSS SP-58',
    description: 'Maximum support spacing for plastic pipe',
    expression: {
      type: 'conditional',
      condition: 'pipe_material == "pvc" || pipe_material == "fiberglass"',
      then: { type: 'range', param: 'support_spacing', max: 1500 },
    },
    errorMessage: 'Plastic pipe requires closer support spacing',
  },

  // Thermal movement requires guides/rollers
  {
    id: 'thermal-movement-support',
    name: 'Thermal Movement Support',
    type: 'constraint',
    description: 'Significant thermal movement requires roller or slide supports',
    expression: {
      type: 'conditional',
      condition: 'thermal_movement > 10',
      then: {
        type: 'required-if',
        param: 'support_type',
        condition: 'support_type == "roller-support" || support_type == "pipe-shoe" || support_type == "guide"',
      },
    },
    errorMessage: 'Use roller/slide supports for thermal movement > 10mm',
  },

  // Riser clamps for vertical
  {
    id: 'vertical-riser-clamp',
    name: 'Vertical Pipe Support',
    type: 'recommendation',
    description: 'Vertical pipes require riser clamps',
    expression: {
      type: 'conditional',
      condition: 'attachment_type == "wall-bracket" && vertical_run',
      then: {
        type: 'required-if',
        param: 'support_type',
        condition: 'support_type == "riser-clamp"',
      },
    },
    errorMessage: 'Consider riser clamp for vertical pipe runs',
  },

  // Insulated pipe protection
  {
    id: 'insulation-protection',
    name: 'Insulation Protection',
    type: 'recommendation',
    description: 'Insulated pipes need protection from crushing',
    expression: {
      type: 'conditional',
      condition: 'insulation_thickness > 25',
      then: {
        type: 'required-if',
        param: 'support_type',
        condition: 'support_type == "pipe-shoe" || support_type == "trapeze"',
      },
    },
    errorMessage: 'Use pipe shoes or trapeze for insulated pipes',
  },

  // Material compatibility
  {
    id: 'stainless-pipe-support',
    name: 'Stainless Pipe Isolation',
    type: 'constraint',
    description: 'Stainless pipe needs compatible support material',
    expression: {
      type: 'conditional',
      condition: 'pipe_material == "stainless"',
      then: {
        type: 'required-if',
        param: 'support_material',
        condition: 'support_material == "stainless-304" || support_material == "stainless-316" || support_material == "plastic"',
      },
    },
    errorMessage: 'Stainless pipe requires stainless or isolated supports',
  },
];

// =============================================================================
// PIPE SUPPORT COMPONENTS
// =============================================================================

const pipeSupportComponents: ComponentDefinition[] = [
  {
    id: 'hanger-body',
    name: 'Hanger Body',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'threaded-rod',
    name: 'Threaded Rod',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "ceiling-hung" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'beam-clamp',
    name: 'Beam Clamp',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "beam-clamp" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'wall-bracket',
    name: 'Wall Bracket',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "wall-bracket" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'anchor-bolt',
    name: 'Anchor Bolt',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "embedded" ? 4 : 2',
    parameters: [],
  },
  {
    id: 'insulation-shield',
    name: 'Insulation Shield',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'insulation_thickness > 0 ? 1 : 0',
    parameters: [],
  },
  {
    id: 'liner',
    name: 'Pipe Liner/Saddle',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'pipe_material == "copper" || pipe_material == "pvc" ? 1 : 0',
    parameters: [],
  },
];

// =============================================================================
// PIPE SUPPORT ELEMENT DEFINITION
// =============================================================================

export const pipeSupportElement: ElementDefinition = {
  id: 'pipe-support',
  name: 'Pipe Support/Hanger',
  description: 'Pipe support and hanger systems per MSS SP-58',
  connectionType: 'surface-mount',
  parameters: pipeSupportParameters,
  rules: pipeSupportRules,
  materials: ['carbon-steel', 'galvanized', 'stainless'],
  components: pipeSupportComponents,
};

// =============================================================================
// DUCT SUPPORT PARAMETERS
// =============================================================================

const ductSupportParameters: ParameterDefinition[] = [
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: ['trapeze', 'strap', 'saddle', 'angle-bracket', 'rod-hung'],
    default: 'trapeze',
    required: true,
    description: 'Type of duct support',
  },
  {
    id: 'duct_width',
    name: 'Duct Width',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Duct width (rectangular)',
  },
  {
    id: 'duct_height',
    name: 'Duct Height',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Duct height (rectangular)',
  },
  {
    id: 'duct_diameter',
    name: 'Duct Diameter',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Duct diameter (round)',
  },
  {
    id: 'duct_weight',
    name: 'Duct Weight',
    type: 'number',
    unit: 'mm',  // Actually kg/m
    required: false,
    description: 'Duct weight per meter (kg/m)',
  },
  {
    id: 'support_spacing',
    name: 'Support Spacing',
    type: 'number',
    unit: 'mm',
    required: true,
    default: 3000,
    description: 'Distance between supports',
  },
  {
    id: 'attachment_type',
    name: 'Attachment Type',
    type: 'select',
    options: ['ceiling-hung', 'wall-bracket', 'floor-stand'],
    default: 'ceiling-hung',
    required: true,
    description: 'How support attaches to structure',
  },
  {
    id: 'insulated',
    name: 'Insulated Duct',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Duct has external insulation',
  },
];

const ductSupportRules: Rule[] = [
  {
    id: 'smacna-spacing-rect',
    name: 'SMACNA Spacing - Rectangular',
    type: 'constraint',
    source: 'SMACNA HVAC Duct Construction',
    description: 'Maximum support spacing for rectangular duct',
    expression: {
      type: 'conditional',
      condition: 'duct_width > 0',
      then: { type: 'range', param: 'support_spacing', max: 3050 },
    },
    errorMessage: 'Support spacing exceeds SMACNA maximum of 10ft',
  },
  {
    id: 'smacna-spacing-round',
    name: 'SMACNA Spacing - Round',
    type: 'constraint',
    source: 'SMACNA HVAC Duct Construction',
    description: 'Maximum support spacing for round duct',
    expression: {
      type: 'conditional',
      condition: 'duct_diameter > 0',
      then: { type: 'range', param: 'support_spacing', max: 3660 },
    },
    errorMessage: 'Support spacing exceeds SMACNA maximum of 12ft',
  },
  {
    id: 'large-duct-trapeze',
    name: 'Large Duct Support Type',
    type: 'recommendation',
    description: 'Large ducts should use trapeze supports',
    expression: {
      type: 'conditional',
      condition: 'duct_width > 600',
      then: {
        type: 'required-if',
        param: 'support_type',
        condition: 'support_type == "trapeze"',
      },
    },
    errorMessage: 'Use trapeze support for ducts > 600mm wide',
  },
];

const ductSupportComponents: ComponentDefinition[] = [
  {
    id: 'trapeze-bar',
    name: 'Trapeze Bar',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'support_type == "trapeze" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'threaded-rod',
    name: 'Threaded Rod',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'support_type == "trapeze" ? 2 : 1',
    parameters: [],
  },
  {
    id: 'strap',
    name: 'Hanger Strap',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'support_type == "strap" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'beam-attachment',
    name: 'Beam Attachment',
    type: 'connector',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'support_type == "trapeze" ? 2 : 1',
    parameters: [],
  },
  {
    id: 'nuts-washers',
    name: 'Nuts and Washers Set',
    type: 'fastener',
    required: true,
    quantity: 'single',
    parameters: [],
  },
];

export const ductSupportElement: ElementDefinition = {
  id: 'duct-support',
  name: 'Duct Support/Hanger',
  description: 'Duct support and hanger systems per SMACNA',
  connectionType: 'surface-mount',
  parameters: ductSupportParameters,
  rules: ductSupportRules,
  materials: ['galvanized-steel', 'stainless', 'aluminum'],
  components: ductSupportComponents,
};

// =============================================================================
// CABLE TRAY SUPPORT PARAMETERS
// =============================================================================

const traySupportParameters: ParameterDefinition[] = [
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: ['trapeze', 'wall-bracket', 'center-hung', 'floor-stand', 'cantilever'],
    default: 'trapeze',
    required: true,
    description: 'Type of cable tray support',
  },
  {
    id: 'tray_width',
    name: 'Tray Width',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Cable tray width',
  },
  {
    id: 'tray_loading',
    name: 'Tray Loading',
    type: 'number',
    unit: 'mm',  // Actually kg/m
    required: true,
    description: 'Total loading per meter (kg/m)',
  },
  {
    id: 'support_spacing',
    name: 'Support Spacing',
    type: 'number',
    unit: 'mm',
    required: true,
    default: 1500,
    description: 'Distance between supports',
  },
  {
    id: 'drop_length',
    name: 'Drop Length',
    type: 'number',
    unit: 'mm',
    required: false,
    default: 300,
    description: 'Distance from structure to tray',
  },
  {
    id: 'attachment_type',
    name: 'Attachment Type',
    type: 'select',
    options: ['beam-clamp', 'concrete-insert', 'expansion-anchor', 'weld'],
    default: 'beam-clamp',
    required: true,
    description: 'How support attaches to structure',
  },
  {
    id: 'seismic_zone',
    name: 'Seismic Zone',
    type: 'select',
    options: ['none', 'low', 'moderate', 'high'],
    default: 'none',
    required: false,
    description: 'Seismic design category',
  },
];

const traySupportRules: Rule[] = [
  {
    id: 'nema-span-limit',
    name: 'NEMA Support Span',
    type: 'constraint',
    source: 'NEMA VE-1',
    description: 'Support spacing must not exceed NEMA limits',
    expression: {
      type: 'range',
      param: 'support_spacing',
      max: 3000,
    },
    errorMessage: 'Support spacing exceeds NEMA maximum',
  },
  {
    id: 'seismic-bracing',
    name: 'Seismic Bracing',
    type: 'constraint',
    description: 'Seismic zones require lateral bracing',
    expression: {
      type: 'conditional',
      condition: 'seismic_zone == "moderate" || seismic_zone == "high"',
      then: {
        type: 'formula',
        formula: 'lateral_brace_spacing <= 12000',
        result: 'bracing_ok',
      },
    },
    errorMessage: 'Seismic zones require lateral bracing per 12m',
  },
  {
    id: 'cantilever-limit',
    name: 'Cantilever Limit',
    type: 'constraint',
    description: 'Maximum cantilever length from support',
    expression: {
      type: 'conditional',
      condition: 'support_type == "cantilever"',
      then: { type: 'range', param: 'cantilever_length', max: 600 },
    },
    errorMessage: 'Cantilever length exceeds 600mm maximum',
  },
];

const traySupportComponents: ComponentDefinition[] = [
  {
    id: 'trapeze-channel',
    name: 'Trapeze Channel',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'support_type == "trapeze" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'threaded-rod',
    name: 'Threaded Rod',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'support_type == "trapeze" || support_type == "center-hung" ? 2 : 0',
    parameters: [],
  },
  {
    id: 'wall-bracket',
    name: 'Wall Bracket',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'support_type == "wall-bracket" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'beam-clamp',
    name: 'Beam Clamp',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "beam-clamp" ? 2 : 0',
    parameters: [],
  },
  {
    id: 'anchor',
    name: 'Concrete Anchor',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'attachment_type == "expansion-anchor" || attachment_type == "concrete-insert" ? 2 : 0',
    parameters: [],
  },
  {
    id: 'lateral-brace',
    name: 'Lateral Brace',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'seismic_zone != "none" ? 1 : 0',
    parameters: [],
  },
];

export const traySupportElement: ElementDefinition = {
  id: 'tray-support',
  name: 'Cable Tray Support',
  description: 'Cable tray support systems per NEMA VE-1',
  connectionType: 'surface-mount',
  parameters: traySupportParameters,
  rules: traySupportRules,
  materials: ['galvanized-steel', 'stainless', 'aluminum'],
  components: traySupportComponents,
};

// =============================================================================
// SUPPORT SIZING DATABASE
// =============================================================================

export interface ThreadedRodData {
  size: string;        // M8, M10, M12, etc.
  diameter: number;    // mm
  capacity: number;    // kg (at 1.5m span, safety factor 5)
  weight: number;      // kg/m
}

export const threadedRodSizes: ThreadedRodData[] = [
  { size: 'M8', diameter: 8, capacity: 120, weight: 0.39 },
  { size: 'M10', diameter: 10, capacity: 200, weight: 0.62 },
  { size: 'M12', diameter: 12, capacity: 300, weight: 0.89 },
  { size: 'M16', diameter: 16, capacity: 550, weight: 1.58 },
  { size: 'M20', diameter: 20, capacity: 900, weight: 2.47 },
  { size: '3/8"', diameter: 9.5, capacity: 175, weight: 0.56 },
  { size: '1/2"', diameter: 12.7, capacity: 340, weight: 1.00 },
  { size: '5/8"', diameter: 15.9, capacity: 530, weight: 1.56 },
  { size: '3/4"', diameter: 19.1, capacity: 770, weight: 2.25 },
];

export interface TrapezeChannelData {
  size: string;        // 41x41, 41x21, etc.
  width: number;       // mm
  depth: number;       // mm
  thickness: number;   // mm
  maxSpan: number;     // mm (for different loads)
  weight: number;      // kg/m
}

export const trapezeChannelSizes: TrapezeChannelData[] = [
  { size: '41x21x1.5', width: 41, depth: 21, thickness: 1.5, maxSpan: 1200, weight: 0.90 },
  { size: '41x41x1.5', width: 41, depth: 41, thickness: 1.5, maxSpan: 1500, weight: 1.20 },
  { size: '41x41x2.0', width: 41, depth: 41, thickness: 2.0, maxSpan: 1800, weight: 1.58 },
  { size: '41x41x2.5', width: 41, depth: 41, thickness: 2.5, maxSpan: 2100, weight: 1.95 },
  { size: '41x62x2.5', width: 41, depth: 62, thickness: 2.5, maxSpan: 2400, weight: 2.45 },
  { size: '41x82x2.5', width: 41, depth: 82, thickness: 2.5, maxSpan: 3000, weight: 2.95 },
];

// =============================================================================
// SUPPORT CALCULATION FUNCTIONS
// =============================================================================

export interface SupportLoadInput {
  supportType: 'pipe' | 'duct' | 'cable-tray';
  loadPerMeter: number;    // kg/m
  span: number;            // mm (support spacing)
  dropLength: number;      // mm
  seismicFactor?: number;  // multiplier
}

export interface SupportLoadResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  totalLoad: number;           // kg
  rodLoad: number;             // kg per rod
  requiredRodSize: string;
  requiredChannelSize: string;
  channelLength: number;       // mm

  components: {
    rods: number;
    rodSize: string;
    rodLength: number;
    channelSize: string;
    channelLength: number;
    attachments: number;
  };
}

export function calculateSupportLoad(input: SupportLoadInput): SupportLoadResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate total load at support point
  const distributedLoad = input.loadPerMeter * (input.span / 1000);
  const seismicMultiplier = input.seismicFactor || 1.0;
  const totalLoad = distributedLoad * seismicMultiplier;

  // Safety factor
  const designLoad = totalLoad * 2.0;  // 2x safety factor

  // Determine rod size
  let requiredRodSize = 'M10';
  let rods = 2;

  for (const rod of threadedRodSizes) {
    if (rod.capacity >= designLoad / 2) {
      requiredRodSize = rod.size;
      break;
    }
  }

  // Check if single rod sufficient
  const selectedRod = threadedRodSizes.find(r => r.size === requiredRodSize);
  if (selectedRod && selectedRod.capacity >= designLoad) {
    rods = 1;
    warnings.push('Single rod support possible');
  }

  // Determine channel size based on span
  let requiredChannelSize = '41x41x2.0';
  for (const channel of trapezeChannelSizes) {
    if (channel.maxSpan >= input.span) {
      requiredChannelSize = channel.size;
      break;
    }
  }

  // Calculate channel length
  let channelLength: number;
  if (input.supportType === 'pipe') {
    channelLength = 150;  // Just for mounting
  } else if (input.supportType === 'duct') {
    channelLength = 600;  // Span across duct
  } else {
    channelLength = 500;  // For cable tray
  }

  // Rod length = drop + 100mm for connections
  const rodLength = input.dropLength + 100;

  // Validate
  if (totalLoad > 500 && input.supportType === 'pipe') {
    warnings.push('Heavy load - verify structural attachment capacity');
  }
  if (input.dropLength > 1500) {
    warnings.push('Long drop - consider lateral bracing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalLoad: Math.round(totalLoad * 10) / 10,
    rodLoad: Math.round((totalLoad / rods) * 10) / 10,
    requiredRodSize,
    requiredChannelSize,
    channelLength,
    components: {
      rods,
      rodSize: requiredRodSize,
      rodLength: Math.round(rodLength),
      channelSize: requiredChannelSize,
      channelLength,
      attachments: rods,
    },
  };
}

/**
 * Calculate pipe support spacing per MSS SP-58
 */
export interface PipeSupportSpacingInput {
  pipeOD: number;          // mm
  pipeMaterial: 'carbon-steel' | 'stainless' | 'copper' | 'pvc' | 'fiberglass';
  schedule: string;
  filledWithWater: boolean;
  operatingTemp: number;   // °C
  insulationThickness?: number;  // mm
}

export interface PipeSupportSpacingResult {
  maxSpacing: number;      // mm
  recommendedSpacing: number;  // mm
  notes: string[];
}

export function calculatePipeSupportSpacing(input: PipeSupportSpacingInput): PipeSupportSpacingResult {
  const notes: string[] = [];

  // Base spacing by material (mm)
  const baseSpacing: Record<string, Record<string, number>> = {
    'carbon-steel': {
      'small': 2100,    // <= 1"
      'medium': 2700,   // 1.25" - 2"
      'large': 3400,    // 2.5" - 4"
      'xlarge': 4200,   // > 4"
    },
    'stainless': {
      'small': 2100,
      'medium': 2700,
      'large': 3400,
      'xlarge': 4200,
    },
    'copper': {
      'small': 1500,
      'medium': 1800,
      'large': 2400,
      'xlarge': 3000,
    },
    'pvc': {
      'small': 900,
      'medium': 1200,
      'large': 1500,
      'xlarge': 1800,
    },
    'fiberglass': {
      'small': 1200,
      'medium': 1500,
      'large': 1800,
      'xlarge': 2100,
    },
  };

  // Determine size category
  let sizeCategory: string;
  if (input.pipeOD <= 33.4) {
    sizeCategory = 'small';
  } else if (input.pipeOD <= 60.3) {
    sizeCategory = 'medium';
  } else if (input.pipeOD <= 114.3) {
    sizeCategory = 'large';
  } else {
    sizeCategory = 'xlarge';
  }

  const materialSpacing = baseSpacing[input.pipeMaterial] || baseSpacing['carbon-steel'];
  let maxSpacing = materialSpacing[sizeCategory] || 2400;

  // Reduce for high temperature
  if (input.operatingTemp > 120) {
    maxSpacing *= 0.85;
    notes.push('Reduced spacing for high temperature');
  }

  // Reduce for heavy insulation
  if (input.insulationThickness && input.insulationThickness > 50) {
    maxSpacing *= 0.9;
    notes.push('Reduced spacing for heavy insulation');
  }

  // Reduce for water-filled
  if (input.filledWithWater) {
    maxSpacing *= 0.95;
    notes.push('Adjusted for water weight');
  }

  // Recommended is typically 80% of max
  const recommendedSpacing = Math.round(maxSpacing * 0.8);

  return {
    maxSpacing: Math.round(maxSpacing),
    recommendedSpacing,
    notes,
  };
}

// =============================================================================
// SUPPORT BOM GENERATOR
// =============================================================================

export interface SupportBOMInput {
  supportType: 'pipe' | 'duct' | 'cable-tray';
  quantity: number;
  loadResult: SupportLoadResult;
  attachmentType: 'beam-clamp' | 'anchor' | 'weld';
}

export interface SupportBOMItem {
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  material: string;
}

export function generateSupportBOM(input: SupportBOMInput): SupportBOMItem[] {
  const items: SupportBOMItem[] = [];
  const { components } = input.loadResult;

  // Threaded rods
  items.push({
    partNumber: `TR-${components.rodSize}-${components.rodLength}`,
    description: `Threaded Rod ${components.rodSize} x ${components.rodLength}mm`,
    quantity: input.quantity * components.rods,
    unit: 'ea',
    material: 'Zinc plated steel',
  });

  // Trapeze channel (for trapeze supports)
  if (input.supportType !== 'pipe') {
    items.push({
      partNumber: `CH-${components.channelSize.replace(/\./g, '')}`,
      description: `Strut Channel ${components.channelSize} x ${components.channelLength}mm`,
      quantity: input.quantity,
      unit: 'ea',
      material: 'Hot-dip galvanized',
    });
  }

  // Attachments
  if (input.attachmentType === 'beam-clamp') {
    items.push({
      partNumber: `BC-${components.rodSize}`,
      description: `Beam Clamp for ${components.rodSize}`,
      quantity: input.quantity * components.attachments,
      unit: 'ea',
      material: 'Malleable iron',
    });
  } else if (input.attachmentType === 'anchor') {
    items.push({
      partNumber: `ANC-${components.rodSize}`,
      description: `Expansion Anchor ${components.rodSize}`,
      quantity: input.quantity * components.attachments,
      unit: 'ea',
      material: 'Zinc plated steel',
    });
  }

  // Nuts and washers
  items.push({
    partNumber: `NW-${components.rodSize}`,
    description: `Hex Nut + Washer ${components.rodSize}`,
    quantity: input.quantity * components.rods * 4,  // Top and bottom of each rod
    unit: 'set',
    material: 'Zinc plated steel',
  });

  // Spring nuts for channel
  if (input.supportType !== 'pipe') {
    items.push({
      partNumber: `SN-${components.rodSize}`,
      description: `Spring Nut ${components.rodSize}`,
      quantity: input.quantity * 2,
      unit: 'ea',
      material: 'Spring steel',
    });
  }

  return items;
}
