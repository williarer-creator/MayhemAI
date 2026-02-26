/**
 * BOM Generator
 *
 * Generates Bill of Materials, cut lists, and assembly instructions.
 */

import type {
  BOMConfig,
  BOMItem,
  BOMDocument,
  BOMColumn,
  CutListConfig,
  CutListItem,
  CutListDocument,
  CutOperation,
  StockUsage,
  AssemblyInstructionConfig,
  AssemblyInstruction,
  AssemblyInstructionDocument,
} from '../types';
import type { GeometryResult, AssemblyResult } from '../../geometry/types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const defaultBOMConfig: BOMConfig = {
  format: 'csv',
  columns: [
    'item-number',
    'part-number',
    'description',
    'quantity',
    'material',
    'dimensions',
    'weight',
  ],
  groupByMaterial: true,
  includeSubAssemblies: true,
  includeHardware: true,
  sortBy: 'item-number',
};

export const defaultCutListConfig: CutListConfig = {
  materialType: 'steel',
  stockLengths: [6000, 12000], // Standard 6m and 12m lengths
  kerfWidth: 3, // 3mm saw blade
  minRemnant: 100, // Keep remnants > 100mm
  optimizeWaste: true,
};

export const defaultAssemblyConfig: AssemblyInstructionConfig = {
  includeImages: false,
  detailLevel: 'detailed',
  includeSafetyWarnings: true,
  includeToolList: true,
};

// ============================================================================
// BOM GENERATOR CLASS
// ============================================================================

export class BOMGenerator {
  private config: BOMConfig;

  constructor(config: Partial<BOMConfig> = {}) {
    this.config = { ...defaultBOMConfig, ...config };
  }

  /**
   * Generate BOM from assembly
   */
  generateBOM(assembly: AssemblyResult, projectName?: string): BOMDocument {
    const items: BOMItem[] = [];
    let itemNumber = 1;

    // Extract items from components
    for (const component of assembly.components) {
      const item = this.componentToBOMItem(component, itemNumber++);
      items.push(item);
    }

    // Sort items
    this.sortItems(items);

    // Group by material if configured
    if (this.config.groupByMaterial) {
      items.sort((a, b) => (a.material || '').localeCompare(b.material || ''));
    }

    // Calculate totals
    const totals = {
      partCount: items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueParts: items.length,
      totalWeight: items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0),
      totalCost: items.reduce((sum, item) => sum + (item.totalCost || 0), 0),
    };

