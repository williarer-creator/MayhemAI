/**
 * Fencing Knowledge Definition
 *
 * Engineering knowledge for perimeter fencing and safety barrier systems.
 * Implements OSHA 1910.212, ISO 14120, ISO 13857 safety distances,
 * and modular fencing system standards.
 */

import type {
  ElementDefinition,
  Rule,
  ParameterDefinition,
  ComponentDefinition,
} from '../../types';

// =============================================================================
// FENCING PARAMETERS
// =============================================================================

const perimeterFenceParameters: ParameterDefinition[] = [
  // Layout
  {
    id: 'total_length',
    name: 'Total Fence Length',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 1000,
    description: 'Total perimeter length of fencing',
  },
  {
    id: 'height',
    name: 'Fence Height',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 1000,
    max: 2400,
    default: 2000,
    description: 'Height of fence panels',
  },
  {
    id: 'post_spacing',
    name: 'Post Spacing',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 500,
    max: 3000,
    default: 1000,
    description: 'Center-to-center distance between posts',
  },

  // Configuration
  {
    id: 'fence_type',
    name: 'Fence Type',
    type: 'select',
    options: ['welded-mesh', 'woven-wire', 'expanded-metal', 'perforated', 'solid'],
    default: 'welded-mesh',
    required: true,
    description: 'Type of fence panel construction',
  },
  {
    id: 'frame_type',
    name: 'Frame Type',
    type: 'select',
    options: ['aluminum-extrusion', 'steel-tube-square', 'steel-tube-round', 'steel-angle'],
    default: 'steel-tube-square',
    required: true,
    description: 'Post and frame construction',
  },
  {
    id: 'mounting_type',
    name: 'Mounting Type',
    type: 'select',
    options: ['floor-mounted', 'wall-mounted', 'free-standing', 'embedded'],
    default: 'floor-mounted',
    required: true,
    description: 'How the fence system is anchored',
  },

  // Safety
  {
    id: 'mesh_opening',
    name: 'Mesh Opening Size',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 6,
    max: 100,
    default: 25,
    description: 'Size of mesh openings (square)',
  },
  {
    id: 'safety_distance',
    name: 'Safety Distance',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 100,
    description: 'Distance from fence to hazard per ISO 13857',
  },
  {
    id: 'hazard_type',
    name: 'Hazard Type',
    type: 'select',
    options: ['rotating-machinery', 'crushing', 'shearing', 'impact', 'entanglement', 'projection'],
    default: 'rotating-machinery',
    required: true,
    description: 'Type of hazard being guarded',
  },

  // Gates
  {
    id: 'gate_count',
    name: 'Number of Gates',
    type: 'number',
    required: true,
    min: 0,
    default: 1,
    description: 'Number of access gates in perimeter',
  },
  {
    id: 'gate_width',
    name: 'Gate Width',
    type: 'number',
    unit: 'mm',
    required: false,
    min: 600,
    max: 4000,
    default: 1000,
    description: 'Width of each access gate',
  },
  {
    id: 'gate_type',
    name: 'Gate Type',
    type: 'select',
    options: ['single-swing', 'double-swing', 'sliding', 'bi-fold', 'vertical-lift'],
    default: 'single-swing',
    required: false,
    description: 'Type of gate operation',
  },

  // Interlock
  {
    id: 'interlocked',
    name: 'Safety Interlock',
    type: 'boolean',
    default: true,
    required: true,
    description: 'Whether gates have safety interlocks',
  },
  {
    id: 'interlock_type',
    name: 'Interlock Type',
    type: 'select',
    options: ['mechanical', 'magnetic', 'rfid', 'solenoid-locking', 'trapped-key'],
    default: 'magnetic',
    required: false,
    description: 'Type of safety interlock system',
  },

  // Finish
  {
    id: 'finish',
    name: 'Surface Finish',
    type: 'select',
    options: ['powder-coat', 'galvanized', 'painted', 'stainless', 'anodized'],
    default: 'powder-coat',
    required: true,
    description: 'Surface treatment for corrosion protection',
  },
  {
    id: 'color',
    name: 'Color',
    type: 'select',
    options: ['safety-yellow', 'safety-orange', 'black', 'gray', 'white', 'custom'],
    default: 'safety-yellow',
    required: false,
    description: 'Fence panel color',
  },
];

// =============================================================================
// FENCING RULES
// =============================================================================

