/**
 * Geometry Generation Module
 *
 * Converts knowledge elements into 3D geometry using OpenCascade.
 */

// Types
export type {
  GeometryResult,
  AssemblyResult,
  BuilderContext,
  ValidationResult,
  ValidationIssue,
  ClearanceCheck,
  ConnectionPoint,
  EnvironmentContext,
  Obstacle,
  AttachmentSurface,
  BuilderOptions,
  GeometryBuilder,
  AssemblyBuilder,
  AssemblyConnection,
} from './types';

export { getMaterialDensity, materialDensities } from './types';

// Builder Framework
export {
  BaseGeometryBuilder,
  GeometryAssemblyBuilder,
  assemblyBuilder,
  registerBuilder,
  getBuilder,
  getAllBuilders,
  generateGeometryId,
  calculateWeight,
  distance3D,
  midpoint3D,
  vectorFromPoints,
  normalizeVector,
  angleFromVector,
} from './builder';

// Domain Builders
export {
  StairBuilder,
  LadderBuilder,
  RampBuilder,
  PlatformBuilder,
  registerAccessBuilders,
} from './builders/access';
export type {
  StairInput,
  LadderInput,
  RampInput,
  PlatformInput,
} from './builders/access';

export {
  BeamBuilder,
  ColumnBuilder,
  BracingBuilder,
  registerStructureBuilders,
} from './builders/structure';
export type {
  BeamInput,
  ColumnInput,
  BracingInput,
} from './builders/structure';

// Validation
export {
  checkClearance,
  validateAssemblyClearances,
  validateEnvironmentClearances,
  checkInterference,
  findAllInterferences,
  validateManufacturing,
  validateCodeCompliance,
  validateGeometry,
  validateAssemblyComplete,
  standardClearances,
  defaultConstraints,
  accessCodeRequirements,
} from './validation';
export type {
  ClearanceRequirement,
  ManufacturingConstraints,
  CodeRequirement,
} from './validation';

// Initialize all builders
import { registerAccessBuilders } from './builders/access';
import { registerStructureBuilders } from './builders/structure';

export function initializeBuilders(): void {
  registerAccessBuilders();
  registerStructureBuilders();
}

// Auto-initialize on module load
initializeBuilders();
