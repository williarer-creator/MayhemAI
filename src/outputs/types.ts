/**
 * Manufacturing Output Types
 *
 * Types for generating production-ready manufacturing files.
 */

import type { Point3D } from '../knowledge/types';

// ============================================================================
// G-CODE TYPES
// ============================================================================

export interface GCodeConfig {
  /** Machine type */
  machineType: 'mill-3axis' | 'mill-5axis' | 'lathe' | 'router' | 'plasma';

  /** Controller type for post-processing */
  controller: 'fanuc' | 'haas' | 'mazak' | 'siemens' | 'grbl' | 'linuxcnc' | 'mach3';

  /** Work coordinate system */
  wcs: 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';

  /** Unit system */
  units: 'mm' | 'inch';

  /** Safety height for rapid moves */
  safetyHeight: number;

  /** Rapid feed rate */
  rapidFeed: number;

  /** Default cutting feed rate */
  cuttingFeed: number;

  /** Default spindle speed */
  spindleSpeed: number;

  /** Coolant option */
  coolant: 'off' | 'flood' | 'mist' | 'through-tool';

  /** Tool change type */
  toolChange: 'manual' | 'atc' | 'none';

  /** Program number */
  programNumber?: number;

  /** Program comment/description */
  programComment?: string;
}

export interface GCodeOperation {
  type: 'rapid' | 'linear' | 'arc-cw' | 'arc-ccw' | 'dwell' | 'tool-change' | 'spindle' | 'coolant' | 'comment';
  params: Record<string, number | string | boolean>;
}

export interface GCodeProgram {
  config: GCodeConfig;
  header: string[];
  operations: GCodeOperation[];
  footer: string[];
  toolList: GCodeTool[];
  estimatedTime: number; // seconds
  warnings: string[];
}

export interface GCodeTool {
  number: number;
  type: 'endmill' | 'drill' | 'tap' | 'reamer' | 'boring-bar' | 'turning' | 'grooving' | 'threading';
  diameter: number;
  length: number;
  flutes?: number;
  material: 'hss' | 'carbide' | 'ceramic' | 'diamond';
  description: string;
}

export interface ToolpathSegment {
  type: 'rapid' | 'linear' | 'arc';
  start: Point3D;
  end: Point3D;
  feedRate?: number;
  center?: Point3D; // For arcs
  clockwise?: boolean; // For arcs
}

// ============================================================================
// DXF/CAD OUTPUT TYPES
// ============================================================================

export interface DXFConfig {
  /** DXF version */
  version: 'R12' | 'R14' | '2000' | '2004' | '2007' | '2010';

  /** Unit system */
  units: 'mm' | 'inch';

  /** Layer configuration */
  layers: DXFLayer[];

  /** Include dimensions */
  includeDimensions: boolean;

  /** Dimension style */
  dimensionStyle?: string;
}

export interface DXFLayer {
  name: string;
  color: number; // AutoCAD color index (1-255)
  lineType: 'continuous' | 'dashed' | 'dotted' | 'center' | 'hidden';
  lineWeight: number; // mm
}

export interface DXFEntity {
  type: 'line' | 'circle' | 'arc' | 'polyline' | 'text' | 'dimension' | 'hatch';
  layer: string;
  properties: Record<string, unknown>;
}

export interface DXFDocument {
  config: DXFConfig;
  entities: DXFEntity[];
  bounds: { min: Point3D; max: Point3D };
  partCount: number;
}

export interface NestingResult {
  sheets: NestedSheet[];
  efficiency: number; // 0-100%
  totalSheetArea: number;
  usedArea: number;
  wasteArea: number;
}

export interface NestedSheet {
  sheetIndex: number;
  sheetSize: { width: number; height: number };
  parts: NestedPart[];
  efficiency: number;
}

export interface NestedPart {
  partId: string;
  position: { x: number; y: number };
  rotation: number; // degrees
  bounds: { width: number; height: number };
}

// ============================================================================
// DRAWING TYPES
// ============================================================================

export interface DrawingConfig {
  /** Paper size */
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'letter' | 'legal' | 'ansi-a' | 'ansi-b' | 'ansi-c' | 'ansi-d';

  /** Orientation */
  orientation: 'portrait' | 'landscape';

  /** Scale */
  scale: number;

  /** Title block template */
  titleBlock?: TitleBlockConfig;

  /** Include BOM */
  includeBOM: boolean;

  /** Dimension style */
  dimensionStyle: 'iso' | 'asme' | 'jis';

  /** Third angle or first angle projection */
  projection: 'third-angle' | 'first-angle';
}

export interface TitleBlockConfig {
  companyName: string;
  projectName: string;
  drawingTitle: string;
  drawingNumber: string;
  revision: string;
  drawnBy: string;
  checkedBy?: string;
  approvedBy?: string;
  date: string;
  material?: string;
  finish?: string;
  tolerances?: string;
}

