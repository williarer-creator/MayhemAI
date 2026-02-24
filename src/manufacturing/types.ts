/**
 * Manufacturing Output Types
 *
 * Types for manufacturing outputs: cut lists, DXF, G-code, drawings.
 */

// =============================================================================
// CUT LIST TYPES
// =============================================================================

export interface CutListItem {
  id: string;
  partName: string;
  material: string;
  profile: string;            // e.g., "C150x19", "25mm round bar"
  quantity: number;
  length: number;             // mm
  width?: number;             // mm (for plates)
  thickness?: number;         // mm (for plates)
  weight: number;             // kg (per piece)
  totalWeight: number;        // kg (quantity * weight)
  operations?: string[];      // e.g., ["drill 4x12mm", "chamfer ends"]
  notes?: string;
}

export interface CutList {
  projectName: string;
  elementType: string;        // e.g., "Stair", "Platform"
  generatedAt: string;        // ISO timestamp
  totalItems: number;
  totalWeight: number;        // kg
  items: CutListItem[];

  // Summary by material
  materialSummary: MaterialSummary[];

  // Summary by profile
  profileSummary: ProfileSummary[];
}

export interface MaterialSummary {
  material: string;
  totalWeight: number;        // kg
  itemCount: number;
}

export interface ProfileSummary {
  profile: string;
  totalLength: number;        // mm
  quantity: number;
  nestedLength?: number;      // Optimized length with nesting
}

// =============================================================================
// DXF EXPORT TYPES
// =============================================================================

export interface DXFExportOptions {
  units: 'mm' | 'inch';
  scale: number;
  includeLabels: boolean;
  includeDimensions: boolean;
  layerPrefix?: string;
}

export interface DXFEntity {
  type: 'line' | 'arc' | 'circle' | 'polyline' | 'text' | 'dimension';
  layer: string;
  color?: number;             // DXF color code (0-255)
  data: unknown;              // Type-specific data
}

export interface DXFLineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DXFArcData {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;         // degrees
  endAngle: number;
}

export interface DXFCircleData {
  cx: number;
  cy: number;
  radius: number;
}

export interface DXFPolylineData {
  points: Array<{ x: number; y: number }>;
  closed: boolean;
}

export interface DXFTextData {
  x: number;
  y: number;
  text: string;
  height: number;
  rotation?: number;          // degrees
}

export interface DXFOutput {
  filename: string;
  content: string;            // DXF file content
  entities: DXFEntity[];
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

// =============================================================================
// G-CODE TYPES
// =============================================================================

export interface GCodeOptions {
  machineType: 'mill' | 'lathe' | 'plasma' | 'laser' | 'router';
  units: 'mm' | 'inch';
  feedRate: number;           // mm/min or in/min
  rapidRate: number;          // mm/min
  spindleSpeed?: number;      // RPM (for mill/lathe)
  toolNumber?: number;
  safeZ: number;              // Safe retract height
  cutDepth?: number;          // Depth per pass
  tabWidth?: number;          // Holding tabs (for cutouts)
  tabHeight?: number;
}

export interface GCodeOperation {
  type: 'rapid' | 'linear' | 'arc_cw' | 'arc_ccw' | 'drill' | 'tool_change' | 'spindle' | 'comment';
  params: Record<string, number | string>;
  comment?: string;
}

export interface GCodeOutput {
  filename: string;
  content: string;            // G-code file content
  operations: GCodeOperation[];
  estimatedTime: number;      // minutes
  toolsRequired: number[];    // Tool numbers
  summary: {
    totalMoves: number;
    rapidMoves: number;
    cuttingMoves: number;
    toolChanges: number;
  };
}

// =============================================================================
// DRAWING TYPES
// =============================================================================

export interface DrawingOptions {
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
  orientation: 'portrait' | 'landscape';
  scale: string;              // e.g., "1:10", "1:20"
  includeViews: DrawingView[];
  includeBOM: boolean;
  includeNotes: boolean;
  titleBlock: TitleBlock;
}

export type DrawingView = 'front' | 'right' | 'top' | 'isometric' | 'section' | 'detail';

export interface TitleBlock {
  projectName: string;
  drawingTitle: string;
  drawingNumber: string;
  revision: string;
  drawnBy: string;
  checkedBy?: string;
  date: string;
  company?: string;
}

export interface DrawingDimension {
  type: 'linear' | 'angular' | 'radial' | 'diameter' | 'ordinate';
  value: number;
  unit: string;
  position: { x: number; y: number };
  tolerance?: string;
}

export interface DrawingNote {
  text: string;
  position: { x: number; y: number };
  balloonNumber?: number;
}

export interface DrawingOutput {
  filename: string;
  content: string;            // SVG or PDF content
  format: 'svg' | 'pdf' | 'dxf';
  pages: number;
  views: string[];
  dimensions: DrawingDimension[];
  notes: DrawingNote[];
}

// =============================================================================
// BILL OF MATERIALS
// =============================================================================

export interface BOMItem {
  itemNumber: number;
  partNumber: string;
  description: string;
  material: string;
  quantity: number;
  unit: 'ea' | 'm' | 'kg' | 'set';
  unitWeight?: number;        // kg
  totalWeight?: number;       // kg
  supplier?: string;
  notes?: string;
}

export interface BillOfMaterials {
  projectName: string;
  revision: string;
  date: string;
  items: BOMItem[];
  totalWeight: number;
  summary: {
    totalItems: number;
    uniqueParts: number;
    materials: string[];
  };
}

// =============================================================================
// NESTING TYPES
// =============================================================================

export interface NestingInput {
  parts: NestingPart[];
  stockSheets: StockSheet[];
  kerf: number;               // Cutting kerf width (mm)
  margin: number;             // Sheet edge margin (mm)
}

export interface NestingPart {
  id: string;
  width: number;              // mm
  height: number;             // mm
  quantity: number;
  canRotate: boolean;
}

export interface StockSheet {
  id: string;
  width: number;              // mm
  height: number;             // mm
  thickness: number;          // mm
  material: string;
  quantity: number;
}

export interface NestingResult {
  success: boolean;
  sheets: NestedSheet[];
  totalSheets: number;
  efficiency: number;         // 0-1
  unusedParts: string[];
}

export interface NestedSheet {
  stockId: string;
  placements: PartPlacement[];
  utilization: number;        // 0-1
}

export interface PartPlacement {
  partId: string;
  x: number;
  y: number;
  rotated: boolean;
}
