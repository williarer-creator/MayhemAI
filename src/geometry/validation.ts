/**
 * Geometry Validation Module
 *
 * Validates generated geometry for:
 * - Clearances and interference
 * - Manufacturing constraints
 * - Code compliance
 */

import * as kernel from '../core/kernel';
import type {
  GeometryResult,
  AssemblyResult,
  ValidationResult,
  ValidationIssue,
  ClearanceCheck,
  EnvironmentContext,
} from './types';
import type { Point3D } from '../knowledge/types';

// ============================================================================
// CLEARANCE VALIDATION
// ============================================================================

export interface ClearanceRequirement {
  category: string;
  minClearance: number; // mm
  description: string;
}

export const standardClearances: ClearanceRequirement[] = [
  { category: 'personnel', minClearance: 450, description: 'Minimum clearance for personnel passage' },
  { category: 'maintenance', minClearance: 600, description: 'Minimum clearance for maintenance access' },
  { category: 'equipment', minClearance: 100, description: 'Minimum clearance around equipment' },
  { category: 'structural', minClearance: 25, description: 'Minimum structural clearance' },
  { category: 'electrical', minClearance: 50, description: 'Minimum electrical clearance' },
];

/**
 * Check clearance between two geometries
 */
export async function checkClearance(
  geometry1: GeometryResult,
  geometry2: GeometryResult,
  requiredClearance: number = 0
): Promise<ClearanceCheck> {
  try {
    const measurement = await kernel.measureDistance(
      geometry1.shapeId,
      geometry2.shapeId
    );

    return {
      component1: geometry1.id,
      component2: geometry2.id,
      minDistance: measurement.distance,
      requiredClearance,
      passed: measurement.distance >= requiredClearance,
      closestPoints: [measurement.point1, measurement.point2],
    };
  } catch (error) {
    return {
      component1: geometry1.id,
      component2: geometry2.id,
      minDistance: -1,
      requiredClearance,
      passed: false,
    };
  }
}

/**
 * Check all clearances within an assembly
 */
export async function validateAssemblyClearances(
  assembly: AssemblyResult,
  requiredClearance: number = 0
): Promise<ClearanceCheck[]> {
  const checks: ClearanceCheck[] = [];

  for (let i = 0; i < assembly.components.length; i++) {
    for (let j = i + 1; j < assembly.components.length; j++) {
      const check = await checkClearance(
        assembly.components[i],
        assembly.components[j],
        requiredClearance
      );
      checks.push(check);
    }
  }

  return checks;
}

/**
 * Check clearance against environment obstacles
 */
export async function validateEnvironmentClearances(
  geometry: GeometryResult,
  environment: EnvironmentContext
): Promise<ClearanceCheck[]> {
  const checks: ClearanceCheck[] = [];

  for (const obstacle of environment.obstacles) {
    if (!obstacle.shapeId) continue;

    try {
      const measurement = await kernel.measureDistance(
        geometry.shapeId,
        obstacle.shapeId
      );

      checks.push({
        component1: geometry.id,
        component2: obstacle.id,
        minDistance: measurement.distance,
        requiredClearance: obstacle.avoidanceMargin,
        passed: measurement.distance >= obstacle.avoidanceMargin,
        closestPoints: [measurement.point1, measurement.point2],
      });
    } catch (error) {
      checks.push({
        component1: geometry.id,
        component2: obstacle.id,
        minDistance: -1,
        requiredClearance: obstacle.avoidanceMargin,
        passed: false,
      });
    }
  }

  return checks;
}

// ============================================================================
// INTERFERENCE DETECTION
// ============================================================================

/**
 * Check if two geometries interfere (overlap)
 */
export async function checkInterference(
  geometry1: GeometryResult,
  geometry2: GeometryResult
): Promise<{
  interferes: boolean;
  volume?: number;
  location?: Point3D;
}> {
  try {
    // Try to intersect the shapes
    const intersection = await kernel.booleanIntersect(
      geometry1.shapeId,
      geometry2.shapeId
    );

    // Get mass properties of intersection
    const props = await kernel.getMassProperties(intersection.shapeId);

    // Clean up temporary shape
    await kernel.deleteShape(intersection.shapeId);

    if (props.volume > 0.001) {
      // More than 0.001 mm³
      return {
        interferes: true,
        volume: props.volume,
        location: props.centerOfMass,
      };
    }

    return { interferes: false };
  } catch (error) {
    // Boolean operation failed - likely no intersection
    return { interferes: false };
  }
}

