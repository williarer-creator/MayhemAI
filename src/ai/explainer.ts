/**
 * Design Explainer
 *
 * Generates human-readable explanations of design decisions,
 * trade-offs, and rationale.
 */

import type {
  DesignRequest,
  DesignSolution,
  DomainClassification,
  DesignRationale,
  DesignDecision,
  Tradeoff,
  RejectedAlternative,
  CodeCheck,
  OptimizationResult,
} from './types';

// ============================================================================
// EXPLANATION TEMPLATES
// ============================================================================

const domainDescriptions: Record<string, string> = {
  access: 'providing human or equipment access between different elevations or locations',
  structure: 'supporting loads and spanning distances with structural elements',
  enclosure: 'protecting, containing, or covering equipment and spaces',
  flow: 'routing fluids, gases, cables, or materials between points',
  mechanical: 'transmitting motion, force, or power between components',
};

const elementDescriptions: Record<string, string> = {
  stairs: 'a stairway with treads, risers, stringers, and handrails',
  ladder: 'a vertical or near-vertical climbing device with rungs',
  ramp: 'an inclined surface for wheelchair or equipment access',
  platform: 'a horizontal surface at elevation for access or working',
  walkway: 'a horizontal path for pedestrian access',
  beam: 'a horizontal structural member spanning between supports',
  column: 'a vertical structural member carrying compressive loads',
  bracing: 'diagonal members providing lateral stability',
  bracket: 'a supporting element projecting from a wall or structure',
  guard: 'a protective enclosure around machinery',
  panel: 'a flat sheet metal component',
  fence: 'a perimeter barrier for safety or security',
  pipe: 'a conduit for fluid or gas transport',
  duct: 'a conduit for air or gas movement',
  shaft: 'a rotating element transmitting torque',
  linkage: 'a mechanism converting or transmitting motion',
};

// ============================================================================
// DESIGN EXPLAINER CLASS
// ============================================================================

export class DesignExplainer {
  /**
   * Generate complete design rationale
   */
  generateRationale(
    request: DesignRequest,
    classification: DomainClassification,
    solution: DesignSolution,
    alternatives: DesignSolution[] = []
  ): DesignRationale {
    const summary = this.generateSummary(request, classification, solution);
    const decisions = this.extractDecisions(request, classification, solution);
    const tradeoffs = this.identifyTradeoffs(solution, alternatives);
    const rejectedAlternatives = this.documentRejections(alternatives, solution);

    return {
      summary,
      decisions,
      tradeoffs,
      rejectedAlternatives,
    };
  }

  /**
   * Generate a summary of the design approach
   */
  private generateSummary(
    request: DesignRequest,
    classification: DomainClassification,
    solution: DesignSolution
  ): string {
    const parts: string[] = [];

    // What we're solving
    parts.push(`This design addresses the requirement of ${domainDescriptions[classification.primaryDomain] || 'connecting two points'}.`);

    // What element type we chose
    const elementDesc = elementDescriptions[solution.elementType] || solution.elementType;
    parts.push(`The selected solution is ${elementDesc}.`);

    // Why this domain
    if (classification.confidence < 0.7) {
      parts.push(`The ${classification.primaryDomain.toUpperCase()} domain was selected with moderate confidence (${(classification.confidence * 100).toFixed(0)}%).`);
      if (classification.secondaryDomains.length > 0) {
        parts.push(`Alternative domains considered: ${classification.secondaryDomains.map(d => d.domain).join(', ')}.`);
      }
    } else {
      parts.push(`The ${classification.primaryDomain.toUpperCase()} domain was clearly indicated by the requirements.`);
    }

    // Key constraint satisfaction
    const constraints = request.constraints;
    if (constraints.codes.length > 0) {
      parts.push(`The design complies with ${constraints.codes.map(c => c.code).join(', ')} requirements.`);
    }

    return parts.join(' ');
  }

