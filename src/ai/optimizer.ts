/**
 * Solution Optimizer
 *
 * Evaluates, scores, and ranks design solutions based on
 * multiple objectives: cost, weight, manufacturability, etc.
 */

import type {
  DesignSolution,
  SolutionMetrics,
  OptimizationObjectives,
  OptimizationResult,
  RankedSolution,
} from './types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default optimization weights
 */
export const defaultObjectives: OptimizationObjectives = {
  minimizeCost: 0.3,
  minimizeWeight: 0.1,
  maximizeMaterialEfficiency: 0.15,
  minimizeComplexity: 0.2,
  minimizeAssemblyTime: 0.15,
  maximizeMaintainability: 0.1,
};

/**
 * Cost estimation factors by material ($/kg)
 */
const materialCosts: Record<string, number> = {
  'carbon-steel': 2.5,
  'stainless-steel': 8.0,
  'aluminum': 6.0,
  'wood': 1.5,
  'fiberglass': 12.0,
  'galvanized-steel': 3.5,
  'plastic': 4.0,
};


// ============================================================================
// SOLUTION OPTIMIZER CLASS
// ============================================================================

export class SolutionOptimizer {
  private objectives: OptimizationObjectives;

  constructor(objectives: Partial<OptimizationObjectives> = {}) {
    this.objectives = { ...defaultObjectives, ...objectives };
    this.normalizeObjectives();
  }

