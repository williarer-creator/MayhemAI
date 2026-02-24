/**
 * G-Code Generator
 *
 * Generates G-code for CNC milling, plasma/laser cutting, and routing.
 */

import type {
  GCodeOptions,
  GCodeOperation,
  GCodeOutput,
} from './types';

// =============================================================================
// G-CODE GENERATION
// =============================================================================

export interface GCodeProgram {
  operations: GCodeOperation[];
  header?: GCodeOptions;
}

/**
 * Generate G-code from operations
 */
export function generateGCode(
  operations: GCodeOperation[],
  options: GCodeOptions,
  filename: string
): GCodeOutput {
  const lines: string[] = [];

  // Header
  lines.push(...generateHeader(options));

  // Process operations
  let rapidMoves = 0;
  let cuttingMoves = 0;
  let toolChanges = 0;

  for (const op of operations) {
    const gcode = operationToGCode(op, options);
    lines.push(gcode);

    // Track stats
    switch (op.type) {
      case 'rapid': rapidMoves++; break;
      case 'linear':
      case 'arc_cw':
      case 'arc_ccw': cuttingMoves++; break;
      case 'tool_change': toolChanges++; break;
    }
  }

  // Footer
  lines.push(...generateFooter(options));

  // Estimate time (very rough)
  const estimatedTime = estimateMachiningTime(operations, options);

  // Collect tools used
  const toolsRequired = Array.from(
    new Set(
      operations
        .filter(op => op.type === 'tool_change')
        .map(op => op.params.toolNumber as number)
    )
  );

  return {
    filename: filename.endsWith('.nc') ? filename : `${filename}.nc`,
    content: lines.join('\n'),
    operations,
    estimatedTime,
    toolsRequired,
    summary: {
      totalMoves: rapidMoves + cuttingMoves,
      rapidMoves,
      cuttingMoves,
      toolChanges,
    },
  };
}

/**
 * Generate program header
 */
function generateHeader(options: GCodeOptions): string[] {
  const lines: string[] = [];

  lines.push('%');
  lines.push('O0001 (PROGRAM START)');
  lines.push(options.units === 'mm' ? 'G21 (METRIC)' : 'G20 (INCH)');
  lines.push('G90 (ABSOLUTE POSITIONING)');
  lines.push('G17 (XY PLANE)');

  if (options.machineType === 'mill' || options.machineType === 'router') {
    lines.push('G40 (CANCEL CUTTER COMP)');
    lines.push('G49 (CANCEL TOOL LENGTH COMP)');
    lines.push('G80 (CANCEL CANNED CYCLES)');
  }

  // Safe position
  lines.push(`G28 G91 Z0 (HOME Z)`);

  return lines;
}

/**
 * Generate program footer
 */
function generateFooter(options: GCodeOptions): string[] {
  const lines: string[] = [];

  lines.push('');
  lines.push('(PROGRAM END)');
  lines.push('M05 (SPINDLE OFF)');
  if (options.machineType !== 'plasma' && options.machineType !== 'laser') {
    lines.push('M09 (COOLANT OFF)');
  }
  lines.push('G28 G91 Z0 (HOME Z)');
  lines.push('G28 X0 Y0 (HOME XY)');
  lines.push('M30 (END PROGRAM)');
  lines.push('%');

  return lines;
}

/**
 * Convert operation to G-code
 */
function operationToGCode(op: GCodeOperation, options: GCodeOptions): string {
  const p = op.params;
  const comment = op.comment ? ` (${op.comment})` : '';

  switch (op.type) {
    case 'rapid':
      return `G00 X${formatNum(p.x)} Y${formatNum(p.y)}${p.z !== undefined ? ` Z${formatNum(p.z)}` : ''}${comment}`;

    case 'linear':
      return `G01 X${formatNum(p.x)} Y${formatNum(p.y)}${p.z !== undefined ? ` Z${formatNum(p.z)}` : ''} F${p.f || options.feedRate}${comment}`;

    case 'arc_cw':
      return `G02 X${formatNum(p.x)} Y${formatNum(p.y)} I${formatNum(p.i)} J${formatNum(p.j)} F${p.f || options.feedRate}${comment}`;

    case 'arc_ccw':
      return `G03 X${formatNum(p.x)} Y${formatNum(p.y)} I${formatNum(p.i)} J${formatNum(p.j)} F${p.f || options.feedRate}${comment}`;

    case 'drill':
      return `G81 X${formatNum(p.x)} Y${formatNum(p.y)} Z${formatNum(p.z)} R${formatNum(p.r || options.safeZ)} F${p.f || options.feedRate}${comment}`;

    case 'tool_change':
      return `T${p.toolNumber} M06 (TOOL CHANGE: ${p.toolDescription || ''})`;

    case 'spindle':
      return `M03 S${p.speed}${comment}`;

    case 'comment':
      return `(${p.text})`;

    default:
      return `; Unknown operation: ${op.type}`;
  }
}