    return {
      config: this.config,
      items,
      totals,
      generatedDate: new Date().toISOString(),
      projectName,
    };
  }

  /**
   * Convert component to BOM item
   */
  private componentToBOMItem(component: GeometryResult, itemNumber: number): BOMItem {
    const bounds = component.bounds;
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.y - bounds.min.y;
    const height = bounds.max.z - bounds.min.z;

    return {
      itemNumber,
      partNumber: component.id,
      description: component.name,
      quantity: 1,
      unit: 'ea',
      material: component.material,
      dimensions: `${width.toFixed(0)} x ${depth.toFixed(0)} x ${height.toFixed(0)}`,
      weight: component.properties.weight,
    };
  }

  /**
   * Sort items based on config
   */
  private sortItems(items: BOMItem[]): void {
    switch (this.config.sortBy) {
      case 'item-number':
        items.sort((a, b) => a.itemNumber - b.itemNumber);
        break;
      case 'part-name':
        items.sort((a, b) => a.description.localeCompare(b.description));
        break;
      case 'quantity':
        items.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'material':
        items.sort((a, b) => (a.material || '').localeCompare(b.material || ''));
        break;
    }
  }

  /**
   * Export BOM to CSV string
   */
  toCSV(doc: BOMDocument): string {
    const headers = this.config.columns.map(col => this.columnHeader(col));
    const rows: string[][] = [headers];

    for (const item of doc.items) {
      const row = this.config.columns.map(col => this.getColumnValue(item, col));
      rows.push(row);
    }

    // Add totals row
    rows.push([]);
    rows.push(['TOTALS', '', '', doc.totals.partCount.toString(), '', '', doc.totals.totalWeight.toFixed(2)]);

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Export BOM to JSON
   */
  toJSON(doc: BOMDocument): string {
    return JSON.stringify(doc, null, 2);
  }

  /**
   * Get column header name
   */
  private columnHeader(column: BOMColumn): string {
    const headers: Record<BOMColumn, string> = {
      'item-number': 'Item #',
      'part-number': 'Part Number',
      'description': 'Description',
      'quantity': 'Qty',
      'material': 'Material',
      'dimensions': 'Dimensions',
      'weight': 'Weight (kg)',
      'unit-cost': 'Unit Cost',
      'total-cost': 'Total Cost',
      'supplier': 'Supplier',
      'lead-time': 'Lead Time',
      'notes': 'Notes',
    };
    return headers[column] || column;
  }

  /**
   * Get column value from item
   */
  private getColumnValue(item: BOMItem, column: BOMColumn): string {
    switch (column) {
      case 'item-number': return item.itemNumber.toString();
      case 'part-number': return item.partNumber;
      case 'description': return item.description;
      case 'quantity': return item.quantity.toString();
      case 'material': return item.material || '';
      case 'dimensions': return item.dimensions || '';
      case 'weight': return item.weight?.toFixed(2) || '';
      case 'unit-cost': return item.unitCost?.toFixed(2) || '';
      case 'total-cost': return item.totalCost?.toFixed(2) || '';
      case 'supplier': return item.supplier || '';
      case 'lead-time': return item.leadTime || '';
      case 'notes': return item.notes || '';
      default: return '';
    }
  }
}

// ============================================================================
// CUT LIST GENERATOR
// ============================================================================

export class CutListGenerator {
  private config: CutListConfig;

  constructor(config: Partial<CutListConfig> = {}) {
    this.config = { ...defaultCutListConfig, ...config };
  }

  /**
   * Generate cut list from assembly
   */
  generateCutList(assembly: AssemblyResult): CutListDocument {
    const items: CutListItem[] = [];
    let itemNumber = 1;

    // Extract linear components (beams, pipes, etc.)
    for (const component of assembly.components) {
      // Check if this is a linear component based on element type
      if (this.isLinearComponent(component)) {
        const item = this.componentToCutListItem(component, itemNumber++);
        items.push(item);
      }
    }

    // Optimize stock usage if configured
    let optimization: CutListDocument['optimization'];
    if (this.config.optimizeWaste) {
      optimization = this.optimizeStockUsage(items);
    }

    // Calculate totals
    const totals = {
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalLength: items.reduce((sum, item) => sum + item.cutLength * item.quantity, 0),
      totalWeight: items.reduce((sum, item) => sum + item.weight * item.quantity, 0),
    };

    return {
      config: this.config,
      items,
      optimization,
      totals,
    };
  }

  /**
   * Check if component is linear (beam, pipe, etc.)
   */
  private isLinearComponent(component: GeometryResult): boolean {
    const linearTypes = ['beam', 'column', 'pipe', 'tube', 'angle', 'channel', 'bracing'];
    return linearTypes.some(type => component.elementType.toLowerCase().includes(type));
  }

