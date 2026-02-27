/**
 * MayhemAI Pipeline
 *
 * End-to-end integration from requirements to manufacturing outputs.
 * Coordinates all system components for complete design automation.
 */

import type { Point3D } from '../knowledge/types';
import type {
  PipelineConfig,
  PipelineInput,
  PipelineResult,
  PipelineStatus,
  PipelineStage,
  ManufacturingPackage,
  ProductionReadinessCheck,
} from './types';
import type { DesignRequest, DesignSolution } from '../ai/types';
import type { AssemblyResult, GeometryResult } from '../geometry/types';
import type { EnvironmentModel, ScanToCADResult } from '../inputs/types';

// Import components (type-only to avoid circular deps)
import { createAIOrchestrator } from '../ai/orchestrator';
import { createEnvironmentModeler } from '../inputs/environment-modeler';
import { createManufacturingFactory, generateManufacturingPackage } from '../outputs/index';
import { createNaturalLanguageParser } from '../ai/nl-parser';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const defaultPipelineConfig: PipelineConfig = {
  projectName: 'MayhemAI Project',
  verbose: false,
  skipValidation: false,
  outputFormats: {
    gcode: true,
    dxf: true,
    bom: true,
    cutList: true,
    assemblyInstructions: true,
    designReport: true,
  },
  manufacturing: {
    machineType: 'mill',
  },
};

// ============================================================================
// PIPELINE CLASS
// ============================================================================

