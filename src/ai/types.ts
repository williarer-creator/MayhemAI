/**
 * AI Module Types
 *
 * Types for AI-powered reasoning, domain selection, and optimization.
 */

import type { Point3D, Vector3D } from '../knowledge/types';

// ============================================================================
// DESIGN REQUEST TYPES
// ============================================================================

/**
 * A design request representing what needs to be built
 */
export interface DesignRequest {
  /** Unique request ID */
  id: string;

  /** Natural language description of the requirement */
  description: string;

  /** Starting point/connection */
  pointA: ConnectionPoint;

  /** Ending point/connection */
  pointB: ConnectionPoint;

  /** Environment constraints */
  environment: EnvironmentConstraints;

  /** Project constraints */
  constraints: ProjectConstraints;

  /** Optional reference images */
  referenceImages?: string[];

  /** Optional point cloud data */
  pointCloud?: PointCloudData;
}

/**
 * A connection point in the design
 */
export interface ConnectionPoint {
  /** 3D position */
  position: Point3D;

  /** Point type (floor, wall, equipment, ceiling, etc.) */
  type: 'floor' | 'wall' | 'ceiling' | 'equipment' | 'structure' | 'opening' | 'custom';

  /** Surface normal at this point */
  normal?: Vector3D;

  /** Available attachment methods */
  attachmentOptions?: AttachmentType[];

  /** Load capacity at this point (N) */
  loadCapacity?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Attachment methods
 */
export type AttachmentType =
  | 'anchor-bolt'
  | 'welded'
  | 'bolted'
  | 'clamped'
  | 'adhesive'
  | 'embedded'
  | 'floating';

/**
 * Environment constraints for the design
 */
export interface EnvironmentConstraints {
  /** Available space boundaries */
  boundaries: BoundingBox;

  /** Obstacles to avoid */
  obstacles: Obstacle[];

  /** Environmental conditions */
  conditions: EnvironmentConditions;

  /** Existing structures to connect to */
  existingStructures?: ExistingStructure[];
}

/**
 * Bounding box for available space
 */
export interface BoundingBox {
  min: Point3D;
  max: Point3D;
}

/**
 * An obstacle in the environment
 */
export interface Obstacle {
  id: string;
  type: 'column' | 'equipment' | 'pipe' | 'duct' | 'wall' | 'other';
  bounds: BoundingBox;
  avoidanceMargin: number;
  canPenetrate: boolean;
}

/**
 * Environmental conditions
 */
export interface EnvironmentConditions {
  /** Indoor/outdoor/covered */
  exposure: 'indoor' | 'outdoor' | 'covered';

  /** Temperature range in Celsius */
  temperatureRange?: { min: number; max: number };

  /** Humidity level */
  humidity?: 'low' | 'normal' | 'high';

  /** Corrosive environment */
  corrosive?: boolean;

  /** Vibration level */
  vibration?: 'none' | 'low' | 'medium' | 'high';
}

/**
 * An existing structure to connect to
 */
export interface ExistingStructure {
  id: string;
  type: string;
  position: Point3D;
  attachmentPoints: ConnectionPoint[];
}

/**
 * Project-level constraints
 */
export interface ProjectConstraints {
  /** Building type for code compliance */
  buildingType: 'commercial' | 'industrial' | 'residential' | 'institutional';

  /** Occupancy type */
  occupancy?: string;

  /** Applicable codes */
  codes: ApplicableCode[];

  /** Budget constraints */
  budget?: BudgetConstraint;

  /** Schedule constraints */
  schedule?: ScheduleConstraint;

  /** Material preferences */
  materialPreferences?: MaterialPreference[];

