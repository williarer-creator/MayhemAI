/**
 * AI Orchestrator
 *
 * Coordinates the AI reasoning pipeline:
 * 1. Parse natural language requirements
 * 2. Classify into knowledge domain
 * 3. Generate solution candidates
 * 4. Evaluate and optimize
 * 5. Explain decisions
 */

import type {
  DesignRequest,
  DesignSolution,
  DomainClassification,
  ElementTypeClassification,
  ParsedRequirements,
  OptimizationResult,
  OptimizationObjectives,
  DesignRationale,
  AIServiceConfig,
  SolutionMetrics,
  ComplianceStatus,
  CodeCheck,
} from './types';

import { DomainSelector } from './domain-selector';
import { NaturalLanguageParser } from './nl-parser';
import { SolutionOptimizer } from './optimizer';
import { DesignExplainer } from './explainer';

// ============================================================================
// ORCHESTRATOR RESULT TYPES
// ============================================================================

/**
 * Complete result from the AI orchestrator
 */
export interface OrchestratorResult {
  /** Original request */
  request: DesignRequest;

  /** Parsed requirements */
  parsedRequirements: ParsedRequirements;

  /** Domain classification */
  classification: DomainClassification;

  /** Element type classification */
  elementType: ElementTypeClassification;

  /** Generated solutions (ranked) */
  solutions: DesignSolution[];

  /** Optimization results */
  optimization: OptimizationResult;

  /** Design rationale for top solution */
  rationale: DesignRationale;

  /** Full design report */
  report: string;

  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    stepsCompleted: string[];
    warnings: string[];
  };
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Optimization objectives */
  optimizationObjectives?: Partial<OptimizationObjectives>;

  /** Maximum solutions to generate */
  maxSolutions?: number;

  /** AI service configuration */
  aiService?: AIServiceConfig;

  /** Enable detailed logging */
  verbose?: boolean;
}

// ============================================================================
// AI ORCHESTRATOR CLASS
// ============================================================================

export class AIOrchestrator {
  private config: OrchestratorConfig;
  private domainSelector: DomainSelector;
  private nlParser: NaturalLanguageParser;
  private optimizer: SolutionOptimizer;
  private explainer: DesignExplainer;

  constructor(config: OrchestratorConfig = {}) {
    this.config = {
      maxSolutions: 5,
      verbose: false,
      ...config,
    };

    this.domainSelector = new DomainSelector();
    this.nlParser = new NaturalLanguageParser();
    this.optimizer = new SolutionOptimizer(config.optimizationObjectives);
    this.explainer = new DesignExplainer();
  }

  /**
   * Process a design request through the full AI pipeline
   */
  async process(request: DesignRequest): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const stepsCompleted: string[] = [];
    const warnings: string[] = [];

    // Step 1: Parse natural language requirements
    this.log('Step 1: Parsing natural language requirements...');
    const parsedRequirements = this.nlParser.parse(request.description);
    stepsCompleted.push('requirement-parsing');

    if (parsedRequirements.unparsedParts.length > 0) {
      warnings.push(`Some requirements could not be fully parsed: ${parsedRequirements.unparsedParts.length} unparsed sections`);
    }

    // Step 2: Classify domain
    this.log('Step 2: Classifying knowledge domain...');
    const classification = this.domainSelector.classifyDomain(request);
    stepsCompleted.push('domain-classification');

    if (classification.confidence < 0.6) {
      warnings.push(`Domain classification has low confidence (${(classification.confidence * 100).toFixed(0)}%)`);
    }

    // Step 3: Classify element type
    this.log('Step 3: Classifying element type...');
    const elementType = this.domainSelector.classifyElementType(request, classification.primaryDomain);
    stepsCompleted.push('element-classification');

    // Step 4: Generate solution candidates
    this.log('Step 4: Generating solution candidates...');
    const solutions = await this.generateSolutions(request, classification, elementType);
    stepsCompleted.push('solution-generation');

    if (solutions.length === 0) {
      warnings.push('No valid solutions could be generated');
    }

    // Step 5: Optimize and rank solutions
    this.log('Step 5: Optimizing and ranking solutions...');
    const optimization = this.optimizer.rankSolutions(solutions);
    stepsCompleted.push('optimization');

    // Step 6: Generate rationale for top solution
    this.log('Step 6: Generating design rationale...');
    const topSolution = solutions.length > 0 ? solutions[0] : this.createEmptySolution(request);
    const rationale = this.explainer.generateRationale(
      request,
      classification,
      topSolution,
      solutions.slice(1)
    );
    stepsCompleted.push('explanation');

