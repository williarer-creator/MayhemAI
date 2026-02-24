/**
 * Ducts Knowledge Definition
 *
 * Engineering knowledge for HVAC ductwork systems.
 * Implements SMACNA standards and ASHRAE guidelines.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// DUCT PARAMETERS
// =============================================================================

const ductParameters: ParameterDefinition[] = [
  // Duct type
  {
    id: 'duct_type',
    name: 'Duct Type',
    type: 'select',
    options: ['rectangular', 'round', 'oval'],
    default: 'rectangular',
    required: true,
    description: 'Duct cross-section shape',
  },

  // Dimensions - Rectangular
  {
    id: 'width',
    name: 'Width',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Duct width (rectangular)',
  },
  {
    id: 'height',
    name: 'Height',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Duct height (rectangular)',
  },

  // Dimensions - Round
  {
    id: 'diameter',
    name: 'Diameter',
    type: 'number',
    unit: 'mm',
    required: false,
    description: 'Duct diameter (round/oval)',
  },

  // Material
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['galvanized-steel', 'stainless-steel', 'aluminum', 'fiberglass', 'pvc', 'fabric'],
    default: 'galvanized-steel',
    required: true,
    description: 'Duct material',
  },
  {
    id: 'gauge',
    name: 'Metal Gauge',
    type: 'select',
    options: ['26', '24', '22', '20', '18', '16'],
    default: '24',
    required: false,
    description: 'Sheet metal gauge (lower = thicker)',
  },

  // Service
  {
    id: 'service_type',
    name: 'Service Type',
    type: 'select',
    options: ['supply', 'return', 'exhaust', 'fresh-air', 'fume-exhaust'],
    default: 'supply',
    required: true,
    description: 'Type of air service',
  },
  {
    id: 'pressure_class',
    name: 'Pressure Class',
    type: 'select',
    options: ['1/2"', '1"', '2"', '3"', '4"', '6"', '10"'],
    default: '2"',
    required: true,
    description: 'Static pressure class (inches WG)',
  },

  // Airflow
  {
    id: 'airflow',
    name: 'Airflow',
    type: 'number',
    unit: 'mm',  // Actually CFM
    required: true,
    description: 'Design airflow (CFM)',
  },
  {
    id: 'velocity',
    name: 'Air Velocity',
    type: 'number',
    unit: 'mm',  // Actually FPM
    required: false,
    description: 'Design velocity (FPM)',
  },

  // Routing
  {
    id: 'total_length',
    name: 'Total Length',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Total duct run length',
  },
  {
    id: 'num_elbows',
    name: 'Number of Elbows',
    type: 'number',
    default: 0,
    required: false,
    description: 'Number of 90° elbows',
  },

  // Connections
  {
    id: 'connection_type',
    name: 'Connection Type',
    type: 'select',
    options: ['slip-drive', 'flange', 'welded', 'spiral-lockseam'],
    default: 'slip-drive',
    required: true,
    description: 'How sections connect',
  },

  // Insulation
  {
    id: 'insulation_type',
    name: 'Insulation Type',
    type: 'select',
    options: ['none', 'internal-liner', 'external-wrap', 'double-wall'],
    default: 'none',
    required: false,
    description: 'Insulation method',
  },
  {
    id: 'insulation_thickness',
    name: 'Insulation Thickness',
    type: 'number',
    unit: 'mm',
    default: 0,
    required: false,
    description: 'Insulation thickness',
  },

  // Support
  {
    id: 'support_type',
    name: 'Support Type',
    type: 'select',
    options: ['trapeze', 'clevis', 'strap', 'angle'],
    default: 'trapeze',
    required: true,
    description: 'Hanger/support type',
  },
];

// =============================================================================
// DUCT RULES (SMACNA)
// =============================================================================

const ductRules: Rule[] = [
  // Aspect ratio for rectangular ducts
  {
    id: 'aspect_ratio',
    name: 'Aspect Ratio Limit',
    description: 'Rectangular duct aspect ratio should not exceed 4:1',
    type: 'recommendation',
    source: 'SMACNA',
    expression: { type: 'ratio', param1: 'width', param2: 'height', max: 4 },
    errorMessage: 'Aspect ratio exceeds 4:1 - consider round duct',
  },

  // Gauge based on size
  {
    id: 'gauge_for_size',
    name: 'Gauge for Duct Size',
    description: 'Larger ducts require heavier gauge',
    type: 'constraint',
    source: 'SMACNA HVAC Duct Construction',
    expression: {
      type: 'conditional',
      condition: 'width > 750 || height > 750',
      then: { type: 'range', param: 'gauge', max: 22 },
    },
    errorMessage: 'Heavier gauge required for large duct',
  },

  // Velocity limits
  {
    id: 'max_velocity_supply',
    name: 'Maximum Supply Velocity',
    description: 'Supply duct velocity for noise control',
    type: 'recommendation',
    source: 'ASHRAE',
    expression: {
      type: 'conditional',
      condition: 'service_type == "supply"',
      then: { type: 'range', param: 'velocity', max: 2000 },
    },
    errorMessage: 'Velocity may cause noise issues',
  },

  // Exhaust duct material
  {
    id: 'fume_exhaust_material',
    name: 'Fume Exhaust Material',
    description: 'Fume exhaust requires corrosion-resistant material',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'service_type == "fume-exhaust"',
      then: { type: 'required-if', param: 'material', condition: 'material == "stainless-steel" || material == "pvc"' },
    },
    errorMessage: 'Fume exhaust requires corrosion-resistant material',
  },

  // Insulation for supply
  {
    id: 'supply_insulation',
    name: 'Supply Duct Insulation',
    description: 'Supply ducts typically require insulation',
    type: 'recommendation',
    expression: {
      type: 'conditional',
      condition: 'service_type == "supply"',
      then: { type: 'required-if', param: 'insulation_type', condition: 'insulation_type != "none"' },
    },
    errorMessage: 'Consider insulation for supply duct',
  },

  // Pressure class affects construction
  {
    id: 'high_pressure_construction',
    name: 'High Pressure Construction',
    description: 'High pressure requires reinforced construction',
    type: 'constraint',
    source: 'SMACNA',
    expression: {
      type: 'conditional',
      condition: 'pressure_class >= "4\""',
      then: { type: 'required-if', param: 'connection_type', condition: 'connection_type == "flange" || connection_type == "welded"' },
    },
    errorMessage: 'High pressure requires flanged or welded connections',
  },
];

// =============================================================================
// DUCT COMPONENTS
// =============================================================================

const ductComponents: ComponentDefinition[] = [
  // Straight sections
  {
    id: 'straight_section',
    name: 'Straight Section',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 1500)',  // 1.5m sections typical
    parameters: [
      {
        id: 'section_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Section length',
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
    quantityFormula: 'num_elbows',
    parameters: [
      {
        id: 'elbow_angle',
        name: 'Angle',
        type: 'number',
        default: 90,
        required: true,
        description: 'Elbow angle',
      },
    ],
  },

  // Transitions
  {
    id: 'transition',
    name: 'Transition',
    type: 'structural',
    required: false,
    quantity: 'single',
    quantityFormula: '0',
    parameters: [],
  },

  // Flanges (for higher pressure)
  {
    id: 'flange',
    name: 'Flange Connection',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'connection_type == "flange" ? Math.ceil(total_length / 1500) * 2 : 0',
    parameters: [],
  },

  // Supports
  {
    id: 'support',
    name: 'Duct Support',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / 3000) + 1',
    parameters: [],
  },

  // Dampers
  {
    id: 'damper',
    name: 'Volume Damper',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: '0',
    parameters: [],
  },

  // Access doors
  {
    id: 'access_door',
    name: 'Access Door',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'Math.floor(total_length / 6000)',
    parameters: [],
  },

  // Insulation
  {
    id: 'insulation',
    name: 'Duct Insulation',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'insulation_type != "none" ? total_length : 0',
    parameters: [],
  },
];

// =============================================================================
// EXPORT DUCT ELEMENT
// =============================================================================

export const ductElement: ElementDefinition = {
  id: 'duct',
  name: 'Ductwork',
  description: 'HVAC air distribution ductwork',
  connectionType: 'point-to-point',
  parameters: ductParameters,
  rules: ductRules,
  materials: ['galvanized-steel', 'stainless-steel', 'aluminum', 'fiberglass'],
  components: ductComponents,
};

// =============================================================================
// DUCT SIZING CALCULATOR
// =============================================================================

export interface DuctSizingInput {
  airflow: number;         // CFM
  maxVelocity: number;     // FPM
  ductType: 'rectangular' | 'round';
  aspectRatio?: number;    // For rectangular (width:height)
  pressureClass?: string;
}

export interface DuctSizingResult {
  // Round equivalent
  roundDiameter: number;   // inches
  roundDiameterMm: number; // mm

  // Rectangular options
  rectangularOptions: Array<{
    width: number;         // inches
    height: number;        // inches
    widthMm: number;       // mm
    heightMm: number;      // mm
    aspectRatio: number;
    velocity: number;      // FPM
  }>;

  // Selected size
  selectedWidth: number;
  selectedHeight: number;
  actualVelocity: number;

  // Gauge requirement
  recommendedGauge: string;
}

/**
 * Size duct for airflow
 */
