/**
 * DXF Generator
 *
 * Generates DXF files for laser cutting, plasma cutting, and CAD export.
 */

import type {
  DXFConfig,
  DXFDocument,
  DXFEntity,
  DXFLayer,
  NestingResult,
  NestedSheet,
} from '../types';
import type { GeometryResult } from '../../geometry/types';
import type { Point3D } from '../../knowledge/types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const defaultDXFConfig: DXFConfig = {
  version: '2007',
  units: 'mm',
  layers: [
    { name: 'CUT', color: 7, lineType: 'continuous', lineWeight: 0.25 },
    { name: 'ENGRAVE', color: 4, lineType: 'continuous', lineWeight: 0.1 },
    { name: 'FOLD', color: 1, lineType: 'dashed', lineWeight: 0.15 },
    { name: 'DIMENSIONS', color: 3, lineType: 'continuous', lineWeight: 0.1 },
    { name: 'NOTES', color: 2, lineType: 'continuous', lineWeight: 0.1 },
  ],
  includeDimensions: true,
  dimensionStyle: 'STANDARD',
};

// ============================================================================
// DXF GENERATOR CLASS
// ============================================================================

export class DXFGenerator {
  private config: DXFConfig;
  private handleCounter: number = 100;

  constructor(config: Partial<DXFConfig> = {}) {
    this.config = { ...defaultDXFConfig, ...config };
  }

  /**
   * Generate DXF document from geometry
   */
  generateDXF(
    geometry: GeometryResult,
    options: {
      view?: 'top' | 'front' | 'right';
      flatten?: boolean;
    } = {}
  ): DXFDocument {
    const entities: DXFEntity[] = [];
    const bounds = geometry.bounds;

    // Generate outline based on view
    const outlineEntities = this.generateOutline(geometry, options.view || 'top');
    entities.push(...outlineEntities);

    // Add dimensions if configured
    if (this.config.includeDimensions) {
      const dimensionEntities = this.generateDimensions(geometry, options.view || 'top');
      entities.push(...dimensionEntities);
    }

    return {
      config: this.config,
      entities,
      bounds,
      partCount: 1,
    };
  }

  /**
   * Generate DXF for multiple parts
   */
  generateMultiPartDXF(
    geometries: GeometryResult[],
    options: {
      view?: 'top' | 'front' | 'right';
      spacing?: number;
    } = {}
  ): DXFDocument {
    const entities: DXFEntity[] = [];
    const spacing = options.spacing || 10;
    let currentX = 0;

    let minBounds = { x: Infinity, y: Infinity, z: 0 };
    let maxBounds = { x: -Infinity, y: -Infinity, z: 0 };

    for (const geometry of geometries) {
      const partEntities = this.generateOutline(geometry, options.view || 'top', { x: currentX, y: 0 });
      entities.push(...partEntities);

      // Update bounds
      const partWidth = geometry.bounds.max.x - geometry.bounds.min.x;
      const partHeight = geometry.bounds.max.y - geometry.bounds.min.y;

      minBounds.x = Math.min(minBounds.x, currentX);
      minBounds.y = Math.min(minBounds.y, 0);
      maxBounds.x = Math.max(maxBounds.x, currentX + partWidth);
      maxBounds.y = Math.max(maxBounds.y, partHeight);

      currentX += partWidth + spacing;
    }

    return {
      config: this.config,
      entities,
      bounds: {
        min: minBounds,
        max: maxBounds,
      },
      partCount: geometries.length,
    };
  }

