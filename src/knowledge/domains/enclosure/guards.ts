/**
 * Guards Knowledge Definition
 *
 * Engineering knowledge for machine guards and safety barriers.
 * Implements OSHA 1910.212, ISO 14120, and ANSI/RIA standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// GUARD PARAMETERS
// =============================================================================

const guardParameters: ParameterDefinition[] = [
  // Dimensions
  {
    id: 'width',
    name: 'Guard Width',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Width of guard panel',
  },
  {
    id: 'height',
    name: 'Guard Height',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 1000,
    description: 'Height of guard (min 1000mm for full-height)',
  },
  {
    id: 'depth',
    name: 'Guard Depth',
    type: 'number',
    unit: 'mm',
    default: 50,
    required: false,
    description: 'Depth/thickness of guard assembly',
  },

  // Type
  {
    id: 'guard_type',
    name: 'Guard Type',
    type: 'select',
    options: ['fixed', 'interlocked', 'adjustable', 'self-adjusting', 'perimeter'],
    default: 'fixed',
    required: true,
    description: 'Type of machine guard',
  },
  {
    id: 'panel_type',
    name: 'Panel Type',
    type: 'select',
    options: ['mesh', 'perforated', 'solid', 'polycarbonate', 'acrylic', 'wire-mesh'],
    default: 'mesh',
    required: true,
    description: 'Guard panel material/style',
  },

  // Safety distance
  {
    id: 'hazard_distance',
    name: 'Distance to Hazard',
    type: 'number',
    unit: 'mm',
    required: true,
    description: 'Distance from guard to hazard point',
  },
  {
    id: 'opening_size',
    name: 'Opening Size',
    type: 'number',
    unit: 'mm',
    default: 25,
    required: true,
    description: 'Size of mesh/perforations (if applicable)',
  },

  // Frame
  {
    id: 'frame_profile',
    name: 'Frame Profile',
    type: 'select',
    options: ['aluminum-extrusion', 'steel-tube', 'steel-angle', 'channel'],
    default: 'aluminum-extrusion',
    required: true,
    description: 'Frame construction type',
  },
  {
    id: 'frame_size',
    name: 'Frame Size',
    type: 'number',
    unit: 'mm',
    default: 40,
    required: false,
    description: 'Frame profile size (e.g., 40mm extrusion)',
  },

  // Mounting
  {
    id: 'mounting_type',
    name: 'Mounting Type',
    type: 'select',
    options: ['floor-mounted', 'machine-mounted', 'wall-mounted', 'ceiling-hung'],
    default: 'floor-mounted',
    required: true,
    description: 'How guard is mounted',
  },
  {
    id: 'removable',
    name: 'Removable',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Whether guard can be removed for maintenance',
  },

  // Access
  {
    id: 'has_door',
    name: 'Has Access Door',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Whether guard includes access door',
  },
  {
    id: 'door_width',
    name: 'Door Width',
    type: 'number',
    unit: 'mm',
    default: 600,
    required: false,
    description: 'Width of access door (if applicable)',
  },
  {
    id: 'interlock_type',
    name: 'Interlock Type',
    type: 'select',
    options: ['none', 'mechanical', 'magnetic', 'rfid', 'trapped-key'],
    default: 'none',
    required: false,
    description: 'Safety interlock type for doors',
  },
];

// =============================================================================
// GUARD RULES (OSHA 1910.212, ISO 14120)
// =============================================================================

const guardRules: Rule[] = [
  // Safety distance based on opening size (ISO 13857)
  {
    id: 'safety_distance_openings',
    name: 'Safety Distance for Openings',
    description: 'Minimum distance to hazard based on opening size per ISO 13857',
    type: 'constraint',
    source: 'ISO 13857 Table 1',
    expression: {
      type: 'conditional',
      condition: 'opening_size <= 4',
      then: { type: 'range', param: 'hazard_distance', min: 2 },
      else: {
        type: 'conditional',
        condition: 'opening_size <= 6',
        then: { type: 'range', param: 'hazard_distance', min: 10 },
        else: {
          type: 'conditional',
          condition: 'opening_size <= 8',
          then: { type: 'range', param: 'hazard_distance', min: 20 },
        },
      },
    },
    errorMessage: 'Safety distance insufficient for opening size',
  },

  // Opening size limits
  {
    id: 'finger_safe_openings',
    name: 'Finger-Safe Opening Size',
    description: 'Openings should prevent finger access (< 8mm) or be at safe distance',
    type: 'constraint',
    source: 'OSHA 1910.212(a)(2)',
    expression: {
      type: 'conditional',
      condition: 'opening_size > 8',
      then: { type: 'range', param: 'hazard_distance', min: 25 },
    },
    errorMessage: 'Large openings require greater safety distance',
  },

  // Minimum guard height
  {
    id: 'min_guard_height',
    name: 'Minimum Guard Height',
    description: 'Guards must be high enough to prevent reaching over',
    type: 'constraint',
    source: 'ISO 14120',
    expression: { type: 'range', param: 'height', min: 1400 },
    errorMessage: 'Guard height below 1400mm minimum for reaching over protection',
  },

  // Interlock requirement for movable guards
  {
    id: 'interlock_required',
    name: 'Interlock Required for Doors',
    description: 'Access doors must have safety interlocks',
    type: 'constraint',
    source: 'OSHA 1910.212',
    expression: {
      type: 'conditional',
      condition: 'has_door == true',
      then: { type: 'required-if', param: 'interlock_type', condition: 'interlock_type != "none"' },
    },
    errorMessage: 'Access doors require safety interlocks',
  },

  // Fixed guard tool requirement
  {
    id: 'fixed_guard_tools',
    name: 'Fixed Guard Removal',
    description: 'Fixed guards should only be removable with tools',
    type: 'recommendation',
    source: 'ISO 14120 5.2',
    expression: {
      type: 'conditional',
      condition: 'guard_type == "fixed"',
      then: { type: 'required-if', param: 'removable', condition: 'true' },
    },
    errorMessage: 'Fixed guards should require tools for removal',
  },

  // Mesh strength
  {
    id: 'mesh_strength',
    name: 'Mesh Structural Integrity',
    description: 'Mesh guards must withstand impact without creating openings',
    type: 'constraint',
    source: 'ISO 14120 5.8',
    expression: {
      type: 'conditional',
      condition: 'panel_type == "mesh" || panel_type == "wire-mesh"',
      then: { type: 'range', param: 'opening_size', max: 50 },
    },
    errorMessage: 'Mesh opening size exceeds maximum',
  },

  // Gap at floor
  {
    id: 'floor_gap',
    name: 'Maximum Floor Gap',
    description: 'Gap under guard must not allow access',
    type: 'constraint',
    source: 'ISO 14120',
    expression: { type: 'range', param: 'floor_gap', max: 180 },
    errorMessage: 'Floor gap exceeds 180mm maximum',
  },
];

// =============================================================================
// GUARD COMPONENTS
// =============================================================================

const guardComponents: ComponentDefinition[] = [
  // Frame posts
  {
    id: 'frame_post',
    name: 'Frame Post',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(width / 1000) + 1',
    parameters: [
      {
        id: 'post_height',
        name: 'Height',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Post height',
      },
    ],
  },

  // Frame rails (top and bottom)
  {
    id: 'frame_rail',
    name: 'Frame Rail',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: '2',  // Top and bottom
    parameters: [
      {
        id: 'rail_length',
        name: 'Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Rail length',
      },
    ],
  },

  // Guard panel
  {
    id: 'panel',
    name: 'Guard Panel',
    type: 'surface',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(width / 1000)',
    parameters: [
      {
        id: 'panel_width',
        name: 'Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Panel width',
      },
      {
        id: 'panel_height',
        name: 'Height',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Panel height',
      },
    ],
  },

  // Door (if applicable)
  {
    id: 'access_door',
    name: 'Access Door',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: 'has_door ? 1 : 0',
    parameters: [
      {
        id: 'door_width',
        name: 'Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Door width',
      },
    ],
  },

  // Hinges
  {
    id: 'hinge',
    name: 'Door Hinge',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'has_door ? 3 : 0',
    parameters: [],
  },

  // Interlock switch
  {
    id: 'interlock_switch',
    name: 'Safety Interlock',
    type: 'accessory',
    required: false,
    quantity: 'single',
    quantityFormula: 'has_door && interlock_type != "none" ? 1 : 0',
    parameters: [],
  },

  // Floor mounting feet
  {
    id: 'floor_mount',
    name: 'Floor Mount',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'mounting_type == "floor-mounted" ? Math.ceil(width / 1000) + 1 : 0',
    parameters: [],
  },

  // Fasteners
  {
    id: 'panel_fastener',
    name: 'Panel Fastener',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'num_panels * 8',
    parameters: [],
  },
];

// =============================================================================
// EXPORT GUARD ELEMENT
// =============================================================================

export const guardElement: ElementDefinition = {
  id: 'guard',
  name: 'Machine Guard',
  description: 'Safety guard for machinery and hazardous areas',
  connectionType: 'surface-mount',
  parameters: guardParameters,
  rules: guardRules,
  materials: ['aluminum', 'steel', 'polycarbonate', 'acrylic'],
  components: guardComponents,
};

// =============================================================================
// GUARD CALCULATOR
// =============================================================================

export interface GuardCalculationInput {
  width: number;           // mm
  height: number;          // mm
  guardType: 'fixed' | 'interlocked' | 'adjustable' | 'perimeter';
  panelType: 'mesh' | 'perforated' | 'solid' | 'polycarbonate';
  hazardDistance: number;  // mm
  openingSize?: number;    // mm (for mesh/perforated)
  hasDoor?: boolean;
  doorWidth?: number;      // mm
  frameProfile?: 'aluminum-extrusion' | 'steel-tube' | 'steel-angle';
  frameSize?: number;      // mm
}

export interface GuardCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Dimensions
  width: number;
  height: number;
  depth: number;

  // Safety
  safetyDistanceOk: boolean;
  requiredDistance: number;
  actualDistance: number;

  // Panels
  numPanels: number;
  panelWidth: number;
  panelHeight: number;

  // Frame
  numPosts: number;
  postLength: number;
  railLength: number;

  // Components
  components: {
    posts: number;
    rails: number;
    panels: number;
    doors: number;
    hinges: number;
    interlocks: number;
    floorMounts: number;
    fasteners: number;
  };

  // Weight estimate
  estimatedWeight: number;  // kg
}

/**
 * Calculate guard parameters
 */