export interface DrawingView {
  type: 'front' | 'top' | 'right' | 'left' | 'back' | 'bottom' | 'isometric' | 'section' | 'detail';
  position: { x: number; y: number };
  scale: number;
  label?: string;
  sectionLine?: { start: Point3D; end: Point3D };
  detailCircle?: { center: Point3D; radius: number };
}

export interface Dimension {
  type: 'linear' | 'angular' | 'radial' | 'diameter' | 'ordinate';
  points: Point3D[];
  value: number;
  tolerance?: { upper: number; lower: number };
  prefix?: string;
  suffix?: string;
  position: { x: number; y: number };
}

export interface DrawingDocument {
  config: DrawingConfig;
  views: DrawingView[];
  dimensions: Dimension[];
  notes: DrawingNote[];
  bomItems?: BOMItem[];
  pageCount: number;
}

export interface DrawingNote {
  text: string;
  position: { x: number; y: number };
  style: 'general' | 'specification' | 'warning';
}

// ============================================================================
// BOM TYPES
// ============================================================================

export interface BOMConfig {
  /** Format for output */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';

  /** Columns to include */
  columns: BOMColumn[];

  /** Group by material */
  groupByMaterial: boolean;

  /** Include sub-assemblies */
  includeSubAssemblies: boolean;

  /** Include hardware */
  includeHardware: boolean;

  /** Sort order */
  sortBy: 'item-number' | 'part-name' | 'quantity' | 'material';
}

export type BOMColumn =
  | 'item-number'
  | 'part-number'
  | 'description'
  | 'quantity'
  | 'material'
  | 'dimensions'
  | 'weight'
  | 'unit-cost'
  | 'total-cost'
  | 'supplier'
  | 'lead-time'
  | 'notes';

export interface BOMItem {
  itemNumber: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: 'ea' | 'ft' | 'm' | 'kg' | 'lb';
  material?: string;
  dimensions?: string;
  weight?: number;
  unitCost?: number;
  totalCost?: number;
  supplier?: string;
  leadTime?: string;
  notes?: string;
  children?: BOMItem[];
}

export interface BOMDocument {
  config: BOMConfig;
  items: BOMItem[];
  totals: {
    partCount: number;
    uniqueParts: number;
    totalWeight: number;
    totalCost?: number;
  };
  generatedDate: string;
  projectName?: string;
}

// ============================================================================
// CUT LIST TYPES
// ============================================================================

export interface CutListConfig {
  /** Material type */
  materialType: 'steel' | 'aluminum' | 'wood' | 'plastic';

  /** Stock material lengths */
  stockLengths: number[];

  /** Kerf width (blade/saw thickness) */
  kerfWidth: number;

  /** Minimum remnant to keep */
  minRemnant: number;

  /** Optimize for waste reduction */
  optimizeWaste: boolean;
}

export interface CutListItem {
  itemNumber: number;
  description: string;
  profile: string;
  material: string;
  quantity: number;
  cutLength: number;
  stockLength?: number;
  operations: CutOperation[];
  weight: number;
  notes?: string;
}

export interface CutOperation {
  type: 'cut' | 'drill' | 'notch' | 'cope' | 'miter' | 'bevel' | 'punch';
  position: number; // mm from start
  parameters: Record<string, number | string>;
  description?: string;
}

export interface CutListDocument {
  config: CutListConfig;
  items: CutListItem[];
  optimization?: {
    stockUsage: StockUsage[];
    wastePercentage: number;
    totalStock: number;
    totalWaste: number;
  };
  totals: {
    totalItems: number;
    totalLength: number;
    totalWeight: number;
  };
}

export interface StockUsage {
  stockLength: number;
  cuts: { length: number; quantity: number }[];
  remnant: number;
  efficiency: number;
}

// ============================================================================
// ASSEMBLY INSTRUCTIONS
// ============================================================================

export interface AssemblyInstructionConfig {
  /** Include images */
  includeImages: boolean;

  /** Detail level */
  detailLevel: 'basic' | 'detailed' | 'expert';

  /** Include safety warnings */
  includeSafetyWarnings: boolean;

  /** Include tool list */
  includeToolList: boolean;
}

export interface AssemblyInstruction {
  stepNumber: number;
  title: string;
  description: string;
  partsUsed: { partNumber: string; quantity: number }[];
  hardwareUsed: { item: string; size: string; quantity: number }[];
  tools?: string[];
  warnings?: string[];
  notes?: string[];
  imageRef?: string;
  estimatedTime?: number; // minutes
}

export interface AssemblyInstructionDocument {
  config: AssemblyInstructionConfig;
  projectName: string;
  assemblyName: string;
  steps: AssemblyInstruction[];
  totalEstimatedTime: number;
  requiredTools: string[];
  safetyPrecautions: string[];
}
