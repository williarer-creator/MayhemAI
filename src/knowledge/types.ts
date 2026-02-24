/**
 * Knowledge Base Types
 *
 * Defines how engineering knowledge is represented in the system.
 * All measurements in millimeters unless otherwise specified.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
}

export type Units = 'mm' | 'cm' | 'm' | 'in' | 'ft';

// =============================================================================
// KNOWLEDGE DOMAIN
// =============================================================================

export interface KnowledgeDomain {
  id: string;
  name: string;
  description: string;
  elements: ElementDefinition[];
}

export interface ElementDefinition {
  id: string;
  name: string;
  description: string;

  /** What this element connects (e.g., "floor-to-elevation", "point-to-point") */
  connectionType: ConnectionType;

  /** Parameters that define this element */
  parameters: ParameterDefinition[];

  /** Rules and constraints that must be satisfied */
  rules: Rule[];

  /** Available material options */
  materials: string[];

  /** Sub-components that make up this element */
  components: ComponentDefinition[];
}

export type ConnectionType =
  | 'elevation-change'      // floor to higher floor (stairs, ramps, ladders)
  | 'horizontal-span'       // across a gap (walkways, bridges)
  | 'point-to-point'        // generic A to B (pipes, ducts)
  | 'surface-mount'         // attached to a surface (brackets, guards)
  | 'volume-enclosure';     // surrounding a volume (housings, guards)

export interface ParameterDefinition {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'point' | 'vector';
  unit?: Units;
  default?: number | string | boolean;
  min?: number;
  max?: number;
  options?: string[];  // For 'select' type
  required: boolean;
  description: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: 'constraint' | 'recommendation' | 'calculation';

  /** Standard this rule comes from (e.g., "IBC 2021", "OSHA 1910.25") */
  source?: string;

  /** The rule expression or calculation */
  expression: RuleExpression;

  /** Error message if rule is violated */
  errorMessage?: string;
}

export type RuleExpression =
  | { type: 'range'; param: string; min?: number; max?: number }
  | { type: 'ratio'; param1: string; param2: string; min?: number; max?: number }
  | { type: 'formula'; formula: string; result: string }
  | { type: 'conditional'; condition: string; then: RuleExpression; else?: RuleExpression }
  | { type: 'required-if'; param: string; condition: string };

export interface ComponentDefinition {
  id: string;
  name: string;
  type: 'structural' | 'surface' | 'fastener' | 'accessory';
  required: boolean;
  quantity: 'single' | 'per-unit' | 'calculated';
  quantityFormula?: string;
  parameters: ParameterDefinition[];
}

// =============================================================================
// MATERIALS
// =============================================================================

export interface Material {
  id: string;
  name: string;
  type: 'steel' | 'stainless' | 'aluminum' | 'wood' | 'concrete' | 'composite';

  /** Standard designations (e.g., "A36", "6061-T6") */
  grades: MaterialGrade[];

  /** Available stock shapes */
  shapes: StockShape[];

  properties: MaterialProperties;
}

export interface MaterialGrade {
  id: string;
  name: string;
  standard: string;  // e.g., "ASTM A36"
  properties: MaterialProperties;
}

export interface MaterialProperties {
  density: number;           // kg/m³
  yieldStrength: number;     // MPa
  tensileStrength: number;   // MPa
  elasticModulus: number;    // GPa
  poissonsRatio: number;
  thermalExpansion?: number; // µm/m·K
  corrosionResistance: 'poor' | 'fair' | 'good' | 'excellent';
  weldability: 'poor' | 'fair' | 'good' | 'excellent';
  machinability: 'poor' | 'fair' | 'good' | 'excellent';
  costFactor: number;        // Relative cost (steel = 1.0)
}

export interface StockShape {
  id: string;
  type: 'plate' | 'sheet' | 'tube-round' | 'tube-square' | 'tube-rect' |
        'angle' | 'channel' | 'i-beam' | 'bar-round' | 'bar-flat' | 'bar-square';
  sizes: StockSize[];
}

