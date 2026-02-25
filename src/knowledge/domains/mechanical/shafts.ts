/**
 * MECHANICAL Domain - Shafts, Couplings, and Bearings
 *
 * Knowledge for power transmission:
 * - Shaft design (torque capacity, deflection, critical speed)
 * - Couplings (rigid, flexible, universal)
 * - Bearings (ball, roller, plain)
 * - Alignment and mounting
 */

import type {
  ElementDefinition,
  ParameterDefinition,
  Rule,
  ComponentDefinition,
} from '../../types';

// ============================================================================
// SHAFT PARAMETERS
// ============================================================================

const shaftParameters: ParameterDefinition[] = [
  {
    id: 'shaft_type',
    name: 'Shaft Type',
    type: 'select',
    options: ['solid', 'hollow', 'stepped', 'splined', 'keyed'],
    default: 'solid',
    required: true,
    description: 'Type of shaft configuration',
  },
  {
    id: 'diameter',
    name: 'Shaft Diameter',
    type: 'number',
    unit: 'mm',
    min: 5,
    max: 500,
    default: 25,
    required: true,
    description: 'Outer diameter of shaft',
  },
  {
    id: 'inner_diameter',
    name: 'Inner Diameter (Hollow)',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 400,
    default: 0,
    required: false,
    description: 'Inner diameter for hollow shafts (0 for solid)',
  },
  {
    id: 'length',
    name: 'Shaft Length',
    type: 'number',
    unit: 'mm',
    min: 10,
    max: 10000,
    default: 300,
    required: true,
    description: 'Total length of shaft',
  },
  {
    id: 'material',
    name: 'Material',
    type: 'select',
    options: ['1045-steel', '4140-steel', '4340-steel', '303-stainless', '316-stainless', '17-4ph', '6061-aluminum', '7075-aluminum'],
    default: '1045-steel',
    required: true,
    description: 'Shaft material',
  },
  {
    id: 'torque',
    name: 'Applied Torque',
    type: 'number',
    unit: 'mm', // Using mm as proxy for Nm
    min: 0.1,
    max: 100000,
    default: 100,
    required: true,
    description: 'Maximum transmitted torque (N·m)',
  },
  {
    id: 'speed',
    name: 'Rotational Speed',
    type: 'number',
    unit: 'mm', // Using mm as proxy for RPM
    min: 1,
    max: 50000,
    default: 1750,
    required: true,
    description: 'Operating speed (RPM)',
  },
  {
    id: 'bearing_span',
    name: 'Bearing Span',
    type: 'number',
    unit: 'mm',
    min: 20,
    max: 5000,
    default: 200,
    required: true,
    description: 'Distance between bearing supports',
  },
  {
    id: 'radial_load',
    name: 'Radial Load',
    type: 'number',
    unit: 'mm', // Using mm as proxy for N
    min: 0,
    max: 500000,
    default: 1000,
    required: false,
    description: 'Maximum radial load (N)',
  },
  {
    id: 'axial_load',
    name: 'Axial Load',
    type: 'number',
    unit: 'mm', // Using mm as proxy for N
    min: 0,
    max: 200000,
    default: 0,
    required: false,
    description: 'Axial thrust load (N)',
  },
  {
    id: 'keyway',
    name: 'Include Keyway',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Include keyway for torque transmission',
  },
  {
    id: 'surface_finish',
    name: 'Surface Finish',
    type: 'select',
    options: ['as-machined', 'ground', 'polished', 'hard-chrome'],
    default: 'ground',
    required: false,
    description: 'Surface finish requirement',
  },
  {
    id: 'heat_treatment',
    name: 'Heat Treatment',
    type: 'select',
    options: ['none', 'through-hardened', 'case-hardened', 'induction-hardened', 'nitrided'],
    default: 'none',
    required: false,
    description: 'Heat treatment for wear resistance',
  },
];

// ============================================================================
// SHAFT RULES
// ============================================================================

const shaftRules: Rule[] = [
  {
    id: 'torsional_stress',
    name: 'Torsional Stress Limit',
    description: 'Shaft must not exceed allowable torsional shear stress',
    type: 'constraint',
    source: 'ASME B106.1M',
    expression: { type: 'range', param: 'diameter', min: 10 },
    errorMessage: 'Shaft diameter may be insufficient for applied torque',
  },
  {
    id: 'deflection_limit',
    name: 'Deflection Limit',
    description: 'Shaft deflection must not exceed 0.001 in/in of span',
    type: 'constraint',
    source: 'Machinery\'s Handbook',
    expression: {
      type: 'ratio',
      param1: 'diameter',
      param2: 'bearing_span',
      min: 0.02, // d/L > 0.02 for reasonable deflection
    },
    errorMessage: 'Shaft may have excessive deflection - increase diameter or reduce span',
  },
  {
    id: 'critical_speed_margin',
    name: 'Critical Speed Margin',
    description: 'Operating speed must be at least 20% below first critical speed',
    type: 'constraint',
    source: 'API 610',
    expression: { type: 'range', param: 'speed', max: 40000 },
    errorMessage: 'Operating speed may approach critical speed - verify dynamics',
  },
  {
    id: 'hollow_ratio',
    name: 'Hollow Shaft Ratio',
    description: 'Inner diameter should not exceed 80% of outer diameter',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: {
      type: 'ratio',
      param1: 'inner_diameter',
      param2: 'diameter',
      max: 0.8,
    },
    errorMessage: 'Hollow shaft wall thickness too thin',
  },
  {
    id: 'keyway_depth',
    name: 'Keyway Depth Limit',
    description: 'Keyway depth should not exceed 25% of shaft diameter',
    type: 'recommendation',
    source: 'ANSI B17.1',
    expression: { type: 'range', param: 'diameter', min: 8 },
    errorMessage: 'Shaft diameter may be too small for standard keyway',
  },
];

// ============================================================================
// SHAFT COMPONENTS
// ============================================================================