export function calculateGuard(input: GuardCalculationInput): GuardCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const openingSize = input.openingSize || 25;
  const frameSize = input.frameSize || 40;

  // Calculate required safety distance based on opening size (ISO 13857 simplified)
  let requiredDistance = 0;
  if (openingSize <= 4) requiredDistance = 2;
  else if (openingSize <= 6) requiredDistance = 10;
  else if (openingSize <= 8) requiredDistance = 20;
  else if (openingSize <= 10) requiredDistance = 80;
  else if (openingSize <= 12) requiredDistance = 100;
  else if (openingSize <= 20) requiredDistance = 120;
  else if (openingSize <= 30) requiredDistance = 200;
  else if (openingSize <= 40) requiredDistance = 500;
  else requiredDistance = 850;

  const safetyDistanceOk = input.hazardDistance >= requiredDistance;
  if (!safetyDistanceOk) {
    errors.push(`Safety distance ${input.hazardDistance}mm insufficient. Need ${requiredDistance}mm for ${openingSize}mm openings`);
  }

  // Height check
  if (input.height < 1400) {
    warnings.push('Guard height below 1400mm - may allow reaching over');
  }

  // Calculate panels
  const maxPanelWidth = 1000;  // Standard panel width
  const numPanels = Math.ceil(input.width / maxPanelWidth);
  const panelWidth = input.width / numPanels;
  const panelHeight = input.height - frameSize * 2;

  // Calculate frame
  const numPosts = numPanels + 1;
  const postLength = input.height;
  const railLength = input.width;

  // Door components
  const hasDoor = input.hasDoor || false;
  const _doorWidth = input.doorWidth || 600; // Reserved for future door sizing
  void _doorWidth; // Suppress unused warning
  const numDoors = hasDoor ? 1 : 0;
  const numHinges = hasDoor ? 3 : 0;
  const numInterlocks = (hasDoor && input.guardType === 'interlocked') ? 1 : 0;

  // Floor mounts
  const numFloorMounts = numPosts;

  // Fasteners (8 per panel)
  const numFasteners = numPanels * 8;

  // Depth calculation
  const depth = frameSize + 10;  // Frame depth + panel

  // Weight estimate
  const frameWeight = (numPosts * postLength + 2 * railLength) / 1000 * 1.5;  // ~1.5 kg/m for aluminum
  let panelWeight = 0;
  if (input.panelType === 'mesh') {
    panelWeight = (panelWidth * panelHeight * numPanels) / 1e6 * 5;  // ~5 kg/m² for mesh
  } else if (input.panelType === 'polycarbonate') {
    panelWeight = (panelWidth * panelHeight * numPanels) / 1e6 * 8;  // ~8 kg/m² for 6mm PC
  } else if (input.panelType === 'solid') {
    panelWeight = (panelWidth * panelHeight * numPanels) / 1e6 * 25;  // ~25 kg/m² for steel
  }
  const estimatedWeight = frameWeight + panelWeight;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    width: input.width,
    height: input.height,
    depth,
    safetyDistanceOk,
    requiredDistance,
    actualDistance: input.hazardDistance,
    numPanels,
    panelWidth: Math.round(panelWidth),
    panelHeight: Math.round(panelHeight),
    numPosts,
    postLength,
    railLength,
    components: {
      posts: numPosts,
      rails: 2,
      panels: numPanels,
      doors: numDoors,
      hinges: numHinges,
      interlocks: numInterlocks,
      floorMounts: numFloorMounts,
      fasteners: numFasteners,
    },
    estimatedWeight: Math.round(estimatedWeight * 10) / 10,
  };
}

