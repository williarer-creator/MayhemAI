/**
 * AI Orchestrator Types
 *
 * Core type definitions for the engineering AI pipeline
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

export type InputType =
  | 'point-cloud'     // 3D scan data
  | 'image'           // Photo/drawing image
  | 'measurements'    // Manual measurements
  | 'sketch'          // 2D sketch
  | 'requirements'    // Natural language requirements
  | 'cad-file'        // Existing CAD file (STEP, DXF, etc.)
  | 'reference';      // Reference material (spec sheet, etc.)

export interface InputData {
  id: string;
  type: InputType;
  source: string; // File path or 'manual'
  timestamp: Date;
  metadata: Record<string, unknown>;
  data: unknown; // Type-specific data
}

export interface PointCloudInput extends InputData {
  type: 'point-cloud';
  data: {
    format: 'xyz' | 'ply' | 'las' | 'e57';
    pointCount: number;
    bounds: BoundingBox3D;
    units: 'mm' | 'm' | 'in' | 'ft';
  };
}

export interface ImageInput extends InputData {
  type: 'image';
  data: {
    format: 'jpg' | 'png' | 'tiff' | 'pdf';
    width: number;
    height: number;
    hasScale: boolean;
    scaleValue?: number;
    scaleUnit?: string;
  };
}

export interface MeasurementsInput extends InputData {
  type: 'measurements';
  data: {
    dimensions: Dimension[];
    angles?: Angle[];
    notes?: string[];
  };
}

export interface RequirementsInput extends InputData {
  type: 'requirements';
  data: {
    text: string;
    domain?: string;
    constraints?: Constraint[];
    preferences?: Preference[];
  };
}

// ============================================================================
// GEOMETRY PRIMITIVES
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

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

export interface BoundingBox2D {
  min: Point2D;
  max: Point2D;
}

export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
}

export interface Dimension {
  id: string;
  name: string;
  value: number;
  unit: 'mm' | 'm' | 'in' | 'ft';
  tolerance?: { min: number; max: number };
  reference?: string;
}

export interface Angle {
  id: string;
  name: string;
  value: number; // degrees
  reference?: string;
}

export interface Constraint {
  type: 'min' | 'max' | 'equal' | 'range';
  parameter: string;
  value: number | [number, number];
  unit?: string;
  reason?: string;
}

export interface Preference {
  parameter: string;
  value: unknown;
  priority: 'must' | 'should' | 'nice-to-have';
  reason?: string;
}

// ============================================================================
// ANALYSIS RESULTS
// ============================================================================

export interface AnalysisResult {
  id: string;
  inputId: string;
  timestamp: Date;
  confidence: number; // 0-1
  suggestedDomain: string;
  suggestedElements: ElementSuggestion[];
  extractedFeatures: ExtractedFeature[];
  spatialRelationships: SpatialRelationship[];
  warnings: string[];
}

export interface ElementSuggestion {
  elementId: string;
  domain: string;
  confidence: number;
  matchedFeatures: string[];
  parameterValues: Record<string, unknown>;
}

export interface ExtractedFeature {
  id: string;
  type: 'dimension' | 'shape' | 'material' | 'connection' | 'annotation';
  value: unknown;
  confidence: number;
  source: string; // Where in the input this was found
}

export interface SpatialRelationship {
  type: 'parallel' | 'perpendicular' | 'coplanar' | 'aligned' | 'offset' | 'connected';
  entity1: string;
  entity2: string;
  parameters?: Record<string, number>;
}

// ============================================================================
// DESIGN INTENT
// ============================================================================

export interface DesignIntent {
  id: string;
  projectId: string;
  domain: string;
  primaryFunction: string;
  secondaryFunctions: string[];
  environmentalConditions: EnvironmentalConditions;
  safetyRequirements: SafetyRequirement[];
  performanceTargets: PerformanceTarget[];
  materialPreferences: MaterialPreference[];
  budgetConstraints?: BudgetConstraint;
  scheduleConstraints?: ScheduleConstraint;
}

export interface EnvironmentalConditions {
  location: 'indoor' | 'outdoor' | 'mixed';
  temperature: { min: number; max: number; unit: 'C' | 'F' };
  humidity?: { min: number; max: number };
  corrosive: boolean;
  cleanroom?: boolean;
  hazardousArea?: 'none' | 'class-1' | 'class-2' | 'class-3';
}

export interface SafetyRequirement {
  standard: string; // e.g., 'OSHA 1910.212', 'ISO 14120'
  requirement: string;
  mandatory: boolean;
}

export interface PerformanceTarget {
  parameter: string;
  target: number;
  unit: string;
  tolerance?: number;
}

export interface MaterialPreference {
  material: string;
  grade?: string;
  reason?: string;
  excluded?: boolean;
}

export interface BudgetConstraint {
  maxCost: number;
  currency: string;
  includesLabor: boolean;
}

export interface ScheduleConstraint {
  deadline: Date;
  flexibility: 'hard' | 'soft' | 'flexible';
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export type OutputFormat =
  | 'step'           // STEP CAD file
  | 'dxf-flat'       // 2D DXF for flat patterns
  | 'dxf-drawing'    // 2D DXF for drawings
  | 'gcode'          // CNC G-code
  | 'svg'            // SVG for laser/plasma
  | 'drawing-pdf'    // Shop drawing PDF
  | 'cut-list'       // Material cut list
  | 'bom'            // Bill of materials
  | 'weld-map';      // Welding procedure map

export interface OutputRequest {
  format: OutputFormat;
  options: OutputOptions;
}

export interface OutputOptions {
  units?: 'mm' | 'in';
  scale?: number;
  includeAnnotations?: boolean;
  includeDimensions?: boolean;
  machineType?: string;
  toolLibrary?: string;
  materialThickness?: number;
  nestingOptimization?: boolean;
}

export interface GeneratedOutput {
  id: string;
  designId: string;
  format: OutputFormat;
  filePath: string;
  timestamp: Date;
  metadata: OutputMetadata;
}

export interface OutputMetadata {
  fileSize: number;
  warnings: string[];
  estimatedTime?: number; // Manufacturing time in minutes
  estimatedMaterial?: MaterialEstimate[];
  machineRequirements?: string[];
}

export interface MaterialEstimate {
  material: string;
  quantity: number;
  unit: string;
  sheetSize?: [number, number];
  utilizationPercent?: number;
}

// ============================================================================
// PIPELINE STATE
// ============================================================================

export type PipelineStage =
  | 'input'
  | 'analysis'
  | 'domain-routing'
  | 'element-selection'
  | 'parameter-extraction'
  | 'validation'
  | 'design-generation'
  | 'output-generation'
  | 'review'
  | 'complete';

export interface PipelineState {
  projectId: string;
  currentStage: PipelineStage;
  inputs: InputData[];
  analysisResults: AnalysisResult[];
  designIntent: DesignIntent | null;
  selectedElements: SelectedElement[];
  validationResults: ValidationResult[];
  generatedOutputs: GeneratedOutput[];
  history: PipelineEvent[];
  errors: PipelineError[];
}

export interface SelectedElement {
  elementId: string;
  domain: string;
  parameters: Record<string, unknown>;
  calculationResult: unknown;
  userOverrides: Record<string, unknown>;
}

export interface ValidationResult {
  elementId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PipelineEvent {
  timestamp: Date;
  stage: PipelineStage;
  action: string;
  details: Record<string, unknown>;
  userId?: string;
}

export interface PipelineError {
  timestamp: Date;
  stage: PipelineStage;
  code: string;
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

// ============================================================================
// AI REASONING
// ============================================================================

export interface ReasoningStep {
  id: string;
  type: 'observation' | 'inference' | 'decision' | 'action';
  content: string;
  confidence: number;
  evidence: string[];
  alternatives?: Alternative[];
}

export interface Alternative {
  option: string;
  reason: string;
  tradeoffs: string[];
}

export interface AIResponse {
  reasoning: ReasoningStep[];
  recommendation: unknown;
  confidence: number;
  requiresUserInput: boolean;
  questions?: UserQuestion[];
}

export interface UserQuestion {
  id: string;
  question: string;
  type: 'choice' | 'value' | 'confirmation' | 'clarification';
  options?: string[];
  default?: unknown;
  required: boolean;
}