    // Step 7: Generate full report
    this.log('Step 7: Generating design report...');
    const report = this.explainer.generateDesignReport(
      request,
      classification,
      topSolution,
      solutions.slice(1),
      optimization
    );
    stepsCompleted.push('report-generation');

    const processingTimeMs = Date.now() - startTime;
    this.log(`Processing complete in ${processingTimeMs}ms`);

    return {
      request,
      parsedRequirements,
      classification,
      elementType,
      solutions,
      optimization,
      rationale,
      report,
      metadata: {
        processingTimeMs,
        stepsCompleted,
        warnings,
      },
    };
  }

  /**
   * Generate solution candidates
   */
  private async generateSolutions(
    request: DesignRequest,
    classification: DomainClassification,
    elementType: ElementTypeClassification
  ): Promise<DesignSolution[]> {
    const solutions: DesignSolution[] = [];
    const maxSolutions = this.config.maxSolutions || 5;

    // Generate primary solution
    const primarySolution = this.generateSingleSolution(
      request,
      classification.primaryDomain,
      elementType.elementType,
      'primary'
    );
    solutions.push(primarySolution);

    // Generate alternative element type solutions
    for (const alt of elementType.alternatives.slice(0, 2)) {
      if (solutions.length >= maxSolutions) break;

      const altSolution = this.generateSingleSolution(
        request,
        classification.primaryDomain,
        alt.elementType,
        `alt-${alt.elementType}`
      );
      solutions.push(altSolution);
    }

    // Generate material variations
    const materials = ['carbon-steel', 'stainless-steel', 'aluminum'];
    const baseMaterial = (primarySolution.parameters.material as string) || 'carbon-steel';

    for (const material of materials) {
      if (solutions.length >= maxSolutions) break;
      if (material === baseMaterial) continue;

      const materialVariant = this.generateSingleSolution(
        request,
        classification.primaryDomain,
        elementType.elementType,
        `material-${material}`,
        { material }
      );
      solutions.push(materialVariant);
    }

    // Estimate metrics and check compliance for all solutions
    for (const solution of solutions) {
      solution.metrics = this.optimizer.estimateMetrics(solution);
      solution.compliance = this.checkCompliance(solution, request);
    }

    return solutions;
  }

  /**
   * Generate a single solution
   */
  private generateSingleSolution(
    request: DesignRequest,
    domain: string,
    elementType: string,
    variant: string,
    overrides: Record<string, unknown> = {}
  ): DesignSolution {
    const baseParams = this.getBaseParameters(request, domain, elementType);
    const parameters = { ...baseParams, ...overrides };

    return {
      id: `${domain}-${elementType}-${variant}`,
      domain: domain as DesignSolution['domain'],
      elementType,
      parameters,
      metrics: {} as SolutionMetrics, // Will be filled in
      compliance: { compliant: true, checks: [] },
      rationale: {
        summary: '',
        decisions: [],
        tradeoffs: [],
        rejectedAlternatives: [],
      },
      warnings: [],
    };
  }

  /**
   * Get base parameters for an element type
   */
  private getBaseParameters(
    request: DesignRequest,
    domain: string,
    elementType: string
  ): Record<string, unknown> {
    const elevationDiff = request.pointB.position.z - request.pointA.position.z;
    const horizDist = Math.sqrt(
      Math.pow(request.pointB.position.x - request.pointA.position.x, 2) +
      Math.pow(request.pointB.position.y - request.pointA.position.y, 2)
    );

    // Default material based on environment
    let material = 'carbon-steel';
    if (request.environment.conditions.corrosive) {
      material = 'stainless-steel';
    } else if (request.environment.conditions.exposure === 'outdoor') {
      material = 'galvanized-steel';
    }

    const baseParams: Record<string, unknown> = {
      material,
      startPoint: request.pointA.position,
      endPoint: request.pointB.position,
    };

    // Domain-specific parameters
    switch (domain) {
      case 'access':
        return this.getAccessParameters(baseParams, elementType, elevationDiff, horizDist);

      case 'structure':
        return this.getStructureParameters(baseParams, elementType, horizDist);

      case 'enclosure':
        return this.getEnclosureParameters(baseParams, elementType);

      case 'flow':
        return this.getFlowParameters(baseParams, elementType, horizDist);

      case 'mechanical':
        return this.getMechanicalParameters(baseParams, elementType);

      default:
        return baseParams;
    }
  }

  /**
   * Get access domain parameters
   */
  private getAccessParameters(
    base: Record<string, unknown>,
    elementType: string,
    elevationDiff: number,
    horizDist: number
  ): Record<string, unknown> {
    const params = { ...base };

    switch (elementType) {
      case 'stairs':
        // Calculate stair parameters per IBC
        const riserHeight = 175; // mm (max 178mm per IBC)
        const numRisers = Math.ceil(Math.abs(elevationDiff) / riserHeight);
        const actualRiser = Math.abs(elevationDiff) / numRisers;
        const treadDepth = 280; // mm (min 279mm per IBC)
        const width = 1100; // mm (min 1118mm for commercial)

        params.riserHeight = actualRiser;
        params.treadDepth = treadDepth;
        params.numRisers = numRisers;
        params.width = width;
        params.stringerType = 'steel-channel';
        params.handrailHeight = 1070; // mm
        break;

      case 'ladder':
        const rungSpacing = 300; // mm
        const numRungs = Math.ceil(Math.abs(elevationDiff) / rungSpacing);

        params.rungSpacing = rungSpacing;
        params.numRungs = numRungs;
        params.width = 450; // mm
        params.cageRequired = Math.abs(elevationDiff) > 6000;
        break;

      case 'ramp':
        // ADA max slope 1:12
        const slope = 12; // 1:12 ratio
        const rampLength = Math.abs(elevationDiff) * slope;

        params.slope = slope;
        params.length = rampLength;
        params.width = 1200; // mm
        params.handrailRequired = true;
        params.landingRequired = rampLength > 9000;
        break;

      case 'platform':
        params.width = horizDist > 0 ? horizDist : 1500;
        params.depth = 1500;
        params.loadCapacity = 4.8; // kN/m²
        params.gratingType = 'steel-bar';
        break;

      case 'walkway':
        params.width = 1000;
        params.length = horizDist;
        params.gratingType = 'steel-bar';
        params.handrailRequired = true;
        break;
    }

    return params;
  }

  /**
   * Get structure domain parameters
   */
  private getStructureParameters(
    base: Record<string, unknown>,
    elementType: string,
    span: number
  ): Record<string, unknown> {
    const params = { ...base };

    switch (elementType) {
      case 'beam':
        params.span = span;
        params.profile = span > 3000 ? 'W200x46' : 'W150x22';
        params.loadType = 'uniform';
        break;

      case 'column':
        params.height = span;
        params.profile = 'HSS150x150x6';
        params.basePlateSize = 300;
        break;

      case 'bracing':
        params.type = 'x-brace';
        params.profile = 'L100x100x8';
        break;
    }

    return params;
  }

  /**
   * Get enclosure domain parameters
   */
  private getEnclosureParameters(
    base: Record<string, unknown>,
    elementType: string
  ): Record<string, unknown> {
    const params = { ...base };

    switch (elementType) {
      case 'guard':
        params.openingSize = 12; // mm max per ISO 13857
        params.height = 1400;
        params.meshType = 'welded-wire';
        break;

      case 'panel':
        params.thickness = 2; // mm
        params.bendRadius = 3; // mm
        break;

      case 'fence':
        params.height = 2100;
        params.postSpacing = 2400;
        params.meshType = 'chain-link';
        break;
    }

    return params;
  }

  /**
   * Get flow domain parameters
   */
  private getFlowParameters(
    base: Record<string, unknown>,
    elementType: string,
    length: number
  ): Record<string, unknown> {
    const params = { ...base };

    switch (elementType) {
      case 'pipe':
        params.nominalSize = 50; // mm
        params.schedule = '40';
        params.length = length;
        params.supportSpacing = 3000;
        break;

      case 'duct':
        params.width = 400;
        params.height = 300;
        params.gauge = 24;
        params.length = length;
        break;

      case 'cable-tray':
        params.width = 300;
        params.depth = 100;
        params.type = 'ladder';
        params.length = length;
        break;
    }

    return params;
  }

  /**
   * Get mechanical domain parameters
   */
  private getMechanicalParameters(
    base: Record<string, unknown>,
    elementType: string
  ): Record<string, unknown> {
    const params = { ...base };

    switch (elementType) {
      case 'shaft':
        params.diameter = 50;
        params.length = 500;
        params.keyway = true;
        break;

      case 'coupling':
        params.type = 'flexible-jaw';
        params.size = 50;
        params.misalignmentCapacity = 1; // degrees
        break;

      case 'linkage':
        params.type = 'four-bar';
        params.inputAngle = 90;
        params.outputAngle = 45;
        break;
    }

    return params;
  }

  /**
   * Check code compliance
   */
  private checkCompliance(
    solution: DesignSolution,
    request: DesignRequest
  ): ComplianceStatus {
    const checks: CodeCheck[] = [];
    const codes = request.constraints.codes;

    for (const code of codes) {
      const codeChecks = this.runCodeChecks(solution, code.code);
      checks.push(...codeChecks);
    }

    return {
      compliant: checks.every(c => c.status !== 'fail'),
      checks,
    };
  }

  /**
   * Run checks for a specific code
   */
  private runCodeChecks(solution: DesignSolution, code: string): CodeCheck[] {
    const checks: CodeCheck[] = [];
    const params = solution.parameters;

    if (code === 'IBC' && solution.domain === 'access') {
      if (solution.elementType === 'stairs') {
        // Riser height check
        const riserHeight = params.riserHeight as number;
        checks.push({
          code: 'IBC',
          section: '1011.5.2',
          requirement: 'Maximum riser height 178mm',
          status: riserHeight <= 178 ? 'pass' : 'fail',
          message: riserHeight <= 178
            ? `Riser height ${riserHeight.toFixed(0)}mm is within limit`
            : `Riser height ${riserHeight.toFixed(0)}mm exceeds maximum of 178mm`,
          value: riserHeight,
          limit: 178,
        });

        // Tread depth check
        const treadDepth = params.treadDepth as number;
        checks.push({
          code: 'IBC',
          section: '1011.5.2',
          requirement: 'Minimum tread depth 279mm',
          status: treadDepth >= 279 ? 'pass' : 'fail',
          message: treadDepth >= 279
            ? `Tread depth ${treadDepth.toFixed(0)}mm meets minimum`
            : `Tread depth ${treadDepth.toFixed(0)}mm below minimum of 279mm`,
          value: treadDepth,
          limit: 279,
        });
      }
    }

    if (code === 'OSHA' && solution.domain === 'access') {
      // Handrail requirement
      const handrailHeight = params.handrailHeight as number;
      if (handrailHeight) {
        checks.push({
          code: 'OSHA',
          section: '1910.23',
          requirement: 'Guardrail height 1067mm minimum',
          status: handrailHeight >= 1067 ? 'pass' : 'fail',
          message: handrailHeight >= 1067
            ? `Handrail height ${handrailHeight}mm meets requirement`
            : `Handrail height ${handrailHeight}mm below minimum of 1067mm`,
          value: handrailHeight,
          limit: 1067,
        });
      }
    }

    if (code === 'ADA' && solution.domain === 'access') {
      if (solution.elementType === 'ramp') {
        const slope = params.slope as number;
        checks.push({
          code: 'ADA',
          section: '405.2',
          requirement: 'Maximum slope 1:12',
          status: slope >= 12 ? 'pass' : 'fail',
          message: slope >= 12
            ? `Slope 1:${slope} meets ADA requirement`
            : `Slope 1:${slope} exceeds maximum (steeper than 1:12)`,
          value: slope,
          limit: 12,
        });
      }
    }

    return checks;
  }

  /**
   * Create an empty solution for error cases
   */
  private createEmptySolution(request: DesignRequest): DesignSolution {
    return {
      id: 'empty-solution',
      domain: 'access',
      elementType: 'unknown',
      parameters: {
        startPoint: request.pointA.position,
        endPoint: request.pointB.position,
      },
      metrics: {
        estimatedCost: 0,
        estimatedWeight: 0,
        materialEfficiency: 0,
        manufacturingComplexity: 0,
        assemblyTimeEstimate: 0,
        maintenanceScore: 5,
        overallScore: 0,
      },
      compliance: { compliant: false, checks: [] },
      rationale: {
        summary: 'No valid solution could be generated.',
        decisions: [],
        tradeoffs: [],
        rejectedAlternatives: [],
      },
      warnings: ['No valid solution generated'],
    };
  }

  /**
   * Log message if verbose mode enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[AIOrchestrator] ${message}`);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAIOrchestrator(config?: OrchestratorConfig): AIOrchestrator {
  return new AIOrchestrator(config);
}