export function sizeDuct(input: DuctSizingInput): DuctSizingResult {
  // Calculate minimum area (sq ft)
  const minArea = input.airflow / input.maxVelocity;

  // Round duct diameter (inches)
  const roundDiameter = Math.sqrt((minArea * 4) / Math.PI) * 12;
  const roundDiameterMm = roundDiameter * 25.4;

  // Generate rectangular options
  const rectangularOptions: DuctSizingResult['rectangularOptions'] = [];

  // Common widths (inches)
  const widths = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

  for (const width of widths) {
    // Calculate required height for area
    const heightExact = (minArea * 144) / width;  // Convert to sq inches

    // Round to standard heights
    const heights = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48];
    for (const height of heights) {
      if (height >= heightExact * 0.9) {  // Allow 10% oversizing
        const area = (width * height) / 144;  // sq ft
        const velocity = input.airflow / area;
        const aspectRatio = Math.max(width, height) / Math.min(width, height);

        if (aspectRatio <= 4 && velocity <= input.maxVelocity * 1.1) {
          rectangularOptions.push({
            width,
            height,
            widthMm: Math.round(width * 25.4),
            heightMm: Math.round(height * 25.4),
            aspectRatio: Math.round(aspectRatio * 10) / 10,
            velocity: Math.round(velocity),
          });
        }
        break;
      }
    }
  }

  // Select best option (lowest aspect ratio)
  const selected = rectangularOptions.reduce((best, curr) =>
    curr.aspectRatio < best.aspectRatio ? curr : best
  , rectangularOptions[0] || { width: 12, height: 12, aspectRatio: 1, velocity: 0, widthMm: 305, heightMm: 305 });

  // Gauge recommendation based on size
  const maxDim = Math.max(selected.widthMm, selected.heightMm);
  let recommendedGauge = '26';
  if (maxDim > 300) recommendedGauge = '24';
  if (maxDim > 450) recommendedGauge = '22';
  if (maxDim > 750) recommendedGauge = '20';
  if (maxDim > 1200) recommendedGauge = '18';

  return {
    roundDiameter: Math.round(roundDiameter * 10) / 10,
    roundDiameterMm: Math.round(roundDiameterMm),
    rectangularOptions,
    selectedWidth: selected.widthMm,
    selectedHeight: selected.heightMm,
    actualVelocity: selected.velocity,
    recommendedGauge,
  };
}

