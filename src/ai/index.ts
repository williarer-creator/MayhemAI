/**
 * AI Module
 *
 * AI-powered reasoning for engineering design:
 * - Natural language requirement parsing
 * - Knowledge domain classification
 * - Solution generation and optimization
 * - Design rationale explanation
 */

// Export types
export type {
  // Design request types
  DesignRequest,
  ConnectionPoint,
  AttachmentType,
  EnvironmentConstraints,
  BoundingBox,
  Obstacle,
  EnvironmentConditions,
  ExistingStructure,
  ProjectConstraints,
  ApplicableCode,
  BudgetConstraint,
  ScheduleConstraint,
  MaterialPreference,
  ManufacturingCapability,
  PointCloudData,

  // Classification types
  KnowledgeDomain,
  DomainClassification,
  ElementTypeClassification,

  // Solution types
  DesignSolution,
  SolutionMetrics,
  ComplianceStatus,
  CodeCheck,
  DesignRationale,
  DesignDecision,
  Tradeoff,
  RejectedAlternative,

  // Parsing types
  ParsedRequirements,
  ExtractedEndpoint,
  ExtractedConstraint,
  ExtractedPreference,

  // Optimization types
  OptimizationObjectives,
  OptimizationResult,
  RankedSolution,

  // Service types
  ReasoningRequest,
  ReasoningResponse,
  AIServiceConfig,
} from './types';

// Export domain selector
export {
  DomainSelector,
  createDomainSelector,
} from './domain-selector';

// Export natural language parser
export {
  NaturalLanguageParser,
  createNaturalLanguageParser,
} from './nl-parser';

// Export optimizer
export {
  SolutionOptimizer,
  createSolutionOptimizer,
  defaultObjectives,
} from './optimizer';

// Export explainer
export {
  DesignExplainer,
  createDesignExplainer,
} from './explainer';

// Export orchestrator
export {
  AIOrchestrator,
  createAIOrchestrator,
} from './orchestrator';
export type {
  OrchestratorResult,
  OrchestratorConfig,
} from './orchestrator';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { AIOrchestrator, OrchestratorConfig } from './orchestrator';
import type { DesignRequest, DesignSolution, KnowledgeDomain } from './types';
import { DomainSelector } from './domain-selector';
import { NaturalLanguageParser } from './nl-parser';

/**
 * Quick design analysis - simplified entry point
 */
export async function analyzeDesignRequest(
  request: DesignRequest,
  config?: OrchestratorConfig
): Promise<{
  domain: KnowledgeDomain;
  elementType: string;
  topSolution: DesignSolution;
  report: string;
}> {
  const orchestrator = new AIOrchestrator(config);
  const result = await orchestrator.process(request);

  return {
    domain: result.classification.primaryDomain,
    elementType: result.elementType.elementType,
    topSolution: result.solutions[0] || result.solutions[0],
    report: result.report,
  };
}

/**
 * Quick domain classification
 */
export function classifyDomain(
  description: string,
  startType: string = 'floor',
  endType: string = 'floor',
  elevationChange: number = 0
): { domain: KnowledgeDomain; confidence: number } {
  const selector = new DomainSelector();

  const request: DesignRequest = {
    id: 'quick-classify',
    description,
    pointA: {
      position: { x: 0, y: 0, z: 0 },
      type: startType as any,
    },
    pointB: {
      position: { x: 1000, y: 0, z: elevationChange },
      type: endType as any,
    },
    environment: {
      boundaries: { min: { x: 0, y: 0, z: 0 }, max: { x: 10000, y: 10000, z: 10000 } },
      obstacles: [],
      conditions: { exposure: 'indoor' },
    },
    constraints: {
      buildingType: 'commercial',
      codes: [{ code: 'IBC' }],
    },
  };

  const result = selector.classifyDomain(request);
  return {
    domain: result.primaryDomain,
    confidence: result.confidence,
  };
}

/**
 * Quick requirement parsing
 */
export function parseRequirements(description: string): {
  endpoints: Array<{ role: string; description: string }>;
  constraints: Array<{ type: string; value: unknown }>;
  confidence: number;
} {
  const parser = new NaturalLanguageParser();
  const result = parser.parse(description);

  return {
    endpoints: result.endpoints.map(e => ({
      role: e.role,
      description: e.description,
    })),
    constraints: result.constraints.map(c => ({
      type: c.type,
      value: c.value,
    })),
    confidence: result.confidence,
  };
}