const shaftComponents: ComponentDefinition[] = [
  {
    id: 'shaft_body',
    name: 'Shaft Body',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'machined_diameter',
        name: 'Machined Diameter',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Final machined diameter',
      },
      {
        id: 'stock_diameter',
        name: 'Stock Diameter',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Starting stock diameter (machining allowance)',
      },
    ],
  },
  {
    id: 'keyway',
    name: 'Keyway',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'keyway ? 1 : 0',
    parameters: [
      {
        id: 'key_width',
        name: 'Key Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Width of keyway and key',
      },
      {
        id: 'key_depth',
        name: 'Key Depth',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Depth of keyway in shaft',
      },
    ],
  },
  {
    id: 'bearing_journal',
    name: 'Bearing Journal',
    type: 'connection',
    required: true,
    quantity: 'calculated',
    quantityFormula: '2', // Two bearing locations typical
    parameters: [
      {
        id: 'journal_diameter',
        name: 'Journal Diameter',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Diameter at bearing location',
      },
      {
        id: 'journal_length',
        name: 'Journal Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Length of bearing journal',
      },
    ],
  },
  {
    id: 'retaining_ring_groove',
    name: 'Retaining Ring Groove',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: '2',
    parameters: [
      {
        id: 'groove_diameter',
        name: 'Groove Diameter',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Diameter at bottom of groove',
      },
    ],
  },
];

// ============================================================================
// SHAFT ELEMENT DEFINITION
// ============================================================================

export const shaftElement: ElementDefinition = {
  id: 'shaft',
  name: 'Power Transmission Shaft',
  description: 'Rotating shafts for torque and power transmission with bearing supports',
  connectionType: 'point-to-point',
  parameters: shaftParameters,
  rules: shaftRules,
  materials: ['1045-steel', '4140-steel', '4340-steel', '303-stainless', '316-stainless', '17-4ph', '6061-aluminum', '7075-aluminum'],
  components: shaftComponents,
};

// ============================================================================
// COUPLING PARAMETERS
// ============================================================================

const couplingParameters: ParameterDefinition[] = [
  {
    id: 'coupling_type',
    name: 'Coupling Type',
    type: 'select',
    options: ['rigid', 'flexible-jaw', 'flexible-disc', 'gear', 'grid', 'universal', 'oldham', 'bellows', 'beam'],
    default: 'flexible-jaw',
    required: true,
    description: 'Type of shaft coupling',
  },
  {
    id: 'bore_drive',
    name: 'Drive Side Bore',
    type: 'number',
    unit: 'mm',
    min: 5,
    max: 200,
    default: 25,
    required: true,
    description: 'Bore diameter for drive shaft',
  },
  {
    id: 'bore_driven',
    name: 'Driven Side Bore',
    type: 'number',
    unit: 'mm',
    min: 5,
    max: 200,
    default: 25,
    required: true,
    description: 'Bore diameter for driven shaft',
  },
  {
    id: 'torque_capacity',
    name: 'Torque Capacity Required',
    type: 'number',
    unit: 'mm', // Using mm as proxy for Nm
    min: 1,
    max: 50000,
    default: 100,
    required: true,
    description: 'Required torque capacity (N·m)',
  },
  {
    id: 'max_speed',
    name: 'Maximum Speed',
    type: 'number',
    unit: 'mm', // Using mm as proxy for RPM
    min: 1,
    max: 30000,
    default: 3600,
    required: true,
    description: 'Maximum operating speed (RPM)',
  },
  {
    id: 'angular_misalignment',
    name: 'Angular Misalignment',
    type: 'number',
    unit: 'mm', // Using mm as proxy for degrees
    min: 0,
    max: 30,
    default: 1,
    required: true,
    description: 'Expected angular misalignment (degrees)',
  },
  {
    id: 'parallel_misalignment',
    name: 'Parallel Misalignment',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 10,
    default: 0.5,
    required: true,
    description: 'Expected parallel offset (mm)',
  },
  {
    id: 'axial_misalignment',
    name: 'Axial Misalignment',
    type: 'number',
    unit: 'mm',
    min: 0,
    max: 20,
    default: 1,
    required: false,
    description: 'Expected axial movement (mm)',
  },
  {
    id: 'keyway_drive',
    name: 'Drive Keyway',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Include keyway on drive side',
  },
  {
    id: 'keyway_driven',
    name: 'Driven Keyway',
    type: 'boolean',
    default: true,
    required: false,
    description: 'Include keyway on driven side',
  },
  {
    id: 'backlash_free',
    name: 'Backlash-Free Required',
    type: 'boolean',
    default: false,
    required: false,
    description: 'Zero-backlash coupling required',
  },
  {
    id: 'torsional_stiffness',
    name: 'Torsional Stiffness',
    type: 'select',
    options: ['low', 'medium', 'high', 'rigid'],
    default: 'medium',
    required: false,
    description: 'Desired torsional stiffness',
  },
];

// ============================================================================
// COUPLING RULES
// ============================================================================

const couplingRules: Rule[] = [
  {
    id: 'torque_service_factor',
    name: 'Torque Service Factor',
    description: 'Apply service factor based on application type',
    type: 'recommendation',
    source: 'AGMA 9002',
    expression: { type: 'range', param: 'torque_capacity', min: 1 },
    errorMessage: 'Apply appropriate service factor to torque capacity',
  },
  {
    id: 'misalignment_check',
    name: 'Misalignment Capability',
    description: 'Coupling must handle specified misalignment',
    type: 'constraint',
    source: 'Coupling Manufacturer Data',
    expression: { type: 'range', param: 'angular_misalignment', max: 15 },
    errorMessage: 'Angular misalignment exceeds typical coupling capability',
  },
  {
    id: 'rigid_alignment',
    name: 'Rigid Coupling Alignment',
    description: 'Rigid couplings require precise alignment',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: { type: 'range', param: 'angular_misalignment', max: 0.5 },
    errorMessage: 'Rigid coupling requires better alignment than specified',
  },
  {
    id: 'bore_match',
    name: 'Bore Size Match',
    description: 'Coupling bores must match shaft diameters',
    type: 'constraint',
    source: 'Engineering Practice',
    expression: { type: 'range', param: 'bore_drive', min: 5, max: 200 },
    errorMessage: 'Bore size outside standard coupling range',
  },
  {
    id: 'speed_rating',
    name: 'Speed Rating Check',
    description: 'Operating speed must be within coupling rating',
    type: 'constraint',
    source: 'Manufacturer Rating',
    expression: { type: 'range', param: 'max_speed', max: 30000 },
    errorMessage: 'Operating speed may exceed coupling balance rating',
  },
];

// ============================================================================
// COUPLING COMPONENTS
// ============================================================================