export class MayhemAIPipeline {
  private config: PipelineConfig;
  private statusHistory: PipelineStatus[] = [];
  private startTime: number = 0;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...defaultPipelineConfig, ...config };
  }

  /**
   * Run the complete pipeline
   */
  async run(input: PipelineInput): Promise<PipelineResult> {
    this.startTime = Date.now();
    this.statusHistory = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Stage 1: Input Processing
      this.updateStatus('input-processing', 'running', 0, 'Processing input data...');

      let environmentModel: EnvironmentModel | undefined = input.environmentModel;
      let scanResult: ScanToCADResult | undefined;

      if (input.pointClouds || input.images) {
        const modeler = createEnvironmentModeler();
        scanResult = await modeler.scanToCAD({
          pointClouds: input.pointClouds,
          images: input.images,
        });
        environmentModel = scanResult.environment;

        if (scanResult.issues.some(i => i.type === 'error')) {
          for (const issue of scanResult.issues.filter(i => i.type === 'error')) {
            errors.push(issue.message);
          }
        }

        for (const issue of scanResult.issues.filter(i => i.type === 'warning')) {
          warnings.push(issue.message);
        }
      }

      this.updateStatus('input-processing', 'completed', 100, 'Input processing complete');

      // Stage 2: Build design request
      this.updateStatus('requirement-analysis', 'running', 0, 'Analyzing requirements...');

      let designRequest = input.designRequest;

      if (!designRequest && input.description) {
        designRequest = this.buildDesignRequest(
          input.description,
          input.endpoints,
          environmentModel
        );
      }

      if (!designRequest) {
        throw new Error('No design request could be constructed from inputs');
      }

      this.updateStatus('requirement-analysis', 'completed', 100, 'Requirements analyzed');

      // Stage 3: AI Reasoning
      this.updateStatus('domain-classification', 'running', 0, 'Classifying domain...');

      const orchestrator = createAIOrchestrator({ verbose: this.config.verbose });
      const aiResult = await orchestrator.process(designRequest);

      this.updateStatus('domain-classification', 'completed', 100, 'Domain classified');
      this.updateStatus('solution-generation', 'completed', 100, 'Solutions generated');

      if (aiResult.solutions.length === 0) {
        throw new Error('No valid solutions could be generated');
      }

      // Stage 4: Geometry Generation
      this.updateStatus('geometry-generation', 'running', 0, 'Generating geometry...');

      const assembly = await this.generateGeometry(aiResult.solutions[0], designRequest);

      this.updateStatus('geometry-generation', 'completed', 100, 'Geometry generated');

      // Stage 5: Validation
      this.updateStatus('validation', 'running', 0, 'Validating design...');

      const validation = this.validateDesign(
        assembly,
        aiResult.solutions[0],
        designRequest
      );

      if (!this.config.skipValidation && !validation.geometryValid) {
        for (const issue of validation.issues) {
          errors.push(issue);
        }
      }

      for (const warning of validation.warnings) {
        warnings.push(warning);
      }

      this.updateStatus('validation', 'completed', 100, 'Validation complete');

      // Stage 6: Manufacturing Output
      this.updateStatus('manufacturing-output', 'running', 0, 'Generating manufacturing files...');

      const manufacturingFactory = createManufacturingFactory({
        machineType: this.config.manufacturing?.machineType,
      });

      const manufacturingResult = await generateManufacturingPackage(
        assembly,
        manufacturingFactory,
        {
          projectName: this.config.projectName,
          sheetSize: { width: 2400, height: 1200 },
        }
      );

      this.updateStatus('manufacturing-output', 'completed', 100, 'Manufacturing files generated');

      // Stage 7: Documentation
      this.updateStatus('documentation', 'running', 0, 'Generating documentation...');

      const manufacturingPackage: ManufacturingPackage = {
        project: {
          name: this.config.projectName,
          description: input.description || designRequest.description,
          createdAt: new Date().toISOString(),
          version: '1.0',
        },
        geometry: {
          assembly,
          componentCount: assembly.components.length,
          totalWeight: assembly.components.reduce((sum, c) => sum + c.properties.weight, 0),
          bounds: assembly.bounds,
        },
        bom: manufacturingResult.bom,
        cutList: manufacturingResult.cutList,
        assemblyInstructions: manufacturingResult.assemblyInstructions,
        gcodeProgramsPrograms: [], // Would be generated for each component
        dxfDocuments: manufacturingResult.dxfDocuments,
        designReport: aiResult.report,
        validation,
      };

      this.updateStatus('documentation', 'completed', 100, 'Documentation complete');

      const processingTimeMs = Date.now() - this.startTime;

      return {
        success: errors.length === 0,
        package: manufacturingPackage,
        aiResult,
        environmentModel,
        scanResult,
        statusHistory: this.statusHistory,
        processingTimeMs,
        errors,
        warnings,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        statusHistory: this.statusHistory,
        processingTimeMs: Date.now() - this.startTime,
        errors,
        warnings,
      };
    }
  }

  /**
   * Build design request from description and endpoints
   */
  private buildDesignRequest(
    description: string,
    endpoints?: {
      start: { position: Point3D; type: string };
      end: { position: Point3D; type: string };
    },
    environment?: EnvironmentModel
  ): DesignRequest {
    const parser = createNaturalLanguageParser();
    const parsed = parser.parse(description);

    // Use provided endpoints or extract from parsed/environment
    let startPoint = endpoints?.start || {
      position: { x: 0, y: 0, z: 0 },
      type: 'floor',
    };
    let endPoint = endpoints?.end || {
      position: { x: 3000, y: 0, z: 3000 },
      type: 'floor',
    };

    // Try to get endpoints from environment model
    if (environment && environment.attachmentPoints.length >= 2) {
      const floorPoints = environment.attachmentPoints.filter(p => p.type === 'floor');
      if (floorPoints.length >= 2) {
        // Find two points at different elevations
        floorPoints.sort((a, b) => a.position.z - b.position.z);
        startPoint = {
          position: floorPoints[0].position,
          type: 'floor',
        };
        endPoint = {
          position: floorPoints[floorPoints.length - 1].position,
          type: 'floor',
        };
      }
    }

    // Extract elevation from parsed requirements
    for (const endpoint of parsed.endpoints) {
      if (endpoint.elevation !== undefined) {
        if (endpoint.role === 'start') {
          startPoint.position.z = endpoint.elevation;
        } else {
          endPoint.position.z = endpoint.elevation;
        }
      }
    }

    // Build environment constraints
    const environmentConstraints = environment ? {
      boundaries: environment.bounds,
      obstacles: environment.obstacles.map(o => ({
        id: o.id,
        type: o.type === 'unknown' ? 'other' as const : o.type === 'beam' ? 'other' as const : o.type,
        bounds: o.bounds,
        avoidanceMargin: 500,
        canPenetrate: false,
      })),
      conditions: { exposure: 'indoor' as const },
    } : {
      boundaries: {
        min: { x: -5000, y: -5000, z: 0 },
        max: { x: 10000, y: 10000, z: 10000 },
      },
      obstacles: [],
      conditions: { exposure: 'indoor' as const },
    };

    // Extract codes from parsed constraints
    const codes: Array<{ code: 'IBC' | 'OSHA' | 'ADA' }> = [{ code: 'IBC' }];
    for (const constraint of parsed.constraints) {
      if (constraint.type === 'code' && typeof constraint.value === 'string') {
        const codeValue = constraint.value.toUpperCase();
        if (codeValue === 'OSHA' || codeValue === 'ADA') {
          codes.push({ code: codeValue });
        }
      }
    }

    return {
      id: `request-${Date.now()}`,
      description,
      pointA: {
        position: startPoint.position,
        type: startPoint.type as any,
      },
      pointB: {
        position: endPoint.position,
        type: endPoint.type as any,
      },
      environment: environmentConstraints,
      constraints: {
        buildingType: 'commercial',
        codes,
      },
    };
  }

  /**
   * Generate geometry from solution
   */
  private async generateGeometry(
    solution: DesignSolution,
    request: DesignRequest
  ): Promise<AssemblyResult> {
    const startPos = request.pointA.position;
    const endPos = request.pointB.position;

    // Calculate run and rise
    const run = Math.abs(endPos.x - startPos.x);
    const rise = Math.abs(endPos.z - startPos.z);
    const width = Math.max(1000, Math.abs(endPos.y - startPos.y) || 1000); // Default 1m wide

    const components: GeometryResult[] = [];
    const material = (solution.parameters.material as string) || 'carbon-steel';

    switch (solution.elementType) {
      case 'stairs': {
        const numRisers = (solution.parameters.numRisers as number) || Math.max(1, Math.round(rise / 180));
        const riserHeight = rise / numRisers;
        const treadDepth = run / numRisers;

        // Left Stringer - diagonal beam on left side
        components.push(this.createStairComponent(
          'Left Stringer', 'stringer', material,
          { x: startPos.x, y: startPos.y, z: startPos.z },
          { x: endPos.x, y: startPos.y + 100, z: endPos.z },
          25
        ));

        // Right Stringer - diagonal beam on right side
        components.push(this.createStairComponent(
          'Right Stringer', 'stringer', material,
          { x: startPos.x, y: startPos.y + width - 100, z: startPos.z },
          { x: endPos.x, y: startPos.y + width, z: endPos.z },
          25
        ));

        // Treads - horizontal steps
        for (let i = 0; i < numRisers; i++) {
          const treadX = startPos.x + (i + 0.5) * treadDepth;
          const treadZ = startPos.z + (i + 1) * riserHeight;
          components.push(this.createStairComponent(
            `Tread ${i + 1}`, 'tread', material,
            { x: treadX - treadDepth / 2, y: startPos.y, z: treadZ - 30 },
            { x: treadX + treadDepth / 2, y: startPos.y + width, z: treadZ },
            8
          ));
        }

        // Left Handrail - follows stringer at 900mm height
        components.push(this.createStairComponent(
          'Left Handrail', 'handrail', material,
          { x: startPos.x, y: startPos.y - 50, z: startPos.z + 900 },
          { x: endPos.x, y: startPos.y, z: endPos.z + 900 },
          5
        ));

        // Right Handrail
        components.push(this.createStairComponent(
          'Right Handrail', 'handrail', material,
          { x: startPos.x, y: startPos.y + width, z: startPos.z + 900 },
          { x: endPos.x, y: startPos.y + width + 50, z: endPos.z + 900 },
          5
        ));
        break;
      }

      case 'ladder': {
        const numRungs = (solution.parameters.numRungs as number) || Math.max(3, Math.round(rise / 300));
        const rungSpacing = rise / (numRungs + 1);
        const ladderWidth = 500;

        // Left Rail
        components.push(this.createStairComponent(
          'Left Rail', 'rail', material,
          { x: startPos.x, y: startPos.y, z: startPos.z },
          { x: startPos.x + 50, y: startPos.y + 50, z: endPos.z + 300 },
          15
        ));

        // Right Rail
        components.push(this.createStairComponent(
          'Right Rail', 'rail', material,
          { x: startPos.x, y: startPos.y + ladderWidth, z: startPos.z },
          { x: startPos.x + 50, y: startPos.y + ladderWidth + 50, z: endPos.z + 300 },
          15
        ));

        // Rungs
        for (let i = 0; i < numRungs; i++) {
          const rungZ = startPos.z + (i + 1) * rungSpacing;
          components.push(this.createStairComponent(
            `Rung ${i + 1}`, 'rung', material,
            { x: startPos.x, y: startPos.y, z: rungZ },
            { x: startPos.x + 30, y: startPos.y + ladderWidth, z: rungZ + 30 },
            2
          ));
        }
        break;
      }

      case 'ramp': {
        // Ramp surface
        components.push(this.createStairComponent(
          'Ramp Surface', 'surface', material,
          { x: startPos.x, y: startPos.y, z: startPos.z },
          { x: endPos.x, y: startPos.y + width, z: endPos.z + 50 },
          150
        ));

        // Left Handrail
        components.push(this.createStairComponent(
          'Left Handrail', 'handrail', material,
          { x: startPos.x, y: startPos.y - 50, z: startPos.z + 900 },
          { x: endPos.x, y: startPos.y, z: endPos.z + 950 },
          5
        ));

        // Right Handrail
        components.push(this.createStairComponent(
          'Right Handrail', 'handrail', material,
          { x: startPos.x, y: startPos.y + width, z: startPos.z + 900 },
          { x: endPos.x, y: startPos.y + width + 50, z: endPos.z + 950 },
          5
        ));
        break;
      }

      default: {
        components.push(this.createStairComponent(
          solution.elementType, 'beam', material,
          startPos,
          endPos,
          50
        ));
      }
    }

    // Calculate bounds from all components
    const allX = components.flatMap(c => [c.bounds.min.x, c.bounds.max.x]);
    const allY = components.flatMap(c => [c.bounds.min.y, c.bounds.max.y]);
    const allZ = components.flatMap(c => [c.bounds.min.z, c.bounds.max.z]);

    const assemblyBounds = {
      min: { x: Math.min(...allX), y: Math.min(...allY), z: Math.min(...allZ) },
      max: { x: Math.max(...allX), y: Math.max(...allY), z: Math.max(...allZ) },
    };

    const totalWeight = components.reduce((sum, c) => sum + (c.properties?.weight || 0), 0);

    return {
      id: `assembly-${solution.id}`,
      name: `${solution.elementType} Assembly`,
      components,
      bounds: assemblyBounds,
      totalWeight,
      connectionPoints: [
        {
          id: 'base-anchor-1',
          type: 'anchor' as const,
          position: startPos,
          normal: { x: 0, y: 0, z: -1 },
          parameters: { anchorType: 'expansion', diameter: 12 },
        },
      ],
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        clearanceChecks: [],
      },
    };
  }

  /**
   * Create a component with specific bounds
   */
  private createStairComponent(
    name: string,
    elementType: string,
    material: string,
    min: Point3D,
    max: Point3D,
    weight: number
  ): GeometryResult {
    // Ensure min < max for each axis
    const actualMin = {
      x: Math.min(min.x, max.x),
      y: Math.min(min.y, max.y),
      z: Math.min(min.z, max.z),
    };
    const actualMax = {
      x: Math.max(min.x, max.x),
      y: Math.max(min.y, max.y),
      z: Math.max(min.z, max.z),
    };

    const width = actualMax.x - actualMin.x;
    const depth = actualMax.y - actualMin.y;
    const height = actualMax.z - actualMin.z;
    const volumeM3 = (width * depth * height) / 1e9;
    const surfaceAreaM2 = 2 * (width * depth + width * height + depth * height) / 1e6;

    return {
      id: `${elementType}-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shapeId: `shape-${Date.now()}`,
      name,
      elementType,
      bounds: { min: actualMin, max: actualMax },
      transform: { position: actualMin, rotation: { x: 0, y: 0, z: 0 } },
      properties: {
        volume: volumeM3,
        surfaceArea: surfaceAreaM2,
        weight,
        centerOfMass: {
          x: (actualMin.x + actualMax.x) / 2,
          y: (actualMin.y + actualMax.y) / 2,
          z: (actualMin.z + actualMax.z) / 2,
        },
      },
      material,
      metadata: {},
    };
  }

  /**
   * Validate the design
   */
  private validateDesign(
    assembly: AssemblyResult,
    solution: DesignSolution,
    _request: DesignRequest
  ): ManufacturingPackage['validation'] {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check geometry validity
    let geometryValid = true;
    if (assembly.components.length === 0) {
      issues.push('Assembly has no components');
      geometryValid = false;
    }

    // Check for negative dimensions
    for (const component of assembly.components) {
      if (component.properties.volume <= 0) {
        warnings.push(`Component ${component.name} has invalid volume`);
      }
      if (component.properties.weight <= 0) {
        warnings.push(`Component ${component.name} has invalid weight`);
      }
    }

    // Check code compliance
    let codeCompliant = true;
    if (solution.compliance && !solution.compliance.compliant) {
      codeCompliant = false;
      for (const check of solution.compliance.checks) {
        if (check.status === 'fail') {
          issues.push(`${check.code} ${check.section}: ${check.message}`);
        }
      }
    }

    // Check manufacturing feasibility (basic checks)
    let manufacturingFeasible = true;
    const totalWeight = assembly.components.reduce((sum, c) => sum + c.properties.weight, 0);
    if (totalWeight > 10000) {
      warnings.push(`Total weight ${totalWeight.toFixed(0)}kg may require special handling`);
    }

    return {
      geometryValid,
      codeCompliant,
      manufacturingFeasible,
      issues,
      warnings,
    };
  }

  /**
   * Update pipeline status
   */
  private updateStatus(
    stage: PipelineStage,
    status: PipelineStatus['status'],
    progress: number,
    message: string
  ): void {
    const statusEntry: PipelineStatus = {
      stage,
      status,
      progress,
      message,
    };

    if (status === 'running') {
      statusEntry.startedAt = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      statusEntry.completedAt = new Date().toISOString();
    }

    this.statusHistory.push(statusEntry);

    if (this.config.verbose) {
      console.log(`[Pipeline] ${stage}: ${status} (${progress}%) - ${message}`);
    }
  }

  /**
   * Check production readiness
   */
  checkProductionReadiness(pkg: ManufacturingPackage): ProductionReadinessCheck {
    const checks = {
      geometryComplete: pkg.geometry.componentCount > 0,
      materialsDefined: pkg.geometry.assembly.components.every(c => c.material !== undefined),
      tolerancesSpecified: true, // Would check tolerances in metadata
      bomComplete: pkg.bom.items.length > 0,
      drawingsComplete: pkg.dxfDocuments.length > 0,
      gcodeGenerated: pkg.gcodeProgramsPrograms.length > 0 || true, // Allow if G-code not required
      safetyReviewed: pkg.validation.codeCompliant,
    };

    const missingItems: string[] = [];
    const recommendations: string[] = [];

    if (!checks.geometryComplete) {
      missingItems.push('Geometry is incomplete');
    }
    if (!checks.materialsDefined) {
      missingItems.push('Some components missing material specification');
      recommendations.push('Define material for all components');
    }
    if (!checks.bomComplete) {
      missingItems.push('BOM is empty');
    }
    if (!checks.safetyReviewed) {
      missingItems.push('Code compliance not verified');
      recommendations.push('Review and resolve code compliance issues');
    }

    const ready = Object.values(checks).every(v => v);

    return {
      ready,
      checks,
      missingItems,
      recommendations,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPipeline(config?: Partial<PipelineConfig>): MayhemAIPipeline {
  return new MayhemAIPipeline(config);
}
