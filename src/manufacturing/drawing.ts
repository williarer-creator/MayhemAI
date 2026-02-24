/**
 * Drawing Generator
 *
 * Generates construction and assembly drawings in SVG format.
 * Can be converted to PDF or printed directly.
 */

import type {
  DrawingOptions,
  DrawingView,
  TitleBlock,
  DrawingDimension,
  DrawingNote,
  DrawingOutput,
  BillOfMaterials,
  BOMItem,
} from './types';
import type { GeneratedComponent } from '../knowledge/types';

// =============================================================================
// PAPER SIZES (mm)
// =============================================================================

const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  A0: { width: 841, height: 1189 },
};

const TITLE_BLOCK_HEIGHT = 30;  // mm
const MARGIN = 10;               // mm

// =============================================================================
// SVG DRAWING GENERATION
// =============================================================================

export interface DrawingContent {
  views: ViewContent[];
  dimensions: DrawingDimension[];
  notes: DrawingNote[];
  bom?: BillOfMaterials;
}

export interface ViewContent {
  name: string;
  type: DrawingView;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scale: number;
  elements: DrawingElement[];
}

export interface DrawingElement {
  type: 'line' | 'rect' | 'circle' | 'path' | 'text';
  attrs: Record<string, string | number>;
  children?: DrawingElement[];
}

/**
 * Generate SVG drawing
 */
export function generateDrawing(
  content: DrawingContent,
  options: DrawingOptions
): DrawingOutput {
  const paperSize = PAPER_SIZES[options.paperSize];
  const width = options.orientation === 'landscape' ? paperSize.height : paperSize.width;
  const height = options.orientation === 'landscape' ? paperSize.width : paperSize.height;

  // Drawing area (minus title block and margins)
  const drawingArea = {
    x: MARGIN,
    y: MARGIN,
    width: width - 2 * MARGIN,
    height: height - TITLE_BLOCK_HEIGHT - 2 * MARGIN,
  };

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}mm" height="${height}mm"
     viewBox="0 0 ${width} ${height}">
  <style>
    .thin { stroke-width: 0.25; }
    .medium { stroke-width: 0.35; }
    .thick { stroke-width: 0.5; }
    .outline { stroke: black; fill: none; }
    .hidden { stroke: black; fill: none; stroke-dasharray: 2,1; }
    .center { stroke: black; fill: none; stroke-dasharray: 4,1,1,1; }
    .dimension { stroke: black; fill: none; stroke-width: 0.18; }
    .dim-text { font-family: Arial; font-size: 2.5px; text-anchor: middle; }
    .note-text { font-family: Arial; font-size: 2px; }
    .title-text { font-family: Arial; font-size: 3px; font-weight: bold; }
  </style>