const couplingComponents: ComponentDefinition[] = [
  {
    id: 'coupling_hub_drive',
    name: 'Drive Hub',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'hub_od',
        name: 'Hub OD',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Outer diameter of hub',
      },
      {
        id: 'hub_length',
        name: 'Hub Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Length of hub',
      },
    ],
  },
  {
    id: 'coupling_hub_driven',
    name: 'Driven Hub',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'hub_od',
        name: 'Hub OD',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Outer diameter of hub',
      },
      {
        id: 'hub_length',
        name: 'Hub Length',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Length of hub',
      },
    ],
  },
  {
    id: 'flexible_element',
    name: 'Flexible Element',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'coupling_type !== "rigid" ? 1 : 0',
    parameters: [
      {
        id: 'element_type',
        name: 'Element Type',
        type: 'string',
        required: true,
        description: 'Type of flexible element (spider, disc, grid, etc.)',
      },
    ],
  },
  {
    id: 'coupling_hardware',
    name: 'Coupling Hardware',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: 'coupling_type === "rigid" ? 4 : 2',
    parameters: [
      {
        id: 'fastener_size',
        name: 'Fastener Size',
        type: 'string',
        required: true,
        description: 'Set screw or clamp size',
      },
    ],
  },
  {
    id: 'key_drive',
    name: 'Drive Key',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'keyway_drive ? 1 : 0',
    parameters: [
      {
        id: 'key_size',
        name: 'Key Size',
        type: 'string',
        required: true,
        description: 'Key dimensions (W x H x L)',
      },
    ],
  },
  {
    id: 'key_driven',
    name: 'Driven Key',
    type: 'connection',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'keyway_driven ? 1 : 0',
    parameters: [
      {
        id: 'key_size',
        name: 'Key Size',
        type: 'string',
        required: true,
        description: 'Key dimensions (W x H x L)',
      },
    ],
  },
];

// ============================================================================
// COUPLING ELEMENT DEFINITION
// ============================================================================

export const couplingElement: ElementDefinition = {
  id: 'coupling',
  name: 'Shaft Coupling',
  description: 'Couplings for connecting rotating shafts with misalignment compensation',
  connectionType: 'point-to-point',
  parameters: couplingParameters,
  rules: couplingRules,
  materials: ['steel', 'cast-iron', 'aluminum', 'polyurethane', 'stainless'],
  components: couplingComponents,
};

// ============================================================================
// BEARING PARAMETERS
// ============================================================================

const bearingParameters: ParameterDefinition[] = [
  {
    id: 'bearing_type',
    name: 'Bearing Type',
    type: 'select',
    options: ['deep-groove-ball', 'angular-contact', 'cylindrical-roller', 'tapered-roller', 'spherical-roller', 'thrust-ball', 'needle', 'plain-sleeve', 'plain-flanged'],
    default: 'deep-groove-ball',
    required: true,
    description: 'Type of bearing',
  },
  {
    id: 'bore_diameter',
    name: 'Bore Diameter',
    type: 'number',
    unit: 'mm',
    min: 3,
    max: 500,
    default: 25,
    required: true,
    description: 'Shaft diameter / inner bore',
  },
  {
    id: 'radial_load',
    name: 'Radial Load',
    type: 'number',
    unit: 'mm', // Using mm as proxy for N
    min: 0,
    max: 1000000,
    default: 5000,
    required: true,
    description: 'Applied radial load (N)',
  },
  {
    id: 'axial_load',
    name: 'Axial Load',
    type: 'number',
    unit: 'mm', // Using mm as proxy for N
    min: 0,
    max: 500000,
    default: 0,
    required: false,
    description: 'Applied axial load (N)',
  },
  {
    id: 'operating_speed',
    name: 'Operating Speed',
    type: 'number',
    unit: 'mm', // Using mm as proxy for RPM
    min: 0,
    max: 100000,
    default: 1750,
    required: true,
    description: 'Rotational speed (RPM)',
  },
  {
    id: 'design_life',
    name: 'Design Life',
    type: 'number',
    unit: 'mm', // Using mm as proxy for hours
    min: 500,
    max: 200000,
    default: 20000,
    required: true,
    description: 'Required L10 life (hours)',
  },
  {
    id: 'precision_class',
    name: 'Precision Class',
    type: 'select',
    options: ['P0', 'P6', 'P5', 'P4', 'P2'],
    default: 'P0',
    required: false,
    description: 'ISO precision class (P0 = normal)',
  },
  {
    id: 'sealing',
    name: 'Sealing Type',
    type: 'select',
    options: ['open', 'shielded', 'sealed', 'double-sealed'],
    default: 'sealed',
    required: false,
    description: 'Bearing seal configuration',
  },
  {
    id: 'lubrication',
    name: 'Lubrication',
    type: 'select',
    options: ['grease-packed', 'oil-bath', 'oil-mist', 'dry'],
    default: 'grease-packed',
    required: false,
    description: 'Lubrication method',
  },
  {
    id: 'mounting',
    name: 'Mounting Configuration',
    type: 'select',
    options: ['shaft-fit', 'housing-fit', 'pillow-block', 'flange-mount', 'take-up'],
    default: 'shaft-fit',
    required: true,
    description: 'How the bearing is mounted',
  },
];

// ============================================================================
// BEARING RULES
// ============================================================================

const bearingRules: Rule[] = [
  {
    id: 'life_requirement',
    name: 'Life Requirement',
    description: 'Bearing must meet specified L10 life under load',
    type: 'constraint',
    source: 'ISO 281',
    expression: { type: 'range', param: 'design_life', min: 500 },
    errorMessage: 'Bearing capacity insufficient for required life',
  },
  {
    id: 'speed_limit',
    name: 'Speed Limit',
    description: 'Operating speed must be within bearing rating',
    type: 'constraint',
    source: 'Bearing Manufacturer',
    expression: { type: 'range', param: 'operating_speed', max: 50000 },
    errorMessage: 'Operating speed exceeds bearing rating - consider higher precision',
  },
  {
    id: 'load_direction',
    name: 'Load Direction Match',
    description: 'Bearing type must match load direction',
    type: 'recommendation',
    source: 'Engineering Practice',
    expression: { type: 'range', param: 'axial_load', min: 0 },
    errorMessage: 'Select bearing type appropriate for combined loads',
  },
  {
    id: 'preload_requirement',
    name: 'Preload Requirement',
    description: 'Angular contact bearings typically mounted in pairs with preload',
    type: 'recommendation',
    source: 'Bearing Practice',
    expression: { type: 'range', param: 'bore_diameter', min: 3 },
    errorMessage: 'Consider bearing arrangement and preload',
  },
];