  /**
   * Generate outline entities for a geometry
   */
  private generateOutline(
    geometry: GeometryResult,
    view: 'top' | 'front' | 'right',
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ): DXFEntity[] {
    const entities: DXFEntity[] = [];
    const bounds = geometry.bounds;

    // Get dimensions based on view
    let width: number, height: number;
    switch (view) {
      case 'top':
        width = bounds.max.x - bounds.min.x;
        height = bounds.max.y - bounds.min.y;
        break;
      case 'front':
        width = bounds.max.x - bounds.min.x;
        height = bounds.max.z - bounds.min.z;
        break;
      case 'right':
        width = bounds.max.y - bounds.min.y;
        height = bounds.max.z - bounds.min.z;
        break;
    }

    // Create rectangular outline (simplified - actual implementation would extract real geometry)
    entities.push({
      type: 'polyline',
      layer: 'CUT',
      properties: {
        closed: true,
        points: [
          { x: offset.x, y: offset.y },
          { x: offset.x + width, y: offset.y },
          { x: offset.x + width, y: offset.y + height },
          { x: offset.x, y: offset.y + height },
        ],
      },
    });

    // Add part label
    entities.push({
      type: 'text',
      layer: 'NOTES',
      properties: {
        x: offset.x + width / 2,
        y: offset.y + height / 2,
        height: Math.min(width, height) * 0.1,
        text: geometry.name,
        horizontalJustification: 'center',
        verticalJustification: 'middle',
      },
    });

    return entities;
  }

  /**
   * Generate dimension entities
   */
  private generateDimensions(
    geometry: GeometryResult,
    view: 'top' | 'front' | 'right'
  ): DXFEntity[] {
    const entities: DXFEntity[] = [];
    const bounds = geometry.bounds;

    let width: number, height: number;
    switch (view) {
      case 'top':
        width = bounds.max.x - bounds.min.x;
        height = bounds.max.y - bounds.min.y;
        break;
      case 'front':
        width = bounds.max.x - bounds.min.x;
        height = bounds.max.z - bounds.min.z;
        break;
      case 'right':
        width = bounds.max.y - bounds.min.y;
        height = bounds.max.z - bounds.min.z;
        break;
    }

    const dimOffset = Math.max(width, height) * 0.1;

    // Width dimension (bottom)
    entities.push({
      type: 'dimension',
      layer: 'DIMENSIONS',
      properties: {
        dimensionType: 'linear',
        defPoint1: { x: 0, y: 0 },
        defPoint2: { x: width, y: 0 },
        dimLinePoint: { x: width / 2, y: -dimOffset },
        textOverride: `${width.toFixed(1)}`,
      },
    });

    // Height dimension (right)
    entities.push({
      type: 'dimension',
      layer: 'DIMENSIONS',
      properties: {
        dimensionType: 'linear',
        defPoint1: { x: width, y: 0 },
        defPoint2: { x: width, y: height },
        dimLinePoint: { x: width + dimOffset, y: height / 2 },
        textOverride: `${height.toFixed(1)}`,
        rotation: 90,
      },
    });

    return entities;
  }

  /**
   * Convert DXF document to string
   */
  documentToString(doc: DXFDocument): string {
    const lines: string[] = [];

    // HEADER section
    lines.push(...this.generateHeader());

    // TABLES section
    lines.push(...this.generateTables(doc.config.layers));

    // ENTITIES section
    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('ENTITIES');

    for (const entity of doc.entities) {
      lines.push(...this.entityToString(entity));
    }

    lines.push('0');
    lines.push('ENDSEC');

    // EOF
    lines.push('0');
    lines.push('EOF');

    return lines.join('\n');
  }

  /**
   * Generate DXF header section
   */
  private generateHeader(): string[] {
    const lines: string[] = [];

    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('HEADER');

    // Version
    lines.push('9');
    lines.push('$ACADVER');
    lines.push('1');
    lines.push(this.getVersionString());

    // Units
    lines.push('9');
    lines.push('$INSUNITS');
    lines.push('70');
    lines.push(this.config.units === 'mm' ? '4' : '1');

    lines.push('0');
    lines.push('ENDSEC');

    return lines;
  }

  /**
   * Generate TABLES section
   */
  private generateTables(layers: DXFLayer[]): string[] {
    const lines: string[] = [];

    lines.push('0');
    lines.push('SECTION');
    lines.push('2');
    lines.push('TABLES');

    // Layer table
    lines.push('0');
    lines.push('TABLE');
    lines.push('2');
    lines.push('LAYER');
    lines.push('70');
    lines.push(layers.length.toString());

    for (const layer of layers) {
      lines.push(...this.layerToString(layer));
    }

    lines.push('0');
    lines.push('ENDTAB');

    lines.push('0');
    lines.push('ENDSEC');

    return lines;
  }

