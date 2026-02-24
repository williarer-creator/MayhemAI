/**
 * Covers and Housings Knowledge Definition
 *
 * Engineering knowledge for equipment covers, protective housings,
 * and enclosures. Implements IP ratings, NEMA standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// COVER/HOUSING PARAMETERS
// =============================================================================

const coverParameters: ParameterDefinition[] = [
  // Dimensions
  {
    id: 'length',
    name: 'Length',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'External length',
  },
  {
    id: 'width',
    name: 'Width',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'External width',
  },
  {
    id: 'height',
    name: 'Height',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'External height',
  },

  // Type
  {
    id: 'enclosure_type',
    name: 'Enclosure Type',
    type: 'select',
    options: ['box', 'cabinet', 'hood', 'shroud', 'case', 'console', 'junction-box'],
    default: 'box',
    required: true,
    description: 'Type of enclosure',
  },
  {
    id: 'construction',
    name: 'Construction',
    type: 'select',
    options: ['welded', 'folded', 'cast', 'molded', 'assembled'],
    default: 'folded',
    required: true,
    description: 'Construction method',
  },

  // Protection
  {
    id: 'ip_rating',
    name: 'IP Rating',
    type: 'select',
    options: ['IP20', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66', 'IP67', 'IP68'],
    default: 'IP54',
    required: true,
    description: 'Ingress Protection rating',
  },
  {
    id: 'nema_rating',
    name: 'NEMA Rating',
    type: 'select',
    options: ['1', '3R', '4', '4X', '6P', '12', '13'],
    required: false,
    description: 'NEMA enclosure type',
  },

  // Material
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['steel', 'stainless-304', 'stainless-316', 'aluminum', 'abs', 'polycarbonate', 'fiberglass'],
    default: 'steel',
    required: true,
    description: 'Enclosure material',
  },
  {
    id: 'wall_thickness',
    name: 'Wall Thickness',
    type: 'number',
    unit: 'mm',
    default: 2,
    min: 1,
    max: 10,
    required: true,
    description: 'Material thickness',
  },

  // Finish
  {
    id: 'finish',
    name: 'Surface Finish',
    type: 'select',
    options: ['painted', 'powder-coated', 'galvanized', 'anodized', 'polished', 'brushed', 'raw'],
    default: 'powder-coated',
    required: true,
    description: 'Surface treatment',
  },
  {
    id: 'color',
    name: 'Color',
    type: 'string',
    default: 'RAL7035',
    required: false,
    description: 'Color code (RAL/Pantone)',
  },

  // Access
  {
    id: 'access_type',
    name: 'Access Type',
    type: 'select',
    options: ['hinged-door', 'removable-cover', 'screw-cover', 'quick-release', 'sliding'],
    default: 'hinged-door',
    required: true,
    description: 'How enclosure is accessed',
  },
  {
    id: 'door_position',
    name: 'Door Position',
    type: 'select',
    options: ['front', 'rear', 'top', 'side-left', 'side-right', 'bottom'],
    default: 'front',
    required: false,
    description: 'Location of access door/cover',
  },
  {
    id: 'locking',
    name: 'Locking Type',
    type: 'select',
    options: ['none', 'key-lock', 'padlock-hasp', 'quarter-turn', 'multi-point'],
    default: 'quarter-turn',
    required: false,
    description: 'Door locking mechanism',
  },

  // Features
  {
    id: 'has_window',
    name: 'Has Window',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether enclosure has viewing window',
  },
  {
    id: 'has_ventilation',
    name: 'Has Ventilation',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether enclosure has ventilation',
  },
  {
    id: 'cable_entries',
    name: 'Number of Cable Entries',
    type: 'number',
    default: 0,
    required: false,
    description: 'Number of cable gland positions',
  },

  // Mounting
  {
    id: 'mounting_type',
    name: 'Mounting Type',
    type: 'select',
    options: ['wall-mount', 'floor-mount', 'pole-mount', 'free-standing', 'machine-mount'],
    default: 'wall-mount',
    required: true,
    description: 'How enclosure is mounted',
  },

  // Internal
  {
    id: 'has_backpanel',
    name: 'Has Mounting Backpanel',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Whether enclosure has internal mounting panel',
  },
  {
    id: 'has_din_rail',
    name: 'Has DIN Rail',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether enclosure has DIN rail mounting',
  },
];

// =============================================================================
// COVER/HOUSING RULES
// =============================================================================

const coverRules: Rule[] = [
  // Minimum wall thickness for size
  {
    id: 'wall_thickness_min',
    name: 'Minimum Wall Thickness',
    description: 'Wall thickness must support size and construction',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'length > 600 || width > 600 || height > 600',
      then: { type: 'range', param: 'wall_thickness', min: 2 },
    },
    errorMessage: 'Wall thickness insufficient for enclosure size',
  },

  // IP65+ requires specific sealing
  {
    id: 'ip65_sealing',
    name: 'IP65+ Sealing Requirements',
    description: 'High IP ratings require proper gasket sealing',
    type: 'constraint',
    source: 'IEC 60529',
    expression: {
      type: 'conditional',
      condition: 'ip_rating >= "IP65"',
      then: { type: 'required-if', param: 'gasket_seal', condition: 'true' },
    },
    errorMessage: 'IP65+ requires gasket sealing',
  },

  // Outdoor enclosures need corrosion protection
  {
    id: 'outdoor_material',
    name: 'Outdoor Material Requirements',
    description: 'Outdoor enclosures require corrosion-resistant materials',
    type: 'recommendation',
    expression: {
      type: 'conditional',
      condition: 'nema_rating == "3R" || nema_rating == "4" || nema_rating == "4X"',
      then: { type: 'required-if', param: 'material', condition: 'material != "steel"' },
    },
    errorMessage: 'Consider stainless or aluminum for outdoor use',
  },

  // Large enclosures need reinforcement
  {
    id: 'large_enclosure_reinforcement',
    name: 'Large Enclosure Reinforcement',
    description: 'Large panels may need internal reinforcement',
    type: 'recommendation',
    expression: {
      type: 'conditional',
      condition: 'length > 1000 || width > 800',
      then: { type: 'range', param: 'wall_thickness', min: 2.5 },
    },
    errorMessage: 'Large panels may require reinforcement ribs',
  },

  // Floor-standing requires legs/base
  {
    id: 'floor_mount_base',
    name: 'Floor Mount Base',
    description: 'Floor-standing enclosures need legs or base frame',
    type: 'constraint',
    expression: {
      type: 'conditional',
      condition: 'mounting_type == "floor-mount" || mounting_type == "free-standing"',
      then: { type: 'required-if', param: 'has_legs', condition: 'true' },
    },
    errorMessage: 'Floor-mount enclosures require legs or base',
  },
];

// =============================================================================
// COVER/HOUSING COMPONENTS
// =============================================================================

const coverComponents: ComponentDefinition[] = [
  // Main body/shell
  {
    id: 'shell',
    name: 'Enclosure Shell',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [
      {
        id: 'shell_dimensions',
        name: 'Shell Dimensions',
        type: 'string',
        required: true,
        description: 'LxWxH',
      },
    ],
  },

  // Door/cover
  {
    id: 'door',
    name: 'Door/Cover',
    type: 'structural',
    required: true,
    quantity: 'single',
    quantityFormula: '1',
    parameters: [],
  },

  // Hinges
  {
    id: 'hinge',
    name: 'Door Hinge',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'height > 600 ? 3 : 2',
    parameters: [],
  },

  // Lock
  {
    id: 'lock',
    name: 'Lock/Latch',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'locking != "none" ? 1 : 0',
    parameters: [],
  },

  // Gasket
  {
    id: 'gasket',
    name: 'Door Gasket',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: 'ip_rating >= "IP54" ? 1 : 0',
    parameters: [],
  },

  // Backpanel
  {
    id: 'backpanel',
    name: 'Mounting Backpanel',
    type: 'surface',
    required: false,
    quantity: 'single',
    quantityFormula: 'has_backpanel ? 1 : 0',
    parameters: [],
  },

  // Wall brackets
  {
    id: 'wall_bracket',
    name: 'Wall Mounting Bracket',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'mounting_type == "wall-mount" ? 4 : 0',
    parameters: [],
  },

  // Legs
  {
    id: 'leg',
    name: 'Enclosure Leg',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'mounting_type == "floor-mount" ? 4 : 0',
    parameters: [],
  },

  // Cable glands
  {
    id: 'cable_gland',
    name: 'Cable Gland',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'cable_entries',
    parameters: [],
  },

  // Ventilation
  {
    id: 'vent',
    name: 'Ventilation Louver',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'has_ventilation ? 2 : 0',
    parameters: [],
  },
];

// =============================================================================
// EXPORT COVER ELEMENT
// =============================================================================

export const coverElement: ElementDefinition = {
  id: 'cover',
  name: 'Enclosure/Housing',
  description: 'Protective enclosure for equipment',
  connectionType: 'volume-enclosure',
  parameters: coverParameters,
  rules: coverRules,
  materials: ['steel', 'stainless', 'aluminum', 'plastic', 'fiberglass'],
  components: coverComponents,
};

// =============================================================================
// ENCLOSURE CALCULATOR
// =============================================================================

export interface EnclosureCalculationInput {
  length: number;          // mm (external)
  width: number;           // mm (external)
  height: number;          // mm (external)
  enclosureType: 'box' | 'cabinet' | 'hood' | 'junction-box';
  material: 'steel' | 'stainless-304' | 'stainless-316' | 'aluminum' | 'polycarbonate';
  wallThickness?: number;  // mm
  ipRating: string;
  mountingType: 'wall-mount' | 'floor-mount' | 'free-standing';
  hasBackpanel?: boolean;
  cableEntries?: number;
}

export interface EnclosureCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  externalDimensions: { length: number; width: number; height: number };
  internalDimensions: { length: number; width: number; height: number };
  internalVolume: number;    // liters
  surfaceArea: number;       // m²

  // Material
  material: string;
  wallThickness: number;
  weight: number;            // kg

  // Components
  components: {
    shell: number;
    door: number;
    hinges: number;
    locks: number;
    gaskets: number;
    backpanel: number;
    brackets: number;
    cableGlands: number;
  };

  // Sheet metal blanks (for manufacturing)
  blanks: Array<{
    name: string;
    length: number;
    width: number;
    quantity: number;
  }>;
}

/**
 * Calculate enclosure parameters
 */