// =============================================================================
// SAFETY DISTANCE CALCULATOR (ISO 13857)
// =============================================================================

export interface SafetyDistanceInput {
  openingType: 'slot' | 'square' | 'circular';
  openingSize: number;      // mm (width for slot, side for square, diameter for circular)
  reachType: 'arm' | 'hand' | 'finger';
}

export interface SafetyDistanceResult {
  minimumDistance: number;  // mm
  source: string;
  notes: string;
}

/**
 * Calculate minimum safety distance per ISO 13857
 */
export function calculateSafetyDistance(input: SafetyDistanceInput): SafetyDistanceResult {
  // Simplified ISO 13857 Table 1 (slot openings, arm reach)
  const slotDistances: Record<number, number> = {
    4: 2, 6: 10, 8: 20, 10: 80, 12: 100, 20: 120, 30: 200, 40: 500, 120: 850,
  };

  // Find applicable distance
  let distance = 850;  // Default maximum
  for (const [size, dist] of Object.entries(slotDistances)) {
    if (input.openingSize <= parseInt(size)) {
      distance = dist;
      break;
    }
  }

  return {
    minimumDistance: distance,
    source: 'ISO 13857:2019 Table 1',
    notes: `For ${input.openingType} opening of ${input.openingSize}mm`,
  };
}
