/**
 * File Inspector Types
 *
 * Defines input file formats and inspection results.
 */

import type { Point3D, Vector3D, BoundingBox3D } from '../../knowledge/types';

// =============================================================================
// SUPPORTED FILE TYPES
// =============================================================================

export type InputFileType =
  // 3D Scan formats
  | 'pointcloud-ply'
  | 'pointcloud-pcd'
  | 'pointcloud-xyz'
  | 'pointcloud-las'
  | 'pointcloud-e57'

  // Mesh formats
  | 'mesh-stl'
  | 'mesh-obj'
  | 'mesh-fbx'
  | 'mesh-gltf'

  // CAD formats
  | 'cad-step'
  | 'cad-iges'
  | 'cad-dxf'
  | 'cad-dwg'

  // Image formats
  | 'image-jpg'
  | 'image-png'
  | 'image-tiff'

  // Measurement/data formats
  | 'measurement-csv'
  | 'measurement-json'
  | 'measurement-xml'

  // Unknown
  | 'unknown';

export interface InputFile {
  name: string;
  path: string;
  size: number;           // bytes
  type: InputFileType;
  mimeType?: string;
  lastModified?: Date;
}

// =============================================================================
// INSPECTION RESULTS
// =============================================================================

export interface FileInspectionResult {
  file: InputFile;
  valid: boolean;
  errors: string[];
  warnings: string[];

  // Type-specific data
  data: PointCloudData | MeshData | CADData | ImageData | MeasurementData | null;

  // Common extracted information
  boundingBox?: BoundingBox3D;
  units?: 'mm' | 'cm' | 'm' | 'in' | 'ft' | 'unknown';
  coordinateSystem?: 'local' | 'world' | 'unknown';
}

// =============================================================================
// POINT CLOUD DATA
// =============================================================================

export interface PointCloudData {
  type: 'pointcloud';
  numPoints: number;
  hasColors: boolean;
  hasNormals: boolean;
  hasIntensity: boolean;

  // Statistics
  density?: number;        // points per m²
  boundingBox: BoundingBox3D;

  // Detected features
  detectedPlanes: DetectedPlane[];
  detectedObjects: DetectedObject[];

  // Raw access (for processing)
  getPoints?: () => Float32Array;
  getColors?: () => Uint8Array;
  getNormals?: () => Float32Array;
}

export interface DetectedPlane {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'surface' | 'unknown';
  normal: Vector3D;
  center: Point3D;
  area: number;            // m²
  confidence: number;      // 0-1
  inlierCount: number;     // number of points on plane
  equation: { a: number; b: number; c: number; d: number }; // ax + by + cz + d = 0
}

export interface DetectedObject {
  id: string;
  type: string;            // 'beam', 'pipe', 'equipment', 'unknown'
  boundingBox: BoundingBox3D;
  pointCount: number;
  confidence: number;
}

// =============================================================================
// MESH DATA
// =============================================================================

export interface MeshData {
  type: 'mesh';
  numVertices: number;
  numTriangles: number;
  hasNormals: boolean;
  hasUVs: boolean;
  hasColors: boolean;

  boundingBox: BoundingBox3D;
  surfaceArea: number;     // mm²
  volume?: number;         // mm³ (if watertight)
  isWatertight: boolean;

  // Topology info
  numShells: number;       // separate bodies
  numEdges: number;
  hasNonManifold: boolean;
}

// =============================================================================
// CAD DATA
// =============================================================================

export interface CADData {
  type: 'cad';
  format: 'step' | 'iges' | 'dxf' | 'dwg';

  // For 3D CAD (STEP, IGES)
  numBodies?: number;
  numFaces?: number;
  numEdges?: number;
  boundingBox?: BoundingBox3D;

  // For 2D CAD (DXF, DWG)
  is2D?: boolean;
  layers?: CADLayer[];
  blocks?: CADBlock[];

  // Extracted geometry
  extractedFeatures?: CADFeature[];
}

export interface CADLayer {
  name: string;
  color?: string;
  visible: boolean;
  entityCount: number;
  entityTypes: string[];
}

export interface CADBlock {
  name: string;
  insertionPoint: Point3D;
  scale: Vector3D;
  rotation: number;
}

export interface CADFeature {
  type: 'line' | 'arc' | 'circle' | 'polyline' | 'dimension' | 'text';
  layer: string;
  data: Record<string, unknown>;
}

// =============================================================================
// IMAGE DATA
// =============================================================================

export interface ImageData {
  type: 'image';
  width: number;
  height: number;
  channels: number;        // 1=grayscale, 3=RGB, 4=RGBA
  bitDepth: number;        // 8 or 16

  // For technical drawings
  isTechnicalDrawing: boolean;
  detectedScale?: string;  // e.g., "1:10"
  detectedUnits?: string;

  // For photos
  hasExif: boolean;
  cameraInfo?: {
    make?: string;
    model?: string;
    focalLength?: number;
  };

  // Detected elements
  detectedLines?: ImageLine[];
  detectedDimensions?: ImageDimension[];
  detectedText?: ImageText[];
}

export interface ImageLine {
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number;
  type: 'solid' | 'dashed' | 'centerline';
}

export interface ImageDimension {
  value: number;
  unit: string;
  position: { x: number; y: number };
  orientation: 'horizontal' | 'vertical' | 'diagonal';
  confidence: number;
}

export interface ImageText {
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  confidence: number;
}

// =============================================================================
// MEASUREMENT DATA
// =============================================================================

export interface MeasurementData {
  type: 'measurement';
  format: 'csv' | 'json' | 'xml';

  // Points and measurements
  points: NamedPoint[];
  distances: NamedDistance[];
  angles?: NamedAngle[];

  // Metadata
  measuredBy?: string;
  measurementDate?: Date;
  instrument?: string;
  accuracy?: number;       // mm
}

export interface NamedPoint {
  id: string;
  name?: string;
  position: Point3D;
  description?: string;
}

export interface NamedDistance {
  id: string;
  from: string;            // point ID
  to: string;              // point ID
  value: number;           // mm
  description?: string;
}

export interface NamedAngle {
  id: string;
  vertex: string;          // point ID
  from: string;            // point ID
  to: string;              // point ID
  value: number;           // degrees
}