// =============================================================================
// DUCT CALCULATOR
// =============================================================================

export interface DuctCalculationInput {
  ductType: 'rectangular' | 'round';
  width?: number;          // mm (rectangular)
  height?: number;         // mm (rectangular)
  diameter?: number;       // mm (round)
  length: number;          // mm
  material: 'galvanized-steel' | 'stainless-steel' | 'aluminum';
  gauge: string;
  numElbows?: number;
  serviceType: 'supply' | 'return' | 'exhaust';
  pressureClass?: string;
  insulationType?: string;
  insulationThickness?: number;  // mm
}

export interface DuctCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  crossSectionArea: number;    // mm²
  perimeter: number;           // mm
  hydraulicDiameter: number;   // mm

  // Sections
  numSections: number;
  sectionLength: number;       // mm

  // Material
  sheetArea: number;           // m²
  weight: number;              // kg

  // Fittings
  elbows: number;
  supports: number;
  accessDoors: number;

  // Fabrication
  blanks: Array<{
    name: string;
    length: number;
    width: number;
    quantity: number;
  }>;
}

/**
 * Calculate duct parameters
 */
export function calculateDuct(input: DuctCalculationInput): DuctCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Cross-section calculations
  let crossSectionArea: number;
  let perimeter: number;
  let hydraulicDiameter: number;

  if (input.ductType === 'round') {
    if (!input.diameter) {
      errors.push('Diameter required for round duct');
      input.diameter = 200;  // Default
    }
    crossSectionArea = Math.PI * Math.pow(input.diameter / 2, 2);
    perimeter = Math.PI * input.diameter;
    hydraulicDiameter = input.diameter;
  } else {
    if (!input.width || !input.height) {
      errors.push('Width and height required for rectangular duct');
      input.width = input.width || 300;
      input.height = input.height || 200;
    }
    crossSectionArea = input.width * input.height;
    perimeter = 2 * (input.width + input.height);
    hydraulicDiameter = (4 * crossSectionArea) / perimeter;

    // Aspect ratio check
    const aspectRatio = Math.max(input.width, input.height) / Math.min(input.width, input.height);
    if (aspectRatio > 4) {
      warnings.push(`Aspect ratio ${aspectRatio.toFixed(1)}:1 exceeds recommended 4:1`);
    }
  }

  // Section calculations
  const standardLength = 1500;  // mm
  const numSections = Math.ceil(input.length / standardLength);
  const sectionLength = input.length / numSections;

  // Material thickness by gauge (mm)
  const gaugeThickness: Record<string, number> = {
    '26': 0.5,
    '24': 0.6,
    '22': 0.8,
    '20': 0.9,
    '18': 1.2,
    '16': 1.5,
  };
  const thickness = gaugeThickness[input.gauge] || 0.6;

  // Sheet area (unfolded perimeter × length)
  const sheetArea = (perimeter / 1000) * (input.length / 1000);  // m²

  // Weight
  const densities: Record<string, number> = {
    'galvanized-steel': 7850,
    'stainless-steel': 8000,
    'aluminum': 2700,
  };
  const density = densities[input.material] || 7850;
  const weight = sheetArea * (thickness / 1000) * density;

  // Fittings
  const elbows = input.numElbows || 0;
  const supports = Math.ceil(input.length / 3000) + 1;
  const accessDoors = Math.floor(input.length / 6000);

  // Fabrication blanks
  const blanks: DuctCalculationResult['blanks'] = [];

  if (input.ductType === 'rectangular' && input.width && input.height) {
    // Main duct sections (wrap-around construction)
    blanks.push({
      name: 'Duct Section',
      length: sectionLength + 50,  // Allow for seams
      width: perimeter + 50,
      quantity: numSections,
    });

    // Elbow blanks
    if (elbows > 0) {
      blanks.push({
        name: 'Elbow Section',
        length: input.width * 1.5,
        width: perimeter + 50,
        quantity: elbows,
      });
    }
  }

  // Insulation
  if (input.insulationType && input.insulationType !== 'none' && input.insulationThickness) {
    const insArea = (perimeter + 2 * Math.PI * input.insulationThickness) / 1000 * (input.length / 1000);
    warnings.push(`Insulation area: ${insArea.toFixed(2)} m²`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    crossSectionArea: Math.round(crossSectionArea),
    perimeter: Math.round(perimeter),
    hydraulicDiameter: Math.round(hydraulicDiameter),
    numSections,
    sectionLength: Math.round(sectionLength),
    sheetArea: Math.round(sheetArea * 100) / 100,
    weight: Math.round(weight * 10) / 10,
    elbows,
    supports,
    accessDoors,
    blanks,
  };
}