const perimeterFenceRules: Rule[] = [
  // ISO 13857 Safety Distance Rules
  {
    id: 'iso-13857-safety-distance',
    name: 'ISO 13857 Safety Distance',
    type: 'constraint',
    source: 'ISO 13857',
    description: 'Minimum safety distance based on mesh opening size',
    expression: {
      type: 'formula',
      formula: 'calculated_safety_distance = getSafetyDistance(mesh_opening)',
      result: 'safety_distance >= calculated_safety_distance',
    },
    errorMessage: 'Safety distance does not meet ISO 13857 requirements for given opening size',
  },
  {
    id: 'iso-13857-opening-limit',
    name: 'ISO 13857 Maximum Opening',
    type: 'constraint',
    source: 'ISO 13857',
    description: 'Maximum mesh opening based on safety distance',
    expression: {
      type: 'conditional',
      condition: 'safety_distance < 850',
      then: {
        type: 'formula',
        formula: 'max_opening = getMaxOpening(safety_distance)',
        result: 'mesh_opening <= max_opening',
      },
    },
    errorMessage: 'Mesh opening too large for given safety distance',
  },

  // Height Requirements
  {
    id: 'min-fence-height',
    name: 'Minimum Fence Height',
    type: 'constraint',
    source: 'ISO 14120',
    description: 'Minimum height for perimeter guards',
    expression: {
      type: 'range',
      param: 'height',
      min: 1400,
    },
    errorMessage: 'Fence height must be at least 1400mm per ISO 14120',
  },
  {
    id: 'climbing-deterrent',
    name: 'Climbing Deterrent Height',
    type: 'recommendation',
    description: 'Height recommendation to deter climbing for high-risk hazards',
    expression: {
      type: 'range',
      param: 'height',
      min: 2000,
    },
    errorMessage: 'Consider 2000mm height to deter climbing for high-risk hazards',
  },

  // Post Spacing
  {
    id: 'max-post-spacing',
    name: 'Maximum Post Spacing',
    type: 'constraint',
    description: 'Maximum spacing between posts for rigidity',
    expression: {
      type: 'range',
      param: 'post_spacing',
      max: 1500,
    },
    errorMessage: 'Post spacing exceeds maximum for frame type',
  },
  {
    id: 'min-post-spacing',
    name: 'Minimum Post Spacing',
    type: 'constraint',
    description: 'Minimum spacing for efficient material use',
    expression: {
      type: 'range',
      param: 'post_spacing',
      min: 500,
    },
    errorMessage: 'Post spacing too small, wasteful material use',
  },

  // Gate Rules
  {
    id: 'gate-interlock-required',
    name: 'Gate Interlock Required',
    type: 'constraint',
    source: 'ISO 14119',
    description: 'Gates must have safety interlocks for hazardous machinery',
    expression: {
      type: 'required-if',
      param: 'interlocked',
      condition: 'gate_count > 0',
    },
    errorMessage: 'Gates accessing hazardous machinery must have safety interlocks',
  },
  {
    id: 'gate-min-width',
    name: 'Minimum Gate Width',
    type: 'constraint',
    description: 'Minimum gate width for personnel access',
    expression: {
      type: 'range',
      param: 'gate_width',
      min: 600,
    },
    errorMessage: 'Gate width must be at least 600mm for personnel access',
  },

  // Mesh Opening Limits (ISO 13857 Table 1)
  {
    id: 'finger-access-prevention',
    name: 'Finger Access Prevention',
    type: 'constraint',
    source: 'ISO 13857',
    description: 'Prevent finger access to hazard zone when safety distance < 120mm',
    expression: {
      type: 'conditional',
      condition: 'safety_distance < 120',
      then: {
        type: 'range',
        param: 'mesh_opening',
        max: 8,
      },
    },
    errorMessage: 'Mesh opening must be ≤8mm to prevent finger access at this distance',
  },
  {
    id: 'hand-access-prevention',
    name: 'Hand Access Prevention',
    type: 'constraint',
    source: 'ISO 13857',
    description: 'Prevent hand access to hazard zone when safety distance 120-200mm',
    expression: {
      type: 'conditional',
      condition: 'safety_distance >= 120 && safety_distance < 200',
      then: {
        type: 'range',
        param: 'mesh_opening',
        max: 25,
      },
    },
    errorMessage: 'Mesh opening must be ≤25mm to prevent hand access at this distance',
  },
  {
    id: 'arm-access-prevention',
    name: 'Arm Access Prevention',
    type: 'constraint',
    source: 'ISO 13857',
    description: 'Prevent arm access to hazard zone when safety distance 200-850mm',
    expression: {
      type: 'conditional',
      condition: 'safety_distance >= 200 && safety_distance < 850',
      then: {
        type: 'range',
        param: 'mesh_opening',
        max: 40,
      },
    },
    errorMessage: 'Mesh opening must be ≤40mm to prevent arm access at this distance',
  },
];