export function calculateEnclosure(input: EnclosureCalculationInput): EnclosureCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const wallThickness = input.wallThickness || 2;

  // Internal dimensions
  const internalDimensions = {
    length: input.length - 2 * wallThickness,
    width: input.width - 2 * wallThickness,
    height: input.height - 2 * wallThickness,
  };

  // Volume (liters)
  const internalVolume = (internalDimensions.length * internalDimensions.width * internalDimensions.height) / 1e6;

  // Surface area (m²)
  const surfaceArea = (
    2 * input.length * input.width +
    2 * input.length * input.height +
    2 * input.width * input.height
  ) / 1e6;

  // Material density (kg/m³)
  const densities: Record<string, number> = {
    'steel': 7850,
    'stainless-304': 8000,
    'stainless-316': 8000,
    'aluminum': 2700,
    'polycarbonate': 1200,
  };
  const density = densities[input.material] || 7850;

  // Weight estimate
  const shellVolume = surfaceArea * (wallThickness / 1000);  // m³
  const weight = shellVolume * density;

  // Warnings
  if (input.length > 1200 || input.width > 800) {
    warnings.push('Large panels may require internal reinforcement');
  }

  // Validate IP rating requirements
  const ipNum = parseInt(input.ipRating.replace('IP', ''));
  if (ipNum >= 65 && input.material === 'steel') {
    warnings.push('Consider stainless for IP65+ outdoor applications');
  }

  // Components count
  const numHinges = input.height > 600 ? 3 : 2;
  const numLocks = 1;
  const needsGasket = ipNum >= 54;
  const numBrackets = input.mountingType === 'wall-mount' ? 4 : 0;
  const numCableGlands = input.cableEntries || 0;

  // Calculate sheet metal blanks for fabrication
  const blanks: Array<{ name: string; length: number; width: number; quantity: number }> = [];

  // Body blank (unfolded)
  blanks.push({
    name: 'Body (4-sided)',
    length: input.length + 2 * input.height + 40,  // Allow for bends
    width: input.width + 2 * input.height + 40,
    quantity: 1,
  });

  // Door
  blanks.push({
    name: 'Door',
    length: input.length - 4,
    width: input.width - 4,
    quantity: 1,
  });

  // Backpanel (if specified)
  if (input.hasBackpanel) {
    blanks.push({
      name: 'Backpanel',
      length: internalDimensions.length - 10,
      width: internalDimensions.width - 10,
      quantity: 1,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    externalDimensions: {
      length: input.length,
      width: input.width,
      height: input.height,
    },
    internalDimensions,
    internalVolume: Math.round(internalVolume * 100) / 100,
    surfaceArea: Math.round(surfaceArea * 100) / 100,
    material: input.material,
    wallThickness,
    weight: Math.round(weight * 10) / 10,
    components: {
      shell: 1,
      door: 1,
      hinges: numHinges,
      locks: numLocks,
      gaskets: needsGasket ? 1 : 0,
      backpanel: input.hasBackpanel ? 1 : 0,
      brackets: numBrackets,
      cableGlands: numCableGlands,
    },
    blanks,
  };
}

// =============================================================================
// IP RATING REFERENCE
// =============================================================================

export interface IPRatingInfo {
  rating: string;
  solidProtection: string;
  liquidProtection: string;
  nemaEquivalent: string[];
  applications: string[];
}

export const ipRatings: IPRatingInfo[] = [
  {
    rating: 'IP20',
    solidProtection: 'Fingers (12.5mm)',
    liquidProtection: 'None',
    nemaEquivalent: ['1'],
    applications: ['Indoor electrical panels', 'Clean environments'],
  },
  {
    rating: 'IP44',
    solidProtection: 'Tools/wires (1mm)',
    liquidProtection: 'Splashing water',
    nemaEquivalent: ['3'],
    applications: ['Indoor factory', 'Light industrial'],
  },
  {
    rating: 'IP54',
    solidProtection: 'Dust protected',
    liquidProtection: 'Splashing water',
    nemaEquivalent: ['3', '12'],
    applications: ['General industrial', 'Warehouse'],
  },
  {
    rating: 'IP55',
    solidProtection: 'Dust protected',
    liquidProtection: 'Water jets',
    nemaEquivalent: ['12'],
    applications: ['Dusty environments', 'Washdown areas'],
  },
  {
    rating: 'IP65',
    solidProtection: 'Dust tight',
    liquidProtection: 'Water jets',
    nemaEquivalent: ['4', '4X'],
    applications: ['Outdoor', 'Food processing'],
  },
  {
    rating: 'IP66',
    solidProtection: 'Dust tight',
    liquidProtection: 'Powerful water jets',
    nemaEquivalent: ['4', '4X'],
    applications: ['Marine', 'Heavy washdown'],
  },
  {
    rating: 'IP67',
    solidProtection: 'Dust tight',
    liquidProtection: 'Temporary immersion',
    nemaEquivalent: ['6'],
    applications: ['Submersible', 'Harsh outdoor'],
  },
  {
    rating: 'IP68',
    solidProtection: 'Dust tight',
    liquidProtection: 'Continuous immersion',
    nemaEquivalent: ['6P'],
    applications: ['Underwater', 'Pressurized environments'],
  },
];