  /**
   * Extract key design decisions
   */
  private extractDecisions(
    request: DesignRequest,
    classification: DomainClassification,
    solution: DesignSolution
  ): DesignDecision[] {
    const decisions: DesignDecision[] = [];

    // Domain selection decision
    decisions.push({
      aspect: 'Domain Selection',
      choice: classification.primaryDomain,
      reason: classification.reasoning,
    });

    // Element type decision
    decisions.push({
      aspect: 'Element Type',
      choice: solution.elementType,
      reason: this.explainElementChoice(solution, classification),
    });

    // Material decision
    const material = solution.parameters.material as string;
    if (material) {
      decisions.push({
        aspect: 'Material Selection',
        choice: material,
        reason: this.explainMaterialChoice(material, request),
      });
    }

    // Configuration decisions from parameters
    const configDecisions = this.extractConfigurationDecisions(solution);
    decisions.push(...configDecisions);

    return decisions;
  }

  /**
   * Explain why this element type was chosen
   */
  private explainElementChoice(
    solution: DesignSolution,
    _classification: DomainClassification
  ): string {
    const elementType = solution.elementType;

    switch (elementType) {
      case 'stairs':
        return 'Stairway selected due to elevation change within comfortable climbing range and available horizontal space.';
      case 'ladder':
        return 'Ladder selected due to limited horizontal space or steep elevation change.';
      case 'ramp':
        return 'Ramp selected for ADA accessibility or equipment movement requirements.';
      case 'beam':
        return 'Beam selected to span the horizontal distance and support the required loads.';
      case 'column':
        return 'Column selected to transfer vertical loads to foundation.';
      default:
        return `${elementType} was the most appropriate element for the given requirements.`;
    }
  }

  /**
   * Explain material choice
   */
  private explainMaterialChoice(material: string, request: DesignRequest): string {
    const env = request.environment.conditions;
    const prefs = request.constraints.materialPreferences || [];

    // Check if material was required
    const required = prefs.find(p => p.material === material && p.preference === 'required');
    if (required) {
      return `${material} was specified as a requirement.`;
    }

    // Explain based on environment
    switch (material) {
      case 'stainless-steel':
        if (env.corrosive || env.humidity === 'high') {
          return 'Stainless steel selected for corrosion resistance in harsh environment.';
        }
        return 'Stainless steel selected for durability and low maintenance.';

      case 'galvanized-steel':
        if (env.exposure === 'outdoor') {
          return 'Galvanized steel selected for outdoor exposure protection at lower cost than stainless.';
        }
        return 'Galvanized steel selected for corrosion resistance.';

      case 'aluminum':
        return 'Aluminum selected for light weight and corrosion resistance.';

      case 'carbon-steel':
        if (env.exposure === 'indoor') {
          return 'Carbon steel selected for cost effectiveness in protected indoor environment.';
        }
        return 'Carbon steel selected for strength and cost, with appropriate coating specified.';

      default:
        return `${material} selected based on requirements and environmental conditions.`;
    }
  }

  /**
   * Extract configuration decisions from parameters
   */
  private extractConfigurationDecisions(solution: DesignSolution): DesignDecision[] {
    const decisions: DesignDecision[] = [];
    const params = solution.parameters;

    // Stairs-specific
    if (solution.elementType === 'stairs') {
      if (params.riserHeight) {
        decisions.push({
          aspect: 'Riser Height',
          choice: `${params.riserHeight}mm`,
          reason: `Selected within IBC limits (max 178mm) for comfortable climbing.`,
        });
      }
      if (params.numLandings && (params.numLandings as number) > 0) {
        decisions.push({
          aspect: 'Landings',
          choice: `${params.numLandings} landing(s)`,
          reason: 'Intermediate landings provided for rise exceeding 3.7m or direction change.',
        });
      }
    }

    // Beam-specific
    if (solution.elementType === 'beam') {
      if (params.profile) {
        decisions.push({
          aspect: 'Profile Selection',
          choice: params.profile as string,
          reason: 'Selected to meet span and load requirements with acceptable deflection.',
        });
      }
    }

    // General size decisions
    if (params.width) {
      decisions.push({
        aspect: 'Width',
        choice: `${params.width}mm`,
        reason: 'Width selected based on capacity requirements and available space.',
      });
    }

    return decisions;
  }