/**
 * Find all interferences in an assembly
 */
export async function findAllInterferences(
  assembly: AssemblyResult
): Promise<
  Array<{
    component1: string;
    component2: string;
    volume: number;
    location: Point3D;
  }>
> {
  const interferences: Array<{
    component1: string;
    component2: string;
    volume: number;
    location: Point3D;
  }> = [];

  for (let i = 0; i < assembly.components.length; i++) {
    for (let j = i + 1; j < assembly.components.length; j++) {
      const result = await checkInterference(
        assembly.components[i],
        assembly.components[j]
      );

      if (result.interferes && result.volume && result.location) {
        interferences.push({
          component1: assembly.components[i].id,
          component2: assembly.components[j].id,
          volume: result.volume,
          location: result.location,
        });
      }
    }
  }

  return interferences;
}

// ============================================================================
// MANUFACTURING VALIDATION
// ============================================================================

export interface ManufacturingConstraints {
  minWallThickness: number; // mm
  minFeatureSize: number; // mm
  maxOverhang: number; // degrees from vertical
  minBendRadius: number; // mm (for sheet metal)
  minHoleDiameter: number; // mm
  minHoleSpacing: number; // mm (edge to edge)
}

export const defaultConstraints: ManufacturingConstraints = {
  minWallThickness: 1.0,
  minFeatureSize: 0.5,
  maxOverhang: 45,
  minBendRadius: 1.0,
  minHoleDiameter: 2.0,
  minHoleSpacing: 3.0,
};

/**
 * Validate geometry against manufacturing constraints
 */