// =============================================================================
// FENCING COMPONENTS
// =============================================================================

const perimeterFenceComponents: ComponentDefinition[] = [
  // Posts
  {
    id: 'fence-post',
    name: 'Fence Post',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / post_spacing) + 1',
    parameters: [],
  },
  {
    id: 'corner-post',
    name: 'Corner Post',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'corner_count',
    parameters: [],
  },
  {
    id: 'gate-post',
    name: 'Gate Post',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'gate_count * 2',
    parameters: [],
  },

  // Panels
  {
    id: 'mesh-panel',
    name: 'Mesh Panel',
    type: 'surface',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / post_spacing)',
    parameters: [],
  },
  {
    id: 'panel-frame',
    name: 'Panel Frame',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil(total_length / post_spacing)',
    parameters: [],
  },

  // Gates
  {
    id: 'gate-panel',
    name: 'Gate Panel',
    type: 'surface',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'gate_count',
    parameters: [],
  },
  {
    id: 'gate-frame',
    name: 'Gate Frame',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'gate_count',
    parameters: [],
  },
  {
    id: 'gate-hinge',
    name: 'Gate Hinge',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'gate_count * (height > 1500 ? 3 : 2)',
    parameters: [],
  },
  {
    id: 'gate-latch',
    name: 'Gate Latch',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'gate_count',
    parameters: [],
  },

  // Safety Interlocks
  {
    id: 'safety-interlock',
    name: 'Safety Interlock Switch',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'interlocked ? gate_count : 0',
    parameters: [],
  },
  {
    id: 'interlock-actuator',
    name: 'Interlock Actuator',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'interlocked ? gate_count : 0',
    parameters: [],
  },

  // Mounting Hardware
  {
    id: 'post-base-plate',
    name: 'Post Base Plate',
    type: 'connector',
    required: false,
    quantity: 'calculated',
    quantityFormula: '(mounting_type == "floor-mounted" || mounting_type == "free-standing") ? total_posts : 0',
    parameters: [],
  },
  {
    id: 'anchor-bolt',
    name: 'Anchor Bolt',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'mounting_type == "floor-mounted" ? total_posts * 4 : 0',
    parameters: [],
  },
  {
    id: 'panel-bracket',
    name: 'Panel Mounting Bracket',
    type: 'connector',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'panel_count * 4',
    parameters: [],
  },
  {
    id: 'panel-fastener',
    name: 'Panel Fastener',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'panel_count * 8',
    parameters: [],
  },

  // Accessories
  {
    id: 'toe-board',
    name: 'Toe Board',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'requires_toe_board ? panel_count : 0',
    parameters: [],
  },
  {
    id: 'warning-sign',
    name: 'Warning Sign',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.max(1, Math.ceil(total_length / 5000))',
    parameters: [],
  },
];

// =============================================================================
// PERIMETER FENCE ELEMENT DEFINITION
// =============================================================================