  /**
   * Identify trade-offs made in the design
   */
  private identifyTradeoffs(
    solution: DesignSolution,
    alternatives: DesignSolution[]
  ): Tradeoff[] {
    const tradeoffs: Tradeoff[] = [];

    // Cost vs. material quality
    const material = solution.parameters.material as string;
    if (material === 'stainless-steel') {
      tradeoffs.push({
        factor1: 'Initial Cost',
        factor2: 'Long-term Durability',
        decision: 'Selected higher-cost stainless steel',
        impact: 'Higher upfront cost offset by reduced maintenance and longer service life.',
      });
    }

    // Compare with alternatives
    for (const alt of alternatives) {
      if (alt.metrics && solution.metrics) {
        // Cost difference
        if (alt.metrics.estimatedCost < solution.metrics.estimatedCost * 0.8) {
          tradeoffs.push({
            factor1: 'Cost',
            factor2: 'Code Compliance/Safety',
            decision: `Selected ${solution.elementType} over cheaper ${alt.elementType}`,
            impact: 'Lower-cost alternative did not meet all requirements.',
          });
        }

        // Weight difference
        if (alt.metrics.estimatedWeight < solution.metrics.estimatedWeight * 0.7) {
          tradeoffs.push({
            factor1: 'Weight',
            factor2: 'Load Capacity',
            decision: `Selected heavier ${solution.elementType}`,
            impact: 'Additional weight provides required structural capacity.',
          });
        }
      }
    }

    // General trade-offs by domain
    if (solution.domain === 'access') {
      tradeoffs.push({
        factor1: 'Space Efficiency',
        factor2: 'User Comfort',
        decision: 'Balanced rise/run ratio within code limits',
        impact: 'Moderate space usage with comfortable climbing angle.',
      });
    }

    return tradeoffs;
  }

  /**
   * Document why alternatives were rejected
   */
  private documentRejections(
    alternatives: DesignSolution[],
    selected: DesignSolution
  ): RejectedAlternative[] {
    const rejections: RejectedAlternative[] = [];

    for (const alt of alternatives) {
      if (alt.id === selected.id) continue;

      // Check compliance
      if (alt.compliance && !alt.compliance.compliant) {
        const failedChecks = alt.compliance.checks.filter(c => c.status === 'fail');
        rejections.push({
          description: `${alt.elementType} using ${alt.parameters.material || 'default material'}`,
          reason: `Failed code compliance: ${failedChecks.map(c => c.code).join(', ')}`,
        });
        continue;
      }

      // Check metrics
      if (alt.metrics && selected.metrics) {
        if (alt.metrics.overallScore < selected.metrics.overallScore * 0.8) {
          const worstAspect = this.findWorstAspect(alt.metrics);
          rejections.push({
            description: `${alt.elementType} configuration`,
            reason: `Lower overall score due to ${worstAspect}`,
          });
        }
      }
    }

    return rejections;
  }

  /**
   * Find the worst-performing aspect of a solution
   */
  private findWorstAspect(metrics: DesignSolution['metrics']): string {
    if (!metrics) return 'multiple factors';

    if (metrics.estimatedCost > 2000) return 'high cost';
    if (metrics.manufacturingComplexity > 7) return 'manufacturing complexity';
    if (metrics.maintenanceScore > 7) return 'maintenance requirements';
    if (metrics.estimatedWeight > 200) return 'excessive weight';

    return 'overall performance';
  }