// ============================================================================
// BEARING COMPONENTS
// ============================================================================

const bearingComponents: ComponentDefinition[] = [
  {
    id: 'bearing_unit',
    name: 'Bearing',
    type: 'structural',
    required: true,
    quantity: 'single',
    parameters: [
      {
        id: 'bearing_designation',
        name: 'Bearing Designation',
        type: 'string',
        required: true,
        description: 'Standard bearing designation (e.g., 6205-2RS)',
      },
      {
        id: 'outer_diameter',
        name: 'Outer Diameter',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Bearing outer diameter',
      },
      {
        id: 'width',
        name: 'Bearing Width',
        type: 'number',
        unit: 'mm',
        required: true,
        description: 'Bearing width',
      },
    ],
  },
  {
    id: 'housing',
    name: 'Bearing Housing',
    type: 'structural',
    required: false,
    quantity: 'calculated',
    quantityFormula: 'mounting === "pillow-block" || mounting === "flange-mount" ? 1 : 0',
    parameters: [
      {
        id: 'housing_type',
        name: 'Housing Type',
        type: 'string',
        required: true,
        description: 'Housing style (P, F, T, etc.)',
      },
    ],
  },
  {
    id: 'retaining_hardware',
    name: 'Retaining Hardware',
    type: 'fastener',
    required: true,
    quantity: 'calculated',
    quantityFormula: '2', // Typically snap ring and locknut
    parameters: [
      {
        id: 'hardware_type',
        name: 'Hardware Type',
        type: 'string',
        required: true,
        description: 'Snap ring, locknut, or adapter sleeve',
      },
    ],
  },
];

// ============================================================================
// BEARING ELEMENT DEFINITION
// ============================================================================

export const bearingElement: ElementDefinition = {
  id: 'bearing',
  name: 'Shaft Bearing',
  description: 'Rolling element and plain bearings for shaft support',
  connectionType: 'surface-mount',
  parameters: bearingParameters,
  rules: bearingRules,
  materials: ['chrome-steel', '440c-stainless', 'ceramic-hybrid', 'bronze', 'babbitt'],
  components: bearingComponents,
};

// ============================================================================
// SHAFT MATERIAL DATABASE
// ============================================================================

export interface ShaftMaterial {
  id: string;
  name: string;
  yieldStrength: number; // MPa
  tensileStrength: number; // MPa
  elasticModulus: number; // GPa
  shearModulus: number; // GPa
  density: number; // kg/m³
  enduranceLimit: number; // MPa (for 10^6 cycles)
  machinability: 'poor' | 'fair' | 'good' | 'excellent';
  heatTreatment: string[];
}

export const shaftMaterials: ShaftMaterial[] = [
  {
    id: '1045-steel',
    name: 'AISI 1045 Carbon Steel',
    yieldStrength: 530,
    tensileStrength: 625,
    elasticModulus: 205,
    shearModulus: 80,
    density: 7850,
    enduranceLimit: 280,
    machinability: 'good',
    heatTreatment: ['normalized', 'annealed', 'quenched-tempered'],
  },
  {
    id: '4140-steel',
    name: 'AISI 4140 Alloy Steel',
    yieldStrength: 655,
    tensileStrength: 1020,
    elasticModulus: 205,
    shearModulus: 80,
    density: 7850,
    enduranceLimit: 420,
    machinability: 'fair',
    heatTreatment: ['normalized', 'quenched-tempered', 'induction-hardened'],
  },
  {
    id: '4340-steel',
    name: 'AISI 4340 Alloy Steel',
    yieldStrength: 860,
    tensileStrength: 1080,
    elasticModulus: 205,
    shearModulus: 80,
    density: 7850,
    enduranceLimit: 480,
    machinability: 'fair',
    heatTreatment: ['quenched-tempered', 'case-hardened'],
  },
  {
    id: '303-stainless',
    name: '303 Stainless Steel',
    yieldStrength: 240,
    tensileStrength: 620,
    elasticModulus: 193,
    shearModulus: 77,
    density: 8000,
    enduranceLimit: 260,
    machinability: 'excellent',
    heatTreatment: ['none'],
  },
  {
    id: '316-stainless',
    name: '316 Stainless Steel',
    yieldStrength: 290,
    tensileStrength: 580,
    elasticModulus: 193,
    shearModulus: 77,
    density: 8000,
    enduranceLimit: 240,
    machinability: 'fair',
    heatTreatment: ['none'],
  },
  {
    id: '17-4ph',
    name: '17-4 PH Stainless Steel',
    yieldStrength: 1170,
    tensileStrength: 1310,
    elasticModulus: 197,
    shearModulus: 77,
    density: 7780,
    enduranceLimit: 520,
    machinability: 'fair',
    heatTreatment: ['H900', 'H1025', 'H1075', 'H1150'],
  },
  {
    id: '6061-aluminum',
    name: '6061-T6 Aluminum',
    yieldStrength: 276,
    tensileStrength: 310,
    elasticModulus: 68.9,
    shearModulus: 26,
    density: 2700,
    enduranceLimit: 97,
    machinability: 'excellent',
    heatTreatment: ['T6'],
  },
  {
    id: '7075-aluminum',
    name: '7075-T6 Aluminum',
    yieldStrength: 503,
    tensileStrength: 572,
    elasticModulus: 71.7,
    shearModulus: 26.9,
    density: 2810,
    enduranceLimit: 160,
    machinability: 'good',
    heatTreatment: ['T6', 'T651'],
  },
];

// ============================================================================
// STANDARD KEYWAY SIZES (ANSI B17.1)
// ============================================================================

export interface KeywaySize {
  shaftDiameterMin: number; // mm
  shaftDiameterMax: number; // mm
  keyWidth: number; // mm
  keyHeight: number; // mm
  shaftDepth: number; // mm - depth in shaft
  hubDepth: number; // mm - depth in hub
}

