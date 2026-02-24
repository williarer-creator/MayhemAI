/**
 * AI Orchestrator Module
 *
 * Main entry point for the engineering AI pipeline
 *
 * Usage:
 * ```typescript
 * import { createPipeline, getAllDomains } from './orchestrator';
 *
 * // Create a new pipeline
 * const pipeline = createPipeline('project-123');
 *
 * // Add inputs
 * pipeline.addInput({
 *   id: 'req-1',
 *   type: 'requirements',
 *   source: 'manual',
 *   timestamp: new Date(),
 *   metadata: {},
 *   data: {
 *     text: 'Need a stair system for mezzanine access, 3 meters rise',
 *     constraints: [{ type: 'max', parameter: 'width', value: 1200 }]
 *   }
 * });
 *
 * // Analyze inputs
 * const analysis = await pipeline.analyzeInputs();
 *
 * // Get AI reasoning
 * const explanation = pipeline.explainDecision('industrial-stair');
 * ```
 */

// Pipeline
export {
  EngineeringPipeline,
  createPipeline,
  getAllDomains,
  getDomain,
  getAllElements,
  findElement,
} from './pipeline';

// Types
export type {
  // Input types
  InputType,
  InputData,
  PointCloudInput,
  ImageInput,
  MeasurementsInput,
  RequirementsInput,

  // Geometry
  Point2D,
  Point3D,
  Vector3D,
  BoundingBox2D,
  BoundingBox3D,
  Dimension,
  Angle,
  Constraint,
  Preference,

  // Analysis
  AnalysisResult,
  ElementSuggestion,
  ExtractedFeature,
  SpatialRelationship,

  // Design
  DesignIntent,
  EnvironmentalConditions,
  SafetyRequirement,
  PerformanceTarget,
  MaterialPreference,
  BudgetConstraint,
  ScheduleConstraint,

  // Output
  OutputFormat,
  OutputRequest,
  OutputOptions,
  GeneratedOutput,
  OutputMetadata,
  MaterialEstimate,

  // Pipeline state
  PipelineStage,
  PipelineState,
  SelectedElement,
  ValidationResult,
  PipelineEvent,
  PipelineError,

  // AI reasoning
  ReasoningStep,
  Alternative,
  AIResponse,
  UserQuestion,
} from './types';