export const perimeterFenceElement: ElementDefinition = {
  id: 'perimeter-fence',
  name: 'Perimeter Safety Fence',
  connectionType: 'surface-mount',
  description:
    'Modular perimeter fencing system for machine guarding and area protection. ' +
    'Configurable mesh panels, posts, and interlocked gates per ISO 14120/13857.',

  parameters: perimeterFenceParameters,
  rules: perimeterFenceRules,
  components: perimeterFenceComponents,
  materials: ['steel', 'aluminum', 'stainless'],
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * ISO 13857 Table 1 - Safety distances for regular openings (square/round)
 * Returns minimum safety distance for given opening size
 */
export function getMinSafetyDistance(openingSize: number): number {
  // ISO 13857 Table 1 - Reaching through regular openings
  if (openingSize <= 4) return 2;
  if (openingSize <= 6) return 10;
  if (openingSize <= 8) return 20;
  if (openingSize <= 10) return 80;
  if (openingSize <= 12) return 100;
  if (openingSize <= 20) return 120;
  if (openingSize <= 30) return 200;
  if (openingSize <= 40) return 200;
  if (openingSize <= 50) return 500;
  if (openingSize <= 65) return 550;
  if (openingSize <= 100) return 850;
  if (openingSize <= 120) return 850;
  return 1100;
}

/**
 * Get maximum opening size for given safety distance
 */
export function getMaxOpeningSize(safetyDistance: number): number {
  if (safetyDistance < 2) return 0;
  if (safetyDistance < 10) return 4;
  if (safetyDistance < 20) return 6;
  if (safetyDistance < 80) return 8;
  if (safetyDistance < 100) return 10;
  if (safetyDistance < 120) return 12;
  if (safetyDistance < 200) return 20;
  if (safetyDistance < 500) return 40;
  if (safetyDistance < 550) return 50;
  if (safetyDistance < 850) return 65;
  if (safetyDistance < 1100) return 120;
  return 150;
}

/**
 * Post sizing based on height and loading
 */
export interface PostSizeResult {
  profileSize: number;
  wallThickness: number;
  basePlateSize: number;
  basePlateThickness: number;
}

export function calculatePostSize(
  height: number,
  postSpacing: number,
  isGatePost: boolean = false,
  isCornerPost: boolean = false
): PostSizeResult {
  let profileSize: number;
  let wallThickness: number;

  if (height <= 1200) {
    profileSize = 40;
    wallThickness = 2;
  } else if (height <= 1800) {
    profileSize = 50;
    wallThickness = 2.5;
  } else if (height <= 2100) {
    profileSize = 60;
    wallThickness = 3;
  } else {
    profileSize = 80;
    wallThickness = 3;
  }

  if (isGatePost) {
    profileSize = Math.max(profileSize, 60);
    wallThickness = Math.max(wallThickness, 3);
  }

  if (isCornerPost) {
    profileSize += 10;
  }

  if (postSpacing > 1200) {
    profileSize += 10;
  }

  const basePlateSize = profileSize * 3;
  const basePlateThickness = profileSize >= 60 ? 8 : 6;

  return { profileSize, wallThickness, basePlateSize, basePlateThickness };
}

/**
 * Calculate fence panel mesh specifications
 */
export interface MeshSpecResult {
  wireGauge: number;
  wireDiameter: number;
  meshOpening: number;
  weight: number;
}

export function calculateMeshSpec(
  targetOpening: number,
  fenceHeight: number,
  isGatePanel: boolean = false
): MeshSpecResult {
  let wireGauge: number;
  let wireDiameter: number;

  if (targetOpening <= 12) {
    wireGauge = fenceHeight > 1800 ? 10 : 11;
    wireDiameter = wireGauge === 10 ? 3.4 : 3.0;
  } else if (targetOpening <= 25) {
    wireGauge = fenceHeight > 1800 ? 8 : 10;
    wireDiameter = wireGauge === 8 ? 4.2 : 3.4;
  } else if (targetOpening <= 50) {
    wireGauge = fenceHeight > 2000 ? 6 : 8;
    wireDiameter = wireGauge === 6 ? 5.2 : 4.2;
  } else {
    wireGauge = 6;
    wireDiameter = 5.2;
  }

  if (isGatePanel && wireGauge > 8) {
    wireGauge -= 2;
    wireDiameter = wireGauge === 8 ? 4.2 : wireGauge === 6 ? 5.2 : wireDiameter;
  }

  const meshOpening = targetOpening - wireDiameter;
  const wiresPerMeter = 1000 / (targetOpening + wireDiameter);
  const wireLength = wiresPerMeter * 2;
  const wireVolume = Math.PI * Math.pow(wireDiameter / 2, 2) * wireLength;
  const weight = (wireVolume / 1000000) * 7850;

  return {
    wireGauge,
    wireDiameter,
    meshOpening,
    weight: Math.round(weight * 100) / 100,
  };
}

/**
 * Complete fence layout calculation
 */
export interface FenceLayoutInput {
  totalLength: number;
  height: number;
  postSpacing: number;
  meshOpening: number;
  safetyDistance: number;
  gateCount: number;
  gateWidth: number;
  gateType: 'single-swing' | 'double-swing' | 'sliding' | 'bi-fold' | 'vertical-lift';
  interlocked: boolean;
  mountingType: 'floor-mounted' | 'wall-mounted' | 'free-standing' | 'embedded';
  frameType: 'aluminum-extrusion' | 'steel-tube-square' | 'steel-tube-round' | 'steel-angle';
  corners?: number;
}

export interface FenceLayoutResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  postCount: number;
  cornerPostCount: number;
  gatePostCount: number;
  panelCount: number;
  gatePanelCount: number;
  standardPostSize: PostSizeResult;
  gatePostSize: PostSizeResult;
  meshSpec: MeshSpecResult;
  standardPanelWidth: number;
  standardPanelHeight: number;
  fillerPanelWidth: number | null;
  totalMeshArea: number;
  totalFrameLength: number;
  totalPostLength: number;
  estimatedWeight: number;
}

