/**
 * STRUCTURE Domain - Frames and Beams
 *
 * Knowledge for structural elements:
 * - Steel frames (I-beams, channels, angles, HSS)
 * - Aluminum extrusions (T-slot profiles)
 * - Connections (bolted, welded)
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// STEEL FRAME PARAMETERS
// ============================================================================

const steelFrameParameters: ParameterDefinition[] = [
  {
    id: 'frame_type',
    name: 'Frame Type',
    type: 'select',
    options: ['portal-frame', 'braced-frame', 'rigid-frame', 'cantilever', 'simple-span'],
    default: 'simple-span',
    required: true,
    description: 'Structural frame configuration',
  },
  {
    id: 'span_length',
    name: 'Span Length',
    type: 'number',
    unit: 'mm',
    min: 500,
    max: 30000,
    default: 3000,
    required: true,
    description: 'Distance between supports',
  },
  {
    id: 'height',
    name: 'Frame Height',
    type: 'number',
    unit: 'mm',
    min: 500,
    max: 20000,
    default: 3000,
    required: false,
    description: 'Height of frame (for portal/braced frames)',
  },
  {
    id: 'beam_profile',
    name: 'Beam Profile',
    type: 'select',
    options: ['W-beam', 'S-beam', 'C-channel', 'HSS-rect', 'HSS-square', 'HSS-round', 'angle'],
    default: 'W-beam',
    required: true,
    description: 'Cross-sectional shape of beams',
  },
  {
    id: 'beam_size',
    name: 'Beam Size',
    type: 'string',
    default: 'W8x31',
    required: true,
    description: 'Standard profile designation (e.g., W8x31, C6x13)',
  },
  {
    id: 'column_profile',
    name: 'Column Profile',
    type: 'select',
    options: ['W-beam', 'S-beam', 'HSS-rect', 'HSS-square', 'HSS-round', 'pipe'],
    default: 'HSS-square',
    required: false,
    description: 'Cross-sectional shape of columns',
  },
  {
    id: 'column_size',
    name: 'Column Size',
    type: 'string',
    default: 'HSS6x6x3/8',
    required: false,
    description: 'Standard profile designation',
  },
  {
    id: 'material_grade',
    name: 'Steel Grade',
    type: 'select',
    options: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C'],
    default: 'A36',
    required: true,
    description: 'Steel material grade',
  },
  {
    id: 'connection_type',
    name: 'Connection Type',
    type: 'select',
    options: ['bolted-simple', 'bolted-moment', 'welded', 'pinned'],
    default: 'bolted-simple',
    required: true,
    description: 'Primary connection method',
  },
  {
    id: 'design_load',
    name: 'Design Load',
    type: 'number',
    unit: 'mm', // Using mm as proxy, actual is kN
    min: 1,
    max: 10000,
    default: 50,
    required: true,
    description: 'Total factored design load (kN)',
  },
  {
    id: 'load_type',
    name: 'Load Type',
    type: 'select',
    options: ['uniform', 'point-center', 'point-third', 'triangular'],
    default: 'uniform',
    required: true,
    description: 'Load distribution pattern',
  },
  {
    id: 'lateral_bracing',
    name: 'Lateral Bracing',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Include lateral bracing system',
  },
  {
    id: 'fire_rating',
    name: 'Fire Rating',
    type: 'select',
    options: ['none', '1-hour', '2-hour', '3-hour'],
    default: 'none',
    required: false,
    description: 'Required fire protection rating',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'primer', 'galvanized', 'powder-coat', 'intumescent'],
    default: 'primer',
    required: false,
    description: 'Surface treatment',
  },
];

// ============================================================================
// STEEL FRAME RULES
// ============================================================================

const steelFrameRules: Rule[] = [
  {
    id: 'deflection_limit',
    name: 'Deflection Limit',
    description: 'Maximum beam deflection L/360 for floors, L/240 for roofs',
    type: 'constraint',
    source: 'AISC 360, IBC',
    expression: {
      type: 'ratio',
      param1: 'span_length',
      param2: 'design_load',
      min: 0,
    },
    errorMessage: 'Beam deflection exceeds allowable limits',
  },
  {
    id: 'slenderness_ratio',
    name: 'Slenderness Ratio',
    description: 'Column slenderness ratio limit for stability',
    type: 'constraint',
    source: 'AISC 360 E2',
    expression: { type: 'range', param: 'height', max: 20000 },
    errorMessage: 'Column slenderness ratio exceeds limit',
  },
  {
    id: 'compact_section',
    name: 'Compact Section',
    description: 'Beam sections should be compact for full plastic capacity',
    type: 'recommendation',
    source: 'AISC 360 Table B4.1b',
    expression: { type: 'range', param: 'design_load', min: 0 },
    errorMessage: 'Section may not be compact',
  },
  {
    id: 'bolt_spacing',
    name: 'Bolt Spacing',
    description: 'Minimum bolt spacing 3 times bolt diameter',
    type: 'constraint',
    source: 'AISC 360 J3.3',
    expression: { type: 'range', param: 'span_length', min: 500 },
    errorMessage: 'Bolt spacing may be insufficient',
  },
];

// ============================================================================
// STEEL FRAME COMPONENTS
// ============================================================================

const steelFrameComponents: ComponentDefinition[] = [
  {
    id: 'beam',
    name: 'Steel Beam',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'beam_count',
    parameters: [
      {
        id: 'beam_length',
        name: 'Beam Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Length of beam',
      },
    ],
  },
  {
    id: 'column',
    name: 'Steel Column',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'column_count',
    parameters: [
      {
        id: 'column_height',
        name: 'Column Height',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Height of column',
      },
    ],
  },
  {
    id: 'brace',
    name: 'Bracing Member',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'brace_count',
    parameters: [
      {
        id: 'brace_length',
        name: 'Brace Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Length of diagonal brace',
      },
    ],
  },
  {
    id: 'connection_plate',
    name: 'Connection Plate',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'connection_count * 2',
    parameters: [
      {
        id: 'plate_size',
        name: 'Plate Size',
        type: 'string',
        required: true,
        description: 'Plate dimensions',
      },
    ],
  },
  {
    id: 'bolts',
    name: 'High-Strength Bolts',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'total_bolt_count',
    parameters: [
      {
        id: 'bolt_spec',
        name: 'Bolt Specification',
        type: 'string',
        required: true,
        description: 'A325 or A490 bolt spec',
      },
    ],
  },
  {
    id: 'base_plate',
    name: 'Base Plate Assembly',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'column_count',
    parameters: [
      {
        id: 'base_dimensions',
        name: 'Base Plate Size',
        type: 'string',
        required: true,
        description: 'Base plate dimensions',
      },
    ],
  },
];

// ============================================================================
// STEEL FRAME ELEMENT
// ============================================================================

export const steelFrameElement: ElementDefinition = {
  id: 'steel-frame',
  name: 'Steel Frame',
  description: 'Structural steel frames using standard rolled shapes and HSS sections',
  connectionType: 'horizontal-span',
  parameters: steelFrameParameters,
  rules: steelFrameRules,
  materials: ['A36', 'A572-50', 'A992', 'A500-B', 'A500-C'],
  components: steelFrameComponents,
};

// ============================================================================
// ALUMINUM EXTRUSION PARAMETERS
// ============================================================================

const extrusionFrameParameters: ParameterDefinition[] = [
  {
    id: 'profile_series',
    name: 'Profile Series',
    type: 'select',
    options: ['20-series', '30-series', '40-series', '45-series', '80-series'],
    default: '40-series',
    required: true,
    description: 'T-slot profile size series',
  },
  {
    id: 'profile_type',
    name: 'Profile Type',
    type: 'select',
    options: ['light', 'standard', 'heavy', 'double', 'corner'],
    default: 'standard',
    required: true,
    description: 'Profile weight class',
  },
  {
    id: 'frame_width',
    name: 'Frame Width',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 5000,
    default: 800,
    required: true,
    description: 'Overall frame width',
  },
  {
    id: 'frame_depth',
    name: 'Frame Depth',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 5000,
    default: 600,
    required: true,
    description: 'Overall frame depth',
  },
  {
    id: 'frame_height',
    name: 'Frame Height',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 3000,
    default: 1200,
    required: true,
    description: 'Overall frame height',
  },
  {
    id: 'corner_brackets',
    name: 'Corner Bracket Type',
    type: 'select',
    options: ['inside-corner', 'outside-corner', 'cast-corner', 'gusset', 'hidden'],
    default: 'inside-corner',
    required: true,
    description: 'Type of corner connection',
  },
  {
    id: 'panel_slots',
    name: 'Panel Retention',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Add panel-holding slots',
  },
  {
    id: 'casters',
    name: 'Include Casters',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Add leveling feet or casters',
  },
  {
    id: 'load_capacity',
    name: 'Load Capacity',
    type: 'number',
    unit: 'mm', // Using mm as proxy, actual is kg
    min: 10,
    max: 2000,
    default: 200,
    required: true,
    description: 'Required load capacity (kg)',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'clear-anodize', 'black-anodize', 'powder-coat'],
    default: 'clear-anodize',
    required: false,
    description: 'Surface finish',
  },
];

// ============================================================================
// EXTRUSION FRAME RULES
// ============================================================================

const extrusionFrameRules: Rule[] = [
  {
    id: 'profile_load_match',
    name: 'Profile Load Match',
    description: 'Profile series must support required load capacity',
    type: 'constraint',
    source: 'Manufacturer Load Tables',
    expression: { type: 'range', param: 'load_capacity', max: 2000 },
    errorMessage: 'Profile may be undersized for load',
  },
  {
    id: 'span_deflection',
    name: 'Span Deflection',
    description: 'Horizontal spans need support or heavier profile',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: {
      type: 'ratio',
      param1: 'frame_width',
      param2: 'frame_height',
      max: 5,
    },
    errorMessage: 'Horizontal span may have excessive deflection',
  },
  {
    id: 'fastener_compatibility',
    name: 'Fastener Compatibility',
    description: 'T-nuts and bolts must match profile slot size',
    type: 'constraint',
    source: 'T-slot Standards',
    expression: { type: 'range', param: 'frame_height', min: 100 },
    errorMessage: 'Fasteners must match slot size',
  },
];

// ============================================================================
// EXTRUSION FRAME COMPONENTS
// ============================================================================

const extrusionFrameComponents: ComponentDefinition[] = [
  {
    id: 'profile',
    name: 'Aluminum Extrusion',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'profile_count',
    parameters: [
      {
        id: 'profile_length',
        name: 'Profile Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Cut length of profile',
      },
    ],
  },
  {
    id: 'corner_bracket',
    name: 'Corner Bracket',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'corner_count * brackets_per_corner',
    parameters: [
      {
        id: 'bracket_type',
        name: 'Bracket Type',
        type: 'string',
        required: true,
        description: 'Type of corner bracket',
      },
    ],
  },
  {
    id: 't_nut',
    name: 'T-Nut',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'total_connection_points * 2',
    parameters: [
      {
        id: 'thread_size',
        name: 'Thread Size',
        type: 'string',
        required: true,
        description: 'M5, M6, M8, etc.',
      },
    ],
  },
  {
    id: 'bolt',
    name: 'Socket Head Bolt',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'total_connection_points',
    parameters: [
      {
        id: 'bolt_spec',
        name: 'Bolt Specification',
        type: 'string',
        required: true,
        description: 'Thread and length',
      },
    ],
  },
  {
    id: 'end_cap',
    name: 'End Cap',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'profile_count * 2',
    parameters: [
      {
        id: 'cap_type',
        name: 'Cap Type',
        type: 'string',
        required: true,
        description: 'Plastic or aluminum',
      },
    ],
  },
  {
    id: 'foot',
    name: 'Leveling Foot',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'foot_count',
    parameters: [
      {
        id: 'foot_size',
        name: 'Foot Size',
        type: 'string',
        required: true,
        description: 'Thread and pad size',
      },
    ],
  },
];

// ============================================================================
// EXTRUSION FRAME ELEMENT
// ============================================================================

export const extrusionFrameElement: ElementDefinition = {
  id: 'extrusion-frame',
  name: 'Aluminum Extrusion Frame',
  description: 'T-slot aluminum extrusion frames for equipment and workstations',
  connectionType: 'volume-enclosure',
  parameters: extrusionFrameParameters,
  rules: extrusionFrameRules,
  materials: ['aluminum-6063-T5', 'aluminum-6063-T6'],
  components: extrusionFrameComponents,
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

// Steel section properties database
export interface SteelSectionData {
  designation: string;
  type: string;
  depth: number;
  width: number;
  webThickness: number;
  flangeThickness: number;
  area: number;
  weight: number;
  Ix: number;
  Sx: number;
  rx: number;
  Zx: number;
}

export const steelSections: SteelSectionData[] = [
  { designation: 'W6x12', type: 'W-beam', depth: 152, width: 102, webThickness: 5.8, flangeThickness: 6.9, area: 2280, weight: 17.9, Ix: 8.7, Sx: 115, rx: 62, Zx: 131 },
  { designation: 'W8x18', type: 'W-beam', depth: 207, width: 133, webThickness: 5.8, flangeThickness: 7.2, area: 3420, weight: 26.8, Ix: 25.4, Sx: 245, rx: 86, Zx: 275 },
  { designation: 'W8x31', type: 'W-beam', depth: 203, width: 203, webThickness: 7.2, flangeThickness: 11.0, area: 5890, weight: 46.1, Ix: 43.3, Sx: 427, rx: 86, Zx: 487 },
  { designation: 'W10x33', type: 'W-beam', depth: 247, width: 202, webThickness: 7.4, flangeThickness: 11.6, area: 6260, weight: 49.1, Ix: 71.1, Sx: 576, rx: 107, Zx: 650 },
  { designation: 'W12x40', type: 'W-beam', depth: 304, width: 203, webThickness: 7.5, flangeThickness: 13.0, area: 7610, weight: 59.5, Ix: 130, Sx: 856, rx: 131, Zx: 966 },
  { designation: 'HSS4x4x1/4', type: 'HSS-square', depth: 102, width: 102, webThickness: 6.4, flangeThickness: 6.4, area: 2290, weight: 18.0, Ix: 5.8, Sx: 114, rx: 50, Zx: 139 },
  { designation: 'HSS6x6x3/8', type: 'HSS-square', depth: 152, width: 152, webThickness: 9.5, flangeThickness: 9.5, area: 5100, weight: 40.0, Ix: 28.7, Sx: 377, rx: 75, Zx: 459 },
  { designation: 'C6x13', type: 'C-channel', depth: 152, width: 56, webThickness: 8.1, flangeThickness: 10.5, area: 2470, weight: 19.4, Ix: 7.4, Sx: 98, rx: 55, Zx: 116 },
  { designation: 'L4x4x1/4', type: 'angle', depth: 102, width: 102, webThickness: 6.4, flangeThickness: 6.4, area: 1230, weight: 9.7, Ix: 1.9, Sx: 31, rx: 31, Zx: 49 },
];

export const steelGrades: Record<string, { Fy: number; Fu: number }> = {
  'A36': { Fy: 250, Fu: 400 },
  'A572-50': { Fy: 345, Fu: 450 },
  'A992': { Fy: 345, Fu: 450 },
  'A500-B': { Fy: 290, Fu: 400 },
  'A500-C': { Fy: 317, Fu: 427 },
};

export interface ExtrusionProfileData {
  series: string;
  type: string;
  slotSize: number;
  nominalSize: number;
  area: number;
  weight: number;
  Ix: number;
  momentCapacity: number;
  boltSize: string;
}

export const extrusionProfiles: ExtrusionProfileData[] = [
  { series: '20-series', type: 'standard', slotSize: 6, nominalSize: 20, area: 130, weight: 0.35, Ix: 4.5, momentCapacity: 15, boltSize: 'M5' },
  { series: '30-series', type: 'standard', slotSize: 8, nominalSize: 30, area: 300, weight: 0.81, Ix: 24, momentCapacity: 50, boltSize: 'M6' },
  { series: '40-series', type: 'light', slotSize: 8, nominalSize: 40, area: 340, weight: 0.92, Ix: 52, momentCapacity: 80, boltSize: 'M8' },
  { series: '40-series', type: 'standard', slotSize: 8, nominalSize: 40, area: 540, weight: 1.46, Ix: 86, momentCapacity: 130, boltSize: 'M8' },
  { series: '40-series', type: 'heavy', slotSize: 8, nominalSize: 40, area: 780, weight: 2.11, Ix: 115, momentCapacity: 180, boltSize: 'M8' },
  { series: '80-series', type: 'standard', slotSize: 10, nominalSize: 80, area: 1600, weight: 4.32, Ix: 920, momentCapacity: 700, boltSize: 'M10' },
];

export interface SteelFrameCalculationInput {
  frameType: string;
  spanLength: number;
  height: number;
  beamSize: string;
  columnSize: string;
  materialGrade: string;
  connectionType: string;
  designLoad: number;
  loadType: string;
  lateralBracing: boolean;
}

export interface SteelFrameCalculationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  beamCheck: {
    momentDemand: number;
    momentCapacity: number;
    utilizationRatio: number;
    deflection: number;
    deflectionLimit: number;
  };
  columnCheck?: {
    axialDemand: number;
    axialCapacity: number;
    utilizationRatio: number;
    slendernessRatio: number;
  };
  componentCounts: {
    beams: number;
    columns: number;
    braces: number;
    connectionPlates: number;
    bolts: number;
    basePlates: number;
  };
  estimatedWeight: number;
  cutList: Array<{
    profile: string;
    length: number;
    quantity: number;
    weight: number;
  }>;
}

export function calculateSteelFrame(input: SteelFrameCalculationInput): SteelFrameCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const beamSection = steelSections.find(s => s.designation === input.beamSize);
  const columnSection = steelSections.find(s => s.designation === input.columnSize);
  const steelGrade = steelGrades[input.materialGrade] || steelGrades['A36'];

  if (!beamSection) {
    errors.push(`Beam section ${input.beamSize} not found in database`);
  }

  const beam = beamSection || steelSections[2];
  const column = columnSection || steelSections[6];

  let momentDemand: number;
  switch (input.loadType) {
    case 'uniform':
      momentDemand = (input.designLoad * input.spanLength) / 8000;
      break;
    case 'point-center':
      momentDemand = (input.designLoad * input.spanLength) / 4000;
      break;
    default:
      momentDemand = (input.designLoad * input.spanLength) / 8000;
  }

  const momentCapacity = (beam.Zx * steelGrade.Fy) / 1e6;
  const momentUtilization = momentDemand / momentCapacity;

  if (momentUtilization > 1.0) {
    errors.push(`Beam moment utilization ${(momentUtilization * 100).toFixed(0)}% exceeds capacity`);
  } else if (momentUtilization > 0.9) {
    warnings.push(`Beam near capacity at ${(momentUtilization * 100).toFixed(0)}%`);
  }

  const E = 200000;
  const deflection = (5 * input.designLoad * 1000 * Math.pow(input.spanLength, 3)) / (384 * E * beam.Ix * 1e6);
  const deflectionLimit = input.spanLength / 360;

  if (deflection > deflectionLimit) {
    errors.push(`Deflection ${deflection.toFixed(1)}mm exceeds L/360 limit`);
  }

  let columnCheck: SteelFrameCalculationResult['columnCheck'];
  if (input.frameType !== 'simple-span') {
    const axialDemand = input.designLoad / 2;
    const K = input.frameType === 'rigid-frame' ? 1.0 : 0.8;
    const Le = K * input.height;
    const slendernessRatio = Le / column.rx;

    let axialCapacity = 0;
    if (slendernessRatio < 200) {
      const Fe = (Math.PI * Math.PI * E) / (slendernessRatio * slendernessRatio);
      const Fcr = slendernessRatio < 100
        ? steelGrade.Fy * (1 - (steelGrade.Fy / (4 * Fe)))
        : 0.877 * Fe;
      axialCapacity = Fcr * column.area / 1000;
    } else {
      errors.push(`Column slenderness ratio ${slendernessRatio.toFixed(0)} exceeds 200`);
    }

    columnCheck = {
      axialDemand,
      axialCapacity,
      utilizationRatio: axialCapacity > 0 ? axialDemand / axialCapacity : 999,
      slendernessRatio,
    };

    if (columnCheck.utilizationRatio > 1.0) {
      errors.push(`Column utilization ${(columnCheck.utilizationRatio * 100).toFixed(0)}% exceeds capacity`);
    }
  }

  let beamCount = 1;
  let columnCount = 0;
  let braceCount = 0;
  let connectionCount = 2;

  switch (input.frameType) {
    case 'portal-frame':
    case 'rigid-frame':
      columnCount = 2;
      connectionCount = 4;
      break;
    case 'braced-frame':
      columnCount = 2;
      braceCount = input.lateralBracing ? 2 : 0;
      connectionCount = 6;
      break;
    case 'cantilever':
      columnCount = 1;
      connectionCount = 2;
      break;
  }

  const boltsPerConnection = input.connectionType === 'bolted-moment' ? 8 : 4;
  const totalBolts = connectionCount * boltsPerConnection;

  const cutList: SteelFrameCalculationResult['cutList'] = [];
  cutList.push({
    profile: input.beamSize,
    length: input.spanLength,
    quantity: beamCount,
    weight: beam.weight * input.spanLength / 1000 * beamCount,
  });

  if (columnCount > 0) {
    cutList.push({
      profile: input.columnSize,
      length: input.height,
      quantity: columnCount,
      weight: column.weight * input.height / 1000 * columnCount,
    });
  }

  const estimatedWeight = cutList.reduce((sum, item) => sum + item.weight, 0);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    beamCheck: {
      momentDemand,
      momentCapacity,
      utilizationRatio: momentUtilization,
      deflection,
      deflectionLimit,
    },
    columnCheck,
    componentCounts: {
      beams: beamCount,
      columns: columnCount,
      braces: braceCount,
      connectionPlates: connectionCount,
      bolts: totalBolts,
      basePlates: columnCount,
    },
    estimatedWeight,
    cutList,
  };
}

export interface ExtrusionFrameCalculationInput {
  profileSeries: string;
  profileType: string;
  frameWidth: number;
  frameDepth: number;
  frameHeight: number;
  cornerBrackets: string;
  loadCapacity: number;
}

export interface ExtrusionFrameCalculationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selectedProfile: ExtrusionProfileData | null;
  componentCounts: {
    profiles: { length: number; quantity: number }[];
    cornerBrackets: number;
    tNuts: number;
    bolts: number;
    endCaps: number;
    feet: number;
  };
  totalProfileLength: number;
  estimatedWeight: number;
}

export function calculateExtrusionFrame(input: ExtrusionFrameCalculationInput): ExtrusionFrameCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const profile = extrusionProfiles.find(
    p => p.series === input.profileSeries && p.type === input.profileType
  );

  if (!profile) {
    errors.push(`Profile ${input.profileSeries} ${input.profileType} not found`);
  }

  const selectedProfile = profile || extrusionProfiles[3];

  const loadPerProfile = input.loadCapacity / 4;
  if (selectedProfile.momentCapacity < loadPerProfile * 0.1) {
    warnings.push(`Profile may be undersized for ${input.loadCapacity}kg load`);
  }

  const profiles: { length: number; quantity: number }[] = [
    { length: input.frameHeight, quantity: 4 },
    { length: input.frameWidth - 2 * selectedProfile.nominalSize, quantity: 4 },
    { length: input.frameDepth - 2 * selectedProfile.nominalSize, quantity: 4 },
  ];

  const bracketsPerCorner = input.cornerBrackets === 'gusset' ? 2 : 1;
  const cornerBrackets = 8 * bracketsPerCorner;
  const tNuts = cornerBrackets * 2;
  const bolts = cornerBrackets * 2;
  const endCaps = 12 * 2;
  const feet = 4;

  const totalLength = profiles.reduce((sum, p) => sum + p.length * p.quantity, 0);
  const estimatedWeight = (totalLength / 1000) * selectedProfile.weight;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    selectedProfile,
    componentCounts: {
      profiles,
      cornerBrackets,
      tNuts,
      bolts,
      endCaps,
      feet,
    },
    totalProfileLength: totalLength,
    estimatedWeight,
  };
}
