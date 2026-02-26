/**
 * End-to-End Integration Module
 *
 * Complete MayhemAI pipeline from requirements to manufacturing outputs:
 * - Pipeline orchestration
 * - Demo scenarios
 * - Interactive design refinement
 * - Production readiness validation
 */

// Export types
export type {
  // Pipeline types
  ManufacturingPackage,
  PipelineStatus,
  PipelineStage,
  PipelineConfig,
  PipelineInput,
  PipelineResult,

  // Demo types
  DemoScenario,
  DesignFeedback,
  IterationResult,

  // Validation types
  ProductionReadinessCheck,
  EngineeringPackage,
} from './types';

// Export pipeline
export {
  MayhemAIPipeline,
  createPipeline,
  defaultPipelineConfig,
} from './pipeline';

// Export demos
export {
  DemoRunner,
  DesignIterator,
  createDemoRunner,
  createDesignIterator,
  getAllDemoScenarios,
  getDemoScenario,
  stairsBetweenTwoPoints,
  platformAccessScenario,
  adaRampScenario,
  cagedLadderScenario,
  structuralBeamScenario,
} from './demos';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { createPipeline } from './pipeline';
import { createDemoRunner, stairsBetweenTwoPoints } from './demos';
import type { PipelineInput, PipelineResult, PipelineConfig } from './types';

/**
 * Quick design from description
 */
export async function quickDesign(
  description: string,
  options?: {
    startPosition?: { x: number; y: number; z: number };
    endPosition?: { x: number; y: number; z: number };
    projectName?: string;
  }
): Promise<PipelineResult> {
  const pipeline = createPipeline({
    projectName: options?.projectName || 'Quick Design',
  });

  const input: PipelineInput = {
    description,
    endpoints: options?.startPosition && options?.endPosition ? {
      start: {
        position: options.startPosition,
        type: 'floor',
      },
      end: {
        position: options.endPosition,
        type: 'floor',
      },
    } : undefined,
  };

  return pipeline.run(input);
}

/**
 * Run the "Stairs Between Two Points" milestone demo
 */
export async function runStairsMilestone(): Promise<{
  success: boolean;
  report: string;
  manufacturingPackage?: import('./types').ManufacturingPackage;
}> {
  const runner = createDemoRunner();
  const result = await runner.runDemo(stairsBetweenTwoPoints);

  return {
    success: result.success && result.matchesExpected,
    report: result.result.package?.designReport || 'No report generated',
    manufacturingPackage: result.result.package,
  };
}

/**
 * Full pipeline with all features
 */
export async function runFullPipeline(
  input: PipelineInput,
  config?: Partial<PipelineConfig>
): Promise<PipelineResult> {
  const pipeline = createPipeline({
    verbose: true,
    ...config,
  });

  return pipeline.run(input);
}

/**
 * Generate engineering package summary
 */
export function generatePackageSummary(
  pkg: import('./types').ManufacturingPackage
): string {
  const lines: string[] = [];

  lines.push('ENGINEERING PACKAGE SUMMARY');
  lines.push('=' .repeat(60));
  lines.push('');
  lines.push(`Project: ${pkg.project.name}`);
  lines.push(`Description: ${pkg.project.description}`);
  lines.push(`Created: ${pkg.project.createdAt}`);
  lines.push(`Version: ${pkg.project.version}`);
  lines.push('');

  lines.push('GEOMETRY');
  lines.push('-'.repeat(40));
  lines.push(`Components: ${pkg.geometry.componentCount}`);
  lines.push(`Total Weight: ${pkg.geometry.totalWeight.toFixed(2)} kg`);
  lines.push('');

  lines.push('BILL OF MATERIALS');
  lines.push('-'.repeat(40));
  lines.push(`Items: ${pkg.bom.items.length}`);
  lines.push(`Unique Parts: ${pkg.bom.totals.uniqueParts}`);
  lines.push(`Total Weight: ${pkg.bom.totals.totalWeight.toFixed(2)} kg`);
  lines.push('');

  lines.push('CUT LIST');
  lines.push('-'.repeat(40));
  lines.push(`Items: ${pkg.cutList.items.length}`);
  lines.push(`Total Length: ${pkg.cutList.totals.totalLength.toFixed(0)} mm`);
  if (pkg.cutList.optimization) {
    lines.push(`Waste: ${pkg.cutList.optimization.wastePercentage.toFixed(1)}%`);
  }
  lines.push('');

  lines.push('MANUFACTURING FILES');
  lines.push('-'.repeat(40));
  lines.push(`G-code Programs: ${pkg.gcodeProgramsPrograms.length}`);
  lines.push(`DXF Documents: ${pkg.dxfDocuments.length}`);
  lines.push('');

  lines.push('VALIDATION');
  lines.push('-'.repeat(40));
  lines.push(`Geometry Valid: ${pkg.validation.geometryValid ? 'Yes' : 'No'}`);
  lines.push(`Code Compliant: ${pkg.validation.codeCompliant ? 'Yes' : 'No'}`);
  lines.push(`Manufacturing Feasible: ${pkg.validation.manufacturingFeasible ? 'Yes' : 'No'}`);

  if (pkg.validation.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    pkg.validation.issues.forEach(i => lines.push(`  - ${i}`));
  }

  if (pkg.validation.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    pkg.validation.warnings.forEach(w => lines.push(`  - ${w}`));
  }

  return lines.join('\n');
}