export function calculateFenceLayout(input: FenceLayoutInput): FenceLayoutResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const minSafetyDist = getMinSafetyDistance(input.meshOpening);
  if (input.safetyDistance < minSafetyDist) {
    errors.push(
      `Safety distance ${input.safetyDistance}mm is less than required ${minSafetyDist}mm for ${input.meshOpening}mm opening`
    );
  }

  if (input.height < 1400) {
    errors.push('Fence height must be at least 1400mm per ISO 14120');
  } else if (input.height < 1800) {
    warnings.push('Consider 1800mm+ height for improved security');
  }

  const totalGateWidth = input.gateCount * input.gateWidth;
  const fenceLength = input.totalLength - totalGateWidth;

  if (fenceLength <= 0) {
    errors.push('Gate widths exceed total fence length');
  }

  const fullPanels = Math.floor(fenceLength / input.postSpacing);
  const remainder = fenceLength % input.postSpacing;
  const needFillerPanel = remainder > 100;

  const panelCount = needFillerPanel ? fullPanels + 1 : fullPanels;
  const fillerPanelWidth = needFillerPanel ? remainder : null;

  const cornerCount = input.corners || 0;
  const gatePostCount = input.gateCount * 2;
  const postCount = panelCount + 1 - gatePostCount;

  const standardPostSize = calculatePostSize(input.height, input.postSpacing, false, false);
  const gatePostSize = calculatePostSize(input.height, input.postSpacing, true, false);
  const meshSpec = calculateMeshSpec(input.meshOpening, input.height, false);

  const standardPanelWidth = input.postSpacing;
  const standardPanelHeight = input.height - 50;

  const meshArea =
    ((panelCount - (needFillerPanel ? 1 : 0)) * standardPanelWidth * standardPanelHeight +
      (fillerPanelWidth || 0) * standardPanelHeight +
      input.gateCount * input.gateWidth * standardPanelHeight) /
    1000000;

  const frameLength =
    (panelCount * (2 * standardPanelWidth + 2 * standardPanelHeight) +
      input.gateCount * (2 * input.gateWidth + 2 * standardPanelHeight)) /
    1000;

  const postLength =
    ((postCount + cornerCount + gatePostCount) * (input.height + 200)) / 1000;

  const meshWeight = meshArea * meshSpec.weight;
  const frameWeight = frameLength * 2.5;
  const postWeight = postLength * 4.0;
  const estimatedWeight = Math.round(meshWeight + frameWeight + postWeight);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    postCount,
    cornerPostCount: cornerCount,
    gatePostCount,
    panelCount,
    gatePanelCount: input.gateCount,
    standardPostSize,
    gatePostSize,
    meshSpec,
    standardPanelWidth,
    standardPanelHeight,
    fillerPanelWidth,
    totalMeshArea: Math.round(meshArea * 100) / 100,
    totalFrameLength: Math.round(frameLength * 100) / 100,
    totalPostLength: Math.round(postLength * 100) / 100,
    estimatedWeight,
  };
}

/**
 * Generate fence component list for BOM
 */
export interface FenceComponent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  material: string;
  dimensions: string;
  notes: string;
}