`;

  // Drawing border
  svg += `  <rect x="${MARGIN}" y="${MARGIN}" width="${drawingArea.width}" height="${drawingArea.height + TITLE_BLOCK_HEIGHT}"
               class="outline thick" />\n`;

  // Title block
  svg += generateTitleBlock(options.titleBlock, {
    x: MARGIN,
    y: height - TITLE_BLOCK_HEIGHT - MARGIN,
    width: drawingArea.width,
    height: TITLE_BLOCK_HEIGHT,
  }, options.scale);

  // Views
  for (const view of content.views) {
    svg += generateView(view, drawingArea);
  }

  // Dimensions
  for (const dim of content.dimensions) {
    svg += generateDimension(dim);
  }

  // Notes
  for (const note of content.notes) {
    svg += generateNote(note);
  }

  // BOM if included
  if (options.includeBOM && content.bom) {
    svg += generateBOMTable(content.bom, {
      x: drawingArea.x + drawingArea.width - 80,
      y: drawingArea.y,
      width: 80,
      height: Math.min(100, content.bom.items.length * 5 + 10),
    });
  }

  svg += '</svg>';

  return {
    filename: `${options.titleBlock.drawingNumber}.svg`,
    content: svg,
    format: 'svg',
    pages: 1,
    views: content.views.map(v => v.name),
    dimensions: content.dimensions,
    notes: content.notes,
  };
}

/**
 * Generate title block
 */
function generateTitleBlock(
  titleBlock: TitleBlock,
  area: { x: number; y: number; width: number; height: number },
  scale: string
): string {
  let svg = '';

  // Title block outline
  svg += `  <rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}"
               class="outline medium" />\n`;

  // Vertical dividers
  const col1 = area.x + area.width * 0.6;
  const col2 = area.x + area.width * 0.8;
  svg += `  <line x1="${col1}" y1="${area.y}" x2="${col1}" y2="${area.y + area.height}" class="outline thin" />\n`;
  svg += `  <line x1="${col2}" y1="${area.y}" x2="${col2}" y2="${area.y + area.height}" class="outline thin" />\n`;

  // Horizontal dividers
  const row1 = area.y + area.height * 0.5;
  svg += `  <line x1="${col1}" y1="${row1}" x2="${area.x + area.width}" y2="${row1}" class="outline thin" />\n`;

  // Text content
  // Project name and drawing title (large area)
  svg += `  <text x="${area.x + 5}" y="${area.y + area.height * 0.35}" class="title-text">${titleBlock.projectName}</text>\n`;
  svg += `  <text x="${area.x + 5}" y="${area.y + area.height * 0.7}" class="note-text">${titleBlock.drawingTitle}</text>\n`;

  // Drawing number
  svg += `  <text x="${col1 + 3}" y="${area.y + area.height * 0.35}" class="note-text">DWG NO:</text>\n`;
  svg += `  <text x="${col1 + 3}" y="${area.y + area.height * 0.7}" class="dim-text" style="text-anchor: start">${titleBlock.drawingNumber}</text>\n`;

  // Revision
  svg += `  <text x="${col1 + 3}" y="${row1 + area.height * 0.2}" class="note-text">REV:</text>\n`;
  svg += `  <text x="${col1 + 20}" y="${row1 + area.height * 0.35}" class="dim-text">${titleBlock.revision}</text>\n`;

  // Scale
  svg += `  <text x="${col2 + 3}" y="${area.y + area.height * 0.35}" class="note-text">SCALE:</text>\n`;
  svg += `  <text x="${col2 + 3}" y="${area.y + area.height * 0.7}" class="dim-text" style="text-anchor: start">${scale}</text>\n`;

  // Date
  svg += `  <text x="${col2 + 3}" y="${row1 + area.height * 0.2}" class="note-text">DATE:</text>\n`;
  svg += `  <text x="${col2 + 3}" y="${row1 + area.height * 0.35}" class="dim-text" style="text-anchor: start">${titleBlock.date}</text>\n`;

  return svg;
}

/**
 * Generate view content
 */
function generateView(view: ViewContent, _drawingArea: { x: number; y: number; width: number; height: number }): string {
  let svg = '';

  // View label
  svg += `  <text x="${view.position.x + view.size.width / 2}" y="${view.position.y - 3}"
               class="note-text" style="text-anchor: middle">${view.name} (${view.scale}:1)</text>\n`;

  // View border (optional)
  // svg += `  <rect x="${view.position.x}" y="${view.position.y}" width="${view.size.width}" height="${view.size.height}"
  //              class="outline thin" stroke-dasharray="1,1" />\n`;

  // Transform group for scaling
  svg += `  <g transform="translate(${view.position.x},${view.position.y}) scale(${1/view.scale})">\n`;

  // Render elements
  for (const element of view.elements) {
    svg += renderElement(element);
  }

  svg += `  </g>\n`;

  return svg;
}

/**
 * Render drawing element
 */