export const keywayStandard: KeywaySize[] = [
  { shaftDiameterMin: 6, shaftDiameterMax: 8, keyWidth: 2, keyHeight: 2, shaftDepth: 1.0, hubDepth: 1.0 },
  { shaftDiameterMin: 8, shaftDiameterMax: 10, keyWidth: 3, keyHeight: 3, shaftDepth: 1.8, hubDepth: 1.4 },
  { shaftDiameterMin: 10, shaftDiameterMax: 12, keyWidth: 4, keyHeight: 4, shaftDepth: 2.5, hubDepth: 1.8 },
  { shaftDiameterMin: 12, shaftDiameterMax: 17, keyWidth: 5, keyHeight: 5, shaftDepth: 3.0, hubDepth: 2.3 },
  { shaftDiameterMin: 17, shaftDiameterMax: 22, keyWidth: 6, keyHeight: 6, shaftDepth: 3.5, hubDepth: 2.8 },
  { shaftDiameterMin: 22, shaftDiameterMax: 30, keyWidth: 8, keyHeight: 7, shaftDepth: 4.0, hubDepth: 3.3 },
  { shaftDiameterMin: 30, shaftDiameterMax: 38, keyWidth: 10, keyHeight: 8, shaftDepth: 5.0, hubDepth: 3.3 },
  { shaftDiameterMin: 38, shaftDiameterMax: 44, keyWidth: 12, keyHeight: 8, shaftDepth: 5.0, hubDepth: 3.3 },
  { shaftDiameterMin: 44, shaftDiameterMax: 50, keyWidth: 14, keyHeight: 9, shaftDepth: 5.5, hubDepth: 3.8 },
  { shaftDiameterMin: 50, shaftDiameterMax: 58, keyWidth: 16, keyHeight: 10, shaftDepth: 6.0, hubDepth: 4.3 },
  { shaftDiameterMin: 58, shaftDiameterMax: 65, keyWidth: 18, keyHeight: 11, shaftDepth: 7.0, hubDepth: 4.4 },
  { shaftDiameterMin: 65, shaftDiameterMax: 75, keyWidth: 20, keyHeight: 12, shaftDepth: 7.5, hubDepth: 4.9 },
  { shaftDiameterMin: 75, shaftDiameterMax: 85, keyWidth: 22, keyHeight: 14, shaftDepth: 9.0, hubDepth: 5.4 },
  { shaftDiameterMin: 85, shaftDiameterMax: 95, keyWidth: 25, keyHeight: 14, shaftDepth: 9.0, hubDepth: 5.4 },
  { shaftDiameterMin: 95, shaftDiameterMax: 110, keyWidth: 28, keyHeight: 16, shaftDepth: 10.0, hubDepth: 6.4 },
  { shaftDiameterMin: 110, shaftDiameterMax: 130, keyWidth: 32, keyHeight: 18, shaftDepth: 11.0, hubDepth: 7.4 },
];

// ============================================================================
// STANDARD BEARING SIZES (ISO 15)
// ============================================================================

export interface BearingSize {
  designation: string;
  boreDiameter: number; // mm
  outerDiameter: number; // mm
  width: number; // mm
  dynamicCapacity: number; // kN (C)
  staticCapacity: number; // kN (C0)
  limitSpeed: number; // RPM (grease)
  weight: number; // kg
}

export const ballBearings6200Series: BearingSize[] = [
  { designation: '6200', boreDiameter: 10, outerDiameter: 30, width: 9, dynamicCapacity: 5.07, staticCapacity: 2.36, limitSpeed: 22000, weight: 0.028 },
  { designation: '6201', boreDiameter: 12, outerDiameter: 32, width: 10, dynamicCapacity: 6.89, staticCapacity: 3.1, limitSpeed: 20000, weight: 0.037 },
  { designation: '6202', boreDiameter: 15, outerDiameter: 35, width: 11, dynamicCapacity: 7.8, staticCapacity: 3.55, limitSpeed: 18000, weight: 0.045 },
  { designation: '6203', boreDiameter: 17, outerDiameter: 40, width: 12, dynamicCapacity: 9.56, staticCapacity: 4.5, limitSpeed: 16000, weight: 0.065 },
  { designation: '6204', boreDiameter: 20, outerDiameter: 47, width: 14, dynamicCapacity: 12.7, staticCapacity: 6.2, limitSpeed: 14000, weight: 0.106 },
  { designation: '6205', boreDiameter: 25, outerDiameter: 52, width: 15, dynamicCapacity: 14.0, staticCapacity: 6.95, limitSpeed: 12000, weight: 0.127 },
  { designation: '6206', boreDiameter: 30, outerDiameter: 62, width: 16, dynamicCapacity: 19.5, staticCapacity: 10.0, limitSpeed: 10000, weight: 0.200 },
  { designation: '6207', boreDiameter: 35, outerDiameter: 72, width: 17, dynamicCapacity: 25.5, staticCapacity: 13.7, limitSpeed: 9000, weight: 0.290 },
  { designation: '6208', boreDiameter: 40, outerDiameter: 80, width: 18, dynamicCapacity: 30.7, staticCapacity: 16.6, limitSpeed: 8000, weight: 0.365 },
  { designation: '6209', boreDiameter: 45, outerDiameter: 85, width: 19, dynamicCapacity: 33.2, staticCapacity: 18.6, limitSpeed: 7500, weight: 0.400 },
  { designation: '6210', boreDiameter: 50, outerDiameter: 90, width: 20, dynamicCapacity: 35.1, staticCapacity: 19.8, limitSpeed: 7000, weight: 0.460 },
  { designation: '6211', boreDiameter: 55, outerDiameter: 100, width: 21, dynamicCapacity: 43.6, staticCapacity: 25.0, limitSpeed: 6300, weight: 0.600 },
  { designation: '6212', boreDiameter: 60, outerDiameter: 110, width: 22, dynamicCapacity: 52.0, staticCapacity: 31.0, limitSpeed: 5600, weight: 0.780 },
];

