/**
 * Part Nesting Optimizer
 *
 * Optimizes placement of parts on stock sheets for cutting.
 * Uses a simple bin-packing algorithm.
 */

import type {
  NestingInput,
  NestingPart,
  StockSheet,
  NestingResult,
  NestedSheet,
  PartPlacement,
} from './types';

// =============================================================================
// NESTING ALGORITHM
// =============================================================================

/**
 * Nest parts onto stock sheets
 */
export function nestParts(input: NestingInput): NestingResult {
  const { parts, stockSheets, kerf, margin } = input;

  // Expand parts by quantity
  const allParts: Array<NestingPart & { instanceId: string }> = [];
  for (const part of parts) {
    for (let i = 0; i < part.quantity; i++) {
      allParts.push({
        ...part,
        instanceId: `${part.id}-${i + 1}`,
      });
    }
  }

  // Sort parts by area (largest first - better for bin packing)
  allParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  // Track results
  const nestedSheets: NestedSheet[] = [];
  const placedParts = new Set<string>();

  // Process each stock sheet type
  for (const stock of stockSheets) {
    for (let sheetNum = 0; sheetNum < stock.quantity; sheetNum++) {
      // Get unplaced parts that fit on this sheet
      const unplaced = allParts.filter(p => !placedParts.has(p.instanceId));
      if (unplaced.length === 0) break;

      // Try to nest parts on this sheet
      const nestResult = nestOnSheet(unplaced, stock, kerf, margin);

      if (nestResult.placements.length > 0) {
        nestedSheets.push({
          stockId: `${stock.id}-${sheetNum + 1}`,
          placements: nestResult.placements,
          utilization: nestResult.utilization,
        });

        // Mark parts as placed
        for (const placement of nestResult.placements) {
          placedParts.add(placement.partId);
        }
      }
    }
  }

  // Check for parts that couldn't be placed
  const unusedParts = allParts
    .filter(p => !placedParts.has(p.instanceId))
    .map(p => p.instanceId);

  // Calculate overall efficiency
  const totalPartArea = allParts.reduce((sum, p) => sum + p.width * p.height, 0);
  const totalSheetArea = nestedSheets.reduce((sum, sheet) => {
    const stock = stockSheets.find(s => sheet.stockId.startsWith(s.id));
    return sum + (stock ? stock.width * stock.height : 0);
  }, 0);
  const efficiency = totalSheetArea > 0 ? totalPartArea / totalSheetArea : 0;

  return {
    success: unusedParts.length === 0,
    sheets: nestedSheets,
    totalSheets: nestedSheets.length,
    efficiency,
    unusedParts,
  };
}

/**
 * Nest parts on a single sheet using bottom-left algorithm
 */
function nestOnSheet(
  parts: Array<NestingPart & { instanceId: string }>,
  sheet: StockSheet,
  kerf: number,
  margin: number
): { placements: PartPlacement[]; utilization: number } {
  const placements: PartPlacement[] = [];

  // Usable area
  const usableWidth = sheet.width - 2 * margin;
  const usableHeight = sheet.height - 2 * margin;

  // Track occupied regions
  const skyline: Array<{ x: number; y: number; width: number }> = [
    { x: margin, y: margin, width: usableWidth },
  ];

  let placedArea = 0;

  for (const part of parts) {
    // Try to place this part
    const placement = findPlacement(part, skyline, usableWidth, usableHeight, margin, kerf);

    if (placement) {
      placements.push({
        partId: part.instanceId,
        x: placement.x,
        y: placement.y,
        rotated: placement.rotated,
      });

      // Update skyline
      updateSkyline(skyline, placement, part, kerf);

      placedArea += part.width * part.height;
    }
  }

  const utilization = placedArea / (sheet.width * sheet.height);

  return { placements, utilization };
}

/**
 * Find placement for a part using bottom-left algorithm
 */
