/**
 * Pipeline Store
 * Manages pipeline execution state and results
 */

import { create } from 'zustand';
import { MayhemAIPipeline } from '../../integration/pipeline';
import type {
  PipelineInput,
  PipelineResult,
  PipelineStatus,
  ManufacturingPackage,
} from '../../integration/types';
import type { OrchestratorResult } from '../../ai/orchestrator';

interface PipelineState {
  // Pipeline instance
  pipeline: MayhemAIPipeline | null;

  // Execution state
  isRunning: boolean;
  currentStage: string | null;
  progress: number;
  statusHistory: PipelineStatus[];

  // Results
  result: PipelineResult | null;
  aiResult: OrchestratorResult | null;
  manufacturingPackage: ManufacturingPackage | null;

  // Timing
  startTime: number | null;
  processingTime: number | null;

  // Errors
  errors: string[];
  warnings: string[];

  // Actions
  runPipeline: (input: PipelineInput, projectName?: string) => Promise<PipelineResult>;
  resetPipeline: () => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  // Initial state
  pipeline: null,
  isRunning: false,
  currentStage: null,
  progress: 0,
  statusHistory: [],
  result: null,
  aiResult: null,
  manufacturingPackage: null,
  startTime: null,
  processingTime: null,
  errors: [],
  warnings: [],

  runPipeline: async (input, projectName = 'Untitled Project') => {
    // Reset state
    set({
      isRunning: true,
      currentStage: 'input-processing',
      progress: 0,
      statusHistory: [],
      result: null,
      aiResult: null,
      manufacturingPackage: null,
      startTime: Date.now(),
      processingTime: null,
      errors: [],
      warnings: [],
    });

    try {
      // Create pipeline instance
      const pipeline = new MayhemAIPipeline({
        projectName,
        verbose: true,
        outputFormats: {
          gcode: false, // Skip heavy G-code generation for now
          dxf: false,
          bom: true,
          cutList: true,
          assemblyInstructions: true,
          designReport: true,
        },
      });

      set({ pipeline });

      // Run the pipeline
      const result = await pipeline.run(input);

      // Calculate processing time
      const processingTime = Date.now() - (get().startTime || Date.now());

      // Update state with results
      set({
        isRunning: false,
        currentStage: null,
        progress: 100,
        statusHistory: result.statusHistory,
        result,
        aiResult: result.aiResult || null,
        manufacturingPackage: result.package || null,
        processingTime,
        errors: result.errors,
        warnings: result.warnings,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      set({
        isRunning: false,
        currentStage: null,
        errors: [errorMessage],
        processingTime: Date.now() - (get().startTime || Date.now()),
      });

      throw error;
    }
  },

  resetPipeline: () => set({
    pipeline: null,
    isRunning: false,
    currentStage: null,
    progress: 0,
    statusHistory: [],
    result: null,
    aiResult: null,
    manufacturingPackage: null,
    startTime: null,
    processingTime: null,
    errors: [],
    warnings: [],
  }),
}));