/**
 * Format number for G-code (fixed precision)
 */
function formatNum(n: number | string | undefined): string {
  if (n === undefined) return '0';
  if (typeof n === 'string') return n;
  return n.toFixed(3);
}

/**
 * Estimate machining time
 */
function estimateMachiningTime(operations: GCodeOperation[], options: GCodeOptions): number {
  let time = 0;  // minutes
  let lastX = 0, lastY = 0, lastZ = options.safeZ;

  for (const op of operations) {
    const p = op.params;

    if (op.type === 'rapid') {
      // Rapid moves at rapid rate
      const dist = Math.sqrt(
        Math.pow((p.x as number || 0) - lastX, 2) +
        Math.pow((p.y as number || 0) - lastY, 2) +
        Math.pow((p.z as number || lastZ) - lastZ, 2)
      );
      time += dist / options.rapidRate;
      lastX = p.x as number || lastX;
      lastY = p.y as number || lastY;
      lastZ = p.z as number || lastZ;
    } else if (op.type === 'linear' || op.type === 'arc_cw' || op.type === 'arc_ccw') {
      // Cutting moves at feed rate
      const dist = Math.sqrt(
        Math.pow((p.x as number || 0) - lastX, 2) +
        Math.pow((p.y as number || 0) - lastY, 2) +
        Math.pow((p.z as number || lastZ) - lastZ, 2)
      );
      time += dist / (p.f as number || options.feedRate);
      lastX = p.x as number || lastX;
      lastY = p.y as number || lastY;
      lastZ = p.z as number || lastZ;
    } else if (op.type === 'tool_change') {
      // Tool changes typically take 10-30 seconds
      time += 0.5;
    }
  }

  return Math.round(time * 100) / 100;
}

// =============================================================================
// OPERATION BUILDERS
// =============================================================================

/**
 * Create rapid move
 */
export function rapid(x: number, y: number, z?: number, comment?: string): GCodeOperation {
  return {
    type: 'rapid',
    params: { x, y, ...(z !== undefined ? { z } : {}) },
    comment,
  };
}

/**
 * Create linear cutting move
 */
export function linear(x: number, y: number, z?: number, feedRate?: number, comment?: string): GCodeOperation {
  return {
    type: 'linear',
    params: { x, y, ...(z !== undefined ? { z } : {}), ...(feedRate ? { f: feedRate } : {}) },
    comment,
  };
}

/**
 * Create clockwise arc
 */
export function arcCW(
  x: number,
  y: number,
  i: number,
  j: number,
  feedRate?: number,
  comment?: string
): GCodeOperation {
  return {
    type: 'arc_cw',
    params: { x, y, i, j, ...(feedRate ? { f: feedRate } : {}) },
    comment,
  };
}

/**
 * Create counter-clockwise arc
 */
export function arcCCW(
  x: number,
  y: number,
  i: number,
  j: number,
  feedRate?: number,
  comment?: string
): GCodeOperation {
  return {
    type: 'arc_ccw',
    params: { x, y, i, j, ...(feedRate ? { f: feedRate } : {}) },
    comment,
  };
}

/**
 * Create drill operation
 */
export function drill(
  x: number,
  y: number,
  depth: number,
  retract?: number,
  feedRate?: number,
  comment?: string
): GCodeOperation {
  return {
    type: 'drill',
    params: {
      x,
      y,
      z: -depth,
      ...(retract !== undefined ? { r: retract } : {}),
      ...(feedRate ? { f: feedRate } : {}),
    },
    comment,
  };
}

/**
 * Create tool change
 */
export function toolChange(toolNumber: number, description?: string): GCodeOperation {
  return {
    type: 'tool_change',
    params: {
      toolNumber,
      ...(description ? { toolDescription: description } : {}),
    },
  };
}

/**
 * Create spindle start
 */
export function spindleOn(speed: number): GCodeOperation {
  return {
    type: 'spindle',
    params: { speed },
  };
}

/**
 * Create comment
 */
export function comment(text: string): GCodeOperation {
  return {
    type: 'comment',
    params: { text },
  };
}

// =============================================================================
// TOOLPATH GENERATORS
// =============================================================================

export interface ContourOptions {
  feedRate: number;
  plungeRate: number;
  depth: number;
  safeZ: number;
  compensation?: 'left' | 'right' | 'none';
  tabs?: { width: number; height: number; count: number };
}