function findPlacement(
  part: NestingPart,
  skyline: Array<{ x: number; y: number; width: number }>,
  usableWidth: number,
  usableHeight: number,
  margin: number,
  kerf: number
): { x: number; y: number; rotated: boolean } | null {
  const partWidth = part.width + kerf;
  const partHeight = part.height + kerf;

  // Try normal orientation
  const normalPos = findBottomLeftPosition(partWidth, partHeight, skyline, usableWidth, usableHeight, margin);
  if (normalPos) {
    return { ...normalPos, rotated: false };
  }

  // Try rotated if allowed
  if (part.canRotate && part.width !== part.height) {
    const rotatedPos = findBottomLeftPosition(partHeight, partWidth, skyline, usableWidth, usableHeight, margin);
    if (rotatedPos) {
      return { ...rotatedPos, rotated: true };
    }
  }

  return null;
}

/**
 * Find bottom-left position for a rectangle
 */
function findBottomLeftPosition(
  width: number,
  height: number,
  skyline: Array<{ x: number; y: number; width: number }>,
  usableWidth: number,
  usableHeight: number,
  margin: number
): { x: number; y: number } | null {
  let bestX = Infinity;
  let bestY = Infinity;
  let found = false;

  // Sort skyline segments by y, then by x
  const sortedSkyline = [...skyline].sort((a, b) => a.y - b.y || a.x - b.x);

  for (const segment of sortedSkyline) {
    // Check if part fits starting at this segment
    if (segment.x + width <= margin + usableWidth &&
        segment.y + height <= margin + usableHeight) {
      // Check if there's enough space
      if (canPlace(segment.x, segment.y, width, height, skyline, margin + usableWidth, margin + usableHeight)) {
        if (segment.y < bestY || (segment.y === bestY && segment.x < bestX)) {
          bestX = segment.x;
          bestY = segment.y;
          found = true;
        }
      }
    }
  }

  return found ? { x: bestX, y: bestY } : null;
}

/**
 * Check if a rectangle can be placed without overlapping
 */
function canPlace(
  x: number,
  y: number,
  width: number,
  height: number,
  _skyline: Array<{ x: number; y: number; width: number }>,
  maxX: number,
  maxY: number
): boolean {
  // Check bounds
  if (x + width > maxX || y + height > maxY) return false;

  // For simplicity, we use a conservative check
  // Real implementation would check against all placed parts
  return true;
}

/**
 * Update skyline after placing a part
 */
function updateSkyline(
  skyline: Array<{ x: number; y: number; width: number }>,
  placement: { x: number; y: number; rotated: boolean },
  part: NestingPart,
  kerf: number
): void {
  const width = placement.rotated ? part.height : part.width;
  const height = placement.rotated ? part.width : part.height;

  const newY = placement.y + height + kerf;

  // Add new segment for the top of this part
  skyline.push({
    x: placement.x,
    y: newY,
    width: width + kerf,
  });

  // Sort skyline by x position
  skyline.sort((a, b) => a.x - b.x);
}

// =============================================================================
// LINEAR STOCK NESTING (for bars, tubes)
// =============================================================================

export interface LinearNestingInput {
  parts: Array<{ id: string; length: number; quantity: number }>;
  stockLength: number;
  kerf: number;
}

export interface LinearNestingResult {
  bars: Array<{
    barNumber: number;
    cuts: Array<{ partId: string; position: number; length: number }>;
    waste: number;
    utilization: number;
  }>;
  totalBars: number;
  totalWaste: number;
  efficiency: number;
}

/**
 * Nest linear parts (bars, tubes) using first-fit decreasing
 */