  /**
   * Convert layer to DXF string
   */
  private layerToString(layer: DXFLayer): string[] {
    return [
      '0',
      'LAYER',
      '2',
      layer.name,
      '70',
      '0',
      '62',
      layer.color.toString(),
      '6',
      layer.lineType.toUpperCase(),
    ];
  }

  /**
   * Convert entity to DXF string
   */
  private entityToString(entity: DXFEntity): string[] {
    const lines: string[] = [];
    const handle = (this.handleCounter++).toString(16).toUpperCase();

    switch (entity.type) {
      case 'line':
        lines.push('0', 'LINE');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        lines.push('10', (entity.properties.x1 as number).toString());
        lines.push('20', (entity.properties.y1 as number).toString());
        lines.push('30', '0');
        lines.push('11', (entity.properties.x2 as number).toString());
        lines.push('21', (entity.properties.y2 as number).toString());
        lines.push('31', '0');
        break;

      case 'circle':
        lines.push('0', 'CIRCLE');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        lines.push('10', (entity.properties.x as number).toString());
        lines.push('20', (entity.properties.y as number).toString());
        lines.push('30', '0');
        lines.push('40', (entity.properties.radius as number).toString());
        break;

      case 'arc':
        lines.push('0', 'ARC');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        lines.push('10', (entity.properties.x as number).toString());
        lines.push('20', (entity.properties.y as number).toString());
        lines.push('30', '0');
        lines.push('40', (entity.properties.radius as number).toString());
        lines.push('50', (entity.properties.startAngle as number).toString());
        lines.push('51', (entity.properties.endAngle as number).toString());
        break;

      case 'polyline':
        lines.push('0', 'LWPOLYLINE');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        const points = entity.properties.points as Array<{ x: number; y: number }>;
        lines.push('90', points.length.toString());
        lines.push('70', entity.properties.closed ? '1' : '0');

        for (const point of points) {
          lines.push('10', point.x.toString());
          lines.push('20', point.y.toString());
        }
        break;

      case 'text':
        lines.push('0', 'TEXT');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        lines.push('10', (entity.properties.x as number).toString());
        lines.push('20', (entity.properties.y as number).toString());
        lines.push('30', '0');
        lines.push('40', (entity.properties.height as number).toString());
        lines.push('1', entity.properties.text as string);
        break;

      case 'dimension':
        // Simplified dimension - full implementation would be more complex
        lines.push('0', 'DIMENSION');
        lines.push('5', handle);
        lines.push('8', entity.layer);
        lines.push('70', '0'); // Linear dimension
        lines.push('10', ((entity.properties.dimLinePoint as Point3D).x).toString());
        lines.push('20', ((entity.properties.dimLinePoint as Point3D).y).toString());
        lines.push('30', '0');
        lines.push('1', entity.properties.textOverride as string);
        break;
    }

    return lines;
  }

  /**
   * Get DXF version string
   */
  private getVersionString(): string {
    switch (this.config.version) {
      case 'R12': return 'AC1009';
      case 'R14': return 'AC1014';
      case '2000': return 'AC1015';
      case '2004': return 'AC1018';
      case '2007': return 'AC1021';
      case '2010': return 'AC1024';
      default: return 'AC1021';
    }
  }
}

// ============================================================================
// NESTING ALGORITHM
// ============================================================================

export class NestingOptimizer {
  /**
   * Nest parts onto sheets for optimal material usage
   */
  nestParts(
    parts: Array<{ id: string; width: number; height: number; quantity: number }>,
    sheetSize: { width: number; height: number },
    options: {
      spacing?: number;
      allowRotation?: boolean;
    } = {}
  ): NestingResult {
    const spacing = options.spacing || 5;
    const allowRotation = options.allowRotation !== false;

    // Expand parts by quantity
    const expandedParts: Array<{ id: string; width: number; height: number; index: number }> = [];
    for (const part of parts) {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({
          id: part.id,
          width: part.width,
          height: part.height,
          index: i,
        });
      }
    }