function renderElement(element: DrawingElement): string {
  const attrs = Object.entries(element.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');

  switch (element.type) {
    case 'line':
      return `    <line ${attrs} class="outline medium" />\n`;
    case 'rect':
      return `    <rect ${attrs} class="outline medium" />\n`;
    case 'circle':
      return `    <circle ${attrs} class="outline medium" />\n`;
    case 'path':
      return `    <path ${attrs} class="outline medium" />\n`;
    case 'text':
      return `    <text ${attrs} class="note-text">${element.attrs.content || ''}</text>\n`;
    default:
      return '';
  }
}

/**
 * Generate dimension
 */
function generateDimension(dim: DrawingDimension): string {
  let svg = '';

  // This is a simplified dimension - full implementation would include
  // extension lines, arrowheads, and proper positioning
  const unitStr = dim.unit || 'mm';
  const tolStr = dim.tolerance ? ` ${dim.tolerance}` : '';
  const valueStr = `${dim.value}${unitStr}${tolStr}`;

  svg += `  <text x="${dim.position.x}" y="${dim.position.y}" class="dim-text">${valueStr}</text>\n`;

  return svg;
}

/**
 * Generate note
 */
function generateNote(note: DrawingNote): string {
  let svg = '';

  if (note.balloonNumber !== undefined) {
    // Balloon with number
    svg += `  <circle cx="${note.position.x}" cy="${note.position.y}" r="4" class="outline thin" fill="white" />\n`;
    svg += `  <text x="${note.position.x}" y="${note.position.y + 1}" class="dim-text">${note.balloonNumber}</text>\n`;
    // Note text offset
    svg += `  <text x="${note.position.x + 8}" y="${note.position.y}" class="note-text">${note.text}</text>\n`;
  } else {
    svg += `  <text x="${note.position.x}" y="${note.position.y}" class="note-text">${note.text}</text>\n`;
  }

  return svg;
}

/**
 * Generate BOM table
 */
function generateBOMTable(
  bom: BillOfMaterials,
  area: { x: number; y: number; width: number; height: number }
): string {
  let svg = '';
  const rowHeight = 4;
  const headerHeight = 6;

  // Table outline
  svg += `  <rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}"
               class="outline medium" fill="white" />\n`;

  // Header
  svg += `  <rect x="${area.x}" y="${area.y}" width="${area.width}" height="${headerHeight}"
               class="outline thin" fill="#f0f0f0" />\n`;
  svg += `  <text x="${area.x + 2}" y="${area.y + 4}" class="note-text" font-weight="bold">BILL OF MATERIALS</text>\n`;

  // Column headers
  const cols = [
    { label: '#', width: 6 },
    { label: 'DESCRIPTION', width: 40 },
    { label: 'QTY', width: 10 },
    { label: 'MATERIAL', width: 24 },
  ];

  let colX = area.x;
  const headerY = area.y + headerHeight;
  svg += `  <line x1="${area.x}" y1="${headerY}" x2="${area.x + area.width}" y2="${headerY}" class="outline thin" />\n`;

  for (const col of cols) {
    svg += `  <text x="${colX + 1}" y="${headerY + 3}" class="note-text" font-size="1.5">${col.label}</text>\n`;
    colX += col.width;
    svg += `  <line x1="${colX}" y1="${headerY}" x2="${colX}" y2="${area.y + area.height}" class="outline thin" />\n`;
  }

  // Data rows
  let rowY = headerY + rowHeight;
  for (const item of bom.items.slice(0, Math.floor((area.height - headerHeight - rowHeight) / rowHeight))) {
    svg += `  <line x1="${area.x}" y1="${rowY}" x2="${area.x + area.width}" y2="${rowY}" class="outline thin" />\n`;

    colX = area.x;
    svg += `  <text x="${colX + 1}" y="${rowY + 3}" class="note-text" font-size="1.5">${item.itemNumber}</text>\n`;
    colX += cols[0].width;
    svg += `  <text x="${colX + 1}" y="${rowY + 3}" class="note-text" font-size="1.5">${item.description.substring(0, 20)}</text>\n`;
    colX += cols[1].width;
    svg += `  <text x="${colX + 1}" y="${rowY + 3}" class="note-text" font-size="1.5">${item.quantity}</text>\n`;
    colX += cols[2].width;
    svg += `  <text x="${colX + 1}" y="${rowY + 3}" class="note-text" font-size="1.5">${item.material}</text>\n`;

    rowY += rowHeight;
  }

  return svg;
}

// =============================================================================
// VIEW GENERATORS
// =============================================================================

/**
 * Generate front view elements for a stair
 */
export function generateStairFrontView(
  totalHeight: number,
  totalRun: number,
  numSteps: number,
  riserHeight: number,
  _treadDepth: number,
  stringerWidth: number
): DrawingElement[] {
  const elements: DrawingElement[] = [];

  // Left stringer outline
  elements.push({
    type: 'line',
    attrs: { x1: 0, y1: 0, x2: 0, y2: totalHeight },
  });
  elements.push({
    type: 'line',
    attrs: { x1: stringerWidth, y1: 0, x2: stringerWidth, y2: totalHeight },
  });

  // Right stringer outline
  elements.push({
    type: 'line',
    attrs: { x1: totalRun - stringerWidth, y1: 0, x2: totalRun - stringerWidth, y2: totalHeight },
  });
  elements.push({
    type: 'line',
    attrs: { x1: totalRun, y1: 0, x2: totalRun, y2: totalHeight },
  });

  // Treads (as horizontal lines between stringers)
  for (let i = 0; i <= numSteps; i++) {
    const y = i * riserHeight;
    elements.push({
      type: 'line',
      attrs: { x1: stringerWidth, y1: y, x2: totalRun - stringerWidth, y2: y },
    });
  }

  return elements;
}

/**
 * Generate side view elements for a stair
 */
export function generateStairSideView(
  _totalHeight: number,
  totalRun: number,
  numSteps: number,
  riserHeight: number,
  treadDepth: number,
  stringerThickness: number
): DrawingElement[] {
  const elements: DrawingElement[] = [];

  // Build stair step profile
  let pathD = 'M 0 0';
  let x = 0;
  let y = 0;

  for (let i = 0; i < numSteps; i++) {
    // Horizontal tread
    x += treadDepth;
    pathD += ` L ${x} ${y}`;
    // Vertical riser
    y += riserHeight;
    pathD += ` L ${x} ${y}`;
  }

  // Close the bottom
  pathD += ` L 0 ${y} Z`;

  elements.push({
    type: 'path',
    attrs: { d: pathD },
  });

  // Stringer outline (offset from steps)
  const offset = stringerThickness;
  elements.push({
    type: 'line',
    attrs: { x1: -offset, y1: -offset, x2: totalRun + offset, y2: -offset },
  });

  return elements;
}

// =============================================================================
// BILL OF MATERIALS GENERATOR
// =============================================================================

/**
 * Generate BOM from components
 */
export function generateBOM(
  components: GeneratedComponent[],
  projectName: string
): BillOfMaterials {
  const items: BOMItem[] = [];
  let itemNumber = 1;

  for (const component of components) {
    if (!component.cutList) continue;

    for (const cut of component.cutList) {
      items.push({
        itemNumber: itemNumber++,
        partNumber: `${component.name}-${cut.description}`.replace(/\s+/g, '-').toUpperCase(),
        description: cut.description,
        material: cut.material,
        quantity: cut.quantity,
        unit: 'ea',
        unitWeight: cut.weight,
        totalWeight: cut.weight * cut.quantity,
        notes: cut.notes,
      });
    }
  }

  const totalWeight = items.reduce((sum, item) => sum + (item.totalWeight || 0), 0);
  const materials = [...new Set(items.map(i => i.material))];

  return {
    projectName,
    revision: 'A',
    date: new Date().toISOString().split('T')[0],
    items,
    totalWeight,
    summary: {
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      uniqueParts: items.length,
      materials,
    },
  };
}