export interface StockSize {
  designation: string;       // e.g., "W8x31", "2x2x0.25"
  dimensions: Record<string, number>;  // width, height, thickness, etc.
  weightPerLength?: number;  // kg/m
  area?: number;             // mm²
  momentOfInertia?: { x: number; y: number };  // mm⁴
  sectionModulus?: { x: number; y: number };   // mm³
}

// =============================================================================
// STANDARDS
// =============================================================================

export interface Standard {
  id: string;
  name: string;
  organization: string;      // e.g., "ICC", "OSHA", "ISO"
  version: string;
  region: 'US' | 'EU' | 'UK' | 'international';

  /** Sections of the standard that we implement */
  sections: StandardSection[];
}

export interface StandardSection {
  id: string;
  reference: string;         // e.g., "1011.5.2"
  title: string;
  requirements: StandardRequirement[];
}

export interface StandardRequirement {
  id: string;
  description: string;
  type: 'mandatory' | 'recommended';
  applies_to: string[];      // Element types this applies to
  rule: RuleExpression;
}

// =============================================================================
// MANUFACTURING
// =============================================================================

export interface ManufacturingProcess {
  id: string;
  name: string;
  type: 'cutting' | 'forming' | 'joining' | 'finishing';

  capabilities: ProcessCapabilities;

  /** Materials this process can handle */
  materials: string[];

  /** Output file formats this process uses */
  outputFormats: string[];
}

export interface ProcessCapabilities {
  minThickness?: number;     // mm
  maxThickness?: number;     // mm
  minFeatureSize?: number;   // mm
  tolerance: number;         // mm
  surfaceFinish?: number;    // Ra µm
  maxSize?: { x: number; y: number; z: number };
}

// =============================================================================
// SOLUTION
// =============================================================================

export interface EngineeringSolution {
  id: string;
  domain: string;
  element: string;

  /** Input points/constraints */
  inputs: {
    pointA: Point3D;
    pointB: Point3D;
    environment?: EnvironmentData;
    constraints: Record<string, unknown>;
  };

  /** Resolved parameters */
  parameters: Record<string, number | string | boolean>;

  /** Generated components */
  components: GeneratedComponent[];

  /** Validation results */
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    rulesChecked: { rule: string; passed: boolean; message?: string }[];
  };

  /** Manufacturing outputs */
  manufacturing: {
    cutList: CutListItem[];
    totalWeight: number;
    totalCost?: number;
    processes: string[];
  };
}

export interface EnvironmentData {
  boundingBox: BoundingBox3D;
  obstacles: Obstacle[];
  surfaces: Surface[];
  clearances: { direction: Vector3D; distance: number }[];
}

export interface Obstacle {
  id: string;
  type: 'box' | 'cylinder' | 'mesh';
  position: Point3D;
  dimensions: Record<string, number>;
  avoidanceMargin: number;   // mm
}

export interface Surface {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'equipment';
  plane: { point: Point3D; normal: Vector3D };
  bounds: Point3D[];         // Polygon vertices
  canAttach: boolean;
  loadCapacity?: number;     // kg
}

export interface GeneratedComponent {
  id: string;
  name: string;
  material: string;
  shape: string;

  /** Position in assembly */
  position: Point3D;
  rotation: Vector3D;        // Euler angles in degrees

  /** Geometry reference (OpenCascade shape ID) */
  shapeId?: string;

  /** Dimensions */
  dimensions: Record<string, number>;

  /** Connection to other components */
  connections: { to: string; type: 'welded' | 'bolted' | 'anchored' }[];

  /** Cut list items for manufacturing */
  cutList?: ComponentCutListItem[];
}

export interface ComponentCutListItem {
  description: string;
  material: string;
  profile: string;
  quantity: number;
  length: number;
  width?: number;
  weight: number;
  notes?: string;
}

export interface CutListItem {
  id: string;
  component: string;
  material: string;
  stockShape: string;
  stockSize: string;
  quantity: number;
  cutLength: number;         // mm
  operations: CutOperation[];
  weight: number;            // kg
}

export interface CutOperation {
  type: 'cut' | 'drill' | 'notch' | 'cope' | 'miter' | 'bend';
  position?: number;         // mm from start
  parameters: Record<string, number>;
}