  /**
   * Normalize objectives to sum to 1
   */
  private normalizeObjectives(): void {
    const sum = Object.values(this.objectives).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (const key of Object.keys(this.objectives) as Array<keyof OptimizationObjectives>) {
        this.objectives[key] /= sum;
      }
    }
  }

  /**
   * Estimate metrics for a solution
   */
  estimateMetrics(solution: DesignSolution): SolutionMetrics {
    const params = solution.parameters;

    // Estimate weight based on material and dimensions
    const material = (params.material as string) || 'carbon-steel';
    const volume = this.estimateVolume(params);
    const density = this.getMaterialDensity(material);
    const weight = volume * density / 1e9; // mm³ to kg

    // Estimate cost
    const materialCost = weight * (materialCosts[material] || 3);
    const laborCost = this.estimateLaborCost(solution);
    const estimatedCost = materialCost + laborCost;

    // Calculate material efficiency
    const boundingVolume = this.estimateBoundingVolume(params);
    const materialEfficiency = boundingVolume > 0 ? (volume / boundingVolume) * 100 : 50;

    // Calculate manufacturing complexity
    const manufacturingComplexity = this.estimateComplexity(solution);

    // Estimate assembly time
    const assemblyTimeEstimate = this.estimateAssemblyTime(solution);

    // Estimate maintenance score (lower is better)
    const maintenanceScore = this.estimateMaintenanceScore(solution);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      estimatedCost,
      estimatedWeight: weight,
      materialEfficiency,
      manufacturingComplexity,
      assemblyTimeEstimate,
      maintenanceScore,
      overallScore: 0, // Will be calculated
    });

    return {
      estimatedCost,
      estimatedWeight: weight,
      materialEfficiency,
      manufacturingComplexity,
      assemblyTimeEstimate,
      maintenanceScore,
      overallScore,
    };
  }

  /**
   * Estimate volume from parameters
   */
  private estimateVolume(params: Record<string, unknown>): number {
    const length = (params.length as number) || 1000;
    const width = (params.width as number) || 100;
    const thickness = (params.thickness as number) || (params.height as number) || 10;

    // Rough volume estimate
    return length * width * thickness;
  }

  /**
   * Estimate bounding volume
   */
  private estimateBoundingVolume(params: Record<string, unknown>): number {
    const length = (params.length as number) || 1000;
    const width = (params.width as number) || (params.totalWidth as number) || 500;
    const height = (params.height as number) || (params.totalRise as number) || 1000;

    return length * width * height;
  }

  /**
   * Get material density (kg/m³)
   */
  private getMaterialDensity(material: string): number {
    const densities: Record<string, number> = {
      'carbon-steel': 7850,
      'stainless-steel': 8000,
      'aluminum': 2700,
      'wood': 600,
      'fiberglass': 1800,
      'galvanized-steel': 7850,
      'plastic': 1200,
    };
    return densities[material] || 7850;
  }

  /**
   * Estimate labor cost
   */
  private estimateLaborCost(solution: DesignSolution): number {
    const baseRate = 50; // $/hour
    const complexity = this.estimateComplexity(solution);
    const hours = complexity * 0.5; // Rough estimate

    return hours * baseRate;
  }

  /**
   * Estimate manufacturing complexity (1-10)
   */
  private estimateComplexity(solution: DesignSolution): number {
    let complexity = 3; // Base complexity

    // Add for element type
    const elementType = solution.elementType;
    if (elementType === 'stairs') complexity += 2;
    if (elementType === 'linkage') complexity += 3;
    if (elementType === 'shaft') complexity += 2;

    // Add for number of components
    const components = (solution.parameters.components as unknown[]) || [];
    complexity += Math.min(components.length * 0.5, 2);

    // Add for precision requirements
    if (solution.parameters.precision === 'high') complexity += 2;

    return Math.min(complexity, 10);
  }

  /**
   * Estimate assembly time in hours
   */
  private estimateAssemblyTime(solution: DesignSolution): number {
    const baseTime = 2; // Base hours
    const complexity = this.estimateComplexity(solution);

    return baseTime + complexity * 0.5;
  }

  /**
   * Estimate maintenance score (1-10, lower is better)
   */
  private estimateMaintenanceScore(solution: DesignSolution): number {
    let score = 5; // Base score

    const material = (solution.parameters.material as string) || 'carbon-steel';

    // Stainless steel and aluminum are lower maintenance
    if (material === 'stainless-steel') score -= 2;
    if (material === 'aluminum') score -= 1;
    if (material === 'fiberglass') score -= 2;

    // Carbon steel needs more maintenance
    if (material === 'carbon-steel') score += 1;

    // Moving parts need more maintenance
    if (solution.domain === 'mechanical') score += 2;

    // Outdoor exposure increases maintenance
    if (solution.parameters.environment === 'outdoor') score += 1;

    return Math.max(1, Math.min(score, 10));
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(metrics: SolutionMetrics): number {
    // Normalize each metric to 0-100 scale
    // Lower is better for cost, weight, complexity, time, maintenance
    // Higher is better for efficiency

    const costScore = Math.max(0, 100 - metrics.estimatedCost / 10); // $1000 = 0
    const weightScore = Math.max(0, 100 - metrics.estimatedWeight * 2); // 50kg = 0
    const efficiencyScore = metrics.materialEfficiency;
    const complexityScore = (10 - metrics.manufacturingComplexity) * 10;
    const timeScore = Math.max(0, 100 - metrics.assemblyTimeEstimate * 5); // 20h = 0
    const maintenanceScore = (10 - metrics.maintenanceScore) * 10;

    // Weighted sum
    return (
      costScore * this.objectives.minimizeCost +
      weightScore * this.objectives.minimizeWeight +
      efficiencyScore * this.objectives.maximizeMaterialEfficiency +
      complexityScore * this.objectives.minimizeComplexity +
      timeScore * this.objectives.minimizeAssemblyTime +
      maintenanceScore * this.objectives.maximizeMaintainability
    );
  }

  /**
   * Rank multiple solutions
   */
  rankSolutions(solutions: DesignSolution[]): OptimizationResult {
    // Calculate metrics for each solution
    const solutionsWithMetrics = solutions.map(s => ({
      solution: s,
      metrics: this.estimateMetrics(s),
    }));

    // Update solution metrics
    for (const { solution, metrics } of solutionsWithMetrics) {
      solution.metrics = metrics;
    }

    // Sort by overall score (descending)
    solutionsWithMetrics.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);

    // Build ranked solutions
    const rankedSolutions: RankedSolution[] = solutionsWithMetrics.map((item, index) => {
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // Identify strengths and weaknesses
      if (item.metrics.estimatedCost < 500) strengths.push('Low cost');
      else if (item.metrics.estimatedCost > 2000) weaknesses.push('High cost');

      if (item.metrics.estimatedWeight < 50) strengths.push('Lightweight');
      else if (item.metrics.estimatedWeight > 200) weaknesses.push('Heavy');

      if (item.metrics.materialEfficiency > 70) strengths.push('Good material usage');
      else if (item.metrics.materialEfficiency < 30) weaknesses.push('Material waste');

      if (item.metrics.manufacturingComplexity < 4) strengths.push('Easy to manufacture');
      else if (item.metrics.manufacturingComplexity > 7) weaknesses.push('Complex manufacturing');

      if (item.metrics.maintenanceScore < 4) strengths.push('Low maintenance');
      else if (item.metrics.maintenanceScore > 7) weaknesses.push('High maintenance');

      return {
        solutionId: item.solution.id,
        rank: index + 1,
        scores: {
          cost: item.metrics.estimatedCost,
          weight: item.metrics.estimatedWeight,
          materialEfficiency: item.metrics.materialEfficiency,
          complexity: item.metrics.manufacturingComplexity,
          assemblyTime: item.metrics.assemblyTimeEstimate,
          maintainability: 10 - item.metrics.maintenanceScore,
          overall: item.metrics.overallScore,
        },
        strengths,
        weaknesses,
      };
    });

    // Find Pareto-optimal solutions
    const paretoOptimal = this.findParetoOptimal(solutionsWithMetrics);

    // Generate summary
    const summary = this.generateSummary(rankedSolutions, paretoOptimal);

    return {
      rankedSolutions,
      paretoOptimal,
      summary,
    };
  }

  /**
   * Find Pareto-optimal solutions (non-dominated)
   */
  private findParetoOptimal(
    solutions: Array<{ solution: DesignSolution; metrics: SolutionMetrics }>
  ): string[] {
    const paretoOptimal: string[] = [];

    for (let i = 0; i < solutions.length; i++) {
      let dominated = false;

      for (let j = 0; j < solutions.length; j++) {
        if (i === j) continue;

        // Check if solution j dominates solution i
        const iMetrics = solutions[i].metrics;
        const jMetrics = solutions[j].metrics;

        // j dominates i if j is better or equal in all objectives and strictly better in at least one
        const jBetterCost = jMetrics.estimatedCost <= iMetrics.estimatedCost;
        const jBetterWeight = jMetrics.estimatedWeight <= iMetrics.estimatedWeight;
        const jBetterEfficiency = jMetrics.materialEfficiency >= iMetrics.materialEfficiency;
        const jBetterComplexity = jMetrics.manufacturingComplexity <= iMetrics.manufacturingComplexity;
        const jBetterTime = jMetrics.assemblyTimeEstimate <= iMetrics.assemblyTimeEstimate;
        const jBetterMaintenance = jMetrics.maintenanceScore <= iMetrics.maintenanceScore;

        const jStrictlyBetter =
          jMetrics.estimatedCost < iMetrics.estimatedCost ||
          jMetrics.estimatedWeight < iMetrics.estimatedWeight ||
          jMetrics.materialEfficiency > iMetrics.materialEfficiency ||
          jMetrics.manufacturingComplexity < iMetrics.manufacturingComplexity ||
          jMetrics.assemblyTimeEstimate < iMetrics.assemblyTimeEstimate ||
          jMetrics.maintenanceScore < iMetrics.maintenanceScore;

        if (jBetterCost && jBetterWeight && jBetterEfficiency &&
            jBetterComplexity && jBetterTime && jBetterMaintenance && jStrictlyBetter) {
          dominated = true;
          break;
        }
      }

      if (!dominated) {
        paretoOptimal.push(solutions[i].solution.id);
      }
    }

    return paretoOptimal;
  }

  /**
   * Generate optimization summary
   */
  private generateSummary(rankedSolutions: RankedSolution[], paretoOptimal: string[]): string {
    if (rankedSolutions.length === 0) {
      return 'No solutions to evaluate.';
    }

    const parts: string[] = [];

    // Top solution
    const top = rankedSolutions[0];
    parts.push(`Best overall solution: ${top.solutionId} (score: ${top.scores.overall.toFixed(1)})`);

    // Strengths
    if (top.strengths.length > 0) {
      parts.push(`Strengths: ${top.strengths.join(', ')}`);
    }

    // Pareto optimal count
    if (paretoOptimal.length > 1) {
      parts.push(`${paretoOptimal.length} Pareto-optimal solutions found (no single best trade-off).`);
    }

    // Cost range
    if (rankedSolutions.length > 1) {
      const costs = rankedSolutions.map(s => s.scores.cost);
      parts.push(`Cost range: $${Math.min(...costs).toFixed(0)} - $${Math.max(...costs).toFixed(0)}`);
    }

    return parts.join(' ');
  }

  /**
   * Update optimization objectives
   */
  setObjectives(objectives: Partial<OptimizationObjectives>): void {
    this.objectives = { ...this.objectives, ...objectives };
    this.normalizeObjectives();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSolutionOptimizer(
  objectives?: Partial<OptimizationObjectives>
): SolutionOptimizer {
  return new SolutionOptimizer(objectives);
}
