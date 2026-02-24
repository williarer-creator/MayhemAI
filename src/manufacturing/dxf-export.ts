/**
 * DXF Export Generator
 *
 * Generates DXF files for laser/plasma cutting, CNC routing, etc.
 * Supports 2D profiles, hole patterns, and text labels.
 */

import type {
  DXFExportOptions,
  DXFEntity,
  DXFLineData,
  DXFArcData,
  DXFCircleData,
  DXFPolylineData,
  DXFTextData,
  DXFOutput,
} from './types';

// =============================================================================
// DXF FILE GENERATION
// =============================================================================

const DXF_HEADER = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
1
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

const DXF_FOOTER = `0
ENDSEC
0
EOF
`;

/**
 * Generate DXF file from entities
 */
export function generateDXF(
  entities: DXFEntity[],
  filename: string,
  options: DXFExportOptions = { units: 'mm', scale: 1, includeLabels: true, includeDimensions: false }
): DXFOutput {
  const scale = options.scale;
  const dxfEntities: string[] = [];

  // Track bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  // Process each entity
  for (const entity of entities) {
    const dxfString = entityToDXF(entity, scale);
    dxfEntities.push(dxfString);

    // Update bounding box
    const bbox = getEntityBounds(entity);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  }

  // Generate layer definitions (for more complex DXF, include in header)
  // For now, we use the default layer "0" in DXF_HEADER
  generateLayerDefinitions(entities);

  // Combine all parts
  const content = DXF_HEADER + dxfEntities.join('') + DXF_FOOTER;

  return {
    filename: filename.endsWith('.dxf') ? filename : `${filename}.dxf`,
    content,
    entities,
    boundingBox: {
      minX: minX === Infinity ? 0 : minX * scale,
      minY: minY === Infinity ? 0 : minY * scale,
      maxX: maxX === -Infinity ? 0 : maxX * scale,
      maxY: maxY === -Infinity ? 0 : maxY * scale,
    },
  };
}

/**
 * Convert entity to DXF string
 */
function entityToDXF(entity: DXFEntity, scale: number): string {
  switch (entity.type) {
    case 'line':
      return lineToDXF(entity.data as DXFLineData, entity.layer, scale, entity.color);
    case 'arc':
      return arcToDXF(entity.data as DXFArcData, entity.layer, scale, entity.color);
    case 'circle':
      return circleToDXF(entity.data as DXFCircleData, entity.layer, scale, entity.color);
    case 'polyline':
      return polylineToDXF(entity.data as DXFPolylineData, entity.layer, scale, entity.color);
    case 'text':
      return textToDXF(entity.data as DXFTextData, entity.layer, scale, entity.color);
    default:
      return '';
  }
}

function lineToDXF(data: DXFLineData, layer: string, scale: number, color?: number): string {
  return `0
LINE
8
${layer}
${color !== undefined ? `62\n${color}\n` : ''}10
${data.x1 * scale}
20
${data.y1 * scale}
30
0.0
11
${data.x2 * scale}
21
${data.y2 * scale}
31
0.0
`;
}

function arcToDXF(data: DXFArcData, layer: string, scale: number, color?: number): string {
  return `0
ARC
8
${layer}
${color !== undefined ? `62\n${color}\n` : ''}10
${data.cx * scale}
20
${data.cy * scale}
30
0.0
40
${data.radius * scale}
50
${data.startAngle}
51
${data.endAngle}
`;
}

function circleToDXF(data: DXFCircleData, layer: string, scale: number, color?: number): string {
  return `0
CIRCLE
8
${layer}
${color !== undefined ? `62\n${color}\n` : ''}10
${data.cx * scale}
20
${data.cy * scale}
30
0.0
40
${data.radius * scale}
`;
}

function polylineToDXF(data: DXFPolylineData, layer: string, scale: number, color?: number): string {
  let dxf = `0
LWPOLYLINE
8
${layer}
${color !== undefined ? `62\n${color}\n` : ''}90
${data.points.length}
70
${data.closed ? 1 : 0}
`;

  for (const point of data.points) {
    dxf += `10
${point.x * scale}
20
${point.y * scale}
`;
  }

  return dxf;
}

function textToDXF(data: DXFTextData, layer: string, scale: number, color?: number): string {
  return `0
TEXT
8
${layer}
${color !== undefined ? `62\n${color}\n` : ''}10
${data.x * scale}
20
${data.y * scale}
30
0.0
40
${data.height * scale}
1
${data.text}
${data.rotation ? `50\n${data.rotation}\n` : ''}`;
}

/**
 * Get entity bounding box
 */
