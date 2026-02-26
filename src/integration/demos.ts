/**
 * Demo Scenarios
 *
 * Pre-built scenarios demonstrating MayhemAI capabilities:
 * - "Stairs Between Two Points" milestone
 * - Multi-domain solutions
 * - Various access configurations
 */

import type {
  DemoScenario,
  PipelineInput,
  DesignFeedback,
  IterationResult,
} from './types';
import type { DesignSolution } from '../ai/types';

import { MayhemAIPipeline, createPipeline } from './pipeline';

// ============================================================================
// DEMO SCENARIOS
// ============================================================================

/**
 * "Stairs Between Two Points" - Core milestone scenario
 */
export const stairsBetweenTwoPoints: DemoScenario = {
  id: 'stairs-between-two-points',
  name: 'Stairs Between Two Points',
  description: 'Connect floor level to mezzanine door with code-compliant stairway',
  input: {
    description: 'Build stairs from ground floor to mezzanine level door, 3 meters elevation change, commercial building, must comply with IBC and ADA requirements, steel construction preferred',
    endpoints: {
      start: {
        position: { x: 0, y: 0, z: 0 },
        type: 'floor',
      },
      end: {
        position: { x: 4000, y: 0, z: 3000 },
        type: 'opening',
      },
    },
  },
  expectedOutcomes: {
    domain: 'access',
    elementType: 'stairs',
    componentCount: 20, // Stringers, treads, handrails
    codeCompliance: ['IBC', 'ADA'],
  },
};

/**
 * Platform access with stairs and ladder
 */
export const platformAccessScenario: DemoScenario = {
  id: 'platform-access',
  name: 'Platform Access System',
  description: 'Equipment platform with primary stairs and emergency ladder',
  input: {
    description: 'Create access to elevated equipment platform at 4m height, need primary stair access plus emergency ladder, OSHA compliant, outdoor installation',
    endpoints: {
      start: {
        position: { x: 0, y: 0, z: 0 },
        type: 'floor',
      },
      end: {
        position: { x: 3000, y: 0, z: 4000 },
        type: 'structure',
      },
    },
  },
  expectedOutcomes: {
    domain: 'access',
    elementType: 'stairs',
    componentCount: 25,
    codeCompliance: ['OSHA', 'IBC'],
  },
};

/**
 * ADA-compliant ramp scenario
 */
export const adaRampScenario: DemoScenario = {
  id: 'ada-ramp',
  name: 'ADA Wheelchair Ramp',
  description: 'Wheelchair-accessible ramp for building entrance',
  input: {
    description: 'ADA compliant wheelchair ramp from parking level to building entrance, 600mm rise, maximum slope 1:12, with handrails on both sides',
    endpoints: {
      start: {
        position: { x: 0, y: 0, z: 0 },
        type: 'floor',
      },
      end: {
        position: { x: 7200, y: 0, z: 600 },
        type: 'opening',
      },
    },
  },
  expectedOutcomes: {
    domain: 'access',
    elementType: 'ramp',
    componentCount: 10,
    codeCompliance: ['ADA', 'IBC'],
  },
};

/**
 * Industrial ladder with cage
 */
export const cagedLadderScenario: DemoScenario = {
  id: 'caged-ladder',
  name: 'Industrial Caged Ladder',
  description: 'Fixed ladder with safety cage for roof access',
  input: {
    description: 'Fixed steel ladder for roof access, 6 meter climb, requires safety cage per OSHA, with rest platform at 3 meters',
    endpoints: {
      start: {
        position: { x: 0, y: 0, z: 0 },
        type: 'floor',
      },
      end: {
        position: { x: 0, y: 600, z: 6000 },
        type: 'structure',
      },
    },
  },
  expectedOutcomes: {
    domain: 'access',
    elementType: 'ladder',
    componentCount: 30,
    codeCompliance: ['OSHA'],
  },
};

/**
 * Structural beam scenario
 */
export const structuralBeamScenario: DemoScenario = {
  id: 'structural-beam',
  name: 'Mezzanine Support Beam',
  description: 'Steel beam spanning between columns to support mezzanine',
  input: {
    description: 'Steel beam to span 8 meters between existing columns, supporting mezzanine floor load of 5kN/m², W-flange profile required',
    endpoints: {
      start: {
        position: { x: 0, y: 0, z: 3000 },
        type: 'structure',
      },
      end: {
        position: { x: 8000, y: 0, z: 3000 },
        type: 'structure',
      },
    },
  },
  expectedOutcomes: {
    domain: 'structure',
    elementType: 'beam',
    componentCount: 3,
    codeCompliance: ['AISC'],
  },
};

// ============================================================================
// DEMO RUNNER
// ============================================================================

export class DemoRunner {
  private pipeline: MayhemAIPipeline;

  constructor() {
    this.pipeline = createPipeline({ verbose: true });
  }

  /**
   * Run a demo scenario
   */
  async runDemo(scenario: DemoScenario): Promise<{
    success: boolean;
    matchesExpected: boolean;
    result: Awaited<ReturnType<MayhemAIPipeline['run']>>;
    analysis: {
      domainMatch: boolean;
      elementMatch: boolean;
      componentCountMatch: boolean;
      complianceMatch: boolean;
    };
  }> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running Demo: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    console.log('='.repeat(60));

    const result = await this.pipeline.run(scenario.input);