export function generateFenceBOM(
  layout: FenceLayoutResult,
  input: FenceLayoutInput
): FenceComponent[] {
  const components: FenceComponent[] = [];

  if (layout.postCount > 0) {
    components.push({
      id: 'POST-STD',
      name: 'Standard Post',
      quantity: layout.postCount,
      unit: 'ea',
      material: input.frameType === 'aluminum-extrusion' ? 'Aluminum 6063-T5' : 'Steel S235',
      dimensions: `${layout.standardPostSize.profileSize}x${layout.standardPostSize.profileSize}x${layout.standardPostSize.wallThickness} x ${input.height + 200}mm`,
      notes: 'Floor plate welded to bottom',
    });
  }

  if (layout.cornerPostCount > 0) {
    const cornerSize = layout.standardPostSize.profileSize + 10;
    components.push({
      id: 'POST-CRN',
      name: 'Corner Post',
      quantity: layout.cornerPostCount,
      unit: 'ea',
      material: input.frameType === 'aluminum-extrusion' ? 'Aluminum 6063-T5' : 'Steel S235',
      dimensions: `${cornerSize}x${cornerSize}x${layout.standardPostSize.wallThickness} x ${input.height + 200}mm`,
      notes: 'Reinforced corner post',
    });
  }

  if (layout.gatePostCount > 0) {
    components.push({
      id: 'POST-GATE',
      name: 'Gate Post',
      quantity: layout.gatePostCount,
      unit: 'ea',
      material: 'Steel S275',
      dimensions: `${layout.gatePostSize.profileSize}x${layout.gatePostSize.profileSize}x${layout.gatePostSize.wallThickness} x ${input.height + 200}mm`,
      notes: 'Heavy-duty gate support post',
    });
  }

  const fullPanelCount = layout.fillerPanelWidth ? layout.panelCount - 1 : layout.panelCount;
  if (fullPanelCount > 0) {
    components.push({
      id: 'PANEL-STD',
      name: 'Standard Mesh Panel',
      quantity: fullPanelCount,
      unit: 'ea',
      material: 'Steel welded mesh',
      dimensions: `${layout.standardPanelWidth}x${layout.standardPanelHeight}mm, ${input.meshOpening}mm mesh`,
      notes: `${layout.meshSpec.wireDiameter}mm wire, ${layout.meshSpec.weight}kg/m²`,
    });
  }

  if (layout.fillerPanelWidth) {
    components.push({
      id: 'PANEL-FILL',
      name: 'Filler Mesh Panel',
      quantity: 1,
      unit: 'ea',
      material: 'Steel welded mesh',
      dimensions: `${layout.fillerPanelWidth}x${layout.standardPanelHeight}mm, ${input.meshOpening}mm mesh`,
      notes: 'Cut to fit remaining gap',
    });
  }

  if (layout.gatePanelCount > 0) {
    components.push({
      id: 'GATE-PANEL',
      name: 'Gate Panel Assembly',
      quantity: layout.gatePanelCount,
      unit: 'ea',
      material: 'Steel welded mesh + frame',
      dimensions: `${input.gateWidth}x${layout.standardPanelHeight}mm`,
      notes: `${input.gateType} type`,
    });

    components.push({
      id: 'HINGE-HD',
      name: 'Heavy-Duty Gate Hinge',
      quantity: layout.gatePanelCount * (input.height > 1500 ? 3 : 2),
      unit: 'ea',
      material: 'Steel zinc plated',
      dimensions: 'M12 pin, 100mm leaf',
      notes: 'Adjustable hinges',
    });

    components.push({
      id: 'LATCH',
      name: 'Gate Latch',
      quantity: layout.gatePanelCount,
      unit: 'ea',
      material: 'Steel zinc plated',
      dimensions: 'Standard industrial latch',
      notes: input.interlocked ? 'Interlock compatible' : 'Standard latch',
    });
  }

  if (input.interlocked && layout.gatePanelCount > 0) {
    components.push({
      id: 'INTERLOCK',
      name: 'Safety Interlock Switch',
      quantity: layout.gatePanelCount,
      unit: 'ea',
      material: 'Various',
      dimensions: 'Category 3/PLd rated',
      notes: 'With door monitoring contacts',
    });

    components.push({
      id: 'ACTUATOR',
      name: 'Interlock Actuator',
      quantity: layout.gatePanelCount,
      unit: 'ea',
      material: 'Stainless steel',
      dimensions: 'Coded actuator',
      notes: 'Matches interlock switch',
    });
  }

  if (input.mountingType === 'floor-mounted') {
    const anchorCount = (layout.postCount + layout.cornerPostCount + layout.gatePostCount) * 4;
    components.push({
      id: 'ANCHOR',
      name: 'Concrete Anchor Bolt',
      quantity: anchorCount,
      unit: 'ea',
      material: 'Steel zinc plated',
      dimensions: input.height > 1800 ? 'M12x100' : 'M10x80',
      notes: 'Wedge anchor type',
    });
  }

  const bracketCount = layout.panelCount * 4 + layout.gatePanelCount * 4;
  components.push({
    id: 'BRACKET',
    name: 'Panel Mounting Bracket',
    quantity: bracketCount,
    unit: 'ea',
    material: 'Steel zinc plated',
    dimensions: '50x50x5mm angle',
    notes: 'Pre-drilled',
  });

  const fastenerCount = bracketCount * 2;
  components.push({
    id: 'FASTENER',
    name: 'Panel Fastener Set',
    quantity: fastenerCount,
    unit: 'set',
    material: 'Steel zinc plated',
    dimensions: 'M8x20 hex bolt + nut + washer',
    notes: 'Security head optional',
  });

  const signCount = Math.max(1, Math.ceil(input.totalLength / 5000));
  components.push({
    id: 'SIGN',
    name: 'Warning Sign',
    quantity: signCount,
    unit: 'ea',
    material: 'Aluminum',
    dimensions: '200x300mm',
    notes: '"DANGER - Moving Machinery"',
  });

  return components;
}