  /**
   * Convert component to cut list item
   */
  private componentToCutListItem(component: GeometryResult, itemNumber: number): CutListItem {
    const bounds = component.bounds;

    // Determine longest dimension as length
    const dims = [
      bounds.max.x - bounds.min.x,
      bounds.max.y - bounds.min.y,
      bounds.max.z - bounds.min.z,
    ];
    const cutLength = Math.max(...dims);

    // Determine profile from element type
    const profile = this.determineProfile(component);

    const operations: CutOperation[] = [];

    // Add end cuts
    operations.push({
      type: 'cut',
      position: 0,
      parameters: { angle: 90 },
      description: 'Square cut - start',
    });
    operations.push({
      type: 'cut',
      position: cutLength,
      parameters: { angle: 90 },
      description: 'Square cut - end',
    });

    // Check metadata for holes, notches, etc.
    if (component.metadata.holes) {
      const holes = component.metadata.holes as Array<{ position: number; diameter: number }>;
      for (const hole of holes) {
        operations.push({
          type: 'drill',
          position: hole.position,
          parameters: { diameter: hole.diameter },
          description: `Drill ${hole.diameter}mm hole`,
        });
      }
    }

    return {
      itemNumber,
      description: component.name,
      profile,
      material: component.material,
      quantity: 1,
      cutLength,
      operations,
      weight: component.properties.weight,
    };
  }

  /**
   * Determine profile description
   */
  private determineProfile(component: GeometryResult): string {
    const elementType = component.elementType.toLowerCase();
    const metadata = component.metadata;

    if (elementType.includes('beam')) {
      return metadata.profile as string || 'W-FLANGE';
    } else if (elementType.includes('tube')) {
      const size = metadata.size as number;
      return `TUBE ${size}x${size}`;
    } else if (elementType.includes('pipe')) {
      const diameter = metadata.diameter as number;
      return `PIPE ${diameter}`;
    } else if (elementType.includes('angle')) {
      return 'ANGLE';
    } else if (elementType.includes('channel')) {
      return 'CHANNEL';
    }

    return 'MISC';
  }