export const ballBearings6300Series: BearingSize[] = [
  { designation: '6300', boreDiameter: 10, outerDiameter: 35, width: 11, dynamicCapacity: 8.06, staticCapacity: 3.4, limitSpeed: 19000, weight: 0.052 },
  { designation: '6301', boreDiameter: 12, outerDiameter: 37, width: 12, dynamicCapacity: 9.75, staticCapacity: 4.15, limitSpeed: 17000, weight: 0.063 },
  { designation: '6302', boreDiameter: 15, outerDiameter: 42, width: 13, dynamicCapacity: 11.4, staticCapacity: 5.0, limitSpeed: 15000, weight: 0.086 },
  { designation: '6303', boreDiameter: 17, outerDiameter: 47, width: 14, dynamicCapacity: 13.5, staticCapacity: 6.1, limitSpeed: 14000, weight: 0.118 },
  { designation: '6304', boreDiameter: 20, outerDiameter: 52, width: 15, dynamicCapacity: 15.9, staticCapacity: 7.8, limitSpeed: 12000, weight: 0.150 },
  { designation: '6305', boreDiameter: 25, outerDiameter: 62, width: 17, dynamicCapacity: 22.5, staticCapacity: 11.4, limitSpeed: 10000, weight: 0.235 },
  { designation: '6306', boreDiameter: 30, outerDiameter: 72, width: 19, dynamicCapacity: 29.6, staticCapacity: 15.3, limitSpeed: 9000, weight: 0.355 },
  { designation: '6307', boreDiameter: 35, outerDiameter: 80, width: 21, dynamicCapacity: 33.2, staticCapacity: 18.0, limitSpeed: 8000, weight: 0.460 },
  { designation: '6308', boreDiameter: 40, outerDiameter: 90, width: 23, dynamicCapacity: 41.0, staticCapacity: 22.4, limitSpeed: 7000, weight: 0.620 },
  { designation: '6309', boreDiameter: 45, outerDiameter: 100, width: 25, dynamicCapacity: 52.7, staticCapacity: 30.0, limitSpeed: 6300, weight: 0.820 },
  { designation: '6310', boreDiameter: 50, outerDiameter: 110, width: 27, dynamicCapacity: 61.8, staticCapacity: 36.0, limitSpeed: 5600, weight: 1.040 },
];

// ============================================================================
// COUPLING DATABASE
// ============================================================================

export interface CouplingData {
  type: string;
  nominalTorque: number; // Nm
  maxSpeed: number; // RPM
  angularMisalignment: number; // degrees
  parallelMisalignment: number; // mm
  axialMisalignment: number; // mm
  minBore: number; // mm
  maxBore: number; // mm
  torsionalStiffness: 'low' | 'medium' | 'high' | 'rigid';
  backlashFree: boolean;
}

export const couplingDatabase: CouplingData[] = [
  { type: 'rigid', nominalTorque: 1000, maxSpeed: 6000, angularMisalignment: 0, parallelMisalignment: 0, axialMisalignment: 0, minBore: 10, maxBore: 100, torsionalStiffness: 'rigid', backlashFree: true },
  { type: 'flexible-jaw', nominalTorque: 500, maxSpeed: 10000, angularMisalignment: 1.5, parallelMisalignment: 0.4, axialMisalignment: 3, minBore: 6, maxBore: 80, torsionalStiffness: 'medium', backlashFree: false },
  { type: 'flexible-disc', nominalTorque: 2000, maxSpeed: 15000, angularMisalignment: 1.0, parallelMisalignment: 0.5, axialMisalignment: 2, minBore: 10, maxBore: 150, torsionalStiffness: 'high', backlashFree: true },
  { type: 'gear', nominalTorque: 10000, maxSpeed: 5000, angularMisalignment: 1.5, parallelMisalignment: 0.3, axialMisalignment: 5, minBore: 20, maxBore: 200, torsionalStiffness: 'high', backlashFree: false },
  { type: 'grid', nominalTorque: 8000, maxSpeed: 4500, angularMisalignment: 0.5, parallelMisalignment: 0.8, axialMisalignment: 4, minBore: 20, maxBore: 180, torsionalStiffness: 'medium', backlashFree: false },
  { type: 'universal', nominalTorque: 3000, maxSpeed: 3000, angularMisalignment: 30, parallelMisalignment: 0, axialMisalignment: 10, minBore: 15, maxBore: 100, torsionalStiffness: 'medium', backlashFree: false },
  { type: 'oldham', nominalTorque: 200, maxSpeed: 8000, angularMisalignment: 0.5, parallelMisalignment: 3, axialMisalignment: 1, minBore: 6, maxBore: 60, torsionalStiffness: 'medium', backlashFree: false },
  { type: 'bellows', nominalTorque: 150, maxSpeed: 20000, angularMisalignment: 3, parallelMisalignment: 1.5, axialMisalignment: 4, minBore: 6, maxBore: 50, torsionalStiffness: 'high', backlashFree: true },
  { type: 'beam', nominalTorque: 50, maxSpeed: 25000, angularMisalignment: 5, parallelMisalignment: 0.5, axialMisalignment: 2, minBore: 3, maxBore: 25, torsionalStiffness: 'low', backlashFree: true },
];

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export interface ShaftDesignInput {
  diameter: number;
  innerDiameter?: number;
  length: number;
  material: string;
  torque: number; // Nm
  speed: number; // RPM
  bearingSpan: number;
  radialLoad?: number; // N
  axialLoad?: number; // N
  includeKeyway: boolean;
}

export interface ShaftDesignResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  torsionalShearStress: number; // MPa
  allowableShearStress: number; // MPa
  torsionalSafetyFactor: number;
  bendingStress: number; // MPa
  combinedStress: number; // MPa
  deflection: number; // mm
  deflectionRatio: number; // per unit span
  criticalSpeed: number; // RPM
  criticalSpeedRatio: number;
  polarMomentOfInertia: number; // mm^4
  sectionModulus: number; // mm^3
  keyway?: KeywaySize;
  recommendedDiameter?: number;
  stockDiameter: number;
  power: number; // kW
}

