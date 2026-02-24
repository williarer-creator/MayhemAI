/**
 * AI Orchestrator Pipeline
 *
 * Main orchestration logic for processing engineering requests
 */

import type {
  InputData,
  AnalysisResult,
  PipelineState,
  PipelineStage,
  SelectedElement,
  ValidationResult,
  OutputRequest,
  GeneratedOutput,
  ElementSuggestion,
  ReasoningStep,
  AIResponse,
} from './types';

// Import knowledge domains
import { accessElements, getAccessElement } from '../knowledge/domains/access';
import { enclosureElements, getEnclosureElement } from '../knowledge/domains/enclosure';
import { flowElements, getFlowElement } from '../knowledge/domains/flow';
import { mechanicalElements, getMechanicalElement } from '../knowledge/domains/mechanical';
import { structureElements, getStructureElement } from '../knowledge/domains/structure';
import { ElementDefinition } from '../knowledge/types';

// ============================================================================
// DOMAIN REGISTRY
// ============================================================================

interface DomainInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  elements: ElementDefinition[];
  getElement: (id: string) => ElementDefinition | undefined;
}

const domainRegistry: DomainInfo[] = [
  {
    id: 'ACCESS',
    name: 'Access Systems',
    description: 'Stairs, ladders, ramps, platforms for personnel access',
    keywords: ['stair', 'ladder', 'ramp', 'platform', 'walkway', 'access', 'catwalk', 'mezzanine', 'egress'],
    elements: accessElements,
    getElement: getAccessElement,
  },
  {
    id: 'ENCLOSURE',
    name: 'Protective Containment',
    description: 'Guards, covers, enclosures for equipment protection and safety',
    keywords: ['guard', 'cover', 'enclosure', 'housing', 'cabinet', 'shield', 'barrier', 'cage', 'fence', 'ip-rating', 'nema'],
    elements: enclosureElements,
    getElement: getEnclosureElement,
  },
  {
    id: 'FLOW',
    name: 'Fluid and Air Conveyance',
    description: 'Pipes, ducts for transporting fluids and gases',
    keywords: ['pipe', 'piping', 'duct', 'hvac', 'plumbing', 'exhaust', 'ventilation', 'ductwork', 'header', 'manifold'],
    elements: flowElements,
    getElement: getFlowElement,
  },
  {
    id: 'MECHANICAL',
    name: 'Hardware and Mounting',
    description: 'Brackets, mounts, equipment bases for mechanical connections',
    keywords: ['bracket', 'mount', 'base', 'plate', 'anchor', 'support', 'isolator', 'vibration', 'gusset', 'clamp'],
    elements: mechanicalElements,
    getElement: getMechanicalElement,
  },
  {
    id: 'STRUCTURE',
    name: 'Structural Frames',
    description: 'Steel frames, aluminum extrusions for structural support',
    keywords: ['frame', 'beam', 'column', 'truss', 'extrusion', 't-slot', 'steel', 'structure', 'portal', 'bracing'],
    elements: structureElements,
    getElement: getStructureElement,
  },
];

// ============================================================================
// PIPELINE CLASS
// ============================================================================

export class EngineeringPipeline {
  private state: PipelineState;

  constructor(projectId: string) {
    this.state = {
      projectId,
      currentStage: 'input',
      inputs: [],
      analysisResults: [],
      designIntent: null,
      selectedElements: [],
      validationResults: [],
      generatedOutputs: [],
      history: [],
      errors: [],
    };
  }

  // ============================================================================
  // INPUT STAGE
  // ============================================================================

  addInput(input: InputData): void {
    this.state.inputs.push(input);
    this.logEvent('input', 'input_added', { inputId: input.id, type: input.type });
  }

  // ============================================================================
  // ANALYSIS STAGE
  // ============================================================================

  async analyzeInputs(): Promise<AnalysisResult[]> {
    this.setStage('analysis');

    const results: AnalysisResult[] = [];

    for (const input of this.state.inputs) {
      const result = await this.analyzeInput(input);
      results.push(result);
    }

    this.state.analysisResults = results;
    return results;
  }