// =============================================================================
// GATE ELEMENT DEFINITION
// =============================================================================

const gateParameters: ParameterDefinition[] = [
  {
    id: 'width',
    name: 'Gate Width',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 600,
    max: 4000,
    default: 1000,
    description: 'Clear opening width',
  },
  {
    id: 'height',
    name: 'Gate Height',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 1000,
    max: 2400,
    default: 2000,
    description: 'Gate panel height',
  },
  {
    id: 'gate_type',
    name: 'Gate Type',
    type: 'select',
    options: ['single-swing', 'double-swing', 'sliding', 'bi-fold', 'vertical-lift'],
    default: 'single-swing',
    required: true,
    description: 'Gate operation type',
  },
  {
    id: 'swing_direction',
    name: 'Swing Direction',
    type: 'select',
    options: ['inward', 'outward', 'both', 'left', 'right'],
    default: 'outward',
    required: false,
    description: 'Direction of gate swing',
  },
  {
    id: 'mesh_opening',
    name: 'Mesh Opening Size',
    type: 'number',
    unit: 'mm',
    required: true,
    min: 6,
    max: 100,
    default: 25,
    description: 'Size of mesh openings',
  },
  {
    id: 'interlocked',
    name: 'Safety Interlock',
    type: 'boolean',
    default: true,
    required: true,
    description: 'Gate has safety interlock',
  },
  {
    id: 'interlock_type',
    name: 'Interlock Type',
    type: 'select',
    options: ['mechanical', 'magnetic', 'rfid', 'solenoid-locking', 'trapped-key'],
    default: 'magnetic',
    required: false,
    description: 'Type of interlock mechanism',
  },
  {
    id: 'self_closing',
    name: 'Self-Closing',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Gate has self-closing mechanism',
  },
  {
    id: 'panic_release',
    name: 'Panic Release',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Inside panic release mechanism',
  },
];

const gateRules: Rule[] = [
  {
    id: 'gate-interlock-pld',
    name: 'Interlock Performance Level',
    type: 'recommendation',
    source: 'ISO 14119',
    description: 'Interlock must meet required performance level PLd / Category 3',
    expression: {
      type: 'required-if',
      param: 'interlocked',
      condition: 'true',
    },
    errorMessage: 'Interlock system must meet minimum PLd / Category 3',
  },
  {
    id: 'swing-gate-clearance',
    name: 'Swing Gate Clearance',
    type: 'calculation',
    description: 'Required clearance for swing gate operation',
    expression: {
      type: 'formula',
      formula: 'swing_clearance = width + 100',
      result: 'swing_clearance',
    },
  },
  {
    id: 'sliding-gate-rail',
    name: 'Sliding Gate Rail Length',
    type: 'calculation',
    description: 'Required rail length for sliding gate',
    expression: {
      type: 'conditional',
      condition: 'gate_type == "sliding"',
      then: {
        type: 'formula',
        formula: 'rail_length = width * 2 + 300',
        result: 'rail_length',
      },
    },
  },
  {
    id: 'double-swing-width',
    name: 'Double Swing Minimum Width',
    type: 'constraint',
    description: 'Minimum width for double swing gates',
    expression: {
      type: 'conditional',
      condition: 'gate_type == "double-swing"',
      then: {
        type: 'range',
        param: 'width',
        min: 1200,
      },
    },
    errorMessage: 'Double swing gates require minimum 1200mm width',
  },
];

const gateComponents: ComponentDefinition[] = [
  {
    id: 'gate-frame',
    name: 'Gate Frame',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'gate-mesh',
    name: 'Gate Mesh Panel',
    type: 'surface',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'hinge-set',
    name: 'Hinge Set',
    type: 'accessory',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'height > 1500 ? 3 : 2',
    parameters: [],
  },
  {
    id: 'latch-assembly',
    name: 'Latch Assembly',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'interlock-switch',
    name: 'Safety Interlock Switch',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'interlocked ? 1 : 0',
    parameters: [],
  },
  {
    id: 'closer',
    name: 'Gate Closer',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'self_closing ? 1 : 0',
    parameters: [],
  },
  {
    id: 'panic-hardware',
    name: 'Panic Release Hardware',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'panic_release ? 1 : 0',
    parameters: [],
  },
];

export const safetyGateElement: ElementDefinition = {
  id: 'safety-gate',
  name: 'Safety Access Gate',
  connectionType: 'surface-mount',
  description:
    'Interlocked access gate for perimeter fencing systems. ' +
    'Swing, sliding, or bi-fold configurations with safety interlock options per ISO 14119.',

  parameters: gateParameters,
  rules: gateRules,
  components: gateComponents,
  materials: ['steel', 'aluminum', 'stainless'],
};

