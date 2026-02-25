/**
 * ENCLOSURE Domain - Access Panels and Doors
 *
 * Elements for equipment access:
 * - Access panels (hinged, removable, sliding)
 * - Access doors (single, double, roll-up)
 * - Windows and viewports
 * - Louvers and vents
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// ACCESS PANEL PARAMETERS
// ============================================================================

const accessPanelParameters: ParameterDefinition[] = [
  {
    id: 'panel_type',
    name: 'Panel Type',
    type: 'select',
    options: ['hinged', 'removable', 'sliding', 'lift-off', 'quick-release', 'flush-mount'],
    default: 'hinged',
    required: true,
    description: 'Type of access panel',
  },
  {
    id: 'width',
    name: 'Panel Width',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 2000,
    default: 400,
    required: true,
    description: 'Clear opening width',
  },
  {
    id: 'height',
    name: 'Panel Height',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 2000,
    default: 400,
    required: true,
    description: 'Clear opening height',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['steel', 'stainless-304', 'stainless-316', 'aluminum', 'galvanized'],
    default: 'steel',
    required: true,
    description: 'Panel material',
  },
  {
    id: 'thickness',
    name: 'Material Thickness',
    type: 'number',
    unit: 'mm',
    min: 0.8,
    max: 6,
    default: 1.5,
    required: true,
    description: 'Sheet metal gauge',
  },
  {
    id: 'frame_type',
    name: 'Frame Type',
    type: 'select',
    options: ['flange-mount', 'surface-mount', 'recessed', 'frameless', 'exposed-flange'],
    default: 'flange-mount',
    required: true,
    description: 'Frame mounting style',
  },
  {
    id: 'frame_width',
    name: 'Frame Flange Width',
    type: 'number',
    unit: 'mm',
    min: 15,
    max: 50,
    default: 25,
    required: false,
    description: 'Width of mounting flange',
  },
  {
    id: 'hinge_side',
    name: 'Hinge Side',
    type: 'select',
    options: ['left', 'right', 'top', 'bottom'],
    default: 'left',
    required: false,
    description: 'Side for hinges (hinged panels)',
  },
  {
    id: 'hinge_type',
    name: 'Hinge Type',
    type: 'select',
    options: ['piano', 'butt', 'concealed', 'spring-loaded', 'lift-off'],
    default: 'piano',
    required: false,
    description: 'Hinge mechanism type',
  },
  {
    id: 'latch_type',
    name: 'Latch Type',
    type: 'select',
    options: ['none', 'quarter-turn', 'cam-lock', 'push-button', 'magnetic', 'slam-latch', 'multi-point'],
    default: 'quarter-turn',
    required: true,
    description: 'Closure mechanism',
  },
  {
    id: 'latch_count',
    name: 'Number of Latches',
    type: 'number',
    unit: 'mm', // proxy for count
    min: 1,
    max: 8,
    default: 2,
    required: false,
    description: 'Number of closure points',
  },
  {
    id: 'seal_type',
    name: 'Seal Type',
    type: 'select',
    options: ['none', 'foam', 'rubber', 'silicone', 'neoprene', 'epdm'],
    default: 'foam',
    required: false,
    description: 'Weather/dust seal material',
  },
  {
    id: 'ip_rating',
    name: 'IP Rating',
    type: 'select',
    options: ['none', 'IP20', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'],
    default: 'IP54',
    required: false,
    description: 'Ingress protection rating',
  },
  {
    id: 'fire_rating',
    name: 'Fire Rating',
    type: 'select',
    options: ['none', '30-min', '60-min', '90-min', '120-min'],
    default: 'none',
    required: false,
    description: 'Fire resistance rating',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'painted', 'powder-coated', 'galvanized', 'anodized', 'primed'],
    default: 'powder-coated',
    required: false,
    description: 'Surface treatment',
  },
  {
    id: 'color',
    name: 'Color',
    type: 'string',
    default: 'RAL7035',
    required: false,
    description: 'Color code (RAL/custom)',
  },
  {
    id: 'insulated',
    name: 'Insulated',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Thermal insulation filled',
  },
  {
    id: 'has_handle',
    name: 'Has Handle',
    type: 'boolean',
    default: false,
    required: false,
    description: 'External pull handle',
  },
];

// ============================================================================
// ACCESS PANEL RULES
// ============================================================================

const accessPanelRules: Rule[] = [
  {
    id: 'min_thickness',
    name: 'Minimum Thickness',
    description: 'Panel thickness based on size',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: {
      type: 'conditional',
      condition: 'width > 600 || height > 600',
      then: { type: 'range', param: 'thickness', min: 1.5 },
    },
    errorMessage: 'Panel thickness insufficient for size',
  },
  {
    id: 'latch_spacing',
    name: 'Latch Spacing',
    description: 'Multiple latches required for large panels',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: {
      type: 'conditional',
      condition: 'width > 800 || height > 800',
      then: { type: 'range', param: 'latch_count', min: 3 },
    },
    errorMessage: 'Large panels require additional latches',
  },
  {
    id: 'seal_for_ip',
    name: 'Seal Required for IP Rating',
    description: 'IP54+ requires proper sealing',
    type: 'constraint',
    source: 'IEC 60529',
    expression: {
      type: 'conditional',
      condition: 'ip_rating >= "IP54"',
      then: { type: 'required-if', param: 'seal_type', condition: 'seal_type != "none"' },
    },
    errorMessage: 'IP54+ requires gasket seal',
  },
  {
    id: 'fire_rated_seal',
    name: 'Fire Rated Seal',
    description: 'Fire rated panels need intumescent seal',
    type: 'constraint',
    source: 'Fire Safety Standards',
    expression: {
      type: 'conditional',
      condition: 'fire_rating != "none"',
      then: { type: 'range', param: 'thickness', min: 1.2 },
    },
    errorMessage: 'Fire rated panels need specific construction',
  },
  {
    id: 'reinforcement',
    name: 'Panel Reinforcement',
    description: 'Large panels need internal stiffeners',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: {
      type: 'conditional',
      condition: 'width > 1000 || height > 1000',
      then: { type: 'range', param: 'thickness', min: 2.0 },
    },
    errorMessage: 'Consider internal reinforcement ribs',
  },
];

// ============================================================================
// ACCESS PANEL COMPONENTS
// ============================================================================

const accessPanelComponents: ComponentDefinition[] = [
  {
    id: 'panel_face',
    name: 'Panel Face',
    type: 'surface',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'panel_dims',
        name: 'Panel Dimensions',
        type: 'string',
        required: true,
        description: 'W x H x t',
      },
    ],
  },
  {
    id: 'frame',
    name: 'Mounting Frame',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'frame_dims',
        name: 'Frame Dimensions',
        type: 'string',
        required: true,
        description: 'Opening size with flange',
      },
    ],
  },
  {
    id: 'hinges',
    name: 'Hinges',
    type: 'fastener',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'panel_type == "hinged" ? (height > 600 ? 3 : 2) : 0',
    parameters: [],
  },
  {
    id: 'latches',
    name: 'Latches',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'latch_count',
    parameters: [],
  },
  {
    id: 'gasket',
    name: 'Seal Gasket',
    type: 'accessory',
    required: false,
    quantity: 'single',
    parameters: [
      {
        id: 'gasket_length',
        name: 'Gasket Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Perimeter length',
      },
    ],
  },
  {
    id: 'handle',
    name: 'Pull Handle',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'has_handle ? 1 : 0',
    parameters: [],
  },
  {
    id: 'mounting_screws',
    name: 'Frame Mounting Screws',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil((2 * width + 2 * height) / 150)',
    parameters: [],
  },
];

// ============================================================================
// ACCESS PANEL ELEMENT
// ============================================================================

export const accessPanelElement: ElementDefinition = {
  id: 'access-panel',
  name: 'Access Panel',
  description: 'Hinged or removable panel for equipment access',
  connectionType: 'surface-mount',
  parameters: accessPanelParameters,
  rules: accessPanelRules,
  materials: ['steel', 'stainless-304', 'stainless-316', 'aluminum'],
  components: accessPanelComponents,
};

// ============================================================================
// ACCESS DOOR PARAMETERS
// ============================================================================

const accessDoorParameters: ParameterDefinition[] = [
  {
    id: 'door_type',
    name: 'Door Type',
    type: 'select',
    options: ['single-swing', 'double-swing', 'sliding', 'roll-up', 'bi-fold', 'personnel'],
    default: 'single-swing',
    required: true,
    description: 'Type of access door',
  },
  {
    id: 'width',
    name: 'Clear Opening Width',
    type: 'number',
    unit: 'mm',
    min: 500,
    max: 4000,
    default: 900,
    required: true,
    description: 'Usable passage width',
  },
  {
    id: 'height',
    name: 'Clear Opening Height',
    type: 'number',
    unit: 'mm',
    min: 1800,
    max: 4000,
    default: 2100,
    required: true,
    description: 'Usable passage height',
  },
  {
    id: 'frame_material',
    name: 'Frame Material',
    type: 'select',
    options: ['steel', 'stainless-304', 'aluminum', 'galvanized'],
    default: 'steel',
    required: true,
    description: 'Door frame material',
  },
  {
    id: 'leaf_material',
    name: 'Leaf Material',
    type: 'select',
    options: ['steel', 'stainless-304', 'aluminum', 'insulated-steel', 'composite'],
    default: 'steel',
    required: true,
    description: 'Door leaf material',
  },
  {
    id: 'leaf_thickness',
    name: 'Leaf Thickness',
    type: 'number',
    unit: 'mm',
    min: 30,
    max: 100,
    default: 45,
    required: true,
    description: 'Door leaf thickness (overall)',
  },
  {
    id: 'swing_direction',
    name: 'Swing Direction',
    type: 'select',
    options: ['inward', 'outward'],
    default: 'outward',
    required: true,
    description: 'Direction door swings',
  },
  {
    id: 'hinge_side',
    name: 'Hinge Side',
    type: 'select',
    options: ['left', 'right'],
    default: 'left',
    required: true,
    description: 'Side of hinges (viewing from swing side)',
  },
  {
    id: 'hardware_finish',
    name: 'Hardware Finish',
    type: 'select',
    options: ['zinc', 'stainless', 'chrome', 'brass', 'powder-coat'],
    default: 'zinc',
    required: true,
    description: 'Door hardware finish',
  },
  {
    id: 'lock_type',
    name: 'Lock Type',
    type: 'select',
    options: ['none', 'cylinder', 'deadbolt', 'panic-bar', 'magnetic', 'card-access', 'keypad'],
    default: 'cylinder',
    required: true,
    description: 'Locking mechanism',
  },
  {
    id: 'closer',
    name: 'Door Closer',
    type: 'select',
    options: ['none', 'surface-mounted', 'concealed', 'floor-spring'],
    default: 'surface-mounted',
    required: false,
    description: 'Automatic closing device',
  },
  {
    id: 'threshold',
    name: 'Threshold Type',
    type: 'select',
    options: ['none', 'flat', 'raised', 'ada-compliant', 'weather-seal'],
    default: 'flat',
    required: false,
    description: 'Bottom threshold style',
  },
  {
    id: 'glazing',
    name: 'Glazing',
    type: 'select',
    options: ['none', 'vision-lite', 'half-glass', 'full-glass'],
    default: 'none',
    required: false,
    description: 'Window/glass area',
  },
  {
    id: 'glazing_type',
    name: 'Glass Type',
    type: 'select',
    options: ['clear', 'tempered', 'wired', 'laminated', 'fire-rated'],
    default: 'tempered',
    required: false,
    description: 'Type of glazing',
  },
  {
    id: 'fire_rating',
    name: 'Fire Rating',
    type: 'select',
    options: ['none', '20-min', '45-min', '60-min', '90-min', '180-min'],
    default: 'none',
    required: false,
    description: 'Fire resistance rating',
  },
  {
    id: 'sound_rating',
    name: 'Sound Rating (STC)',
    type: 'number',
    unit: 'mm', // proxy for STC value
    min: 0,
    max: 55,
    default: 0,
    required: false,
    description: 'Sound Transmission Class',
  },
  {
    id: 'weatherstripping',
    name: 'Weatherstripping',
    type: 'select',
    options: ['none', 'brush', 'compression', 'magnetic', 'q-lon'],
    default: 'compression',
    required: false,
    description: 'Weather seal type',
  },
  {
    id: 'kick_plate',
    name: 'Kick Plate',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Bottom protection plate',
  },
  {
    id: 'vision_panel_size',
    name: 'Vision Panel Size',
    type: 'string',
    default: '150x600',
    required: false,
    description: 'Vision lite dimensions (WxH)',
  },
];

// ============================================================================
// ACCESS DOOR RULES
// ============================================================================

const accessDoorRules: Rule[] = [
  {
    id: 'fire_door_closer',
    name: 'Fire Door Closer',
    description: 'Fire-rated doors require self-closing device',
    type: 'constraint',
    source: 'NFPA 80',
    expression: {
      type: 'conditional',
      condition: 'fire_rating != "none"',
      then: { type: 'required-if', param: 'closer', condition: 'closer != "none"' },
    },
    errorMessage: 'Fire-rated doors must be self-closing',
  },
  {
    id: 'fire_glazing',
    name: 'Fire-Rated Glazing',
    description: 'Vision panels in fire doors need fire-rated glass',
    type: 'constraint',
    source: 'NFPA 80',
    expression: {
      type: 'conditional',
      condition: 'fire_rating != "none" && glazing != "none"',
      then: { type: 'required-if', param: 'glazing_type', condition: 'glazing_type == "fire-rated"' },
    },
    errorMessage: 'Fire doors require fire-rated glazing',
  },
  {
    id: 'ada_threshold',
    name: 'ADA Threshold Height',
    description: 'Accessible doors limit threshold height to 13mm',
    type: 'recommendation',
    source: 'ADA Standards',
    expression: {
      type: 'conditional',
      condition: 'threshold == "raised"',
      then: { type: 'range', param: 'width', min: 815 },
    },
    errorMessage: 'Consider ADA-compliant threshold',
  },
  {
    id: 'min_egress_width',
    name: 'Minimum Egress Width',
    description: 'Personnel doors should meet egress requirements',
    type: 'constraint',
    source: 'IBC',
    expression: {
      type: 'conditional',
      condition: 'door_type == "personnel"',
      then: { type: 'range', param: 'width', min: 815 },
    },
    errorMessage: 'Door width below minimum egress requirement',
  },
  {
    id: 'panic_hardware',
    name: 'Panic Hardware',
    description: 'Exit doors may require panic hardware',
    type: 'recommendation',
    source: 'NFPA 101',
    expression: {
      type: 'conditional',
      condition: 'swing_direction == "outward"',
      then: { type: 'range', param: 'width', min: 700 },
    },
    errorMessage: 'Consider panic hardware for exit doors',
  },
];

// ============================================================================
// ACCESS DOOR COMPONENTS
// ============================================================================

const accessDoorComponents: ComponentDefinition[] = [
  {
    id: 'door_frame',
    name: 'Door Frame',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'frame_dims',
        name: 'Frame Dimensions',
        type: 'string',
        required: true,
        description: 'Rough opening size',
      },
    ],
  },
  {
    id: 'door_leaf',
    name: 'Door Leaf',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'door_type == "double-swing" ? 2 : 1',
    parameters: [
      {
        id: 'leaf_dims',
        name: 'Leaf Dimensions',
        type: 'string',
        required: true,
        description: 'Door size',
      },
    ],
  },
  {
    id: 'hinges',
    name: 'Door Hinges',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'height > 2200 ? 4 : 3',
    parameters: [],
  },
  {
    id: 'lockset',
    name: 'Lock Set',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'closer',
    name: 'Door Closer',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'closer != "none" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'threshold',
    name: 'Threshold',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'threshold != "none" ? 1 : 0',
    parameters: [],
  },
  {
    id: 'weatherstrip',
    name: 'Weatherstripping Set',
    type: 'accessory',
    required: false,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'kick_plate',
    name: 'Kick Plate',
    type: 'surface',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'kick_plate ? 1 : 0',
    parameters: [],
  },
  {
    id: 'vision_panel',
    name: 'Vision Panel',
    type: 'surface',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'glazing != "none" ? 1 : 0',
    parameters: [],
  },
];

// ============================================================================
// ACCESS DOOR ELEMENT
// ============================================================================

export const accessDoorElement: ElementDefinition = {
  id: 'access-door',
  name: 'Access Door',
  description: 'Personnel or equipment access door',
  connectionType: 'surface-mount',
  parameters: accessDoorParameters,
  rules: accessDoorRules,
  materials: ['steel', 'stainless-304', 'aluminum', 'composite'],
  components: accessDoorComponents,
};

// ============================================================================
// WINDOW/VIEWPORT PARAMETERS
// ============================================================================

const windowParameters: ParameterDefinition[] = [
  {
    id: 'window_type',
    name: 'Window Type',
    type: 'select',
    options: ['fixed', 'hinged', 'sliding', 'tilt', 'viewport', 'inspection'],
    default: 'fixed',
    required: true,
    description: 'Type of window/viewport',
  },
  {
    id: 'width',
    name: 'Window Width',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 2000,
    default: 300,
    required: true,
    description: 'Clear glazing width',
  },
  {
    id: 'height',
    name: 'Window Height',
    type: 'number',
    unit: 'mm',
    min: 50,
    max: 2000,
    default: 300,
    required: true,
    description: 'Clear glazing height',
  },
  {
    id: 'shape',
    name: 'Shape',
    type: 'select',
    options: ['rectangular', 'square', 'circular', 'oval'],
    default: 'rectangular',
    required: true,
    description: 'Window shape',
  },
  {
    id: 'glazing_material',
    name: 'Glazing Material',
    type: 'select',
    options: ['glass', 'tempered-glass', 'polycarbonate', 'acrylic', 'wire-glass', 'laminated'],
    default: 'polycarbonate',
    required: true,
    description: 'Transparent material',
  },
  {
    id: 'glazing_thickness',
    name: 'Glazing Thickness',
    type: 'number',
    unit: 'mm',
    min: 3,
    max: 25,
    default: 6,
    required: true,
    description: 'Material thickness',
  },
  {
    id: 'frame_material',
    name: 'Frame Material',
    type: 'select',
    options: ['aluminum', 'steel', 'stainless', 'plastic', 'rubber-gasket'],
    default: 'aluminum',
    required: true,
    description: 'Window frame material',
  },
  {
    id: 'frame_finish',
    name: 'Frame Finish',
    type: 'select',
    options: ['mill', 'anodized-clear', 'anodized-black', 'painted', 'powder-coated'],
    default: 'anodized-clear',
    required: false,
    description: 'Frame surface treatment',
  },
  {
    id: 'mounting',
    name: 'Mounting Method',
    type: 'select',
    options: ['flush', 'surface', 'recessed', 'bolt-through'],
    default: 'flush',
    required: true,
    description: 'Installation method',
  },
  {
    id: 'seal_type',
    name: 'Seal Type',
    type: 'select',
    options: ['compression', 'foam-tape', 'silicone', 'o-ring', 'none'],
    default: 'compression',
    required: false,
    description: 'Weatherproofing seal',
  },
  {
    id: 'ip_rating',
    name: 'IP Rating',
    type: 'select',
    options: ['none', 'IP54', 'IP65', 'IP66', 'IP67'],
    default: 'IP54',
    required: false,
    description: 'Ingress protection',
  },
  {
    id: 'impact_rated',
    name: 'Impact Rated',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Meets impact resistance standard',
  },
  {
    id: 'uv_resistant',
    name: 'UV Resistant',
    type: 'boolean',
    default: true,
    required: false,
    description: 'UV stabilized material',
  },
  {
    id: 'tinted',
    name: 'Tinted',
    type: 'select',
    options: ['clear', 'smoke', 'bronze', 'gray'],
    default: 'clear',
    required: false,
    description: 'Glazing tint color',
  },
];

// ============================================================================
// WINDOW RULES
// ============================================================================

const windowRules: Rule[] = [
  {
    id: 'min_thickness',
    name: 'Minimum Glazing Thickness',
    description: 'Glazing thickness based on size',
    type: 'constraint',
    source: 'Engineering Standards',
    expression: {
      type: 'conditional',
      condition: 'width > 500 || height > 500',
      then: { type: 'range', param: 'glazing_thickness', min: 6 },
    },
    errorMessage: 'Glazing too thin for size',
  },
  {
    id: 'safety_glazing',
    name: 'Safety Glazing',
    description: 'Large windows require safety glazing',
    type: 'constraint',
    source: 'Safety Standards',
    expression: {
      type: 'conditional',
      condition: 'width > 600 && height > 600',
      then: { type: 'required-if', param: 'glazing_material', condition: 'glazing_material != "glass"' },
    },
    errorMessage: 'Large windows require tempered or laminated glazing',
  },
  {
    id: 'polycarbonate_uv',
    name: 'Polycarbonate UV Protection',
    description: 'Polycarbonate needs UV protection for outdoor use',
    type: 'recommendation',
    source: 'Material Guidelines',
    expression: {
      type: 'conditional',
      condition: 'glazing_material == "polycarbonate"',
      then: { type: 'required-if', param: 'uv_resistant', condition: 'uv_resistant == true' },
    },
    errorMessage: 'Polycarbonate should be UV-stabilized',
  },
];

// ============================================================================
// WINDOW COMPONENTS
// ============================================================================

const windowComponents: ComponentDefinition[] = [
  {
    id: 'glazing',
    name: 'Glazing Panel',
    type: 'surface',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'glazing_dims',
        name: 'Glazing Dimensions',
        type: 'string',
        required: true,
        description: 'W x H x t',
      },
    ],
  },
  {
    id: 'frame',
    name: 'Window Frame',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'gasket',
    name: 'Frame Gasket',
    type: 'accessory',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'mounting_hardware',
    name: 'Mounting Hardware',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil((2 * width + 2 * height) / 200)',
    parameters: [],
  },
];

// ============================================================================
// WINDOW ELEMENT
// ============================================================================

export const windowElement: ElementDefinition = {
  id: 'window',
  name: 'Window/Viewport',
  description: 'Transparent viewing panel or inspection window',
  connectionType: 'surface-mount',
  parameters: windowParameters,
  rules: windowRules,
  materials: ['polycarbonate', 'acrylic', 'tempered-glass', 'laminated-glass'],
  components: windowComponents,
};

// ============================================================================
// LOUVER PARAMETERS
// ============================================================================

const louverParameters: ParameterDefinition[] = [
  {
    id: 'louver_type',
    name: 'Louver Type',
    type: 'select',
    options: ['fixed', 'adjustable', 'storm-proof', 'chevron', 'sand-trap', 'acoustic'],
    default: 'fixed',
    required: true,
    description: 'Type of louver',
  },
  {
    id: 'width',
    name: 'Louver Width',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 3000,
    default: 300,
    required: true,
    description: 'Overall width',
  },
  {
    id: 'height',
    name: 'Louver Height',
    type: 'number',
    unit: 'mm',
    min: 100,
    max: 2000,
    default: 300,
    required: true,
    description: 'Overall height',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['aluminum', 'steel', 'stainless', 'galvanized'],
    default: 'aluminum',
    required: true,
    description: 'Louver material',
  },
  {
    id: 'blade_type',
    name: 'Blade Type',
    type: 'select',
    options: ['J-blade', 'K-blade', 'Y-blade', 'drainable', 'inverted-V'],
    default: 'J-blade',
    required: true,
    description: 'Blade profile',
  },
  {
    id: 'blade_spacing',
    name: 'Blade Spacing',
    type: 'number',
    unit: 'mm',
    min: 25,
    max: 100,
    default: 50,
    required: true,
    description: 'Vertical spacing between blades',
  },
  {
    id: 'free_area',
    name: 'Free Area',
    type: 'number',
    unit: 'mm', // proxy for %
    min: 30,
    max: 70,
    default: 50,
    required: true,
    description: 'Percentage of open area',
  },
  {
    id: 'pressure_drop',
    name: 'Pressure Drop',
    type: 'number',
    unit: 'mm', // proxy for Pa
    min: 0,
    max: 100,
    default: 25,
    required: false,
    description: 'Pressure drop at rated velocity (Pa)',
  },
  {
    id: 'velocity',
    name: 'Face Velocity',
    type: 'number',
    unit: 'mm', // proxy for m/s
    min: 1,
    max: 10,
    default: 2.5,
    required: false,
    description: 'Design air velocity (m/s)',
  },
  {
    id: 'rain_defense',
    name: 'Rain Defense',
    type: 'select',
    options: ['none', 'standard', 'storm-proof', 'hurricane'],
    default: 'standard',
    required: true,
    description: 'Water penetration resistance',
  },
  {
    id: 'bird_screen',
    name: 'Bird Screen',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Include insect/bird screen',
  },
  {
    id: 'screen_mesh',
    name: 'Screen Mesh Size',
    type: 'number',
    unit: 'mm',
    min: 3,
    max: 25,
    default: 12,
    required: false,
    description: 'Screen opening size (mm)',
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'select',
    options: ['mill', 'anodized', 'painted', 'powder-coated', 'PVDF'],
    default: 'powder-coated',
    required: true,
    description: 'Surface treatment',
  },
  {
    id: 'flange',
    name: 'Mounting Flange',
    type: 'select',
    options: ['none', 'front', 'rear', 'both'],
    default: 'front',
    required: true,
    description: 'Flange location for mounting',
  },
];

// ============================================================================
// LOUVER RULES
// ============================================================================

const louverRules: Rule[] = [
  {
    id: 'min_free_area',
    name: 'Minimum Free Area',
    description: 'Free area based on airflow requirements',
    type: 'constraint',
    source: 'AMCA Standards',
    expression: {
      type: 'range',
      param: 'free_area',
      min: 35,
    },
    errorMessage: 'Free area too low for adequate airflow',
  },
  {
    id: 'storm_proof_size',
    name: 'Storm-Proof Size Limit',
    description: 'Storm-proof louvers have size limitations',
    type: 'constraint',
    source: 'Manufacturer Limits',
    expression: {
      type: 'conditional',
      condition: 'louver_type == "storm-proof"',
      then: { type: 'range', param: 'width', max: 1500 },
    },
    errorMessage: 'Storm-proof louvers limited in size',
  },
  {
    id: 'acoustic_thickness',
    name: 'Acoustic Louver Depth',
    description: 'Acoustic louvers require minimum depth',
    type: 'recommendation',
    source: 'Acoustic Design',
    expression: {
      type: 'conditional',
      condition: 'louver_type == "acoustic"',
      then: { type: 'range', param: 'blade_spacing', min: 75 },
    },
    errorMessage: 'Acoustic louvers need deeper blades',
  },
];

// ============================================================================
// LOUVER COMPONENTS
// ============================================================================

const louverComponents: ComponentDefinition[] = [
  {
    id: 'frame',
    name: 'Louver Frame',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [],
  },
  {
    id: 'blades',
    name: 'Louver Blades',
    type: 'structural',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.floor(height / blade_spacing)',
    parameters: [],
  },
  {
    id: 'screen',
    name: 'Bird Screen',
    type: 'accessory',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'bird_screen ? 1 : 0',
    parameters: [],
  },
  {
    id: 'mounting_clips',
    name: 'Mounting Clips',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'Math.ceil((2 * width + 2 * height) / 300)',
    parameters: [],
  },
];

// ============================================================================
// LOUVER ELEMENT
// ============================================================================

export const louverElement: ElementDefinition = {
  id: 'louver',
  name: 'Louver/Vent',
  description: 'Ventilation louver for air intake or exhaust',
  connectionType: 'surface-mount',
  parameters: louverParameters,
  rules: louverRules,
  materials: ['aluminum', 'steel', 'stainless', 'galvanized'],
  components: louverComponents,
};

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface AccessPanelInput {
  panelType: string;
  width: number;
  height: number;
  material: string;
  thickness: number;
  frameType: string;
  latchType: string;
  latchCount: number;
  sealType: string;
  ipRating: string;
}

export interface AccessPanelResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dimensions: {
    panelWidth: number;
    panelHeight: number;
    frameWidth: number;
    frameHeight: number;
    cutoutWidth: number;
    cutoutHeight: number;
  };
  components: {
    hinges: number;
    latches: number;
    screws: number;
    gasketLength: number;
  };
  weight: number;
}

export interface LouverInput {
  louverType: string;
  width: number;
  height: number;
  material: string;
  bladeType: string;
  bladeSpacing: number;
  freeArea: number;
  velocity: number;
  birdScreen: boolean;
}

export interface LouverResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  performance: {
    effectiveFreeArea: number;   // mm²
    pressureDrop: number;        // Pa
    airflowCapacity: number;     // m³/h
  };
  geometry: {
    numBlades: number;
    bladeLength: number;
  };
  weight: number;
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

const materialDensities: Record<string, number> = {
  'steel': 7850,
  'stainless-304': 8000,
  'stainless-316': 8000,
  'aluminum': 2700,
  'galvanized': 7850,
};

export function calculateAccessPanel(input: AccessPanelInput): AccessPanelResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Frame dimensions (add flange width)
  const flangeWidth = 25;
  const frameWidth = input.width + 2 * flangeWidth;
  const frameHeight = input.height + 2 * flangeWidth;

  // Cutout dimensions (slightly larger than frame)
  const cutoutWidth = frameWidth + 4;
  const cutoutHeight = frameHeight + 4;

  // Validate thickness for size
  if ((input.width > 600 || input.height > 600) && input.thickness < 1.5) {
    errors.push('Panel thickness insufficient for size - need minimum 1.5mm');
  }

  // Validate seal for IP rating
  const ipNum = parseInt(input.ipRating.replace(/\D/g, '') || '0');
  if (ipNum >= 54 && input.sealType === 'none') {
    errors.push('IP54+ requires gasket seal');
  }

  // Component counts
  const numHinges = input.panelType === 'hinged' ? (input.height > 600 ? 3 : 2) : 0;
  const numLatches = input.latchCount;
  const perimeter = 2 * input.width + 2 * input.height;
  const numScrews = Math.ceil(perimeter / 150);
  const gasketLength = input.sealType !== 'none' ? perimeter + 50 : 0;

  // Weight calculation
  const density = materialDensities[input.material] || 7850;
  const panelArea = (input.width * input.height) / 1e6; // m²
  const frameArea = ((frameWidth * frameHeight) - (input.width * input.height)) / 1e6;
  const weight = (panelArea + frameArea) * (input.thickness / 1000) * density;

  // Warnings
  if (input.width > 800 && input.latchCount < 3) {
    warnings.push('Wide panels should have 3+ latches');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dimensions: {
      panelWidth: input.width,
      panelHeight: input.height,
      frameWidth,
      frameHeight,
      cutoutWidth,
      cutoutHeight,
    },
    components: {
      hinges: numHinges,
      latches: numLatches,
      screws: numScrews,
      gasketLength,
    },
    weight: Math.round(weight * 10) / 10,
  };
}

export function calculateLouver(input: LouverInput): LouverResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate geometry
  const numBlades = Math.floor(input.height / input.bladeSpacing);
  const bladeLength = input.width - 10; // Allow for frame

  // Calculate effective free area
  const grossArea = input.width * input.height; // mm²
  const effectiveFreeArea = grossArea * (input.freeArea / 100);

  // Pressure drop (simplified calculation)
  // ΔP = K × ρ × v² / 2, where K depends on louver type
  const kFactors: Record<string, number> = {
    'fixed': 2.5,
    'adjustable': 3.0,
    'storm-proof': 4.0,
    'chevron': 3.5,
    'acoustic': 5.0,
  };
  const k = kFactors[input.louverType] || 2.5;
  const rho = 1.2; // air density kg/m³
  const pressureDrop = k * rho * input.velocity * input.velocity / 2;

  // Airflow capacity (m³/h)
  const airflowCapacity = (effectiveFreeArea / 1e6) * input.velocity * 3600;

  // Weight
  const density = materialDensities[input.material] || 2700;
  const bladeThickness = 1.5; // mm typical
  const bladeWidth = input.bladeSpacing * 0.8; // approximate blade width
  const bladeVolume = numBlades * bladeLength * bladeWidth * bladeThickness / 1e9; // m³
  const frameVolume = (2 * input.height + 2 * input.width) * 30 * 2 / 1e9; // approximate
  const weight = (bladeVolume + frameVolume) * density;

  // Validations
  if (input.freeArea < 35) {
    errors.push('Free area too low - minimum 35% required');
  }

  if (input.louverType === 'storm-proof' && input.width > 1500) {
    warnings.push('Storm-proof louvers limited to 1500mm width');
  }

  if (pressureDrop > 50) {
    warnings.push(`High pressure drop (${pressureDrop.toFixed(0)} Pa) may affect system performance`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    performance: {
      effectiveFreeArea: Math.round(effectiveFreeArea),
      pressureDrop: Math.round(pressureDrop * 10) / 10,
      airflowCapacity: Math.round(airflowCapacity),
    },
    geometry: {
      numBlades,
      bladeLength,
    },
    weight: Math.round(weight * 10) / 10,
  };
}
