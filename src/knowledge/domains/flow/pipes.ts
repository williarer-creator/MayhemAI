/**
 * Pipes Knowledge Definition
 *
 * Engineering knowledge for piping systems.
 * Implements ASME B31.1, B31.3, and common piping standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// PIPE PARAMETERS
// =============================================================================

const pipeParameters: ParameterDefinition[] = [
  // Pipe specification
  {
    id: 'nominal_size',
    name: 'Nominal Pipe Size',
    type: 'select',
    options: ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"', '6"', '8"', '10"', '12"'],
    required: true,
    description: 'NPS (Nominal Pipe Size)',
  },
  {
    id: 'schedule',
    name: 'Pipe Schedule',
    type: 'select',
    options: ['SCH5', 'SCH10', 'SCH40', 'SCH80', 'SCH160', 'XXS'],
    default: 'SCH40',
    required: true,
    description: 'Wall thickness schedule',
  },
  {
    id: 'material',
    name: 'Pipe Material',
    type: 'select',
    options: ['carbon-steel', 'stainless-304', 'stainless-316', 'copper', 'pvc', 'cpvc', 'hdpe', 'aluminum'],
    default: 'carbon-steel',
    required: true,
    description: 'Pipe material specification',
  },

  // Connection points
  {
    id: 'start_point_x',
    name: 'Start Point X',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'X coordinate of pipe start',
  },
  {
    id: 'start_point_y',
    name: 'Start Point Y',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Y coordinate of pipe start',
  },
  {
    id: 'start_point_z',
    name: 'Start Point Z',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Z coordinate of pipe start',
  },
  {
    id: 'end_point_x',
    name: 'End Point X',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'X coordinate of pipe end',
  },
  {
    id: 'end_point_y',
    name: 'End Point Y',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Y coordinate of pipe end',
  },
  {
    id: 'end_point_z',
    name: 'End Point Z',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Z coordinate of pipe end',
  },

  // Service conditions
  {
    id: 'fluid_type',
    name: 'Fluid Type',
    type: 'select',
    options: ['water', 'steam', 'air', 'gas', 'oil', 'chemicals', 'cryogenic'],
    default: 'water',
    required: true,
    description: 'Type of fluid being conveyed',
  },
  {
    id: 'design_pressure',
    name: 'Design Pressure',
    type: 'number',
    unit: 'mm',  // Actually bar but using mm for unit consistency
    default: 10,
    required: true,
    description: 'Design pressure (bar)',
  },
  {
    id: 'design_temperature',
    name: 'Design Temperature',
    type: 'number',
    unit: 'mm',  // Actually °C
    default: 20,
    required: true,
    description: 'Design temperature (°C)',
  },

  // Routing
  {
    id: 'routing_type',
    name: 'Routing Type',
    type: 'select',
    options: ['direct', 'orthogonal', 'spline'],
    default: 'orthogonal',
    required: true,
    description: 'How pipe is routed between points',
  },
  {
    id: 'bend_radius',
    name: 'Minimum Bend Radius',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Minimum bend radius (1.5D default)',
  },

  // Connection types
  {
    id: 'start_connection',
    name: 'Start Connection',
    type: 'select',
    options: ['butt-weld', 'socket-weld', 'threaded', 'flanged', 'grooved', 'compression'],
    default: 'butt-weld',
    required: true,
    description: 'Connection type at start',
  },
  {
    id: 'end_connection',
    name: 'End Connection',
    type: 'select',
    options: ['butt-weld', 'socket-weld', 'threaded', 'flanged', 'grooved', 'compression'],
    default: 'butt-weld',
    required: true,
    description: 'Connection type at end',
  },

  // Support
  {
    id: 'support_spacing',
    name: 'Support Spacing',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Distance between pipe supports',
  },
  {
    id: 'insulation_thickness',
    name: 'Insulation Thickness',
    type: 'number',
    unit: 'mm',
    default: 0,
    required: false,
    description: 'Insulation thickness (0 = none)',
  },
];

// =============================================================================
// PIPE RULES
// =============================================================================

const pipeRules: Rule[] = [
  // Minimum wall thickness for pressure
  {
    id: 'wall_thickness_pressure',
    name: 'Wall Thickness for Pressure',
    description: 'Pipe wall must handle design pressure',
    type: 'constraint',
    source: 'ASME B31.3',
    expression: {
      type: 'conditional',
      condition: 'design_pressure > 20',
      then: { type: 'required-if', param: 'schedule', condition: 'schedule != "SCH5" && schedule != "SCH10"' },
    },
    errorMessage: 'Thin wall schedule insufficient for pressure',
  },

  // Material compatibility with fluid
  {
    id: 'material_fluid_compatibility',
    name: 'Material-Fluid Compatibility',
    description: 'Pipe material must be compatible with fluid',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'fluid_type == "chemicals"',
      then: { type: 'required-if', param: 'material', condition: 'material == "stainless-316" || material == "hdpe" || material == "cpvc"' },
    },
    errorMessage: 'Material not suitable for chemical service',
  },

  // Temperature limits
  {
    id: 'pvc_temperature_limit',
    name: 'PVC Temperature Limit',
    description: 'PVC has maximum temperature limit',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'material == "pvc"',
      then: { type: 'range', param: 'design_temperature', max: 60 },
    },
    errorMessage: 'PVC not suitable above 60°C',
  },

  // Minimum bend radius
  {
    id: 'min_bend_radius',
    name: 'Minimum Bend Radius',
    description: 'Bends should be at least 1.5D',
    type: 'recommendation',
    source: 'ASME B31.3',
    expression: { type: 'formula', formula: 'bend_radius >= 1.5 * od', result: 'bend_ok' },
    errorMessage: 'Bend radius less than 1.5D',
  },

  // Support spacing based on size
  {
    id: 'support_spacing_calc',
    name: 'Support Spacing',
    description: 'Pipe supports should be properly spaced',
    type: 'recommendation',
    expression: {
      type: 'conditional',
      condition: 'nominal_size <= 2',
      then: { type: 'range', param: 'support_spacing', max: 2400 },
      else: { type: 'range', param: 'support_spacing', max: 3600 },
    },
    errorMessage: 'Support spacing may be too wide',
  },

  // Threaded connections pressure limit
  {
    id: 'threaded_pressure_limit',
    name: 'Threaded Connection Pressure Limit',
    description: 'Threaded connections have pressure/size limits',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'start_connection == "threaded" || end_connection == "threaded"',
      then: { type: 'range', param: 'design_pressure', max: 20 },
    },
    errorMessage: 'Threaded connections limited to 20 bar',
  },
];

// =============================================================================
// PIPE COMPONENTS
// =============================================================================

const pipeComponents: ComponentDefinition[] = [
  // Straight pipe sections
  {
    id: 'pipe_straight',
    name: 'Straight Pipe',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'total_length / 6000',  // 6m standard lengths
    parameters: [
      {
        id: 'length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Pipe length',
      },
    ],
  },

  // Elbows
  {
    id: 'elbow',
    name: 'Elbow',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_direction_changes',
    parameters: [
      {
        id: 'angle',
        name: 'Angle',
        type: 'number',
        unit: 'mm',
        default: 90,
        required: true,
        description: 'Elbow angle (45° or 90°)',
      },
    ],
  },

  // Tees
  {
    id: 'tee',
    name: 'Tee',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_branches',
    parameters: [],
  },

  // Reducers
  {
    id: 'reducer',
    name: 'Reducer',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_size_changes',
    parameters: [],
  },

  // Flanges
  {
    id: 'flange',
    name: 'Flange',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: '(start_connection == "flanged" ? 1 : 0) + (end_connection == "flanged" ? 1 : 0)',
    parameters: [],
  },

  // Gaskets
  {
    id: 'gasket',
    name: 'Flange Gasket',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_flanges / 2',
    parameters: [],
  },

  // Bolts for flanges
  {
    id: 'flange_bolt',
    name: 'Flange Bolt Set',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'num_flanges / 2',
    parameters: [],
  },

  // Pipe supports
  {
    id: 'support',
    name: 'Pipe Support',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / support_spacing) + 1',
    parameters: [],
  },

  // Insulation
  {
    id: 'insulation',
    name: 'Pipe Insulation',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'insulation_thickness > 0 ? total_length : 0',
    parameters: [],
  },
];

// =============================================================================
// EXPORT PIPE ELEMENT
// =============================================================================

export const pipeElement: ElementDefinition = {
  id: 'pipe',
  name: 'Pipe Run',
  description: 'Piping system for fluid conveyance',
  connectionType: 'point-to-point',
  parameters: pipeParameters,
  rules: pipeRules,
  materials: ['carbon-steel', 'stainless', 'copper', 'pvc', 'hdpe'],
  components: pipeComponents,
};

// =============================================================================
// PIPE SIZE DATABASE
// =============================================================================

export interface PipeSizeData {
  nps: string;          // Nominal pipe size
  od: number;           // Outside diameter (mm)
  schedules: Record<string, { wall: number; id: number; weight: number }>;
}

export const pipeSizes: PipeSizeData[] = [
  {
    nps: '1/2"',
    od: 21.3,
    schedules: {
      'SCH5': { wall: 1.65, id: 18.0, weight: 0.80 },
      'SCH10': { wall: 2.11, id: 17.1, weight: 1.00 },
      'SCH40': { wall: 2.77, id: 15.8, weight: 1.27 },
      'SCH80': { wall: 3.73, id: 13.8, weight: 1.62 },
    },
  },
  {
    nps: '3/4"',
    od: 26.7,
    schedules: {
      'SCH5': { wall: 1.65, id: 23.4, weight: 1.02 },
      'SCH10': { wall: 2.11, id: 22.5, weight: 1.28 },
      'SCH40': { wall: 2.87, id: 21.0, weight: 1.69 },
      'SCH80': { wall: 3.91, id: 18.9, weight: 2.20 },
    },
  },
  {
    nps: '1"',
    od: 33.4,
    schedules: {
      'SCH5': { wall: 1.65, id: 30.1, weight: 1.29 },
      'SCH10': { wall: 2.77, id: 27.9, weight: 2.09 },
      'SCH40': { wall: 3.38, id: 26.6, weight: 2.50 },
      'SCH80': { wall: 4.55, id: 24.3, weight: 3.24 },
    },
  },
  {
    nps: '1-1/2"',
    od: 48.3,
    schedules: {
      'SCH5': { wall: 1.65, id: 45.0, weight: 1.90 },
      'SCH10': { wall: 2.77, id: 42.8, weight: 3.11 },
      'SCH40': { wall: 3.68, id: 40.9, weight: 4.05 },
      'SCH80': { wall: 5.08, id: 38.1, weight: 5.41 },
    },
  },
  {
    nps: '2"',
    od: 60.3,
    schedules: {
      'SCH5': { wall: 1.65, id: 57.0, weight: 2.39 },
      'SCH10': { wall: 2.77, id: 54.8, weight: 3.93 },
      'SCH40': { wall: 3.91, id: 52.5, weight: 5.44 },
      'SCH80': { wall: 5.54, id: 49.2, weight: 7.48 },
    },
  },
  {
    nps: '3"',
    od: 88.9,
    schedules: {
      'SCH5': { wall: 2.11, id: 84.7, weight: 4.51 },
      'SCH10': { wall: 3.05, id: 82.8, weight: 6.45 },
      'SCH40': { wall: 5.49, id: 77.9, weight: 11.29 },
      'SCH80': { wall: 7.62, id: 73.7, weight: 15.27 },
    },
  },
  {
    nps: '4"',
    od: 114.3,
    schedules: {
      'SCH5': { wall: 2.11, id: 110.1, weight: 5.84 },
      'SCH10': { wall: 3.05, id: 108.2, weight: 8.36 },
      'SCH40': { wall: 6.02, id: 102.3, weight: 16.07 },
      'SCH80': { wall: 8.56, id: 97.2, weight: 22.32 },
    },
  },
  {
    nps: '6"',
    od: 168.3,
    schedules: {
      'SCH5': { wall: 2.77, id: 162.8, weight: 11.31 },
      'SCH10': { wall: 3.40, id: 161.5, weight: 13.82 },
      'SCH40': { wall: 7.11, id: 154.1, weight: 28.26 },
      'SCH80': { wall: 10.97, id: 146.4, weight: 42.56 },
    },
  },
  {
    nps: '8"',
    od: 219.1,
    schedules: {
      'SCH5': { wall: 2.77, id: 213.6, weight: 14.78 },
      'SCH10': { wall: 3.76, id: 211.6, weight: 19.96 },
      'SCH40': { wall: 8.18, id: 202.7, weight: 42.55 },
      'SCH80': { wall: 12.70, id: 193.7, weight: 64.64 },
    },
  },
];

// =============================================================================
// PIPE CALCULATOR
// =============================================================================

export interface PipeCalculationInput {
  startPoint: { x: number; y: number; z: number };
  endPoint: { x: number; y: number; z: number };
  nominalSize: string;
  schedule: string;
  material: 'carbon-steel' | 'stainless-304' | 'stainless-316' | 'pvc';
  routingType: 'direct' | 'orthogonal';
  designPressure?: number;     // bar
  designTemperature?: number;  // °C
  startConnection?: string;
  endConnection?: string;
}

export interface PipeCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  nominalSize: string;
  schedule: string;
  od: number;              // mm
  id: number;              // mm
  wallThickness: number;   // mm

  // Length
  totalLength: number;     // mm
  straightLength: number;  // mm
  fittingsCount: {
    elbows90: number;
    elbows45: number;
    tees: number;
    flanges: number;
  };

  // Supports
  supportSpacing: number;  // mm
  numSupports: number;

  // Weight
  pipeWeight: number;      // kg/m
  totalWeight: number;     // kg
  waterWeight: number;     // kg (when full)

  // Routing
  routeSegments: Array<{
    start: { x: number; y: number; z: number };
    end: { x: number; y: number; z: number };
    length: number;
    direction: 'X' | 'Y' | 'Z';
  }>;
}

/**
 * Calculate pipe run parameters
 */
