/**
 * Cable Tray Knowledge Definition
 *
 * Engineering knowledge for cable tray systems.
 * Implements NEC (NFPA 70), NEMA VE-1/VE-2, and IEC 61537.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// CABLE TRAY PARAMETERS
// =============================================================================

const cableTrayParameters: ParameterDefinition[] = [
  // Tray type
  {
    id: 'tray_type',
    name: 'Tray Type',
    type: 'select',
    options: ['ladder', 'solid-bottom', 'ventilated-trough', 'channel', 'wire-mesh'],
    default: 'ladder',
    required: true,
    description: 'Cable tray construction type',
  },

  // Dimensions
  {
    id: 'width',
    name: 'Tray Width',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 50,
    max: 900,
    default: 300,
    description: 'Inside width of cable tray',
  },
  {
    id: 'depth',
    name: 'Tray Depth',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 50,
    max: 150,
    default: 100,
    description: 'Inside depth of cable tray',
  },
  {
    id: 'total_length',
    name: 'Total Length',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total cable tray run length',
  },

  // Material
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['galvanized-steel', 'stainless-304', 'stainless-316', 'aluminum', 'fiberglass', 'pvc-coated'],
    default: 'galvanized-steel',
    required: true,
    description: 'Tray material',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['pre-galvanized', 'hot-dip-galvanized', 'powder-coat', 'none'],
    default: 'pre-galvanized',
    required: false,
    description: 'Surface finish',
  },

  // Loading
  {
    id: 'loading_class',
    name: 'Loading Class',
    type: 'select',
    options: ['light', 'medium', 'heavy', 'extra-heavy'],
    default: 'medium',
    required: true,
    description: 'NEMA load class',
  },
  {
    id: 'cable_weight',
    name: 'Cable Weight',
    type: 'number',
    unit: 'mm',  // Actually kg/m
    required: false,
    description: 'Cable weight per meter (kg/m)',
  },

  // Environment
  {
    id: 'environment',
    name: 'Environment',
    type: 'select',
    options: ['indoor-dry', 'indoor-wet', 'outdoor', 'corrosive', 'hazardous'],
    default: 'indoor-dry',
    required: true,
    description: 'Installation environment',
  },

  // Cable fill
  {
    id: 'cable_type',
    name: 'Cable Type',
    type: 'select',
    options: ['power', 'control', 'instrumentation', 'data', 'mixed'],
    default: 'power',
    required: true,
    description: 'Primary cable type',
  },
  {
    id: 'voltage_class',
    name: 'Voltage Class',
    type: 'select',
    options: ['low-voltage', '600V', 'medium-voltage', 'high-voltage'],
    default: '600V',
    required: true,
    description: 'Cable voltage rating',
  },

  // Routing
  {
    id: 'routing_type',
    name: 'Routing Type',
    type: 'select',
    options: ['horizontal', 'vertical', 'combined'],
    default: 'horizontal',
    required: true,
    description: 'Tray orientation',
  },
  {
    id: 'num_horizontal_bends',
    name: 'Horizontal Bends',
    type: 'number',
    default: 0,
    required: false,
    description: 'Number of horizontal direction changes',
  },
  {
    id: 'num_vertical_bends',
    name: 'Vertical Bends',
    type: 'number',
    default: 0,
    required: false,
    description: 'Number of vertical direction changes',
  },
  {
    id: 'elevation_change',
    name: 'Elevation Change',
    type: 'number',
    unit: 'mm',
    default: 0,
    required: false,
    description: 'Total vertical rise/drop',
  },

  // Support
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: ['trapeze', 'wall-bracket', 'center-hung', 'floor-mounted'],
    default: 'trapeze',
    required: true,
    description: 'Support method',
  },
  {
    id: 'support_spacing',
    name: 'Support Spacing',
    type: 'number',
    unit: 'mm',
    required: false,
    default: 1500,
    description: 'Distance between supports',
  },

  // Cover
  {
    id: 'cover_type',
    name: 'Cover Type',
    type: 'select',
    options: ['none', 'solid', 'ventilated', 'hinged'],
    default: 'none',
    required: false,
    description: 'Tray cover type',
  },
];

// =============================================================================
// CABLE TRAY RULES
// =============================================================================

const cableTrayRules: Rule[] = [
  // Fill ratio per NEC
  {
    id: 'nec-fill-single-conductor',
    name: 'NEC Fill - Single Conductors',
    type: 'constraint',
    source: 'NEC 392.22(A)',
    description: 'Single conductor fill must not exceed area limits',
    expression: {
      type: 'conditional',
      condition: 'cable_type == "power" && voltage_class == "600V"',
      then: {
        type: 'formula',
        formula: 'fill_area <= width * depth * 0.4',
        result: 'fill_ok',
      },
    },
    errorMessage: 'Cable fill exceeds 40% for single conductors per NEC',
  },
  {
    id: 'nec-fill-multiconductor',
    name: 'NEC Fill - Multiconductor',
    type: 'constraint',
    source: 'NEC 392.22(A)',
    description: 'Multiconductor cable fill depth limit',
    expression: {
      type: 'conditional',
      condition: 'cable_type == "control" || cable_type == "instrumentation"',
      then: {
        type: 'formula',
        formula: 'fill_depth <= depth * 0.5',
        result: 'fill_ok',
      },
    },
    errorMessage: 'Cable fill exceeds 50% depth for multiconductor',
  },

  // Support spacing per NEMA
  {
    id: 'nema-support-spacing',
    name: 'NEMA Support Spacing',
    type: 'constraint',
    source: 'NEMA VE-1',
    description: 'Maximum support spacing based on loading class',
    expression: {
      type: 'conditional',
      condition: 'loading_class == "heavy" || loading_class == "extra-heavy"',
      then: { type: 'range', param: 'support_spacing', max: 1500 },
      else: { type: 'range', param: 'support_spacing', max: 2400 },
    },
    errorMessage: 'Support spacing exceeds NEMA limits for loading class',
  },

  // Material for corrosive environment
  {
    id: 'corrosive-material',
    name: 'Corrosive Environment Material',
    type: 'constraint',
    description: 'Corrosive environments require special materials',
    expression: {
      type: 'conditional',
      condition: 'environment == "corrosive"',
      then: {
        type: 'required-if',
        param: 'material',
        condition: 'material == "stainless-316" || material == "fiberglass" || material == "pvc-coated"',
      },
    },
    errorMessage: 'Material not suitable for corrosive environment',
  },

  // Outdoor requires cover or special material
  {
    id: 'outdoor-protection',
    name: 'Outdoor Protection',
    type: 'recommendation',
    description: 'Outdoor installations should have covers or HDG',
    expression: {
      type: 'conditional',
      condition: 'environment == "outdoor"',
      then: {
        type: 'required-if',
        param: 'finish',
        condition: 'finish == "hot-dip-galvanized" || cover_type != "none"',
      },
    },
    errorMessage: 'Consider cover or HDG finish for outdoor installation',
  },

  // Ladder tray rung spacing
  {
    id: 'ladder-rung-spacing',
    name: 'Ladder Rung Spacing',
    type: 'recommendation',
    source: 'NEMA VE-1',
    description: 'Ladder rung spacing for cable support',
    expression: {
      type: 'conditional',
      condition: 'tray_type == "ladder"',
      then: {
        type: 'formula',
        formula: 'rung_spacing <= 230',
        result: 'rung_ok',
      },
    },
    errorMessage: 'Rung spacing should be 9" (230mm) or less',
  },

  // Bend radius
  {
    id: 'min-bend-radius',
    name: 'Minimum Bend Radius',
    type: 'constraint',
    source: 'NEC 392.26',
    description: 'Minimum bend radius for cable protection',
    expression: {
      type: 'formula',
      formula: 'bend_radius >= width * 0.6',
      result: 'bend_ok',
    },
    errorMessage: 'Bend radius too tight for tray width',
  },

  // Grounding
  {
    id: 'grounding-required',
    name: 'Grounding Requirements',
    type: 'constraint',
    source: 'NEC 392.60',
    description: 'Metallic cable trays must be grounded',
    expression: {
      type: 'conditional',
      condition: 'material != "fiberglass"',
      then: {
        type: 'formula',
        formula: 'grounding_provided = true',
        result: 'grounded',
      },
    },
    errorMessage: 'Metallic cable tray requires grounding per NEC',
  },
];

// =============================================================================
// CABLE TRAY COMPONENTS
// =============================================================================

const cableTrayComponents: ComponentDefinition[] = [
  // Straight sections
  {
    id: 'straight-section',
    name: 'Straight Section',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3000)',  // 3m standard lengths
    parameters: [],
  },

  // Horizontal elbows
  {
    id: 'horizontal-elbow',
    name: 'Horizontal Elbow',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_horizontal_bends',
    parameters: [],
  },

  // Vertical elbows
  {
    id: 'vertical-elbow',
    name: 'Vertical Elbow',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_vertical_bends',
    parameters: [],
  },

  // Tees
  {
    id: 'tee',
    name: 'Tee Section',
    type: 'structural',
    required: false,
    quantity: 'single',
    parameters: [],
  },

  // Reducers
  {
    id: 'reducer',
    name: 'Reducer',
    type: 'structural',
    required: false,
    quantity: 'single',
    parameters: [],
  },

  // Splice plates
  {
    id: 'splice-plate',
    name: 'Splice Plate',
    type: 'connector',
    required: true,
    quantity: 'calculated',
    quantityFormula: '(Math.ceil(total_length / 3000) - 1) * 2',
    parameters: [],
  },

  // Supports
  {
    id: 'support',
    name: 'Tray Support',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / support_spacing) + 1',
    parameters: [],
  },

  // Hold-down clamps
  {
    id: 'hold-down-clamp',
    name: 'Hold-Down Clamp',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'routing_type == "vertical" ? Math.ceil(total_length / 1000) : 0',
    parameters: [],
  },

  // Covers
  {
    id: 'cover',
    name: 'Tray Cover',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'cover_type != "none" ? Math.ceil(total_length / 3000) : 0',
    parameters: [],
  },

  // Cover clamps
  {
    id: 'cover-clamp',
    name: 'Cover Clamp',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'cover_type != "none" ? Math.ceil(total_length / 500) : 0',
    parameters: [],
  },

  // Grounding
  {
    id: 'grounding-strap',
    name: 'Grounding Strap',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3000)',
    parameters: [],
  },

  // Hardware
  {
    id: 'splice-hardware',
    name: 'Splice Hardware Set',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3000) - 1',
    parameters: [],
  },
];

// =============================================================================
// CABLE TRAY ELEMENT DEFINITION
// =============================================================================

export const cableTrayElement: ElementDefinition = {
  id: 'cable-tray',
  name: 'Cable Tray',
  description: 'Cable tray system for electrical cable routing per NEC/NEMA',
  connectionType: 'point-to-point',
  parameters: cableTrayParameters,
  rules: cableTrayRules,
  materials: ['galvanized-steel', 'stainless', 'aluminum', 'fiberglass'],
  components: cableTrayComponents,
};

// =============================================================================
// CABLE TRAY SIZE DATABASE
// =============================================================================

export interface CableTraySizeData {
  width: number;       // mm
  depth: number;       // mm
  crossSection: number;  // mm²
  loadClass: Record<string, { spanSteel: number; spanAlum: number; load: number }>;
}

export const cableTraySizes: CableTraySizeData[] = [
  {
    width: 150,
    depth: 50,
    crossSection: 7500,
    loadClass: {
      light: { spanSteel: 2400, spanAlum: 1800, load: 25 },
      medium: { spanSteel: 2400, spanAlum: 1500, load: 50 },
      heavy: { spanSteel: 1800, spanAlum: 1200, load: 75 },
    },
  },
  {
    width: 150,
    depth: 100,
    crossSection: 15000,
    loadClass: {
      light: { spanSteel: 2400, spanAlum: 1800, load: 25 },
      medium: { spanSteel: 2400, spanAlum: 1500, load: 50 },
      heavy: { spanSteel: 1800, spanAlum: 1200, load: 75 },
    },
  },
  {
    width: 300,
    depth: 50,
    crossSection: 15000,
    loadClass: {
      light: { spanSteel: 3000, spanAlum: 2400, load: 35 },
      medium: { spanSteel: 2400, spanAlum: 1800, load: 75 },
      heavy: { spanSteel: 1800, spanAlum: 1500, load: 100 },
    },
  },
  {
    width: 300,
    depth: 100,
    crossSection: 30000,
    loadClass: {
      light: { spanSteel: 3000, spanAlum: 2400, load: 35 },
      medium: { spanSteel: 2400, spanAlum: 1800, load: 75 },
      heavy: { spanSteel: 1800, spanAlum: 1500, load: 100 },
    },
  },
  {
    width: 450,
    depth: 100,
    crossSection: 45000,
    loadClass: {
      light: { spanSteel: 3000, spanAlum: 2400, load: 50 },
      medium: { spanSteel: 2400, spanAlum: 1800, load: 100 },
      heavy: { spanSteel: 1800, spanAlum: 1500, load: 150 },
    },
  },
  {
    width: 600,
    depth: 100,
    crossSection: 60000,
    loadClass: {
      light: { spanSteel: 3000, spanAlum: 2400, load: 75 },
      medium: { spanSteel: 2400, spanAlum: 1800, load: 125 },
      heavy: { spanSteel: 1500, spanAlum: 1200, load: 200 },
    },
  },
  {
    width: 600,
    depth: 150,
    crossSection: 90000,
    loadClass: {
      light: { spanSteel: 3000, spanAlum: 2400, load: 75 },
      medium: { spanSteel: 2400, spanAlum: 1800, load: 125 },
      heavy: { spanSteel: 1500, spanAlum: 1200, load: 200 },
    },
  },
  {
    width: 900,
    depth: 150,
    crossSection: 135000,
    loadClass: {
      medium: { spanSteel: 2100, spanAlum: 1500, load: 150 },
      heavy: { spanSteel: 1500, spanAlum: 1200, load: 250 },
      'extra-heavy': { spanSteel: 1200, spanAlum: 900, load: 350 },
    },
  },
];

// =============================================================================
// CABLE FILL CALCULATION
// =============================================================================

export interface CableFillInput {
  trayWidth: number;      // mm
  trayDepth: number;      // mm
  cables: Array<{
    diameter: number;     // mm
    quantity: number;
    type: 'single' | 'multi';
  }>;
  voltageClass: '600V' | 'medium-voltage';
}

export interface CableFillResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  totalCableArea: number;    // mm²
  trayArea: number;          // mm²
  fillPercentage: number;    // %
  maxAllowedFill: number;    // %

  cableArrangement: 'single-layer' | 'stacked';
  stackHeight: number;       // mm
  maxStackHeight: number;    // mm
}

export function calculateCableFill(input: CableFillInput): CableFillResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trayArea = input.trayWidth * input.trayDepth;

  // Calculate total cable area
  let totalCableArea = 0;
  for (const cable of input.cables) {
    const cableArea = Math.PI * Math.pow(cable.diameter / 2, 2);
    totalCableArea += cableArea * cable.quantity;
  }

  const fillPercentage = (totalCableArea / trayArea) * 100;

  // Determine max fill per NEC
  // Single conductors: sum of areas ≤ cross-section based on voltage
  // Multiconductor: depth limited to 50% of tray depth
  const hasSingleConductors = input.cables.some(c => c.type === 'single');
  const hasMultiConductors = input.cables.some(c => c.type === 'multi');

  let maxAllowedFill: number;
  if (input.voltageClass === 'medium-voltage') {
    maxAllowedFill = 40;  // Single layer only for MV
  } else if (hasSingleConductors && !hasMultiConductors) {
    maxAllowedFill = 40;  // NEC 392.22(A)(1) - 40% for 600V single conductors
  } else if (hasMultiConductors && !hasSingleConductors) {
    maxAllowedFill = 50;  // NEC 392.22(A)(2) - 50% depth
  } else {
    maxAllowedFill = 35;  // Mixed - more conservative
  }

  // Check fill
  if (fillPercentage > maxAllowedFill) {
    errors.push(`Cable fill ${fillPercentage.toFixed(1)}% exceeds maximum ${maxAllowedFill}%`);
  } else if (fillPercentage > maxAllowedFill * 0.9) {
    warnings.push(`Cable fill ${fillPercentage.toFixed(1)}% approaching maximum ${maxAllowedFill}%`);
  }

  // Calculate stack height
  const maxCableDia = Math.max(...input.cables.map(c => c.diameter));
  const totalCableCount = input.cables.reduce((sum, c) => sum + c.quantity, 0);
  const cablesPerRow = Math.floor(input.trayWidth / maxCableDia);
  const numRows = Math.ceil(totalCableCount / cablesPerRow);
  const stackHeight = numRows * maxCableDia;

  const maxStackHeight = input.voltageClass === 'medium-voltage'
    ? maxCableDia  // Single layer for MV
    : input.trayDepth * 0.5;  // 50% depth for LV

  const cableArrangement = numRows > 1 ? 'stacked' : 'single-layer';

  if (stackHeight > maxStackHeight) {
    errors.push(`Stack height ${stackHeight}mm exceeds maximum ${maxStackHeight}mm`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalCableArea: Math.round(totalCableArea),
    trayArea,
    fillPercentage: Math.round(fillPercentage * 10) / 10,
    maxAllowedFill,
    cableArrangement,
    stackHeight: Math.round(stackHeight),
    maxStackHeight: Math.round(maxStackHeight),
  };
}

// =============================================================================
// CABLE TRAY CALCULATOR
// =============================================================================

export interface CableTrayCalculationInput {
  trayType: 'ladder' | 'solid-bottom' | 'ventilated-trough' | 'channel' | 'wire-mesh';
  width: number;           // mm
  depth: number;           // mm
  length: number;          // mm
  material: 'galvanized-steel' | 'stainless-304' | 'stainless-316' | 'aluminum' | 'fiberglass';
  loadingClass: 'light' | 'medium' | 'heavy' | 'extra-heavy';
  environment: 'indoor-dry' | 'indoor-wet' | 'outdoor' | 'corrosive';
  numHorizontalBends?: number;
  numVerticalBends?: number;
  elevationChange?: number;   // mm
  hasCover?: boolean;
}

export interface CableTrayCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  width: number;
  depth: number;
  crossSection: number;      // mm²
  totalLength: number;       // mm

  // Capacity
  maxSupportSpan: number;    // mm
  maxLoad: number;           // kg/m
  recommendedSupportSpacing: number;  // mm

  // Quantities
  straightSections: number;
  horizontalElbows: number;
  verticalElbows: number;
  supports: number;
  splicePlates: number;
  covers: number;
  groundingStraps: number;

  // Weight
  trayWeight: number;        // kg/m
  totalTrayWeight: number;   // kg

  // Fittings
  fittingsList: Array<{
    type: string;
    quantity: number;
    partNumber?: string;
  }>;
}

export function calculateCableTray(input: CableTrayCalculationInput): CableTrayCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find size data
  const sizeData = cableTraySizes.find(
    s => s.width === input.width && s.depth === input.depth
  );

  if (!sizeData) {
    warnings.push(`Non-standard size ${input.width}x${input.depth}mm`);
  }

  // Get load class data
  const loadData = sizeData?.loadClass[input.loadingClass];
  const isAluminum = input.material === 'aluminum';
  const maxSpan = loadData
    ? (isAluminum ? loadData.spanAlum : loadData.spanSteel)
    : (isAluminum ? 1500 : 2400);
  const maxLoad = loadData?.load || 50;

  // Validate environment/material combination
  if (input.environment === 'corrosive' &&
      !['stainless-316', 'fiberglass'].includes(input.material)) {
    errors.push('Corrosive environment requires SS316 or fiberglass');
  }
  if (input.environment === 'outdoor' && input.material === 'galvanized-steel') {
    warnings.push('Consider HDG or aluminum for outdoor use');
  }

  // Calculate quantities
  const standardLength = 3000;  // 3m sections
  const straightSections = Math.ceil(input.length / standardLength);
  const horizontalElbows = input.numHorizontalBends || 0;
  const verticalElbows = input.numVerticalBends || 0;

  // Support spacing
  const recommendedSpacing = Math.min(maxSpan, 1500);
  const supports = Math.ceil(input.length / recommendedSpacing) + 1;

  // Splice plates (2 per joint)
  const splicePlates = (straightSections - 1) * 2;

  // Covers
  const covers = input.hasCover ? straightSections : 0;

  // Grounding
  const groundingStraps = straightSections;

  // Weight estimation (kg/m)
  const materialDensity: Record<string, number> = {
    'galvanized-steel': 7850,
    'stainless-304': 8000,
    'stainless-316': 8000,
    'aluminum': 2700,
    'fiberglass': 1800,
  };
  const density = materialDensity[input.material] || 7850;

  // Approximate tray cross-section area (side rails + rungs/bottom)
  const sideRailArea = 2 * input.depth * 2;  // 2mm thick sides
  const rungArea = input.trayType === 'ladder'
    ? (input.width * 5 * (1000 / 230))  // Rungs every 230mm, 5mm thick
    : (input.width * 1.5);  // Solid bottom ~1.5mm
  const trayMetalArea = sideRailArea + rungArea;  // mm² per meter
  const trayWeight = (trayMetalArea / 1000000) * density;

  const totalTrayWeight = (input.length / 1000) * trayWeight;

  // Fittings list
  const fittingsList: CableTrayCalculationResult['fittingsList'] = [];

  fittingsList.push({
    type: 'Straight Section',
    quantity: straightSections,
    partNumber: `CT-${input.trayType.toUpperCase()}-${input.width}x${input.depth}-3000`,
  });

  if (horizontalElbows > 0) {
    fittingsList.push({
      type: 'Horizontal 90° Elbow',
      quantity: horizontalElbows,
      partNumber: `CT-HE90-${input.width}x${input.depth}`,
    });
  }

  if (verticalElbows > 0) {
    fittingsList.push({
      type: 'Vertical 90° Elbow',
      quantity: verticalElbows,
      partNumber: `CT-VE90-${input.width}x${input.depth}`,
    });
  }

  fittingsList.push({
    type: 'Trapeze Support',
    quantity: supports,
  });

  fittingsList.push({
    type: 'Splice Plate Set',
    quantity: Math.ceil(splicePlates / 2),
  });

  fittingsList.push({
    type: 'Grounding Strap',
    quantity: groundingStraps,
  });

  if (covers > 0) {
    fittingsList.push({
      type: 'Cover Section',
      quantity: covers,
      partNumber: `CT-COV-${input.width}-3000`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    width: input.width,
    depth: input.depth,
    crossSection: input.width * input.depth,
    totalLength: input.length,
    maxSupportSpan: maxSpan,
    maxLoad,
    recommendedSupportSpacing: recommendedSpacing,
    straightSections,
    horizontalElbows,
    verticalElbows,
    supports,
    splicePlates,
    covers,
    groundingStraps,
    trayWeight: Math.round(trayWeight * 10) / 10,
    totalTrayWeight: Math.round(totalTrayWeight * 10) / 10,
    fittingsList,
  };
}

// =============================================================================
// CONDUIT ELEMENT DEFINITION
// =============================================================================

const conduitParameters: ParameterDefinition[] = [
  {
    id: 'conduit_type',
    name: 'Conduit Type',
    type: 'select',
    options: ['EMT', 'IMC', 'RMC', 'PVC-40', 'PVC-80', 'LFMC', 'LFNC'],
    default: 'EMT',
    required: true,
    description: 'Conduit type per NEC',
  },
  {
    id: 'trade_size',
    name: 'Trade Size',
    type: 'select',
    options: ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'],
    default: '3/4"',
    required: true,
    description: 'Nominal conduit size',
  },
  {
    id: 'total_length',
    name: 'Total Length',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total conduit run length',
  },
  {
    id: 'num_bends',
    name: 'Number of Bends',
    type: 'number',
    default: 0,
    required: false,
    max: 4,
    description: 'Number of bends (max 360° total)',
  },
  {
    id: 'num_conductors',
    name: 'Number of Conductors',
    type: 'number',
    required: true,
    min: 1,
    description: 'Number of conductors in conduit',
  },
  {
    id: 'conductor_size',
    name: 'Conductor Size',
    type: 'select',
    options: ['14 AWG', '12 AWG', '10 AWG', '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1/0', '2/0', '4/0'],
    required: true,
    description: 'Conductor size',
  },
];

const conduitRules: Rule[] = [
  {
    id: 'nec-bend-limit',
    name: 'NEC Bend Limit',
    type: 'constraint',
    source: 'NEC 358.26',
    description: 'Maximum 360° of bends between pull points',
    expression: {
      type: 'range',
      param: 'num_bends',
      max: 4,  // 4 x 90° = 360°
    },
    errorMessage: 'Exceeds 360° bends between pull points',
  },
  {
    id: 'nec-fill-ratio',
    name: 'NEC Fill Ratio',
    type: 'constraint',
    source: 'NEC Chapter 9',
    description: 'Conduit fill must not exceed limits',
    expression: {
      type: 'conditional',
      condition: 'num_conductors > 2',
      then: {
        type: 'formula',
        formula: 'fill_percentage <= 40',
        result: 'fill_ok',
      },
    },
    errorMessage: 'Conduit fill exceeds 40% for 3+ conductors',
  },
];

const conduitComponents: ComponentDefinition[] = [
  {
    id: 'conduit-stick',
    name: 'Conduit Stick',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3050)',  // 10ft sticks
    parameters: [],
  },
  {
    id: 'coupling',
    name: 'Coupling',
    type: 'connector',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3050) - 1',
    parameters: [],
  },
  {
    id: 'elbow',
    name: 'Elbow',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_bends',
    parameters: [],
  },
  {
    id: 'connector',
    name: 'Box Connector',
    type: 'connector',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'support-strap',
    name: 'Support Strap',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 1500) + 1',
    parameters: [],
  },
];

export const conduitElement: ElementDefinition = {
  id: 'conduit',
  name: 'Electrical Conduit',
  description: 'Electrical conduit for conductor protection per NEC',
  connectionType: 'point-to-point',
  parameters: conduitParameters,
  rules: conduitRules,
  materials: ['steel', 'aluminum', 'pvc'],
  components: conduitComponents,
};

// =============================================================================
// CONDUIT SIZE DATABASE
// =============================================================================

export interface ConduitSizeData {
  tradeSize: string;
  type: string;
  od: number;      // mm
  id: number;      // mm
  area: number;    // mm² (internal)
}

export const conduitSizes: ConduitSizeData[] = [
  // EMT (Electrical Metallic Tubing)
  { tradeSize: '1/2"', type: 'EMT', od: 17.93, id: 15.80, area: 196 },
  { tradeSize: '3/4"', type: 'EMT', od: 23.42, id: 20.93, area: 344 },
  { tradeSize: '1"', type: 'EMT', od: 29.54, id: 26.64, area: 558 },
  { tradeSize: '1-1/4"', type: 'EMT', od: 38.35, id: 35.05, area: 965 },
  { tradeSize: '1-1/2"', type: 'EMT', od: 44.45, id: 40.89, area: 1314 },
  { tradeSize: '2"', type: 'EMT', od: 57.15, id: 52.50, area: 2165 },
  { tradeSize: '2-1/2"', type: 'EMT', od: 73.03, id: 68.33, area: 3669 },
  { tradeSize: '3"', type: 'EMT', od: 88.90, id: 82.55, area: 5355 },
  { tradeSize: '4"', type: 'EMT', od: 114.30, id: 107.95, area: 9156 },

  // RMC (Rigid Metal Conduit)
  { tradeSize: '1/2"', type: 'RMC', od: 21.34, id: 15.80, area: 196 },
  { tradeSize: '3/4"', type: 'RMC', od: 26.67, id: 20.93, area: 344 },
  { tradeSize: '1"', type: 'RMC', od: 33.40, id: 26.64, area: 558 },
  { tradeSize: '1-1/4"', type: 'RMC', od: 42.16, id: 35.05, area: 965 },
  { tradeSize: '1-1/2"', type: 'RMC', od: 48.26, id: 40.89, area: 1314 },
  { tradeSize: '2"', type: 'RMC', od: 60.33, id: 52.50, area: 2165 },

  // PVC Schedule 40
  { tradeSize: '1/2"', type: 'PVC-40', od: 21.34, id: 15.80, area: 196 },
  { tradeSize: '3/4"', type: 'PVC-40', od: 26.67, id: 20.93, area: 344 },
  { tradeSize: '1"', type: 'PVC-40', od: 33.40, id: 26.64, area: 558 },
  { tradeSize: '1-1/4"', type: 'PVC-40', od: 42.16, id: 35.05, area: 965 },
  { tradeSize: '1-1/2"', type: 'PVC-40', od: 48.26, id: 40.89, area: 1314 },
  { tradeSize: '2"', type: 'PVC-40', od: 60.33, id: 52.50, area: 2165 },
];

// =============================================================================
// CONDUIT FILL CALCULATOR
// =============================================================================

export interface ConduitFillInput {
  conduitType: string;
  tradeSize: string;
  conductors: Array<{
    size: string;    // AWG or kcmil
    quantity: number;
    insulation: 'THHN' | 'THWN' | 'XHHW';
  }>;
}

export interface ConduitFillResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  conduitArea: number;       // mm²
  conductorArea: number;     // mm²
  fillPercentage: number;    // %
  maxAllowedFill: number;    // %
}

// Conductor areas (mm²) - THHN/THWN
const conductorAreas: Record<string, number> = {
  '14 AWG': 8.97,
  '12 AWG': 11.68,
  '10 AWG': 16.77,
  '8 AWG': 36.81,
  '6 AWG': 48.39,
  '4 AWG': 66.39,
  '2 AWG': 90.97,
  '1 AWG': 119.48,
  '1/0': 144.52,
  '2/0': 173.16,
  '3/0': 206.06,
  '4/0': 262.71,
};

export function calculateConduitFill(input: ConduitFillInput): ConduitFillResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find conduit data
  const conduitData = conduitSizes.find(
    c => c.tradeSize === input.tradeSize && c.type === input.conduitType
  );

  if (!conduitData) {
    errors.push(`Unknown conduit size: ${input.conduitType} ${input.tradeSize}`);
    return {
      valid: false,
      errors,
      warnings,
      conduitArea: 0,
      conductorArea: 0,
      fillPercentage: 0,
      maxAllowedFill: 40,
    };
  }

  // Calculate conductor area
  let conductorArea = 0;
  let totalConductors = 0;
  for (const cond of input.conductors) {
    const area = conductorAreas[cond.size] || 0;
    if (area === 0) {
      warnings.push(`Unknown conductor size: ${cond.size}`);
    }
    conductorArea += area * cond.quantity;
    totalConductors += cond.quantity;
  }

  // Max fill per NEC Chapter 9 Table 1
  let maxAllowedFill: number;
  if (totalConductors === 1) {
    maxAllowedFill = 53;
  } else if (totalConductors === 2) {
    maxAllowedFill = 31;
  } else {
    maxAllowedFill = 40;
  }

  const fillPercentage = (conductorArea / conduitData.area) * 100;

  if (fillPercentage > maxAllowedFill) {
    errors.push(`Fill ${fillPercentage.toFixed(1)}% exceeds ${maxAllowedFill}% maximum`);
  } else if (fillPercentage > maxAllowedFill * 0.9) {
    warnings.push(`Fill ${fillPercentage.toFixed(1)}% approaching maximum`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    conduitArea: conduitData.area,
    conductorArea: Math.round(conductorArea),
    fillPercentage: Math.round(fillPercentage * 10) / 10,
    maxAllowedFill,
  };
}