export function designShaft(input: ShaftDesignInput): ShaftDesignResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get material properties
  const material = shaftMaterials.find(m => m.id === input.material);
  if (!material) {
    errors.push(`Unknown material: ${input.material}`);
    return {
      isValid: false,
      errors,
      warnings,
      torsionalShearStress: 0,
      allowableShearStress: 0,
      torsionalSafetyFactor: 0,
      bendingStress: 0,
      combinedStress: 0,
      deflection: 0,
      deflectionRatio: 0,
      criticalSpeed: 0,
      criticalSpeedRatio: 0,
      polarMomentOfInertia: 0,
      sectionModulus: 0,
      stockDiameter: input.diameter + 2,
      power: 0,
    };
  }

  const d = input.diameter;
  const di = input.innerDiameter || 0;
  const L = input.bearingSpan;
  const T = input.torque * 1000; // Convert to N·mm
  const n = input.speed;
  const Fr = input.radialLoad || 0;

  // Calculate geometric properties
  const polarMomentOfInertia = (Math.PI / 32) * (Math.pow(d, 4) - Math.pow(di, 4)); // mm^4
  const momentOfInertia = polarMomentOfInertia / 2; // mm^4 (I = J/2 for circular section)
  const sectionModulus = (Math.PI / 32) * (Math.pow(d, 4) - Math.pow(di, 4)) / d; // mm^3

  // Torsional shear stress: τ = T * r / J = 16T / (πd³) for solid shaft
  const torsionalShearStress = (16 * T) / (Math.PI * (Math.pow(d, 3) - Math.pow(di, 3) * di / d)); // MPa

  // Allowable shear stress (typically 0.4 * yield for ductile materials)
  const allowableShearStress = 0.4 * material.yieldStrength;
  const torsionalSafetyFactor = allowableShearStress / torsionalShearStress;

  if (torsionalSafetyFactor < 1.5) {
    errors.push(`Torsional safety factor ${torsionalSafetyFactor.toFixed(2)} < 1.5 - increase diameter`);
  } else if (torsionalSafetyFactor < 2.0) {
    warnings.push(`Torsional safety factor ${torsionalSafetyFactor.toFixed(2)} is marginal - consider increasing diameter`);
  }

  // Bending stress from radial load (assuming simply supported)
  const bendingMoment = (Fr * L) / 4; // N·mm (max at center for point load at center)
  const bendingStress = (bendingMoment * d / 2) / momentOfInertia; // MPa

  // Combined stress using von Mises criterion
  const combinedStress = Math.sqrt(Math.pow(bendingStress, 2) + 3 * Math.pow(torsionalShearStress, 2));

  // Deflection (simplified - assumes simply supported beam with center load)
  const E = material.elasticModulus * 1000; // Convert GPa to MPa
  const deflection = (Fr * Math.pow(L, 3)) / (48 * E * momentOfInertia); // mm
  const deflectionRatio = deflection / L;

  if (deflectionRatio > 0.001) {
    warnings.push(`Deflection ratio ${(deflectionRatio * 1000).toFixed(3)} mm/m exceeds 1 mm/m guideline`);
  }

  // Critical speed (first mode, simply supported)
  // ωn = √(48EI / mL³) where m = ρAL (total mass)
  const area = (Math.PI / 4) * (Math.pow(d, 2) - Math.pow(di, 2)); // mm²
  const massPerLength = (material.density * area) / 1e9; // kg/mm
  const totalMass = massPerLength * L; // kg
  const stiffness = (48 * E * momentOfInertia) / Math.pow(L, 3); // N/mm
  const omega_n = Math.sqrt(stiffness / totalMass); // rad/s
  const criticalSpeed = (omega_n * 60) / (2 * Math.PI); // RPM
  const criticalSpeedRatio = n / criticalSpeed;

  if (criticalSpeedRatio > 0.8) {
    errors.push(`Operating speed ${n} RPM exceeds 80% of critical speed ${criticalSpeed.toFixed(0)} RPM`);
  } else if (criticalSpeedRatio > 0.7) {
    warnings.push(`Operating speed approaches critical speed - verify dynamics`);
  }

  // Find keyway size
  let keyway: KeywaySize | undefined;
  if (input.includeKeyway) {
    keyway = keywayStandard.find(k => d >= k.shaftDiameterMin && d <= k.shaftDiameterMax);
    if (!keyway) {
      warnings.push(`No standard keyway found for ${d}mm diameter`);
    }
  }

  // Recommend minimum diameter based on torque (ASME equation)
  // d = ((16 * SF * T) / (π * τallow))^(1/3)
  const SF = 2.0; // Design safety factor
  const recommendedDiameter = Math.pow((16 * SF * T) / (Math.PI * allowableShearStress), 1/3);

  if (d < recommendedDiameter) {
    errors.push(`Diameter ${d}mm below recommended ${recommendedDiameter.toFixed(1)}mm for SF=${SF}`);
  }

  // Stock diameter (add machining allowance)
  const stockDiameter = d + 2; // 1mm per side for machining

  // Calculate power
  const power = (T / 1000 * n * 2 * Math.PI) / 60000; // kW

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    torsionalShearStress,
    allowableShearStress,
    torsionalSafetyFactor,
    bendingStress,
    combinedStress,
    deflection,
    deflectionRatio,
    criticalSpeed,
    criticalSpeedRatio,
    polarMomentOfInertia,
    sectionModulus,
    keyway,
    recommendedDiameter,
    stockDiameter,
    power,
  };
}

export interface BearingSelectionInput {
  boreDiameter: number;
  radialLoad: number; // N
  axialLoad: number; // N
  operatingSpeed: number; // RPM
  designLife: number; // hours
  bearingType?: string;
}

export interface BearingSelectionResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selectedBearing?: BearingSize;
  equivalentLoad: number; // N
  calculatedLife: number; // hours
  lifeSafetyFactor: number;
  speedRatio: number;
  alternativeBearings: BearingSize[];
}