    // Sort parts by area (largest first)
    expandedParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    const sheets: NestedSheet[] = [];
    let currentSheet: NestedSheet | null = null;
    const placedParts: Set<number> = new Set();

    // Simple bin packing algorithm
    while (placedParts.size < expandedParts.length) {
      // Start new sheet
      currentSheet = {
        sheetIndex: sheets.length,
        sheetSize,
        parts: [],
        efficiency: 0,
      };
      sheets.push(currentSheet);

      // Create grid of available positions
      const usedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];

      for (let i = 0; i < expandedParts.length; i++) {
        if (placedParts.has(i)) continue;

        const part = expandedParts[i];

        // Try to place part
        const position = this.findPosition(
          part,
          sheetSize,
          usedAreas,
          spacing,
          allowRotation
        );

        if (position) {
          currentSheet.parts.push({
            partId: `${part.id}_${part.index}`,
            position: { x: position.x, y: position.y },
            rotation: position.rotation,
            bounds: {
              width: position.rotation === 90 ? part.height : part.width,
              height: position.rotation === 90 ? part.width : part.height,
            },
          });

          usedAreas.push({
            x: position.x,
            y: position.y,
            width: position.rotation === 90 ? part.height : part.width,
            height: position.rotation === 90 ? part.width : part.height,
          });

          placedParts.add(i);
        }
      }

      // Calculate efficiency
      const usedArea = currentSheet.parts.reduce(
        (sum, p) => sum + p.bounds.width * p.bounds.height,
        0
      );
      currentSheet.efficiency = (usedArea / (sheetSize.width * sheetSize.height)) * 100;
    }

    // Calculate totals
    const totalSheetArea = sheets.length * sheetSize.width * sheetSize.height;
    const usedArea = sheets.reduce(
      (sum, sheet) => sum + sheet.parts.reduce(
        (psum, p) => psum + p.bounds.width * p.bounds.height,
        0
      ),
      0
    );

    return {
      sheets,
      efficiency: (usedArea / totalSheetArea) * 100,
      totalSheetArea,
      usedArea,
      wasteArea: totalSheetArea - usedArea,
    };
  }

  /**
   * Find position for a part on the sheet
   */
  private findPosition(
    part: { width: number; height: number },
    sheetSize: { width: number; height: number },
    usedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    spacing: number,
    allowRotation: boolean
  ): { x: number; y: number; rotation: number } | null {
    // Try both orientations
    const orientations = allowRotation
      ? [{ width: part.width, height: part.height, rotation: 0 },
         { width: part.height, height: part.width, rotation: 90 }]
      : [{ width: part.width, height: part.height, rotation: 0 }];

    for (const orientation of orientations) {
      // Check if part fits on sheet at all
      if (orientation.width > sheetSize.width - spacing ||
          orientation.height > sheetSize.height - spacing) {
        continue;
      }

      // Try positions along bottom-left
      for (let y = spacing; y <= sheetSize.height - orientation.height - spacing; y += 10) {
        for (let x = spacing; x <= sheetSize.width - orientation.width - spacing; x += 10) {
          if (!this.overlapsAny(x, y, orientation.width, orientation.height, usedAreas, spacing)) {
            return { x, y, rotation: orientation.rotation };
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if a rectangle overlaps any used areas
   */
  private overlapsAny(
    x: number,
    y: number,
    width: number,
    height: number,
    usedAreas: Array<{ x: number; y: number; width: number; height: number }>,
    spacing: number
  ): boolean {
    for (const area of usedAreas) {
      if (x < area.x + area.width + spacing &&
          x + width + spacing > area.x &&
          y < area.y + area.height + spacing &&
          y + height + spacing > area.y) {
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createDXFGenerator(config?: Partial<DXFConfig>): DXFGenerator {
  return new DXFGenerator(config);
}

export function createNestingOptimizer(): NestingOptimizer {
  return new NestingOptimizer();
}