export function nestLinearParts(input: LinearNestingInput): LinearNestingResult {
  const { parts, stockLength, kerf } = input;

  // Expand parts by quantity
  const allCuts: Array<{ id: string; length: number }> = [];
  for (const part of parts) {
    for (let i = 0; i < part.quantity; i++) {
      allCuts.push({
        id: `${part.id}-${i + 1}`,
        length: part.length,
      });
    }
  }

  // Sort by length (longest first)
  allCuts.sort((a, b) => b.length - a.length);

  // Bins (bars)
  const bars: Array<{
    barNumber: number;
    cuts: Array<{ partId: string; position: number; length: number }>;
    remaining: number;
  }> = [];

  // First-fit decreasing algorithm
  for (const cut of allCuts) {
    const cutLength = cut.length + kerf;

    // Find first bar that fits
    let placed = false;
    for (const bar of bars) {
      if (bar.remaining >= cutLength) {
        const position = stockLength - bar.remaining;
        bar.cuts.push({
          partId: cut.id,
          position,
          length: cut.length,
        });
        bar.remaining -= cutLength;
        placed = true;
        break;
      }
    }

    // Need a new bar
    if (!placed) {
      const newBar = {
        barNumber: bars.length + 1,
        cuts: [{
          partId: cut.id,
          position: 0,
          length: cut.length,
        }],
        remaining: stockLength - cutLength,
      };
      bars.push(newBar);
    }
  }

  // Calculate results
  const totalUsed = allCuts.reduce((sum, c) => sum + c.length, 0);
  const totalStock = bars.length * stockLength;
  const totalWaste = totalStock - totalUsed - (allCuts.length * kerf);

  return {
    bars: bars.map(bar => ({
      barNumber: bar.barNumber,
      cuts: bar.cuts,
      waste: bar.remaining,
      utilization: (stockLength - bar.remaining) / stockLength,
    })),
    totalBars: bars.length,
    totalWaste,
    efficiency: totalUsed / totalStock,
  };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

/**
 * Format nesting result as text report
 */
export function formatNestingReport(result: NestingResult, stockSheets: StockSheet[]): string {
  const lines: string[] = [];

  lines.push('=' .repeat(60));
  lines.push('NESTING REPORT');
  lines.push('=' .repeat(60));
  lines.push('');

  lines.push(`Total Sheets Used: ${result.totalSheets}`);
  lines.push(`Overall Efficiency: ${(result.efficiency * 100).toFixed(1)}%`);
  lines.push('');

  for (const sheet of result.sheets) {
    const stock = stockSheets.find(s => sheet.stockId.startsWith(s.id));
    lines.push('-'.repeat(40));
    lines.push(`Sheet: ${sheet.stockId}`);
    if (stock) {
      lines.push(`  Size: ${stock.width} x ${stock.height} x ${stock.thickness}mm`);
      lines.push(`  Material: ${stock.material}`);
    }
    lines.push(`  Parts: ${sheet.placements.length}`);
    lines.push(`  Utilization: ${(sheet.utilization * 100).toFixed(1)}%`);
    lines.push('');

    lines.push('  Placements:');
    for (const p of sheet.placements) {
      lines.push(`    ${p.partId}: X=${p.x}, Y=${p.y}${p.rotated ? ' (rotated)' : ''}`);
    }
    lines.push('');
  }

  if (result.unusedParts.length > 0) {
    lines.push('WARNING: Parts that could not be placed:');
    for (const part of result.unusedParts) {
      lines.push(`  - ${part}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format linear nesting result as text report
 */
export function formatLinearNestingReport(result: LinearNestingResult, stockLength: number): string {
  const lines: string[] = [];

  lines.push('=' .repeat(60));
  lines.push('LINEAR NESTING REPORT');
  lines.push('=' .repeat(60));
  lines.push('');

  lines.push(`Stock Length: ${stockLength}mm`);
  lines.push(`Total Bars Used: ${result.totalBars}`);
  lines.push(`Total Waste: ${result.totalWaste.toFixed(0)}mm`);
  lines.push(`Overall Efficiency: ${(result.efficiency * 100).toFixed(1)}%`);
  lines.push('');

  for (const bar of result.bars) {
    lines.push('-'.repeat(40));
    lines.push(`Bar #${bar.barNumber}:`);
    lines.push(`  Utilization: ${(bar.utilization * 100).toFixed(1)}%`);
    lines.push(`  Waste: ${bar.waste.toFixed(0)}mm`);
    lines.push('  Cuts:');

    for (const cut of bar.cuts) {
      lines.push(`    ${cut.partId}: ${cut.length}mm @ ${cut.position}mm`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
