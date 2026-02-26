/**
 * Geometry Generation Types
 *
 * Common types for parametric geometry generation from knowledge elements.
 */

import type { Point3D, Vector3D } from '../knowledge/types';

// ============================================================================
// GEOMETRY RESULT TYPES
// ============================================================================

export interface GeometryResult {
  /** Unique identifier for this geometry */
  id: string;

  /** Shape ID from OpenCascade kernel */
  shapeId: string;

  /** Human-readable name */
  name: string;

  /** Element type that generated this */
  elementType: string;

  /** Bounding box */
  bounds: {
    min: Point3D;
    max: Point3D;
  };

  /** Transform from origin */
  transform: {
    position: Point3D;
    rotation: Vector3D; // Euler angles in degrees
  };

  /** Mass properties */
  properties: {
    volume: number; // mm³
    surfaceArea: number; // mm²
    weight: number; // kg (calculated from material density)
    centerOfMass: Point3D;
  };

  /** Material assignment */
  material: string;

  /** Sub-components (for assemblies) */
  children?: GeometryResult[];

  /** Metadata from knowledge element */
  metadata: Record<string, unknown>;
}

export interface AssemblyResult {
  /** Assembly identifier */
  id: string;

  /** Assembly name */
  name: string;

  /** All component geometries */
  components: GeometryResult[];

  /** Combined shape ID (union of all components) */
  combinedShapeId?: string;

  /** Overall bounding box */
  bounds: {
    min: Point3D;
    max: Point3D;
  };

  /** Total weight */
  totalWeight: number;

  /** Connection points for joining to other assemblies */
  connectionPoints: ConnectionPoint[];

  /** Validation results */
  validation: ValidationResult;
}

export interface ConnectionPoint {
  id: string;
  type: 'bolt-hole' | 'weld-point' | 'anchor' | 'bearing-surface' | 'mating-face';
  position: Point3D;
  normal: Vector3D;
  parameters: Record<string, number | string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  clearanceChecks: ClearanceCheck[];
}

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: Point3D;
  affectedComponents?: string[];
}

export interface ClearanceCheck {
  component1: string;
  component2: string;
  minDistance: number;
  requiredClearance: number;
  passed: boolean;
  closestPoints?: [Point3D, Point3D];
}

// ============================================================================
// BUILDER INPUT TYPES
// ============================================================================

export interface BuilderContext {
  /** Starting point (Point A) */
  pointA: Point3D;

  /** Ending point (Point B) */
  pointB: Point3D;

  /** Environment constraints */
  environment?: EnvironmentContext;

  /** Material selection */
  material: string;

  /** Parameters from knowledge element */
  parameters: Record<string, number | string | boolean>;

  /** Options for geometry generation */
  options?: BuilderOptions;
}

export interface EnvironmentContext {
  /** Available space bounding box */
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };

  /** Obstacles to avoid */
  obstacles: Obstacle[];

  /** Attachment surfaces */
  surfaces: AttachmentSurface[];

  /** Required clearances */
  clearances: {
    minimum: number;
    preferred: number;
  };
}

export interface Obstacle {
  id: string;
  shapeId?: string;
  bounds: {
    min: Point3D;
    max: Point3D;
  };
  avoidanceMargin: number;
}

export interface AttachmentSurface {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'beam' | 'column';
  position: Point3D;
  normal: Vector3D;
  bounds: Point3D[]; // Polygon vertices
  loadCapacity: number; // kg
}

export interface BuilderOptions {
  /** Level of detail for mesh generation */
  meshQuality: 'low' | 'medium' | 'high';

  /** Whether to generate connection points */
  generateConnections: boolean;

  /** Whether to validate during build */
  validateDuringBuild: boolean;

  /** Progress callback */
  onProgress?: (progress: number, message: string) => void;
}

// ============================================================================
// MATERIAL PROPERTIES FOR WEIGHT CALCULATION
// ============================================================================

export interface MaterialDensity {
  id: string;
  density: number; // kg/m³
}

export const materialDensities: MaterialDensity[] = [
  { id: 'mild-steel', density: 7850 },
  { id: 'stainless-304', density: 8000 },
  { id: 'stainless-316', density: 8000 },
  { id: 'aluminum-6061', density: 2700 },
  { id: 'aluminum-7075', density: 2810 },
  { id: 'cast-iron', density: 7200 },
  { id: 'carbon-steel', density: 7850 },
  { id: 'galvanized', density: 7850 },
  { id: 'wood-pine', density: 500 },
  { id: 'wood-oak', density: 750 },
  { id: 'concrete', density: 2400 },
  { id: 'plastic-abs', density: 1050 },
  { id: 'plastic-hdpe', density: 970 },
];

export function getMaterialDensity(materialId: string): number {
  const material = materialDensities.find(m => m.id === materialId);
  return material?.density ?? 7850; // Default to steel
}

// ============================================================================
// BUILDER INTERFACE
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GeometryBuilder<TInput = any> {
  /** Element type this builder handles */
  elementType: string;

  /** Build geometry from parameters */
  build(context: BuilderContext, input: TInput): Promise<GeometryResult>;

  /** Validate input before building */
  validate(context: BuilderContext, input: TInput): ValidationResult;

  /** Get estimated build time */
  estimateBuildTime(context: BuilderContext, input: TInput): number;
}

export interface AssemblyBuilder {
  /** Build an assembly from multiple elements */
  buildAssembly(
    name: string,
    components: GeometryResult[],
    connections?: AssemblyConnection[]
  ): Promise<AssemblyResult>;

  /** Add component to existing assembly */
  addComponent(
    assembly: AssemblyResult,
    component: GeometryResult,
    connection?: AssemblyConnection
  ): Promise<AssemblyResult>;

  /** Validate assembly */
  validateAssembly(assembly: AssemblyResult): Promise<ValidationResult>;
}

export interface AssemblyConnection {
  from: {
    componentId: string;
    connectionPointId: string;
  };
  to: {
    componentId: string;
    connectionPointId: string;
  };
  type: 'bolted' | 'welded' | 'pinned' | 'anchored';
}