  /** Manufacturing capabilities */
  manufacturingCapabilities?: ManufacturingCapability[];
}

/**
 * Applicable building/safety code
 */
export interface ApplicableCode {
  code: 'IBC' | 'OSHA' | 'ADA' | 'NFPA' | 'ASME' | 'AWS' | 'AISC' | 'NEC' | 'custom';
  version?: string;
  sections?: string[];
}

/**
 * Budget constraint
 */
export interface BudgetConstraint {
  maxCost: number;
  currency: string;
  priority: 'strict' | 'flexible';
}

/**
 * Schedule constraint
 */
export interface ScheduleConstraint {
  maxLeadTime: number; // days
  preferredLeadTime?: number;
  priority: 'strict' | 'flexible';
}

/**
 * Material preference
 */
export interface MaterialPreference {
  material: string;
  preference: 'required' | 'preferred' | 'acceptable' | 'avoid';
  reason?: string;
}

/**
 * Manufacturing capability
 */
export interface ManufacturingCapability {
  process: 'cnc-mill' | 'cnc-lathe' | 'laser-cut' | 'plasma-cut' | 'waterjet' | 'welding' | 'bending' | '3d-print';
  available: boolean;
  maxSize?: { x: number; y: number; z: number };
  tolerance?: number;
}

/**
 * Point cloud data from scanning
 */
export interface PointCloudData {
  points: Point3D[];
  colors?: Array<{ r: number; g: number; b: number }>;
  normals?: Vector3D[];
  density: number; // points per cubic meter
  accuracy: number; // mm
}

// ============================================================================
// DOMAIN CLASSIFICATION
// ============================================================================

/**
 * Knowledge domains
 */
export type KnowledgeDomain = 'access' | 'structure' | 'enclosure' | 'flow' | 'mechanical';

/**
 * Domain classification result
 */
export interface DomainClassification {
  /** Primary domain */
  primaryDomain: KnowledgeDomain;

  /** Confidence score (0-1) */
  confidence: number;

  /** Secondary domains that may be involved */
  secondaryDomains: Array<{
    domain: KnowledgeDomain;
    confidence: number;
    reason: string;
  }>;

  /** Reasoning for the classification */
  reasoning: string;
}

/**
 * Specific element type within a domain
 */
export interface ElementTypeClassification {
  domain: KnowledgeDomain;
  elementType: string;
  confidence: number;
  alternatives: Array<{
    elementType: string;
    confidence: number;
    reason: string;
  }>;
}

// ============================================================================
// SOLUTION TYPES
// ============================================================================

/**
 * A design solution candidate
 */
export interface DesignSolution {
  /** Solution ID */
  id: string;

  /** Domain used */
  domain: KnowledgeDomain;

  /** Element type used */
  elementType: string;

  /** Solution parameters */
  parameters: Record<string, unknown>;

  /** Estimated metrics */
  metrics: SolutionMetrics;

  /** Code compliance status */
  compliance: ComplianceStatus;

  /** Design rationale */
  rationale: DesignRationale;

  /** Warnings or concerns */
  warnings: string[];
}

/**
 * Solution metrics for comparison
 */
export interface SolutionMetrics {
  /** Estimated cost in configured currency */
  estimatedCost: number;

  /** Estimated weight in kg */
  estimatedWeight: number;

  /** Material usage efficiency (0-100%) */
  materialEfficiency: number;

  /** Manufacturing complexity (1-10) */
  manufacturingComplexity: number;

  /** Assembly time estimate in hours */
  assemblyTimeEstimate: number;

  /** Maintenance requirements (1-10, lower is better) */
  maintenanceScore: number;

  /** Overall score (weighted combination) */
  overallScore: number;
}

/**
 * Code compliance status
 */
export interface ComplianceStatus {
  /** Overall compliant */
  compliant: boolean;

  /** Individual code checks */
  checks: CodeCheck[];
}

/**
 * Individual code check result
 */
export interface CodeCheck {
  code: string;
  section: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning' | 'not-applicable';
  message: string;
  value?: number;
  limit?: number;
}

/**
 * Design rationale explaining why this solution was chosen
 */
export interface DesignRationale {
  /** Summary of the design approach */
  summary: string;