  private async analyzeInput(input: InputData): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      id: `analysis-${input.id}`,
      inputId: input.id,
      timestamp: new Date(),
      confidence: 0,
      suggestedDomain: '',
      suggestedElements: [],
      extractedFeatures: [],
      spatialRelationships: [],
      warnings: [],
    };

    // Extract features based on input type
    switch (input.type) {
      case 'requirements':
        result.extractedFeatures = this.extractRequirementsFeatures(input);
        break;
      case 'measurements':
        result.extractedFeatures = this.extractMeasurementFeatures(input);
        break;
      case 'image':
        result.extractedFeatures = await this.extractImageFeatures(input);
        break;
      case 'point-cloud':
        result.extractedFeatures = await this.extractPointCloudFeatures(input);
        break;
      default:
        result.warnings.push(`Input type ${input.type} analysis not yet implemented`);
    }

    // Route to domain based on extracted features
    const domainMatch = this.routeToDomain(result.extractedFeatures);
    result.suggestedDomain = domainMatch.domain;
    result.confidence = domainMatch.confidence;

    // Suggest elements within the domain
    result.suggestedElements = this.suggestElements(domainMatch.domain, result.extractedFeatures);

    this.logEvent('analysis', 'input_analyzed', {
      inputId: input.id,
      domain: result.suggestedDomain,
      confidence: result.confidence,
      elementCount: result.suggestedElements.length,
    });

    return result;
  }

  private extractRequirementsFeatures(input: InputData): AnalysisResult['extractedFeatures'] {
    const features: AnalysisResult['extractedFeatures'] = [];
    const data = input.data as { text: string; constraints?: unknown[]; preferences?: unknown[] };
    const text = data.text.toLowerCase();

    // Extract keywords and match to domains
    for (const domain of domainRegistry) {
      for (const keyword of domain.keywords) {
        if (text.includes(keyword)) {
          features.push({
            id: `keyword-${keyword}`,
            type: 'annotation',
            value: { keyword, domain: domain.id },
            confidence: 0.8,
            source: 'requirements_text',
          });
        }
      }
    }

    // Extract dimensions from text (e.g., "3 meters", "1500mm")
    const dimensionPattern = /(\d+(?:\.\d+)?)\s*(mm|cm|m|in|ft|inch|inches|feet|meters)/gi;
    let match;
    while ((match = dimensionPattern.exec(data.text)) !== null) {
      features.push({
        id: `dim-${features.length}`,
        type: 'dimension',
        value: { value: parseFloat(match[1]), unit: this.normalizeUnit(match[2]) },
        confidence: 0.9,
        source: 'requirements_text',
      });
    }

    return features;
  }

  private extractMeasurementFeatures(input: InputData): AnalysisResult['extractedFeatures'] {
    const features: AnalysisResult['extractedFeatures'] = [];
    const data = input.data as { dimensions: Array<{ name: string; value: number; unit: string }> };

    for (const dim of data.dimensions) {
      features.push({
        id: `dim-${dim.name}`,
        type: 'dimension',
        value: dim,
        confidence: 1.0, // Manual measurements are high confidence
        source: 'measurements',
      });
    }

    return features;
  }

  private async extractImageFeatures(_input: InputData): Promise<AnalysisResult['extractedFeatures']> {
    // Placeholder for image analysis - would use computer vision in production
    // TODO: Integrate with CV model to extract features from _input
    const features: AnalysisResult['extractedFeatures'] = [];

    features.push({
      id: 'image-pending',
      type: 'annotation',
      value: { status: 'pending_cv_analysis' },
      confidence: 0,
      source: 'image',
    });

    return features;
  }

  private async extractPointCloudFeatures(input: InputData): Promise<AnalysisResult['extractedFeatures']> {
    // Placeholder for point cloud analysis
    const features: AnalysisResult['extractedFeatures'] = [];
    const data = input.data as { bounds: { min: unknown; max: unknown } };

    features.push({
      id: 'pointcloud-bounds',
      type: 'shape',
      value: { bounds: data.bounds },
      confidence: 1.0,
      source: 'point_cloud',
    });

    return features;
  }

  private normalizeUnit(unit: string): string {
    const normalized = unit.toLowerCase();
    if (['in', 'inch', 'inches'].includes(normalized)) return 'in';
    if (['ft', 'feet', 'foot'].includes(normalized)) return 'ft';
    if (['m', 'meter', 'meters'].includes(normalized)) return 'm';
    if (['cm', 'centimeter', 'centimeters'].includes(normalized)) return 'cm';
    return 'mm';
  }

  // ============================================================================
  // DOMAIN ROUTING
  // ============================================================================

  private routeToDomain(features: AnalysisResult['extractedFeatures']): { domain: string; confidence: number } {
    const domainScores: Record<string, number> = {};

    for (const domain of domainRegistry) {
      domainScores[domain.id] = 0;
    }

    // Score based on keyword matches
    for (const feature of features) {
      if (feature.type === 'annotation' && typeof feature.value === 'object') {
        const val = feature.value as { domain?: string };
        if (val.domain) {
          domainScores[val.domain] = (domainScores[val.domain] || 0) + feature.confidence;
        }
      }
    }

    // Find highest scoring domain
    let bestDomain = 'MECHANICAL'; // Default fallback
    let bestScore = 0;

    for (const [domain, score] of Object.entries(domainScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }

    // Normalize confidence
    const totalFeatures = features.filter(f => f.type === 'annotation').length || 1;
    const confidence = Math.min(bestScore / totalFeatures, 1.0);

    return { domain: bestDomain, confidence };
  }

  // ============================================================================
  // ELEMENT SELECTION
  // ============================================================================

  private suggestElements(
    domainId: string,
    features: AnalysisResult['extractedFeatures']
  ): ElementSuggestion[] {
    const domain = domainRegistry.find(d => d.id === domainId);
    if (!domain) return [];

    const suggestions: ElementSuggestion[] = [];

    for (const element of domain.elements) {
      const matchScore = this.scoreElementMatch(element, features);

      if (matchScore > 0.3) {
        suggestions.push({
          elementId: element.id,
          domain: domainId,
          confidence: matchScore,
          matchedFeatures: this.getMatchedFeatures(element, features),
          parameterValues: this.inferParameters(element, features),
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return suggestions;
  }

  private scoreElementMatch(element: ElementDefinition, features: AnalysisResult['extractedFeatures']): number {
    let score = 0;
    const elementKeywords = [
      element.id.toLowerCase(),
      element.name.toLowerCase(),
      ...element.description.toLowerCase().split(' '),
    ];

    for (const feature of features) {
      if (feature.type === 'annotation' && typeof feature.value === 'object') {
        const val = feature.value as { keyword?: string };
        if (val.keyword && elementKeywords.some(kw => kw.includes(val.keyword!))) {
          score += feature.confidence;
        }
      }
    }

    return Math.min(score, 1.0);
  }

  private getMatchedFeatures(element: ElementDefinition, features: AnalysisResult['extractedFeatures']): string[] {
    const matched: string[] = [];
    const elementKeywords = [element.id, element.name, ...element.description.split(' ')];

    for (const feature of features) {
      if (feature.type === 'annotation' && typeof feature.value === 'object') {
        const val = feature.value as { keyword?: string };
        if (val.keyword && elementKeywords.some(kw => kw.toLowerCase().includes(val.keyword!.toLowerCase()))) {
          matched.push(val.keyword);
        }
      }
    }

    return matched;
  }

  private inferParameters(
    element: ElementDefinition,
    features: AnalysisResult['extractedFeatures']
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    // Set defaults from element definition
    for (const param of element.parameters) {
      if (param.default !== undefined) {
        params[param.id] = param.default;
      }
    }

    // Override with extracted dimensions
    const dimensions = features.filter(f => f.type === 'dimension');
    for (const dim of dimensions) {
      const val = dim.value as { name?: string; value: number; unit: string };
      // Try to match dimension to parameter
      for (const param of element.parameters) {
        if (param.type === 'number') {
          const paramLower = param.id.toLowerCase();
          const dimName = (val.name || '').toLowerCase();

          if (dimName.includes(paramLower) || paramLower.includes(dimName)) {
            // Convert units if needed
            params[param.id] = this.convertToMm(val.value, val.unit);
          }
        }
      }
    }

    return params;
  }

  private convertToMm(value: number, unit: string): number {
    switch (unit) {
      case 'm': return value * 1000;
      case 'cm': return value * 10;
      case 'in': return value * 25.4;
      case 'ft': return value * 304.8;
      default: return value;
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  async validateSelection(): Promise<ValidationResult[]> {
    this.setStage('validation');

    const results: ValidationResult[] = [];

    for (const selection of this.state.selectedElements) {
      const result = await this.validateElement(selection);
      results.push(result);
    }

    this.state.validationResults = results;
    return results;
  }

  private async validateElement(selection: SelectedElement): Promise<ValidationResult> {
    const result: ValidationResult = {
      elementId: selection.elementId,
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Get element definition
    const domain = domainRegistry.find(d => d.id === selection.domain);
    if (!domain) {
      result.isValid = false;
      result.errors.push(`Unknown domain: ${selection.domain}`);
      return result;
    }

    const element = domain.getElement(selection.elementId);
    if (!element) {
      result.isValid = false;
      result.errors.push(`Unknown element: ${selection.elementId}`);
      return result;
    }

    // Validate parameters against rules
    for (const rule of element.rules) {
      const ruleResult = this.checkRule(rule, selection.parameters);
      if (!ruleResult.passed) {
        // 'constraint' rules are errors, 'recommendation' rules are warnings
        if (rule.type === 'constraint') {
          result.isValid = false;
          result.errors.push(`${rule.description} (${rule.source || 'Engineering standard'})`);
        } else {
          result.warnings.push(`${rule.description} (${rule.source || 'Best practice'})`);
        }
      }
    }

    // Parameter range validation
    for (const param of element.parameters) {
      const value = selection.parameters[param.id];
      if (value === undefined && param.default === undefined) {
        result.warnings.push(`Parameter ${param.name} not specified`);
        continue;
      }

      if (param.type === 'number' && typeof value === 'number') {
        if (param.min !== undefined && value < param.min) {
          result.errors.push(`${param.name} (${value}) below minimum (${param.min})`);
          result.isValid = false;
        }
        if (param.max !== undefined && value > param.max) {
          result.errors.push(`${param.name} (${value}) exceeds maximum (${param.max})`);
          result.isValid = false;
        }
      }
    }

    return result;
  }

  private checkRule(
    _rule: ElementDefinition['rules'][0],
    _params: Record<string, unknown>
  ): { passed: boolean; message?: string } {
    // Rule checking would involve parsing the expression
    // For now, return passed - real implementation would evaluate rule expressions
    // TODO: Implement expression evaluation based on rule.expression type
    return { passed: true };
  }

  // ============================================================================
  // OUTPUT GENERATION
  // ============================================================================

  async generateOutputs(requests: OutputRequest[]): Promise<GeneratedOutput[]> {
    this.setStage('output-generation');

    const outputs: GeneratedOutput[] = [];

    for (const request of requests) {
      const output = await this.generateOutput(request);
      if (output) {
        outputs.push(output);
      }
    }

    this.state.generatedOutputs = outputs;
    this.setStage('complete');

    return outputs;
  }

  private async generateOutput(request: OutputRequest): Promise<GeneratedOutput | null> {
    // Placeholder for output generation
    // Would integrate with CAD kernel and output generators

    const output: GeneratedOutput = {
      id: `output-${Date.now()}`,
      designId: this.state.projectId,
      format: request.format,
      filePath: `./output/${this.state.projectId}/${request.format}`,
      timestamp: new Date(),
      metadata: {
        fileSize: 0,
        warnings: ['Output generation not yet implemented'],
      },
    };

    this.logEvent('output-generation', 'output_generated', {
      format: request.format,
      outputId: output.id,
    });

    return output;
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  private setStage(stage: PipelineStage): void {
    this.state.currentStage = stage;
    this.logEvent(stage, 'stage_entered', {});
  }

  private logEvent(stage: PipelineStage, action: string, details: Record<string, unknown>): void {
    this.state.history.push({
      timestamp: new Date(),
      stage,
      action,
      details,
    });
  }

  // Reserved for error handling - will be used when rule evaluation is implemented
  // @ts-expect-error - Method reserved for future use
  private logError(stage: PipelineStage, code: string, message: string, recoverable: boolean): void {
    this.state.errors.push({
      timestamp: new Date(),
      stage,
      code,
      message,
      recoverable,
    });
  }

  getState(): Readonly<PipelineState> {
    return this.state;
  }

  // ============================================================================
  // AI REASONING (for transparency)
  // ============================================================================

  explainDecision(elementId: string): AIResponse {
    const analysis = this.state.analysisResults;
    const suggestion = analysis
      .flatMap(a => a.suggestedElements)
      .find(s => s.elementId === elementId);

    const reasoning: ReasoningStep[] = [];

    // Build reasoning chain
    reasoning.push({
      id: 'obs-1',
      type: 'observation',
      content: `Analyzed ${this.state.inputs.length} input(s) for engineering requirements`,
      confidence: 1.0,
      evidence: this.state.inputs.map(i => i.type),
    });

    if (suggestion) {
      reasoning.push({
        id: 'inf-1',
        type: 'inference',
        content: `Input keywords matched ${suggestion.domain} domain with ${(suggestion.confidence * 100).toFixed(0)}% confidence`,
        confidence: suggestion.confidence,
        evidence: suggestion.matchedFeatures,
      });

      reasoning.push({
        id: 'dec-1',
        type: 'decision',
        content: `Selected ${elementId} element based on feature matching`,
        confidence: suggestion.confidence,
        evidence: Object.keys(suggestion.parameterValues),
        alternatives: this.getAlternatives(suggestion),
      });
    }

    return {
      reasoning,
      recommendation: suggestion,
      confidence: suggestion?.confidence || 0,
      requiresUserInput: (suggestion?.confidence || 0) < 0.7,
      questions: this.generateQuestions(suggestion),
    };
  }

  private getAlternatives(suggestion: ElementSuggestion): AIResponse['reasoning'][0]['alternatives'] {
    const domain = domainRegistry.find(d => d.id === suggestion.domain);
    if (!domain) return [];

    return domain.elements
      .filter(e => e.id !== suggestion.elementId)
      .slice(0, 3)
      .map(e => ({
        option: e.name,
        reason: e.description,
        tradeoffs: [],
      }));
  }

  private generateQuestions(suggestion?: ElementSuggestion): AIResponse['questions'] {
    if (!suggestion) return [];

    const questions: AIResponse['questions'] = [];

    // Ask about uncertain parameters
    const domain = domainRegistry.find(d => d.id === suggestion.domain);
    const element = domain?.getElement(suggestion.elementId);

    if (element) {
      for (const param of element.parameters) {
        if (suggestion.parameterValues[param.id] === undefined && param.default === undefined) {
          questions.push({
            id: `q-${param.id}`,
            question: `What is the ${param.name}?`,
            type: param.type === 'select' ? 'choice' : 'value',
            options: param.options,
            required: true,
          });
        }
      }
    }

    return questions;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPipeline(projectId: string): EngineeringPipeline {
  return new EngineeringPipeline(projectId);
}

// ============================================================================
// DOMAIN QUERIES
// ============================================================================

export function getAllDomains(): DomainInfo[] {
  return domainRegistry;
}

export function getDomain(id: string): DomainInfo | undefined {
  return domainRegistry.find(d => d.id === id);
}

export function getAllElements(): ElementDefinition[] {
  return domainRegistry.flatMap(d => d.elements);
}

export function findElement(elementId: string): { domain: DomainInfo; element: ElementDefinition } | undefined {
  for (const domain of domainRegistry) {
    const element = domain.getElement(elementId);
    if (element) {
      return { domain, element };
    }
  }
  return undefined;
}