export function calculatePipe(input: PipeCalculationInput): PipeCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get pipe size data
  const sizeData = pipeSizes.find(s => s.nps === input.nominalSize);
  if (!sizeData) {
    errors.push(`Unknown pipe size: ${input.nominalSize}`);
    return {
      valid: false,
      errors,
      warnings,
      nominalSize: input.nominalSize,
      schedule: input.schedule,
      od: 0,
      id: 0,
      wallThickness: 0,
      totalLength: 0,
      straightLength: 0,
      fittingsCount: { elbows90: 0, elbows45: 0, tees: 0, flanges: 0 },
      supportSpacing: 0,
      numSupports: 0,
      pipeWeight: 0,
      totalWeight: 0,
      waterWeight: 0,
      routeSegments: [],
    };
  }

  const scheduleData = sizeData.schedules[input.schedule];
  if (!scheduleData) {
    errors.push(`Schedule ${input.schedule} not available for ${input.nominalSize}`);
    return {
      valid: false,
      errors,
      warnings,
      nominalSize: input.nominalSize,
      schedule: input.schedule,
      od: sizeData.od,
      id: 0,
      wallThickness: 0,
      totalLength: 0,
      straightLength: 0,
      fittingsCount: { elbows90: 0, elbows45: 0, tees: 0, flanges: 0 },
      supportSpacing: 0,
      numSupports: 0,
      pipeWeight: 0,
      totalWeight: 0,
      waterWeight: 0,
      routeSegments: [],
    };
  }

  // Calculate route
  const dx = input.endPoint.x - input.startPoint.x;
  const dy = input.endPoint.y - input.startPoint.y;
  const dz = input.endPoint.z - input.startPoint.z;

  const routeSegments: PipeCalculationResult['routeSegments'] = [];
  let totalLength = 0;
  let elbows90 = 0;

  if (input.routingType === 'direct') {
    // Direct route
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    routeSegments.push({
      start: input.startPoint,
      end: input.endPoint,
      length,
      direction: 'X',  // Primary direction
    });
    totalLength = length;
  } else {
    // Orthogonal routing (Manhattan style)
    let current = { ...input.startPoint };

    // X direction
    if (Math.abs(dx) > 0) {
      const end = { ...current, x: input.endPoint.x };
      routeSegments.push({
        start: { ...current },
        end,
        length: Math.abs(dx),
        direction: 'X',
      });
      current = end;
      totalLength += Math.abs(dx);
    }

    // Y direction
    if (Math.abs(dy) > 0) {
      if (routeSegments.length > 0) elbows90++;
      const end = { ...current, y: input.endPoint.y };
      routeSegments.push({
        start: { ...current },
        end,
        length: Math.abs(dy),
        direction: 'Y',
      });
      current = end;
      totalLength += Math.abs(dy);
    }

    // Z direction
    if (Math.abs(dz) > 0) {
      if (routeSegments.length > 0) elbows90++;
      routeSegments.push({
        start: { ...current },
        end: input.endPoint,
        length: Math.abs(dz),
        direction: 'Z',
      });
      totalLength += Math.abs(dz);
    }
  }

  // Support spacing based on size (simplified)
  const npsNum = parseFloat(input.nominalSize.replace('"', ''));
  let supportSpacing = 2400;  // Default for small pipe
  if (npsNum >= 2) supportSpacing = 3000;
  if (npsNum >= 4) supportSpacing = 3600;
  if (npsNum >= 8) supportSpacing = 4500;

  const numSupports = Math.ceil(totalLength / supportSpacing) + 1;

  // Flanges
  const numFlanges = (
    (input.startConnection === 'flanged' ? 1 : 0) +
    (input.endConnection === 'flanged' ? 1 : 0)
  );

  // Weight calculations
  const pipeWeight = scheduleData.weight;  // kg/m
  const totalWeight = (totalLength / 1000) * pipeWeight;

  // Water weight
  const waterVolume = Math.PI * Math.pow(scheduleData.id / 2, 2) * totalLength / 1e9;  // m³
  const waterWeight = waterVolume * 1000;  // kg

  // Warnings
  if (input.material === 'pvc' && (input.designTemperature || 20) > 60) {
    warnings.push('PVC temperature limit exceeded');
  }
  if ((input.designPressure || 10) > 20 && input.schedule === 'SCH10') {
    warnings.push('Consider heavier schedule for pressure');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    nominalSize: input.nominalSize,
    schedule: input.schedule,
    od: sizeData.od,
    id: scheduleData.id,
    wallThickness: scheduleData.wall,
    totalLength: Math.round(totalLength),
    straightLength: Math.round(totalLength - elbows90 * sizeData.od * 1.5),
    fittingsCount: {
      elbows90,
      elbows45: 0,
      tees: 0,
      flanges: numFlanges,
    },
    supportSpacing,
    numSupports,
    pipeWeight,
    totalWeight: Math.round(totalWeight * 10) / 10,
    waterWeight: Math.round(waterWeight * 10) / 10,
    routeSegments,
  };
}