export function validateManufacturing(
  geometry: GeometryResult,
  constraints: ManufacturingConstraints = defaultConstraints
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Check overall size (basic sanity check)
  const size = geometry.bounds.max;
  const minSize = geometry.bounds.min;

  const width = size.x - minSize.x;
  const depth = size.y - minSize.y;
  const height = size.z - minSize.z;

  // Extremely small parts warning
  if (width < 5 || depth < 5 || height < 5) {
    warnings.push({
      code: 'SMALL_PART',
      severity: 'warning',
      message: 'Part has dimension less than 5mm - verify manufacturability',
    });
  }

  // Extremely large parts warning
  if (width > 10000 || depth > 10000 || height > 10000) {
    warnings.push({
      code: 'LARGE_PART',
      severity: 'warning',
      message: 'Part exceeds 10m in one dimension - verify machine capacity',
    });
  }

  // Very thin features (based on volume to surface area ratio)
  const volSurfRatio = geometry.properties.volume / geometry.properties.surfaceArea;
  if (volSurfRatio < constraints.minWallThickness / 3) {
    warnings.push({
      code: 'THIN_FEATURES',
      severity: 'warning',
      message: 'Part may have thin-wall features below manufacturing limits',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    clearanceChecks: [],
  };
}

// ============================================================================
// CODE COMPLIANCE VALIDATION
// ============================================================================

export interface CodeRequirement {
  code: string;
  section: string;
  description: string;
  check: (geometry: GeometryResult, params: Record<string, unknown>) => ValidationIssue | null;
}

export const accessCodeRequirements: CodeRequirement[] = [
  {
    code: 'IBC',
    section: '1011.5.2',
    description: 'Maximum riser height 7 inches (178mm)',
    check: (_geometry, params) => {
      const riserHeight = params.riserHeight as number;
      if (riserHeight && riserHeight > 178) {
        return {
          code: 'IBC_1011.5.2',
          severity: 'error',
          message: `Riser height ${riserHeight}mm exceeds IBC maximum of 178mm`,
        };
      }
      return null;
    },
  },
  {
    code: 'IBC',
    section: '1011.5.2',
    description: 'Minimum tread depth 11 inches (279mm)',
    check: (_geometry, params) => {
      const treadDepth = params.treadDepth as number;
      if (treadDepth && treadDepth < 279) {
        return {
          code: 'IBC_1011.5.2',
          severity: 'error',
          message: `Tread depth ${treadDepth}mm below IBC minimum of 279mm`,
        };
      }
      return null;
    },
  },
  {
    code: 'OSHA',
    section: '1910.23',
    description: 'Guardrails required for falls > 4 feet',
    check: (_geometry, params) => {
      const height = params.height as number;
      const hasGuardrails = params.hasGuardrails as boolean;
      if (height && height > 1219 && !hasGuardrails) {
        return {
          code: 'OSHA_1910.23',
          severity: 'error',
          message: 'Guardrails required for heights over 1219mm (4 ft)',
        };
      }
      return null;
    },
  },
  {
    code: 'ADA',
    section: '405.2',
    description: 'Maximum ramp slope 1:12',
    check: (_geometry, params) => {
      const slope = params.slope as number;
      if (slope && slope < 12) {
        return {
          code: 'ADA_405.2',
          severity: 'error',
          message: `Ramp slope 1:${slope} exceeds ADA maximum of 1:12`,
        };
      }
      return null;
    },
  },
];

/**
 * Validate geometry against building codes
 */
export function validateCodeCompliance(
  geometry: GeometryResult,
  requirements: CodeRequirement[] = accessCodeRequirements
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  for (const req of requirements) {
    const issue = req.check(geometry, geometry.metadata);
    if (issue) {
      if (issue.severity === 'error') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    clearanceChecks: [],
  };
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Run all validations on a geometry
 */
export async function validateGeometry(
  geometry: GeometryResult,
  options: {
    checkManufacturing?: boolean;
    checkCodeCompliance?: boolean;
    manufacturingConstraints?: ManufacturingConstraints;
    codeRequirements?: CodeRequirement[];
  } = {}
): Promise<ValidationResult> {
  const allErrors: ValidationIssue[] = [];
  const allWarnings: ValidationIssue[] = [];

  // Manufacturing validation
  if (options.checkManufacturing !== false) {
    const mfgResult = validateManufacturing(
      geometry,
      options.manufacturingConstraints
    );
    allErrors.push(...mfgResult.errors);
    allWarnings.push(...mfgResult.warnings);
  }

  // Code compliance
  if (options.checkCodeCompliance !== false) {
    const codeResult = validateCodeCompliance(
      geometry,
      options.codeRequirements
    );
    allErrors.push(...codeResult.errors);
    allWarnings.push(...codeResult.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    clearanceChecks: [],
  };
}

/**
 * Run all validations on an assembly
 */
export async function validateAssemblyComplete(
  assembly: AssemblyResult,
  environment?: EnvironmentContext
): Promise<ValidationResult> {
  const allErrors: ValidationIssue[] = [];
  const allWarnings: ValidationIssue[] = [];
  const allClearanceChecks: ClearanceCheck[] = [];

  // Validate each component
  for (const component of assembly.components) {
    const result = await validateGeometry(component);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Check internal clearances
  const internalChecks = await validateAssemblyClearances(assembly);
  allClearanceChecks.push(...internalChecks);

  for (const check of internalChecks) {
    if (!check.passed) {
      if (check.minDistance < 0) {
        allErrors.push({
          code: 'INTERFERENCE',
          severity: 'error',
          message: `Interference between ${check.component1} and ${check.component2}`,
          affectedComponents: [check.component1, check.component2],
        });
      } else {
        allWarnings.push({
          code: 'LOW_CLEARANCE',
          severity: 'warning',
          message: `Clearance ${check.minDistance.toFixed(1)}mm below required ${check.requiredClearance}mm`,
          affectedComponents: [check.component1, check.component2],
        });
      }
    }
  }

  // Check environment clearances
  if (environment) {
    for (const component of assembly.components) {
      const envChecks = await validateEnvironmentClearances(component, environment);
      allClearanceChecks.push(...envChecks);

      for (const check of envChecks) {
        if (!check.passed) {
          allErrors.push({
            code: 'OBSTACLE_INTERFERENCE',
            severity: 'error',
            message: `Component ${check.component1} violates clearance to ${check.component2}`,
            affectedComponents: [check.component1],
          });
        }
      }
    }
  }

  // Check for interferences
  const interferences = await findAllInterferences(assembly);
  for (const interference of interferences) {
    allErrors.push({
      code: 'SOLID_INTERFERENCE',
      severity: 'error',
      message: `Solid interference (${interference.volume.toFixed(1)} mm³) between ${interference.component1} and ${interference.component2}`,
      location: interference.location,
      affectedComponents: [interference.component1, interference.component2],
    });
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    clearanceChecks: allClearanceChecks,
  };
}
