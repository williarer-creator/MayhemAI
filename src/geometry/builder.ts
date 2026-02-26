/**
 * Geometry Builder Framework
 *
 * Base classes and utilities for building 3D geometry from knowledge elements.
 */

import * as kernel from '../core/kernel';
import type {
  GeometryResult,
  AssemblyResult,
  BuilderContext,
  ValidationResult,
  ValidationIssue,
  ConnectionPoint,
  ClearanceCheck,
  AssemblyConnection,
  GeometryBuilder,
} from './types';
import { getMaterialDensity } from './types';
import type { Point3D, Vector3D } from '../knowledge/types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

let geometryCounter = 0;

export function generateGeometryId(prefix: string = 'geo'): string {
  return `${prefix}_${Date.now()}_${++geometryCounter}`;
}

export function calculateWeight(volumeMm3: number, materialId: string): number {
  const density = getMaterialDensity(materialId);
  // Volume in mm³, density in kg/m³ -> weight in kg
  return (volumeMm3 / 1e9) * density;
}

export function distance3D(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

export function midpoint3D(p1: Point3D, p2: Point3D): Point3D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2,
  };
}

export function vectorFromPoints(from: Point3D, to: Point3D): Vector3D {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
    z: to.z - from.z,
  };
}

export function normalizeVector(v: Vector3D): Vector3D {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (mag === 0) return { x: 0, y: 0, z: 1 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

export function angleFromVector(v: Vector3D): Vector3D {
  const normalized = normalizeVector(v);
  // Calculate Euler angles (simplified)
  const pitch = Math.asin(-normalized.y) * (180 / Math.PI);
  const yaw = Math.atan2(normalized.x, normalized.z) * (180 / Math.PI);
  return { x: pitch, y: yaw, z: 0 };
}

// ============================================================================
// BASE GEOMETRY BUILDER
// ============================================================================

export abstract class BaseGeometryBuilder<TInput = Record<string, unknown>>
  implements GeometryBuilder<TInput>
{
  abstract elementType: string;

  abstract build(context: BuilderContext, input: TInput): Promise<GeometryResult>;

  validate(_context: BuilderContext, _input: TInput): ValidationResult {
    // Default validation - override in subclasses
    return {
      valid: true,
      errors: [],
      warnings: [],
      clearanceChecks: [],
    };
  }

  estimateBuildTime(_context: BuilderContext, _input: TInput): number {
    // Default estimate in milliseconds
    return 1000;
  }

  protected async createGeometryResult(
    shapeId: string,
    name: string,
    material: string,
    metadata: Record<string, unknown> = {}
  ): Promise<GeometryResult> {
    // Get properties from kernel
    const bounds = await kernel.getBoundingBox(shapeId);
    const massProps = await kernel.getMassProperties(shapeId);
    const weight = calculateWeight(massProps.volume, material);

    return {
      id: generateGeometryId(this.elementType),
      shapeId,
      name,
      elementType: this.elementType,
      bounds: {
        min: bounds.min,
        max: bounds.max,
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      properties: {
        volume: massProps.volume,
        surfaceArea: massProps.surfaceArea,
        weight,
        centerOfMass: massProps.centerOfMass,
      },
      material,
      metadata,
    };
  }

  protected reportProgress(
    context: BuilderContext,
    progress: number,
    message: string
  ): void {
    context.options?.onProgress?.(progress, message);
  }
}

// ============================================================================
// ASSEMBLY BUILDER IMPLEMENTATION
// ============================================================================

export class GeometryAssemblyBuilder {
  /**
   * Build an assembly from multiple geometry results
   */
  async buildAssembly(
    name: string,
    components: GeometryResult[],
    _connections: AssemblyConnection[] = []
  ): Promise<AssemblyResult> {
    if (components.length === 0) {
      throw new Error('Cannot create assembly with no components');
    }

    // Calculate overall bounds
    const bounds = this.calculateCombinedBounds(components);

    // Calculate total weight
    const totalWeight = components.reduce((sum, c) => sum + c.properties.weight, 0);

    // Collect all connection points
    const connectionPoints: ConnectionPoint[] = [];
    // Connection points would be extracted from components

    // Validate assembly
    const validation = await this.validateAssembly({
      id: generateGeometryId('asm'),
      name,
      components,
      bounds,
      totalWeight,
      connectionPoints,
      validation: { valid: true, errors: [], warnings: [], clearanceChecks: [] },
    });

    return {
      id: generateGeometryId('asm'),
      name,
      components,
      bounds,
      totalWeight,
      connectionPoints,
      validation,
    };
  }

  /**
   * Combine all components into a single shape
   */
  async combineComponents(assembly: AssemblyResult): Promise<string> {
    if (assembly.components.length === 0) {
      throw new Error('No components to combine');
    }

    if (assembly.components.length === 1) {
      return assembly.components[0].shapeId;
    }

    // Union all shapes together
    let combinedShapeId = assembly.components[0].shapeId;

    for (let i = 1; i < assembly.components.length; i++) {
      const result = await kernel.booleanUnion(
        combinedShapeId,
        assembly.components[i].shapeId
      );
      combinedShapeId = result.shapeId;
    }

    return combinedShapeId;
  }

  /**
   * Add a component to an existing assembly
   */
  async addComponent(
    assembly: AssemblyResult,
    component: GeometryResult,
    _connection?: AssemblyConnection
  ): Promise<AssemblyResult> {
    const newComponents = [...assembly.components, component];
    const bounds = this.calculateCombinedBounds(newComponents);
    const totalWeight = newComponents.reduce((sum, c) => sum + c.properties.weight, 0);

    const validation = await this.validateAssembly({
      ...assembly,
      components: newComponents,
      bounds,
      totalWeight,
    });

    return {
      ...assembly,
      components: newComponents,
      bounds,
      totalWeight,
      validation,
    };
  }

  /**
   * Validate an assembly for clearances and interference
   */
  async validateAssembly(assembly: AssemblyResult): Promise<ValidationResult> {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const clearanceChecks: ClearanceCheck[] = [];

    // Check for interference between components
    for (let i = 0; i < assembly.components.length; i++) {
      for (let j = i + 1; j < assembly.components.length; j++) {
        const c1 = assembly.components[i];
        const c2 = assembly.components[j];

        try {
          const measurement = await kernel.measureDistance(c1.shapeId, c2.shapeId);

          const check: ClearanceCheck = {
            component1: c1.id,
            component2: c2.id,
            minDistance: measurement.distance,
            requiredClearance: 0, // Minimum clearance
            passed: measurement.distance >= 0,
            closestPoints: [measurement.point1, measurement.point2],
          };

          clearanceChecks.push(check);

          if (measurement.distance < 0) {
            errors.push({
              code: 'INTERFERENCE',
              severity: 'error',
              message: `Interference detected between ${c1.name} and ${c2.name}`,
              affectedComponents: [c1.id, c2.id],
            });
          } else if (measurement.distance < 1) {
            warnings.push({
              code: 'LOW_CLEARANCE',
              severity: 'warning',
              message: `Low clearance (${measurement.distance.toFixed(2)}mm) between ${c1.name} and ${c2.name}`,
              affectedComponents: [c1.id, c2.id],
            });
          }
        } catch (error) {
          warnings.push({
            code: 'MEASUREMENT_FAILED',
            severity: 'warning',
            message: `Could not measure distance between ${c1.name} and ${c2.name}`,
            affectedComponents: [c1.id, c2.id],
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      clearanceChecks,
    };
  }

  private calculateCombinedBounds(
    components: GeometryResult[]
  ): { min: Point3D; max: Point3D } {
    if (components.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    const min = { ...components[0].bounds.min };
    const max = { ...components[0].bounds.max };

    for (const component of components) {
      min.x = Math.min(min.x, component.bounds.min.x);
      min.y = Math.min(min.y, component.bounds.min.y);
      min.z = Math.min(min.z, component.bounds.min.z);
      max.x = Math.max(max.x, component.bounds.max.x);
      max.y = Math.max(max.y, component.bounds.max.y);
      max.z = Math.max(max.z, component.bounds.max.z);
    }

    return { min, max };
  }
}

// ============================================================================
// BUILDER REGISTRY
// ============================================================================

const builderRegistry = new Map<string, GeometryBuilder>();

export function registerBuilder(builder: GeometryBuilder): void {
  builderRegistry.set(builder.elementType, builder);
}

export function getBuilder(elementType: string): GeometryBuilder | undefined {
  return builderRegistry.get(elementType);
}

export function getAllBuilders(): GeometryBuilder[] {
  return Array.from(builderRegistry.values());
}

// Export assembly builder singleton
export const assemblyBuilder = new GeometryAssemblyBuilder();