/**
 * Generate rectangular pocket toolpath
 */
export function rectanglePocket(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  toolDiameter: number,
  options: ContourOptions
): GCodeOperation[] {
  const ops: GCodeOperation[] = [];
  const stepover = toolDiameter * 0.7;
  const depthPerPass = Math.min(depth, toolDiameter * 0.5);
  const numPasses = Math.ceil(depth / depthPerPass);

  ops.push(comment(`POCKET ${width}x${height}x${depth}`));
  ops.push(rapid(x + toolDiameter / 2, y + toolDiameter / 2));
  ops.push(rapid(x + toolDiameter / 2, y + toolDiameter / 2, options.safeZ));

  for (let pass = 1; pass <= numPasses; pass++) {
    const z = -Math.min(pass * depthPerPass, depth);
    ops.push(comment(`PASS ${pass} Z=${z}`));

    // Plunge
    ops.push(linear(x + toolDiameter / 2, y + toolDiameter / 2, z, options.plungeRate));

    // Spiral out
    let currentX = x + toolDiameter / 2;
    let currentY = y + toolDiameter / 2;
    let currentWidth = toolDiameter;
    let currentHeight = toolDiameter;

    while (currentWidth < width - toolDiameter && currentHeight < height - toolDiameter) {
      // Cut rectangle at current size
      ops.push(linear(currentX + currentWidth, currentY, undefined, options.feedRate));
      ops.push(linear(currentX + currentWidth, currentY + currentHeight));
      ops.push(linear(currentX, currentY + currentHeight));
      ops.push(linear(currentX, currentY));

      // Step out
      currentX -= stepover / 2;
      currentY -= stepover / 2;
      currentWidth += stepover;
      currentHeight += stepover;
      ops.push(linear(currentX, currentY));
    }

    // Final perimeter
    ops.push(linear(x + width - toolDiameter / 2, y + toolDiameter / 2));
    ops.push(linear(x + width - toolDiameter / 2, y + height - toolDiameter / 2));
    ops.push(linear(x + toolDiameter / 2, y + height - toolDiameter / 2));
    ops.push(linear(x + toolDiameter / 2, y + toolDiameter / 2));
  }

  ops.push(rapid(x + toolDiameter / 2, y + toolDiameter / 2, options.safeZ));
  return ops;
}

/**
 * Generate hole drilling toolpath
 */
export function drillHolePattern(
  holes: Array<{ x: number; y: number; diameter: number; depth: number }>,
  options: { safeZ: number; feedRate: number; peckDepth?: number }
): GCodeOperation[] {
  const ops: GCodeOperation[] = [];

  ops.push(comment(`DRILL ${holes.length} HOLES`));

  for (const hole of holes) {
    ops.push(rapid(hole.x, hole.y));
    ops.push(rapid(hole.x, hole.y, options.safeZ));

    if (options.peckDepth && hole.depth > options.peckDepth) {
      // Peck drilling
      let currentDepth = 0;
      while (currentDepth < hole.depth) {
        currentDepth = Math.min(currentDepth + options.peckDepth, hole.depth);
        ops.push(linear(hole.x, hole.y, -currentDepth, options.feedRate, `PECK TO ${currentDepth}`));
        ops.push(rapid(hole.x, hole.y, options.safeZ));
      }
    } else {
      // Single plunge
      ops.push(drill(hole.x, hole.y, hole.depth, options.safeZ, options.feedRate));
    }

    ops.push(rapid(hole.x, hole.y, options.safeZ));
  }

  return ops;
}

/**
 * Generate profile contour toolpath (2D cutting)
 */
export function profileContour(
  points: Array<{ x: number; y: number }>,
  options: ContourOptions & { closed?: boolean }
): GCodeOperation[] {
  const ops: GCodeOperation[] = [];

  if (points.length < 2) return ops;

  ops.push(comment(`PROFILE CONTOUR ${points.length} POINTS`));

  // Lead in
  ops.push(rapid(points[0].x, points[0].y));
  ops.push(rapid(points[0].x, points[0].y, options.safeZ));
  ops.push(linear(points[0].x, points[0].y, -options.depth, options.plungeRate));

  // Cut profile
  for (let i = 1; i < points.length; i++) {
    ops.push(linear(points[i].x, points[i].y, undefined, options.feedRate));
  }

  // Close if needed
  if (options.closed) {
    ops.push(linear(points[0].x, points[0].y, undefined, options.feedRate));
  }

  // Retract
  ops.push(rapid(undefined as unknown as number, undefined as unknown as number, options.safeZ));

  return ops;
}
