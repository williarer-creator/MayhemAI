/**
 * MachinistCAD Core Types
 * Manufacturing-first type definitions
 */

// ============================================================================
// COORDINATE SYSTEMS - The heart of manufacturing-first design
// ============================================================================

/**
 * Machine types with their standard coordinate orientations
 *
 * MILL (VMC - Vertical Machining Center):
 *   Z+ = Spindle UP (away from table)
 *   X+ = Table RIGHT (operator view)
 *   Y+ = Table BACK (away from operator)
 *
 * LATHE:
 *   Z+ = Along spindle axis (toward tailstock)
 *   X+ = Cross-slide toward operator (diameter value)
 *   Y  = Not typically used (some mill-turn machines)
 *
 * 3D_PRINTER (FDM/SLA):
 *   Z+ = Nozzle/platform UP
 *   X+ = RIGHT
 *   Y+ = BACK
 *
 * CAD_STANDARD (traditional CAD - what SolidWorks does wrong):
 *   Often Y+ = UP, which doesn't match any real machine
 */
export type MachineType = 'mill' | 'lathe' | '3d_printer' | 'cad_standard';

export interface CoordinateSystem {
  type: MachineType;
  /** Which world axis points "up" in this system */
  upAxis: 'x' | 'y' | 'z';
  /** Sign of the up direction (+1 or -1) */
  upSign: 1 | -1;
  /** Human-readable description */
  description: string;
  /** Transform matrix to convert from internal (Z-up) to this system */
  toSystemMatrix: Float32Array;
  /** Transform matrix to convert from this system to internal (Z-up) */
  fromSystemMatrix: Float32Array;
}

export const COORDINATE_SYSTEMS: Record<MachineType, CoordinateSystem> = {
  mill: {
    type: 'mill',
    upAxis: 'z',
    upSign: 1,
    description: 'Mill/VMC: Z+ up, X+ right, Y+ back',
    toSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]),
    fromSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]),
  },
  lathe: {
    type: 'lathe',
    upAxis: 'x',
    upSign: 1,
    description: 'Lathe: Z+ toward tailstock, X+ is diameter',
    toSystemMatrix: new Float32Array([
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ]),
    fromSystemMatrix: new Float32Array([
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1,
    ]),
  },
  '3d_printer': {
    type: '3d_printer',
    upAxis: 'z',
    upSign: 1,
    description: '3D Printer: Z+ up, X+ right, Y+ back',
    toSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]),
    fromSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]),
  },
  cad_standard: {
    type: 'cad_standard',
    upAxis: 'y',
    upSign: 1,
    description: 'Traditional CAD: Y+ up (not recommended)',
    // Rotate -90 degrees around X to convert Z-up to Y-up
    toSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 0, -1, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ]),
    fromSystemMatrix: new Float32Array([
      1, 0, 0, 0,
      0, 0, 1, 0,
      0, -1, 0, 0,
      0, 0, 0, 1,
    ]),
  },
};

// ============================================================================
// GEOMETRY TYPES
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

export interface MeshData {
  /** Flat array of vertex positions [x,y,z, x,y,z, ...] */
  positions: Float32Array;
  /** Flat array of vertex normals [nx,ny,nz, ...] */
  normals: Float32Array;
  /** Triangle indices */
  indices: Uint32Array;
  /** Bounding box for quick culling */
  bounds: BoundingBox;
}

// ============================================================================
// FEATURE TREE
// ============================================================================

export type FeatureType =
  | 'sketch'
  | 'extrude'
  | 'revolve'
  | 'hole'
  | 'fillet'
  | 'chamfer'
  | 'shell'
  | 'boolean'
  | 'pattern';

export interface Feature {
  id: string;
  type: FeatureType;
  name: string;
  /** IDs of features this depends on */
  dependencies: string[];
  /** Feature-specific parameters */
  params: Record<string, unknown>;
  /** Is this feature suppressed? */
  suppressed: boolean;
  /** Cached mesh for this feature's result (null if needs rebuild) */
  cachedMesh: MeshData | null;
}

// ============================================================================
// WORKER MESSAGES - Multi-threading communication
// ============================================================================

export type WorkerMessageType =
  | 'init'
  | 'compute'
  | 'mesh'
  | 'export'
  | 'analyze'
  | 'cancel';

export interface WorkerRequest {
  id: string;
  type: WorkerMessageType;
  payload: unknown;
}

export interface WorkerResponse {
  id: string;
  type: WorkerMessageType;
  success: boolean;
  payload?: unknown;
  error?: string;
  /** Progress 0-100 for long operations */
  progress?: number;
}

// ============================================================================
// MANUFACTURING ANALYSIS
// ============================================================================

export type ManufacturingMethod =
  | 'milling_3axis'
  | 'milling_5axis'
  | 'turning'
  | 'turn_mill'
  | 'fdm_printing'
  | 'sla_printing'
  | 'sheet_metal'
  | 'casting'
  | 'unknown';

export interface ManufacturingAnalysis {
  /** Suggested primary manufacturing method */
  suggestedMethod: ManufacturingMethod;
  /** Confidence score 0-1 */
  confidence: number;
  /** Alternative methods that could work */
  alternatives: ManufacturingMethod[];
  /** Suggested orientation for this method */
  suggestedOrientation: {
    rotation: Vector3; // Euler angles in radians
    description: string;
  };
  /** Issues detected */
  warnings: string[];
  /** Features that inform this analysis */
  analyzedFeatures: {
    hasRevolutionSymmetry: boolean;
    hasPockets: boolean;
    hasOverhangs: boolean;
    hasThinWalls: boolean;
    hasThreads: boolean;
    maxAspectRatio: number;
  };
}

// ============================================================================
// APPLICATION STATE
// ============================================================================

export interface ModelState {
  id: string;
  name: string;
  /** Active coordinate system */
  coordinateSystem: MachineType;
  /** Feature tree */
  features: Feature[];
  /** Current selection */
  selection: string[];
  /** Undo stack */
  undoStack: unknown[];
  /** Redo stack */
  redoStack: unknown[];
}

export interface AppState {
  /** Currently open model */
  model: ModelState | null;
  /** Default coordinate system for new models */
  defaultCoordinateSystem: MachineType;
  /** Is geometry kernel initialized? */
  kernelReady: boolean;
  /** Active long-running operations */
  pendingOperations: Map<string, { type: string; progress: number }>;
}