export function selectBearing(input: BearingSelectionInput): BearingSelectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find suitable bearings from database
  const allBearings = [...ballBearings6200Series, ...ballBearings6300Series];
  const suitableBearings = allBearings.filter(b => b.boreDiameter === input.boreDiameter);

  if (suitableBearings.length === 0) {
    // Find closest bore size
    const closestBore = allBearings.reduce((prev, curr) =>
      Math.abs(curr.boreDiameter - input.boreDiameter) < Math.abs(prev.boreDiameter - input.boreDiameter) ? curr : prev
    );
    warnings.push(`No bearing found for ${input.boreDiameter}mm bore. Closest available: ${closestBore.boreDiameter}mm`);
  }

  // Calculate equivalent dynamic load (ISO 281)
  // P = X*Fr + Y*Fa for ball bearings
  // Simplified: assuming X=1, Y=0 for pure radial, adjust based on Fa/Fr ratio
  const Fr = input.radialLoad;
  const Fa = input.axialLoad;
  let equivalentLoad: number;

  if (Fa <= 0) {
    equivalentLoad = Fr;
  } else {
    // For deep groove ball bearings, typical values
    const e = 0.22; // Load angle factor
    const faFrRatio = Fa / Fr;
    if (faFrRatio <= e) {
      equivalentLoad = Fr;
    } else {
      equivalentLoad = 0.56 * Fr + 1.6 * Fa;
    }
  }

  // Calculate required dynamic capacity for desired life
  // L10 = (C/P)^p * 10^6 / (60 * n)
  // C = P * (L10 * 60 * n / 10^6)^(1/p)
  const p = 3; // Ball bearing exponent
  const requiredCapacity = (equivalentLoad / 1000) * Math.pow(
    (input.designLife * 60 * input.operatingSpeed) / 1e6,
    1 / p
  ); // kN

  // Select bearing that meets requirements
  let selectedBearing: BearingSize | undefined;
  const alternativeBearings: BearingSize[] = [];

  for (const bearing of suitableBearings) {
    if (bearing.dynamicCapacity >= requiredCapacity && bearing.limitSpeed >= input.operatingSpeed) {
      if (!selectedBearing) {
        selectedBearing = bearing;
      } else {
        alternativeBearings.push(bearing);
      }
    }
  }

  if (!selectedBearing && suitableBearings.length > 0) {
    // Select largest available even if undersized
    selectedBearing = suitableBearings.reduce((prev, curr) =>
      curr.dynamicCapacity > prev.dynamicCapacity ? curr : prev
    );
    errors.push(`No bearing meets life requirement of ${input.designLife} hours. Selected ${selectedBearing.designation} may have shorter life.`);
  }

  // Calculate actual life with selected bearing
  let calculatedLife = 0;
  let lifeSafetyFactor = 0;
  let speedRatio = 0;

  if (selectedBearing) {
    const C = selectedBearing.dynamicCapacity * 1000; // N
    calculatedLife = Math.pow(C / equivalentLoad, p) * 1e6 / (60 * input.operatingSpeed);
    lifeSafetyFactor = calculatedLife / input.designLife;
    speedRatio = input.operatingSpeed / selectedBearing.limitSpeed;

    if (speedRatio > 1) {
      errors.push(`Operating speed ${input.operatingSpeed} RPM exceeds bearing limit ${selectedBearing.limitSpeed} RPM`);
    } else if (speedRatio > 0.8) {
      warnings.push(`Operating speed approaches bearing speed limit - consider higher precision class`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    selectedBearing,
    equivalentLoad,
    calculatedLife,
    lifeSafetyFactor,
    speedRatio,
    alternativeBearings,
  };
}

export interface CouplingSelectionInput {
  torque: number; // Nm
  speed: number; // RPM
  angularMisalignment: number; // degrees
  parallelMisalignment: number; // mm
  axialMisalignment: number; // mm
  boreDrive: number; // mm
  boreDriven: number; // mm
  backlashFree?: boolean;
  torsionalStiffness?: 'low' | 'medium' | 'high' | 'rigid';
  serviceFactor?: number;
}

export interface CouplingSelectionResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  selectedCoupling?: CouplingData;
  designTorque: number; // Nm (with service factor)
  alternatives: CouplingData[];
}

export function selectCoupling(input: CouplingSelectionInput): CouplingSelectionResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Apply service factor (default 1.5 for general machinery)
  const serviceFactor = input.serviceFactor || 1.5;
  const designTorque = input.torque * serviceFactor;

  // Filter couplings by requirements
  const maxBore = Math.max(input.boreDrive, input.boreDriven);
  const minBore = Math.min(input.boreDrive, input.boreDriven);

  const suitableCouplings = couplingDatabase.filter(c => {
    // Check torque capacity
    if (c.nominalTorque < designTorque) return false;

    // Check speed
    if (c.maxSpeed < input.speed) return false;

    // Check bore range
    if (c.minBore > minBore || c.maxBore < maxBore) return false;

    // Check misalignment capability
    if (c.angularMisalignment < input.angularMisalignment) return false;
    if (c.parallelMisalignment < input.parallelMisalignment) return false;
    if (c.axialMisalignment < input.axialMisalignment) return false;

    // Check backlash-free requirement
    if (input.backlashFree && !c.backlashFree) return false;

    // Check stiffness preference
    if (input.torsionalStiffness && c.torsionalStiffness !== input.torsionalStiffness) return false;

    return true;
  });

  // Sort by torque capacity (select smallest adequate coupling)
  suitableCouplings.sort((a, b) => a.nominalTorque - b.nominalTorque);

  const selectedCoupling = suitableCouplings[0];
  const alternatives = suitableCouplings.slice(1, 4);

  if (!selectedCoupling) {
    errors.push('No coupling found that meets all requirements');

    // Provide diagnostic info
    const torqueSuitable = couplingDatabase.filter(c => c.nominalTorque >= designTorque);
    if (torqueSuitable.length === 0) {
      errors.push(`Design torque ${designTorque.toFixed(0)} Nm exceeds all available couplings`);
    }

    const misalignmentSuitable = couplingDatabase.filter(c =>
      c.angularMisalignment >= input.angularMisalignment &&
      c.parallelMisalignment >= input.parallelMisalignment
    );
    if (misalignmentSuitable.length === 0) {
      errors.push(`Misalignment requirements exceed available couplings`);
    }
  } else {
    // Check if rigid coupling selected with misalignment
    if (selectedCoupling.type === 'rigid' && (input.angularMisalignment > 0.1 || input.parallelMisalignment > 0.1)) {
      warnings.push('Rigid coupling selected but misalignment specified - ensure precise alignment');
    }

    // Check torque utilization
    const torqueUtilization = designTorque / selectedCoupling.nominalTorque;
    if (torqueUtilization > 0.9) {
      warnings.push(`Coupling at ${(torqueUtilization * 100).toFixed(0)}% capacity - consider next size up`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    selectedCoupling,
    designTorque,
    alternatives,
  };
}

/**
 * Get keyway size for a given shaft diameter
 */
export function getKeywaySize(shaftDiameter: number): KeywaySize | undefined {
  return keywayStandard.find(k =>
    shaftDiameter >= k.shaftDiameterMin && shaftDiameter <= k.shaftDiameterMax
  );
}

/**
 * Get shaft material properties
 */
export function getShaftMaterial(materialId: string): ShaftMaterial | undefined {
  return shaftMaterials.find(m => m.id === materialId);
}

/**
 * Calculate power from torque and speed
 */
export function calculatePower(torqueNm: number, speedRpm: number): number {
  return (torqueNm * speedRpm * 2 * Math.PI) / 60000; // kW
}

/**
 * Calculate torque from power and speed
 */
export function calculateTorque(powerKw: number, speedRpm: number): number {
  return (powerKw * 60000) / (speedRpm * 2 * Math.PI); // Nm
}