  /**
   * Generate compliance explanation
   */
  explainCompliance(checks: CodeCheck[]): string {
    const parts: string[] = [];

    const failed = checks.filter(c => c.status === 'fail');
    const warnings = checks.filter(c => c.status === 'warning');

    if (failed.length === 0) {
      parts.push(`Design meets all ${checks.length} code requirements.`);
    } else {
      parts.push(`Design fails ${failed.length} of ${checks.length} code requirements.`);
      for (const check of failed) {
        parts.push(`- ${check.code} ${check.section}: ${check.message}`);
      }
    }

    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning(s) noted:`);
      for (const check of warnings) {
        parts.push(`- ${check.message}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Generate optimization explanation
   */
  explainOptimization(result: OptimizationResult): string {
    const parts: string[] = [];

    parts.push(result.summary);

    if (result.rankedSolutions.length > 1) {
      parts.push('\nRanking breakdown:');
      for (const ranked of result.rankedSolutions.slice(0, 3)) {
        parts.push(`${ranked.rank}. Solution ${ranked.solutionId}`);
        parts.push(`   Cost: $${ranked.scores.cost.toFixed(0)}, Weight: ${ranked.scores.weight.toFixed(1)}kg`);
        parts.push(`   Score: ${ranked.scores.overall.toFixed(1)}/100`);
        if (ranked.strengths.length > 0) {
          parts.push(`   Strengths: ${ranked.strengths.join(', ')}`);
        }
        if (ranked.weaknesses.length > 0) {
          parts.push(`   Weaknesses: ${ranked.weaknesses.join(', ')}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Generate full design report
   */
  generateDesignReport(
    request: DesignRequest,
    classification: DomainClassification,
    solution: DesignSolution,
    alternatives: DesignSolution[] = [],
    optimization?: OptimizationResult
  ): string {
    const sections: string[] = [];

    // Header
    sections.push('DESIGN REPORT');
    sections.push('='.repeat(60));
    sections.push('');

    // Request summary
    sections.push('1. REQUIREMENTS');
    sections.push('-'.repeat(40));
    sections.push(`Description: ${request.description}`);
    sections.push(`Start point: ${request.pointA.type} at (${request.pointA.position.x}, ${request.pointA.position.y}, ${request.pointA.position.z})`);
    sections.push(`End point: ${request.pointB.type} at (${request.pointB.position.x}, ${request.pointB.position.y}, ${request.pointB.position.z})`);
    sections.push(`Building type: ${request.constraints.buildingType}`);
    sections.push(`Applicable codes: ${request.constraints.codes.map(c => c.code).join(', ')}`);
    sections.push('');

    // Classification
    sections.push('2. DOMAIN ANALYSIS');
    sections.push('-'.repeat(40));
    sections.push(`Primary domain: ${classification.primaryDomain.toUpperCase()} (${(classification.confidence * 100).toFixed(0)}% confidence)`);
    sections.push(`Reasoning: ${classification.reasoning}`);
    sections.push('');

    // Solution summary
    sections.push('3. SELECTED SOLUTION');
    sections.push('-'.repeat(40));
    sections.push(`Element type: ${solution.elementType}`);
    sections.push(`Parameters:`);
    for (const [key, value] of Object.entries(solution.parameters)) {
      if (value !== undefined && value !== null) {
        sections.push(`  - ${key}: ${value}`);
      }
    }
    sections.push('');

    // Rationale
    const rationale = this.generateRationale(request, classification, solution, alternatives);
    sections.push('4. DESIGN RATIONALE');
    sections.push('-'.repeat(40));
    sections.push(rationale.summary);
    sections.push('');
    sections.push('Key decisions:');
    for (const decision of rationale.decisions) {
      sections.push(`  ${decision.aspect}: ${decision.choice}`);
      sections.push(`    Reason: ${decision.reason}`);
    }
    sections.push('');

    // Trade-offs
    if (rationale.tradeoffs.length > 0) {
      sections.push('Trade-offs considered:');
      for (const tradeoff of rationale.tradeoffs) {
        sections.push(`  - ${tradeoff.factor1} vs ${tradeoff.factor2}: ${tradeoff.decision}`);
      }
      sections.push('');
    }

    // Compliance
    if (solution.compliance) {
      sections.push('5. CODE COMPLIANCE');
      sections.push('-'.repeat(40));
      sections.push(this.explainCompliance(solution.compliance.checks));
      sections.push('');
    }

    // Optimization
    if (optimization) {
      sections.push('6. OPTIMIZATION RESULTS');
      sections.push('-'.repeat(40));
      sections.push(this.explainOptimization(optimization));
      sections.push('');
    }

    // Warnings
    if (solution.warnings.length > 0) {
      sections.push('7. WARNINGS');
      sections.push('-'.repeat(40));
      for (const warning of solution.warnings) {
        sections.push(`- ${warning}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createDesignExplainer(): DesignExplainer {
  return new DesignExplainer();
}
