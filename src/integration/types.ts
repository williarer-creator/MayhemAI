/**
 * End-to-End Integration Types
 *
 * Types for the complete MayhemAI pipeline from
 * requirements to manufacturing outputs.
 */

import type { Point3D } from '../knowledge/types';
import type { DesignSolution, DesignRequest } from '../ai/types';
import type { OrchestratorResult } from '../ai/orchestrator';
import type { AssemblyResult } from '../geometry/types';
import type { EnvironmentModel, PointCloud, ImageInput, ScanToCADResult } from '../inputs/types';
import type {
  GCodeProgram,
  DXFDocument,
  BOMDocument,
  CutListDocument,
  AssemblyInstructionDocument,
} from '../outputs/types';

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/**
 * Complete manufacturing package
 */
export interface ManufacturingPackage {
  /** Project information */
  project: {
    name: string;
    description: string;
    createdAt: string;
    version: string;
  };

  /** Generated geometry */
  geometry: {
    assembly: AssemblyResult;
    componentCount: number;
    totalWeight: number;
    bounds: { min: Point3D; max: Point3D };
  };

  /** Bill of materials */
  bom: BOMDocument;

  /** Cut list */
  cutList: CutListDocument;

  /** Assembly instructions */
  assemblyInstructions: AssemblyInstructionDocument;

  /** G-code programs (by component) */
  gcodeProgramsPrograms: GCodeProgram[];

  /** DXF documents (by component) */
  dxfDocuments: DXFDocument[];

  /** Design rationale */
  designReport: string;

  /** Validation results */
  validation: {
    geometryValid: boolean;
    codeCompliant: boolean;
    manufacturingFeasible: boolean;
    issues: string[];
    warnings: string[];
  };
}

/**
 * Pipeline stage status
 */
export interface PipelineStatus {
  stage: PipelineStage;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

/**
 * Pipeline stages
 */
export type PipelineStage =
  | 'input-processing'
  | 'environment-modeling'
  | 'requirement-analysis'
  | 'domain-classification'
  | 'solution-generation'
  | 'geometry-generation'
  | 'validation'
  | 'manufacturing-output'
  | 'documentation';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Project name */
  projectName: string;

  /** Enable verbose logging */
  verbose?: boolean;

  /** Skip validation (for testing) */
  skipValidation?: boolean;

  /** Output formats */
  outputFormats?: {
    gcode?: boolean;
    dxf?: boolean;
    bom?: boolean;
    cutList?: boolean;
    assemblyInstructions?: boolean;
    designReport?: boolean;
  };

  /** Manufacturing preferences */
  manufacturing?: {
    machineType?: 'mill' | 'lathe' | 'router';
    materialPreference?: string;
    maxPartSize?: { x: number; y: number; z: number };
  };
}

/**
 * Pipeline input
 */
export interface PipelineInput {
  /** Natural language description */
  description?: string;

  /** Structured design request */
  designRequest?: DesignRequest;

  /** Point cloud data */
  pointClouds?: PointCloud[];

  /** Image data */
  images?: ImageInput[];

  /** Pre-built environment model */
  environmentModel?: EnvironmentModel;

  /** Manual endpoint specification */
  endpoints?: {
    start: {
      position: Point3D;
      type: string;
    };
    end: {
      position: Point3D;
      type: string;
    };
  };
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  /** Success status */
  success: boolean;

  /** Manufacturing package (if successful) */
  package?: ManufacturingPackage;

  /** AI reasoning result */
  aiResult?: OrchestratorResult;

  /** Environment model */
  environmentModel?: EnvironmentModel;

  /** Scan-to-CAD result */
  scanResult?: ScanToCADResult;

  /** Pipeline status history */
  statusHistory: PipelineStatus[];

  /** Total processing time */
  processingTimeMs: number;

  /** Errors */
  errors: string[];

  /** Warnings */
  warnings: string[];
}

// ============================================================================
// DEMO SCENARIO TYPES
// ============================================================================

/**
 * Demo scenario definition
 */
export interface DemoScenario {
  /** Scenario ID */
  id: string;

  /** Scenario name */
  name: string;

  /** Description */
  description: string;

  /** Input configuration */
  input: PipelineInput;

  /** Expected outcomes */
  expectedOutcomes: {
    domain: string;
    elementType: string;
    componentCount: number;
    codeCompliance: string[];
  };
}

/**
 * Feedback for design iteration
 */
export interface DesignFeedback {
  /** Type of feedback */
  type: 'approve' | 'modify' | 'reject';

  /** Modifications requested */
  modifications?: Array<{
    parameter: string;
    currentValue: unknown;
    requestedValue: unknown;
    reason?: string;
  }>;

  /** Rejection reason */
  rejectionReason?: string;

  /** Alternative preferences */
  alternatives?: {
    preferDifferentElement?: string;
    preferDifferentMaterial?: string;
    preferDifferentApproach?: string;
  };
}

/**
 * Design iteration result
 */
export interface IterationResult {
  /** Iteration number */
  iteration: number;

  /** Previous solution */
  previousSolution?: DesignSolution;

  /** Updated solution */
  updatedSolution: DesignSolution;

  /** Changes made */
  changes: string[];

  /** New validation status */
  validationStatus: {
    valid: boolean;
    issues: string[];
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Production readiness check
 */
export interface ProductionReadinessCheck {
  /** Overall ready status */
  ready: boolean;

  /** Individual checks */
  checks: {
    geometryComplete: boolean;
    materialsDefined: boolean;
    tolerancesSpecified: boolean;
    bomComplete: boolean;
    drawingsComplete: boolean;
    gcodeGenerated: boolean;
    safetyReviewed: boolean;
  };

  /** Missing items */
  missingItems: string[];

  /** Recommendations */
  recommendations: string[];
}

/**
 * Engineering package
 */
export interface EngineeringPackage {
  /** Project info */
  project: {
    name: string;
    number: string;
    revision: string;
    date: string;
    engineer: string;
  };

  /** Design documentation */
  designDocs: {
    summary: string;
    requirements: string;
    calculations: string;
    rationale: string;
  };

  /** Drawing list */
  drawings: Array<{
    number: string;
    title: string;
    revision: string;
    type: 'assembly' | 'detail' | 'fabrication';
  }>;

  /** BOM */
  bom: BOMDocument;

  /** Manufacturing files */
  manufacturingFiles: {
    gcode: string[];
    dxf: string[];
    step?: string;
  };

  /** Approval status */
  approvals: {
    designApproved: boolean;
    safetyApproved: boolean;
    manufacturingApproved: boolean;
  };
}