  /**
   * Optimize stock usage using cutting stock problem algorithm
   */
  private optimizeStockUsage(items: CutListItem[]): CutListDocument['optimization'] {
    // Group items by profile and material
    const groups = new Map<string, CutListItem[]>();

    for (const item of items) {
      const key = `${item.profile}|${item.material}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      // Expand by quantity
      for (let i = 0; i < item.quantity; i++) {
        groups.get(key)!.push(item);
      }
    }

    const stockUsage: StockUsage[] = [];
    let totalStock = 0;
    let totalWaste = 0;

    // Optimize each group
    for (const [_key, groupItems] of groups) {
      // Sort by length descending (First Fit Decreasing)
      const lengths = groupItems.map(item => item.cutLength).sort((a, b) => b - a);

      // Try each stock length
      for (const stockLength of this.config.stockLengths) {
        const usage = this.packIntoStock(lengths, stockLength);
        if (usage) {
          stockUsage.push(usage);
          totalStock += stockLength * Math.ceil(lengths.length / usage.cuts.length);
        }
      }
    }

    // Calculate waste
    const usedLength = items.reduce((sum, item) => sum + item.cutLength * item.quantity, 0);
    totalWaste = totalStock - usedLength;
    const wastePercentage = (totalWaste / totalStock) * 100;

    return {
      stockUsage,
      wastePercentage,
      totalStock,
      totalWaste,
    };
  }

  /**
   * Pack cuts into a stock length
   */
  private packIntoStock(lengths: number[], stockLength: number): StockUsage | null {
    const cuts: { length: number; quantity: number }[] = [];
    let remaining = stockLength;

    // Group same-length cuts
    const lengthMap = new Map<number, number>();
    for (const length of lengths) {
      if (length + this.config.kerfWidth <= remaining) {
        lengthMap.set(length, (lengthMap.get(length) || 0) + 1);
        remaining -= length + this.config.kerfWidth;
      }
    }

    // Convert to cuts array
    for (const [length, quantity] of lengthMap) {
      cuts.push({ length, quantity });
    }

    if (cuts.length === 0) return null;

    const usedLength = stockLength - remaining;
    const efficiency = (usedLength / stockLength) * 100;

    return {
      stockLength,
      cuts,
      remnant: remaining,
      efficiency,
    };
  }

  /**
   * Export cut list to text format
   */
  toText(doc: CutListDocument): string {
    const lines: string[] = [];

    lines.push('CUT LIST');
    lines.push('=' .repeat(60));
    lines.push('');

    // Header
    lines.push(
      'Item'.padEnd(6) +
      'Description'.padEnd(25) +
      'Profile'.padEnd(15) +
      'Material'.padEnd(15) +
      'Qty'.padEnd(5) +
      'Length'.padEnd(10) +
      'Weight'
    );
    lines.push('-'.repeat(80));

    // Items
    for (const item of doc.items) {
      lines.push(
        item.itemNumber.toString().padEnd(6) +
        item.description.substring(0, 24).padEnd(25) +
        item.profile.substring(0, 14).padEnd(15) +
        item.material.substring(0, 14).padEnd(15) +
        item.quantity.toString().padEnd(5) +
        item.cutLength.toFixed(0).padEnd(10) +
        item.weight.toFixed(2)
      );

      // Operations
      for (const op of item.operations) {
        lines.push(`      - ${op.description} @ ${op.position}mm`);
      }
    }

    lines.push('-'.repeat(80));
    lines.push(
      'TOTALS'.padEnd(46) +
      doc.totals.totalItems.toString().padEnd(5) +
      doc.totals.totalLength.toFixed(0).padEnd(10) +
      doc.totals.totalWeight.toFixed(2)
    );

    // Optimization results
    if (doc.optimization) {
      lines.push('');
      lines.push('STOCK OPTIMIZATION');
      lines.push('-'.repeat(40));
      lines.push(`Waste: ${doc.optimization.wastePercentage.toFixed(1)}%`);
      lines.push(`Total stock required: ${doc.optimization.totalStock}mm`);
      lines.push(`Total waste: ${doc.optimization.totalWaste}mm`);
    }

    return lines.join('\n');
  }
}

// ============================================================================
// ASSEMBLY INSTRUCTIONS GENERATOR
// ============================================================================

export class AssemblyInstructionsGenerator {
  private config: AssemblyInstructionConfig;

  constructor(config: Partial<AssemblyInstructionConfig> = {}) {
    this.config = { ...defaultAssemblyConfig, ...config };
  }

  /**
   * Generate assembly instructions
   */
  generateInstructions(
    assembly: AssemblyResult,
    projectName: string
  ): AssemblyInstructionDocument {
    const steps: AssemblyInstruction[] = [];
    const requiredTools: string[] = [];

    // Add preparation step
    steps.push({
      stepNumber: 1,
      title: 'Preparation',
      description: 'Gather all components and verify quantities against the bill of materials. Lay out components in order of assembly.',
      partsUsed: [],
      hardwareUsed: [],
      tools: ['Tape measure', 'Marker'],
      estimatedTime: 10,
    });

    // Generate steps for each component
    let stepNumber = 2;
    for (let i = 0; i < assembly.components.length; i++) {
      const component = assembly.components[i];
      const step = this.generateStep(component, stepNumber++, i === 0);
      steps.push(step);

      // Collect tools
      if (step.tools) {
        for (const tool of step.tools) {
          if (!requiredTools.includes(tool)) {
            requiredTools.push(tool);
          }
        }
      }
    }

    // Add final inspection step
    steps.push({
      stepNumber: stepNumber,
      title: 'Final Inspection',
      description: 'Verify all connections are secure. Check alignment and clearances. Remove any temporary supports or fixtures.',
      partsUsed: [],
      hardwareUsed: [],
      tools: ['Level', 'Square', 'Tape measure'],
      estimatedTime: 15,
    });

    // Calculate total time
    const totalEstimatedTime = steps.reduce((sum, step) => sum + (step.estimatedTime || 10), 0);

    // Safety precautions
    const safetyPrecautions = [
      'Wear appropriate personal protective equipment (PPE)',
      'Ensure adequate ventilation when welding or cutting',
      'Use proper lifting techniques for heavy components',
      'Secure all components before releasing lifting equipment',
      'Follow all applicable safety codes and regulations',
    ];

    return {
      config: this.config,
      projectName,
      assemblyName: assembly.name,
      steps,
      totalEstimatedTime,
      requiredTools,
      safetyPrecautions,
    };
  }

  /**
   * Generate step for a component
   */
  private generateStep(
    component: GeometryResult,
    stepNumber: number,
    isFirst: boolean
  ): AssemblyInstruction {
    const tools: string[] = [];
    const hardware: Array<{ item: string; size: string; quantity: number }> = [];

    // Determine tools based on connection type
    if (component.material.includes('steel')) {
      tools.push('Welding equipment');
      tools.push('Grinder');
    }

    tools.push('Level');
    tools.push('Clamps');

    // Add typical hardware
    hardware.push({ item: 'Bolts', size: 'M12x40', quantity: 4 });
    hardware.push({ item: 'Nuts', size: 'M12', quantity: 4 });
    hardware.push({ item: 'Washers', size: 'M12', quantity: 8 });

    // Generate description
    let description = '';
    if (isFirst) {
      description = `Position ${component.name} as the base component. Ensure it is level and properly aligned with reference marks. Secure temporarily.`;
    } else {
      description = `Align ${component.name} with the previous component. Verify fit and clearances before securing permanently.`;
    }

    return {
      stepNumber,
      title: `Install ${component.name}`,
      description,
      partsUsed: [{ partNumber: component.id, quantity: 1 }],
      hardwareUsed: hardware,
      tools,
      estimatedTime: 20,
    };
  }

  /**
   * Export instructions to text format
   */
  toText(doc: AssemblyInstructionDocument): string {
    const lines: string[] = [];

    lines.push('ASSEMBLY INSTRUCTIONS');
    lines.push('=' .repeat(60));
    lines.push('');
    lines.push(`Project: ${doc.projectName}`);
    lines.push(`Assembly: ${doc.assemblyName}`);
    lines.push(`Estimated Time: ${doc.totalEstimatedTime} minutes`);
    lines.push('');

    // Safety precautions
    if (this.config.includeSafetyWarnings) {
      lines.push('SAFETY PRECAUTIONS');
      lines.push('-'.repeat(40));
      for (const warning of doc.safetyPrecautions) {
        lines.push(`⚠ ${warning}`);
      }
      lines.push('');
    }

    // Required tools
    if (this.config.includeToolList) {
      lines.push('REQUIRED TOOLS');
      lines.push('-'.repeat(40));
      for (const tool of doc.requiredTools) {
        lines.push(`• ${tool}`);
      }
      lines.push('');
    }

    // Steps
    lines.push('ASSEMBLY STEPS');
    lines.push('-'.repeat(40));

    for (const step of doc.steps) {
      lines.push('');
      lines.push(`STEP ${step.stepNumber}: ${step.title}`);
      lines.push(step.description);

      if (step.partsUsed.length > 0) {
        lines.push('  Parts:');
        for (const part of step.partsUsed) {
          lines.push(`    - ${part.partNumber} (${part.quantity})`);
        }
      }

      if (step.hardwareUsed.length > 0) {
        lines.push('  Hardware:');
        for (const hw of step.hardwareUsed) {
          lines.push(`    - ${hw.item} ${hw.size} (${hw.quantity})`);
        }
      }

      if (step.estimatedTime) {
        lines.push(`  Time: ~${step.estimatedTime} min`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createBOMGenerator(config?: Partial<BOMConfig>): BOMGenerator {
  return new BOMGenerator(config);
}

export function createCutListGenerator(config?: Partial<CutListConfig>): CutListGenerator {
  return new CutListGenerator(config);
}

export function createAssemblyInstructionsGenerator(
  config?: Partial<AssemblyInstructionConfig>
): AssemblyInstructionsGenerator {
  return new AssemblyInstructionsGenerator(config);
}