// =============================================================================
// SAFETY INTERLOCK ELEMENT DEFINITION
// =============================================================================

const interlockParameters: ParameterDefinition[] = [
  {
    id: 'interlock_type',
    name: 'Interlock Type',
    type: 'select',
    options: ['mechanical', 'magnetic-coded', 'magnetic-standard', 'rfid', 'solenoid', 'trapped-key'],
    default: 'magnetic-coded',
    required: true,
    description: 'Type of safety interlock',
  },
  {
    id: 'performance_level',
    name: 'Performance Level',
    type: 'select',
    options: ['PLa', 'PLb', 'PLc', 'PLd', 'PLe'],
    default: 'PLd',
    required: true,
    description: 'Required performance level per ISO 13849',
  },
  {
    id: 'category',
    name: 'Safety Category',
    type: 'select',
    options: ['B', '1', '2', '3', '4'],
    default: '3',
    required: true,
    description: 'Safety category per ISO 13849',
  },
  {
    id: 'locking',
    name: 'Guard Locking',
    type: 'boolean',
    default: false,
    required: true,
    description: 'Interlock includes guard locking function',
  },
  {
    id: 'escape_release',
    name: 'Escape Release',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Internal escape release mechanism',
  },
  {
    id: 'contacts_nc',
    name: 'NC Contacts',
    type: 'number',
    required: true,
    min: 1,
    max: 4,
    default: 2,
    description: 'Number of normally closed safety contacts',
  },
  {
    id: 'contacts_no',
    name: 'NO Contacts',
    type: 'number',
    required: false,
    min: 0,
    max: 2,
    default: 1,
    description: 'Number of normally open auxiliary contacts',
  },
  {
    id: 'actuator_type',
    name: 'Actuator Type',
    type: 'select',
    options: ['standard', 'flexible', 'coded', 'unique-coded', 'rotating'],
    default: 'coded',
    required: true,
    description: 'Type of interlock actuator',
  },
  {
    id: 'ip_rating',
    name: 'IP Rating',
    type: 'select',
    options: ['IP65', 'IP66', 'IP67', 'IP69K'],
    default: 'IP67',
    required: true,
    description: 'Ingress protection rating',
  },
];

const interlockRules: Rule[] = [
  {
    id: 'category-contact-redundancy',
    name: 'Category 3/4 Contact Redundancy',
    type: 'constraint',
    source: 'ISO 13849',
    description: 'Categories 3 and 4 require redundant contacts',
    expression: {
      type: 'conditional',
      condition: 'category == "3" || category == "4"',
      then: {
        type: 'range',
        param: 'contacts_nc',
        min: 2,
      },
    },
    errorMessage: 'Category 3/4 requires minimum 2 NC contacts for redundancy',
  },
  {
    id: 'ple-coding',
    name: 'PLe Coded Actuator',
    type: 'constraint',
    source: 'ISO 14119',
    description: 'PLe applications require coded or unique-coded actuators',
    expression: {
      type: 'conditional',
      condition: 'performance_level == "PLe"',
      then: {
        type: 'required-if',
        param: 'actuator_type',
        condition: 'actuator_type == "coded" || actuator_type == "unique-coded"',
      },
    },
    errorMessage: 'PLe requires coded or unique-coded actuator to prevent defeat',
  },
];

const interlockComponents: ComponentDefinition[] = [
  {
    id: 'interlock-switch',
    name: 'Interlock Switch',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'actuator',
    name: 'Actuator',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'solenoid',
    name: 'Solenoid Coil',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'locking ? 1 : 0',
    parameters: [],
  },
  {
    id: 'escape-module',
    name: 'Escape Release Module',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'escape_release ? 1 : 0',
    parameters: [],
  },
  {
    id: 'mounting-bracket',
    name: 'Mounting Bracket',
    type: 'connector',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'cable-gland',
    name: 'Cable Gland',
    type: 'fastener',
    required: true,
    quantity: 'single',
    parameters: [],
  },
];

export const safetyInterlockElement: ElementDefinition = {
  id: 'safety-interlock',
  name: 'Safety Interlock Switch',
  connectionType: 'surface-mount',
  description:
    'Safety interlock switch for guarded access points. ' +
    'Various technologies (magnetic, mechanical, RFID) with optional guard locking per ISO 14119.',

  parameters: interlockParameters,
  rules: interlockRules,
  components: interlockComponents,
  materials: ['plastic', 'metal', 'stainless'],
};