    // Analyze results
    const analysis = {
      domainMatch: result.aiResult?.classification.primaryDomain === scenario.expectedOutcomes.domain,
      elementMatch: result.aiResult?.elementType.elementType === scenario.expectedOutcomes.elementType,
      componentCountMatch: Math.abs(
        (result.package?.geometry.componentCount || 0) - scenario.expectedOutcomes.componentCount
      ) <= 5,
      complianceMatch: scenario.expectedOutcomes.codeCompliance.every(code =>
        result.aiResult?.solutions[0]?.compliance.checks.some((c: { code: string; status: string }) =>
          c.code === code && c.status !== 'fail'
        ) ?? false
      ),
    };

    const matchesExpected = Object.values(analysis).every(v => v);

    console.log(`\nResults:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Domain Match: ${analysis.domainMatch}`);
    console.log(`  Element Match: ${analysis.elementMatch}`);
    console.log(`  Component Count Match: ${analysis.componentCountMatch}`);
    console.log(`  Compliance Match: ${analysis.complianceMatch}`);
    console.log(`  Overall Match: ${matchesExpected}`);

    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      result.errors.forEach(e => console.log(`  - ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\nWarnings:`);
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    return {
      success: result.success,
      matchesExpected,
      result,
      analysis,
    };
  }

  /**
   * Run all demo scenarios
   */
  async runAllDemos(): Promise<{
    totalScenarios: number;
    passed: number;
    failed: number;
    results: Array<{
      scenario: string;
      success: boolean;
      matchesExpected: boolean;
    }>;
  }> {
    const scenarios = [
      stairsBetweenTwoPoints,
      platformAccessScenario,
      adaRampScenario,
      cagedLadderScenario,
      structuralBeamScenario,
    ];

    const results: Array<{ scenario: string; success: boolean; matchesExpected: boolean }> = [];

    for (const scenario of scenarios) {
      const result = await this.runDemo(scenario);
      results.push({
        scenario: scenario.name,
        success: result.success,
        matchesExpected: result.matchesExpected,
      });
    }

    const passed = results.filter(r => r.success && r.matchesExpected).length;
    const failed = results.length - passed;

    console.log(`\n${'='.repeat(60)}`);
    console.log('DEMO SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Scenarios: ${scenarios.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    return {
      totalScenarios: scenarios.length,
      passed,
      failed,
      results,
    };
  }
}

// ============================================================================
// INTERACTIVE REFINEMENT
// ============================================================================

export class DesignIterator {
  private pipeline: MayhemAIPipeline;
  private currentSolution: DesignSolution | null = null;
  private iterationCount: number = 0;

  constructor() {
    this.pipeline = createPipeline();
  }

  /**
   * Start a new design session
   */
  async startDesign(input: PipelineInput): Promise<DesignSolution | null> {
    const result = await this.pipeline.run(input);

    if (result.success && result.aiResult) {
      this.currentSolution = result.aiResult.solutions[0];
      this.iterationCount = 1;
      return this.currentSolution;
    }

    return null;
  }

  /**
   * Apply feedback and iterate on design
   */
  async applyFeedback(feedback: DesignFeedback): Promise<IterationResult | null> {
    if (!this.currentSolution) {
      return null;
    }

    const previousSolution = { ...this.currentSolution };
    const changes: string[] = [];

    if (feedback.type === 'approve') {
      return {
        iteration: this.iterationCount,
        previousSolution,
        updatedSolution: this.currentSolution,
        changes: ['Design approved - no changes'],
        validationStatus: { valid: true, issues: [] },
      };
    }

    if (feedback.type === 'reject') {
      // Would restart with different approach
      changes.push(`Design rejected: ${feedback.rejectionReason}`);
      return {
        iteration: this.iterationCount,
        previousSolution,
        updatedSolution: this.currentSolution,
        changes,
        validationStatus: { valid: false, issues: [feedback.rejectionReason || 'Rejected'] },
      };
    }

    // Apply modifications
    if (feedback.modifications) {
      for (const mod of feedback.modifications) {
        if (this.currentSolution.parameters[mod.parameter] !== undefined) {
          (this.currentSolution.parameters as Record<string, unknown>)[mod.parameter] = mod.requestedValue;
          changes.push(`Changed ${mod.parameter} from ${mod.currentValue} to ${mod.requestedValue}`);
        }
      }
    }

    // Apply alternative preferences
    if (feedback.alternatives?.preferDifferentMaterial) {
      (this.currentSolution.parameters as Record<string, unknown>).material = feedback.alternatives.preferDifferentMaterial;
      changes.push(`Changed material to ${feedback.alternatives.preferDifferentMaterial}`);
    }

    this.iterationCount++;

    return {
      iteration: this.iterationCount,
      previousSolution,
      updatedSolution: this.currentSolution,
      changes,
      validationStatus: {
        valid: true,
        issues: [],
      },
    };
  }

  /**
   * Get current design state
   */
  getCurrentSolution(): DesignSolution | null {
    return this.currentSolution;
  }

  /**
   * Get iteration count
   */
  getIterationCount(): number {
    return this.iterationCount;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createDemoRunner(): DemoRunner {
  return new DemoRunner();
}

export function createDesignIterator(): DesignIterator {
  return new DesignIterator();
}

/**
 * Get all available demo scenarios
 */
export function getAllDemoScenarios(): DemoScenario[] {
  return [
    stairsBetweenTwoPoints,
    platformAccessScenario,
    adaRampScenario,
    cagedLadderScenario,
    structuralBeamScenario,
  ];
}

/**
 * Get demo scenario by ID
 */
export function getDemoScenario(id: string): DemoScenario | undefined {
  return getAllDemoScenarios().find(s => s.id === id);
}