function getEntityBounds(entity: DXFEntity): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (entity.type) {
    case 'line': {
      const line = entity.data as DXFLineData;
      return {
        minX: Math.min(line.x1, line.x2),
        minY: Math.min(line.y1, line.y2),
        maxX: Math.max(line.x1, line.x2),
        maxY: Math.max(line.y1, line.y2),
      };
    }
    case 'circle': {
      const circle = entity.data as DXFCircleData;
      return {
        minX: circle.cx - circle.radius,
        minY: circle.cy - circle.radius,
        maxX: circle.cx + circle.radius,
        maxY: circle.cy + circle.radius,
      };
    }
    case 'arc': {
      const arc = entity.data as DXFArcData;
      return {
        minX: arc.cx - arc.radius,
        minY: arc.cy - arc.radius,
        maxX: arc.cx + arc.radius,
        maxY: arc.cy + arc.radius,
      };
    }
    case 'polyline': {
      const poly = entity.data as DXFPolylineData;
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      for (const p of poly.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { minX, minY, maxX, maxY };
    }
    default:
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

/**
 * Generate layer definitions from entities
 */
function generateLayerDefinitions(entities: DXFEntity[]): string {
  const layers = new Set<string>();
  for (const e of entities) {
    layers.add(e.layer);
  }

  let dxf = '';
  for (const layer of layers) {
    dxf += `0
LAYER
2
${layer}
70
0
62
7
6
CONTINUOUS
`;
  }
  return dxf;
}

// =============================================================================
// SHAPE BUILDERS
// =============================================================================

/**
 * Create a rectangle profile
 */
export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  layer = '0'
): DXFEntity {
  return {
    type: 'polyline',
    layer,
    data: {
      points: [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ],
      closed: true,
    } as DXFPolylineData,
  };
}

/**
 * Create a hole (circle)
 */
export function createHole(
  cx: number,
  cy: number,
  diameter: number,
  layer = 'HOLES'
): DXFEntity {
  return {
    type: 'circle',
    layer,
    data: {
      cx,
      cy,
      radius: diameter / 2,
    } as DXFCircleData,
  };
}

/**
 * Create a bolt hole pattern
 */
export function createBoltPattern(
  cx: number,
  cy: number,
  boltCircleDiameter: number,
  holeDiameter: number,
  numHoles: number,
  startAngle = 0,
  layer = 'HOLES'
): DXFEntity[] {
  const entities: DXFEntity[] = [];
  const radius = boltCircleDiameter / 2;

  for (let i = 0; i < numHoles; i++) {
    const angle = startAngle + (i * 360 / numHoles);
    const radians = angle * Math.PI / 180;
    const hx = cx + radius * Math.cos(radians);
    const hy = cy + radius * Math.sin(radians);

    entities.push(createHole(hx, hy, holeDiameter, layer));
  }

  return entities;
}

/**
 * Create a slot (obround)
 */
export function createSlot(
  cx: number,
  cy: number,
  width: number,
  length: number,
  rotation = 0,
  layer = 'SLOTS'
): DXFEntity[] {
  const entities: DXFEntity[] = [];
  const rad = rotation * Math.PI / 180;
  const halfLength = length / 2;
  const halfWidth = width / 2;

  // Create slot as two arcs and two lines
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // End centers
  const c1x = cx - halfLength * cos;
  const c1y = cy - halfLength * sin;
  const c2x = cx + halfLength * cos;
  const c2y = cy + halfLength * sin;

  // Arcs
  entities.push({
    type: 'arc',
    layer,
    data: {
      cx: c1x,
      cy: c1y,
      radius: halfWidth,
      startAngle: rotation + 90,
      endAngle: rotation + 270,
    } as DXFArcData,
  });

  entities.push({
    type: 'arc',
    layer,
    data: {
      cx: c2x,
      cy: c2y,
      radius: halfWidth,
      startAngle: rotation - 90,
      endAngle: rotation + 90,
    } as DXFArcData,
  });

  // Lines connecting arcs
  const perpCos = Math.cos(rad + Math.PI / 2);
  const perpSin = Math.sin(rad + Math.PI / 2);

  entities.push({
    type: 'line',
    layer,
    data: {
      x1: c1x + halfWidth * perpCos,
      y1: c1y + halfWidth * perpSin,
      x2: c2x + halfWidth * perpCos,
      y2: c2y + halfWidth * perpSin,
    } as DXFLineData,
  });

  entities.push({
    type: 'line',
    layer,
    data: {
      x1: c1x - halfWidth * perpCos,
      y1: c1y - halfWidth * perpSin,
      x2: c2x - halfWidth * perpCos,
      y2: c2y - halfWidth * perpSin,
    } as DXFLineData,
  });

  return entities;
}

/**
 * Create text label
 */
export function createLabel(
  x: number,
  y: number,
  text: string,
  height = 5,
  layer = 'LABELS'
): DXFEntity {
  return {
    type: 'text',
    layer,
    data: {
      x,
      y,
      text,
      height,
    } as DXFTextData,
  };
}

// =============================================================================
// PLATE PROFILE GENERATORS
// =============================================================================

export interface BasePlateProfile {
  width: number;
  height: number;
  thickness: number;
  centerHoles?: { diameter: number; pattern: 'single' | '4-corner' | 'bolt-circle'; bcd?: number };
  slotHoles?: { width: number; length: number; positions: Array<{ x: number; y: number }> };
  cornerRadius?: number;
}

/**
 * Generate base plate DXF profile
 */
export function generateBasePlateProfile(
  plate: BasePlateProfile,
  options: { includeLabel?: boolean; partNumber?: string } = {}
): DXFEntity[] {
  const entities: DXFEntity[] = [];

  // Outer profile
  if (plate.cornerRadius && plate.cornerRadius > 0) {
    // Rounded corners - more complex polyline
    entities.push(...createRoundedRectangle(
      0, 0, plate.width, plate.height, plate.cornerRadius, 'PROFILE'
    ));
  } else {
    entities.push(createRectangle(0, 0, plate.width, plate.height, 'PROFILE'));
  }

  // Center holes
  if (plate.centerHoles) {
    const cx = plate.width / 2;
    const cy = plate.height / 2;

    switch (plate.centerHoles.pattern) {
      case 'single':
        entities.push(createHole(cx, cy, plate.centerHoles.diameter));
        break;
      case '4-corner': {
        const offset = Math.min(plate.width, plate.height) * 0.3;
        entities.push(createHole(offset, offset, plate.centerHoles.diameter));
        entities.push(createHole(plate.width - offset, offset, plate.centerHoles.diameter));
        entities.push(createHole(offset, plate.height - offset, plate.centerHoles.diameter));
        entities.push(createHole(plate.width - offset, plate.height - offset, plate.centerHoles.diameter));
        break;
      }
      case 'bolt-circle':
        if (plate.centerHoles.bcd) {
          entities.push(...createBoltPattern(cx, cy, plate.centerHoles.bcd, plate.centerHoles.diameter, 4, 45));
        }
        break;
    }
  }

  // Slot holes
  if (plate.slotHoles) {
    for (const pos of plate.slotHoles.positions) {
      entities.push(...createSlot(pos.x, pos.y, plate.slotHoles.width, plate.slotHoles.length));
    }
  }

  // Label
  if (options.includeLabel && options.partNumber) {
    entities.push(createLabel(5, plate.height - 10, options.partNumber, 5));
  }

  return entities;
}

/**
 * Create rounded rectangle as polyline segments
 */
function createRoundedRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  layer = '0'
): DXFEntity[] {
  // For simplicity, create as lines and arcs
  const entities: DXFEntity[] = [];

  // Bottom line
  entities.push({
    type: 'line',
    layer,
    data: { x1: x + radius, y1: y, x2: x + width - radius, y2: y } as DXFLineData,
  });

  // Right line
  entities.push({
    type: 'line',
    layer,
    data: { x1: x + width, y1: y + radius, x2: x + width, y2: y + height - radius } as DXFLineData,
  });

  // Top line
  entities.push({
    type: 'line',
    layer,
    data: { x1: x + width - radius, y1: y + height, x2: x + radius, y2: y + height } as DXFLineData,
  });

  // Left line
  entities.push({
    type: 'line',
    layer,
    data: { x1: x, y1: y + height - radius, x2: x, y2: y + radius } as DXFLineData,
  });

  // Corner arcs
  entities.push({
    type: 'arc',
    layer,
    data: { cx: x + radius, cy: y + radius, radius, startAngle: 180, endAngle: 270 } as DXFArcData,
  });
  entities.push({
    type: 'arc',
    layer,
    data: { cx: x + width - radius, cy: y + radius, radius, startAngle: 270, endAngle: 360 } as DXFArcData,
  });
  entities.push({
    type: 'arc',
    layer,
    data: { cx: x + width - radius, cy: y + height - radius, radius, startAngle: 0, endAngle: 90 } as DXFArcData,
  });
  entities.push({
    type: 'arc',
    layer,
    data: { cx: x + radius, cy: y + height - radius, radius, startAngle: 90, endAngle: 180 } as DXFArcData,
  });

  return entities;
}