  /** Key decisions made */
  decisions: DesignDecision[];

  /** Trade-offs considered */
  tradeoffs: Tradeoff[];

  /** Alternatives that were rejected */
  rejectedAlternatives: RejectedAlternative[];
}

/**
 * A design decision
 */
export interface DesignDecision {
  aspect: string;
  choice: string;
  reason: string;
}

/**
 * A trade-off that was considered
 */
export interface Tradeoff {
  factor1: string;
  factor2: string;
  decision: string;
  impact: string;
}

/**
 * An alternative that was rejected
 */
export interface RejectedAlternative {
  description: string;
  reason: string;
}

// ============================================================================
// NATURAL LANGUAGE PARSING
// ============================================================================

/**
 * Parsed requirements from natural language
 */
export interface ParsedRequirements {
  /** Extracted endpoints */
  endpoints: ExtractedEndpoint[];

  /** Extracted constraints */
  constraints: ExtractedConstraint[];

  /** Extracted preferences */
  preferences: ExtractedPreference[];

  /** Confidence in the parsing */
  confidence: number;

  /** Parts that couldn't be parsed */
  unparsedParts: string[];
}

/**
 * Extracted endpoint from text
 */
export interface ExtractedEndpoint {
  role: 'start' | 'end';
  description: string;
  type?: ConnectionPoint['type'];
  elevation?: number;
  confidence: number;
}

/**
 * Extracted constraint from text
 */
export interface ExtractedConstraint {
  type: 'dimensional' | 'material' | 'code' | 'cost' | 'schedule' | 'environmental';
  description: string;
  value?: number | string;
  unit?: string;
  confidence: number;
}

/**
 * Extracted preference from text
 */
export interface ExtractedPreference {
  aspect: string;
  preference: string;
  strength: 'must' | 'should' | 'could' | 'would-like';
  confidence: number;
}

// ============================================================================
// OPTIMIZATION TYPES
// ============================================================================

/**
 * Optimization objectives
 */
export interface OptimizationObjectives {
  /** Minimize cost (weight 0-1) */
  minimizeCost: number;

  /** Minimize weight (weight 0-1) */
  minimizeWeight: number;

  /** Maximize material efficiency (weight 0-1) */
  maximizeMaterialEfficiency: number;

  /** Minimize manufacturing complexity (weight 0-1) */
  minimizeComplexity: number;

  /** Minimize assembly time (weight 0-1) */
  minimizeAssemblyTime: number;

  /** Maximize maintainability (weight 0-1) */
  maximizeMaintainability: number;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Ranked solutions */
  rankedSolutions: RankedSolution[];

  /** Pareto-optimal solutions */
  paretoOptimal: string[];

  /** Optimization summary */
  summary: string;
}

/**
 * A ranked solution
 */
export interface RankedSolution {
  solutionId: string;
  rank: number;
  scores: {
    cost: number;
    weight: number;
    materialEfficiency: number;
    complexity: number;
    assemblyTime: number;
    maintainability: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
}

// ============================================================================
// AI SERVICE TYPES
// ============================================================================

/**
 * AI reasoning request
 */
export interface ReasoningRequest {
  type: 'domain-classification' | 'requirement-parsing' | 'solution-generation' | 'optimization' | 'explanation';
  context: Record<string, unknown>;
  prompt: string;
}

/**
 * AI reasoning response
 */
export interface ReasoningResponse {
  success: boolean;
  result: unknown;
  reasoning: string;
  confidence: number;
  tokensUsed?: number;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  /** API endpoint */
  endpoint?: string;

  /** API key (should be from environment) */
  apiKey?: string;

  /** Model to use */
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'local';

  /** Maximum tokens for response */
  maxTokens: number;

  /** Temperature for generation */
  temperature: number;

  /** Enable caching */
  enableCaching: boolean;

  /** Timeout in milliseconds */
  timeout: number;
}
