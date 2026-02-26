/**
 * Manufacturing Outputs Module
 *
 * Exports all manufacturing output generators for production-ready files:
 * - G-code for CNC machines (mills, lathes, routers)
 * - DXF for laser/plasma cutting with nesting optimization
 * - BOM (Bill of Materials) with cost estimation
 * - Cut lists with stock optimization
 * - Assembly instructions
 */

// Export types
export type {
  // G-Code types
  GCodeConfig,
  GCodeOperation,
  GCodeProgram,
  GCodeTool,
  ToolpathSegment,

  // DXF types
  DXFConfig,
  DXFLayer,
  DXFEntity,
  DXFDocument,
  NestingResult,
  NestedSheet,
  NestedPart,

  // Drawing types
  DrawingConfig,
  TitleBlockConfig,
  DrawingView,
  Dimension,
  DrawingDocument,
  DrawingNote,

  // BOM types
  BOMConfig,
  BOMColumn,
  BOMItem,
  BOMDocument,

  // Cut List types
  CutListConfig,
  CutListItem,
  CutOperation,
  CutListDocument,
  StockUsage,

  // Assembly Instructions types
  AssemblyInstructionConfig,
  AssemblyInstruction,
  AssemblyInstructionDocument,
} from './types';

// G-Code Generator
export {
  GCodeGenerator,
  createGCodeGenerator,
  defaultMillConfig,
  defaultLatheConfig,
  defaultRouterConfig,
  standardEndmills,
  standardDrills,
} from './gcode/generator';
export type { ToolpathOperation } from './gcode/generator';

// DXF Generator
export {
  DXFGenerator,
  NestingOptimizer,
  defaultDXFConfig,
  createDXFGenerator,
  createNestingOptimizer,
} from './dxf/generator';

// BOM Generator
export {
  BOMGenerator,
  CutListGenerator,
  AssemblyInstructionsGenerator,
  defaultBOMConfig,
  defaultCutListConfig,
  defaultAssemblyConfig,
  createBOMGenerator,
  createCutListGenerator,
  createAssemblyInstructionsGenerator,
} from './bom/generator';

// ============================================================================
// CONVENIENCE FACTORY FUNCTIONS
// ============================================================================

import { GCodeGenerator, createGCodeGenerator } from './gcode/generator';
import { DXFGenerator, NestingOptimizer } from './dxf/generator';
import { BOMGenerator, CutListGenerator, AssemblyInstructionsGenerator } from './bom/generator';
import type { GeometryResult, AssemblyResult } from '../geometry/types';
import type { GCodeConfig, DXFConfig, BOMConfig, CutListConfig, NestingResult } from './types';

/**
 * Manufacturing output factory - creates all generators with consistent config
 */
export interface ManufacturingOutputFactory {
  gcode: GCodeGenerator;
  dxf: DXFGenerator;
  nesting: NestingOptimizer;
  bom: BOMGenerator;
  cutList: CutListGenerator;
  assembly: AssemblyInstructionsGenerator;
}

/**
 * Create a complete manufacturing output factory
 */
export function createManufacturingFactory(options?: {
  gcodeConfig?: Partial<GCodeConfig>;
  dxfConfig?: Partial<DXFConfig>;
  bomConfig?: Partial<BOMConfig>;
  cutListConfig?: Partial<CutListConfig>;
  machineType?: 'mill' | 'lathe' | 'router';
}): ManufacturingOutputFactory {
  return {
    gcode: createGCodeGenerator(options?.machineType || 'mill', options?.gcodeConfig),
    dxf: new DXFGenerator(options?.dxfConfig),
    nesting: new NestingOptimizer(),
    bom: new BOMGenerator(options?.bomConfig),
    cutList: new CutListGenerator(options?.cutListConfig),
    assembly: new AssemblyInstructionsGenerator(),
  };
}

/**
 * Generate complete manufacturing package from assembly
 */
export async function generateManufacturingPackage(
  assembly: AssemblyResult,
  factory: ManufacturingOutputFactory,
  options?: {
    sheetSize?: { width: number; height: number };
    projectName?: string;
  }
): Promise<{
  bom: ReturnType<BOMGenerator['generateBOM']>;
  cutList: ReturnType<CutListGenerator['generateCutList']>;
  assemblyInstructions: ReturnType<AssemblyInstructionsGenerator['generateInstructions']>;
  dxfDocuments: ReturnType<DXFGenerator['generateDXF']>[];
  nestingResult?: NestingResult;
}> {
  // Generate BOM
  const bom = factory.bom.generateBOM(assembly, options?.projectName);

  // Generate cut list
  const cutList = factory.cutList.generateCutList(assembly);

  // Generate assembly instructions
  const projectName = options?.projectName || assembly.name;
  const assemblyInstructions = factory.assembly.generateInstructions(assembly, projectName);

  // Generate DXF for each component
  const dxfDocuments: ReturnType<DXFGenerator['generateDXF']>[] = [];
  for (const component of assembly.components) {
    const dxf = factory.dxf.generateDXF(component);
    dxfDocuments.push(dxf);
  }

  // Optimize nesting if sheet size provided
  let nestingResult: NestingResult | undefined;
  if (options?.sheetSize) {
    const parts = assembly.components.map(c => ({
      id: c.id,
      width: c.bounds.max.x - c.bounds.min.x,
      height: c.bounds.max.y - c.bounds.min.y,
      quantity: 1,
    }));
    nestingResult = factory.nesting.nestParts(parts, options.sheetSize);
  }

  return {
    bom,
    cutList,
    assemblyInstructions,
    dxfDocuments,
    nestingResult,
  };
}

/**
 * Quick G-code generation for a single geometry
 */
export function generateQuickGCode(
  geometry: GeometryResult,
  machineType: 'mill' | 'lathe' | 'router' = 'mill'
): string {
  const generator = createGCodeGenerator(machineType);

  // Create basic facing operation
  const bounds = geometry.bounds;
  const operation = {
    name: 'Facing',
    type: 'face' as const,
    spindleSpeed: machineType === 'router' ? 18000 : 3000,
    feedRate: machineType === 'router' ? 1000 : 500,
    coolant: machineType === 'router' ? 'off' as const : 'flood' as const,
    startPoint: { x: bounds.min.x, y: bounds.min.y, z: bounds.max.z + 10 },
    segments: [
      {
        type: 'linear' as const,
        start: { x: bounds.min.x, y: bounds.min.y, z: bounds.max.z },
        end: { x: bounds.max.x, y: bounds.min.y, z: bounds.max.z },
        feedRate: 500,
      },
      {
        type: 'linear' as const,
        start: { x: bounds.max.x, y: bounds.min.y, z: bounds.max.z },
        end: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
        feedRate: 500,
      },
    ],
  };

  const program = generator.generateProgram(geometry, [operation]);
  return generator.programToString(program);
}
