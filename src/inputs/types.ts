/**
 * Input Processing Types
 *
 * Types for processing real-world inputs:
 * - Point clouds from LiDAR/photogrammetry
 * - Images for feature extraction
 * - Environment scanning and modeling
 */

import type { Point3D, Vector3D } from '../knowledge/types';

// ============================================================================
// POINT CLOUD TYPES
// ============================================================================

/**
 * A 3D point with optional attributes
 */
export interface PointCloudPoint {
  /** Position in 3D space */
  position: Point3D;

  /** RGB color (0-255 per channel) */
  color?: { r: number; g: number; b: number };

  /** Surface normal at this point */
  normal?: Vector3D;

  /** Intensity (e.g., from LiDAR return) */
  intensity?: number;

  /** Classification (ground, building, vegetation, etc.) */
  classification?: PointClassification;

  /** Confidence/quality score (0-1) */
  confidence?: number;
}

/**
 * Point classification categories
 */
export type PointClassification =
  | 'unclassified'
  | 'ground'
  | 'low-vegetation'
  | 'medium-vegetation'
  | 'high-vegetation'
  | 'building'
  | 'low-point'
  | 'water'
  | 'rail'
  | 'road'
  | 'bridge'
  | 'wire'
  | 'structure'
  | 'equipment';

/**
 * A point cloud dataset
 */
export interface PointCloud {
  /** Unique identifier */
  id: string;

  /** Source information */
  source: PointCloudSource;

  /** Array of points */
  points: PointCloudPoint[];

  /** Bounding box */
  bounds: { min: Point3D; max: Point3D };

  /** Point density (points per cubic meter) */
  density: number;

  /** Coordinate reference system (if geo-referenced) */
  crs?: string;

  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Point cloud source information
 */
export interface PointCloudSource {
  type: 'lidar' | 'photogrammetry' | 'structured-light' | 'depth-camera' | 'synthetic';
  scanner?: string;
  accuracy?: number; // mm
  timestamp?: string;
  location?: { lat: number; lon: number; alt: number };
}

/**
 * Point cloud processing configuration
 */
export interface PointCloudProcessingConfig {
  /** Downsampling voxel size (mm) */
  voxelSize?: number;

  /** Remove statistical outliers */
  removeOutliers?: boolean;

  /** Estimate normals */
  estimateNormals?: boolean;

  /** Normal estimation radius (mm) */
  normalRadius?: number;

  /** Ground detection */
  detectGround?: boolean;

  /** Surface reconstruction method */
  surfaceReconstruction?: 'poisson' | 'ball-pivoting' | 'alpha-shape' | 'none';
}

// ============================================================================
// DETECTED GEOMETRY TYPES
// ============================================================================

/**
 * A detected surface from point cloud
 */
export interface DetectedSurface {
  id: string;
  type: 'floor' | 'wall' | 'ceiling' | 'ramp' | 'stairs' | 'irregular';
  plane?: PlaneEquation;
  normal: Vector3D;
  bounds: { min: Point3D; max: Point3D };
  area: number; // mm²
  pointIndices: number[];
  confidence: number;
  material?: string;
}

/**
 * Plane equation: ax + by + cz + d = 0
 */
export interface PlaneEquation {
  a: number;
  b: number;
  c: number;
  d: number;
}

/**
 * A detected obstacle
 */
export interface DetectedObstacle {
  id: string;
  type: 'column' | 'pipe' | 'duct' | 'equipment' | 'beam' | 'unknown';
  bounds: { min: Point3D; max: Point3D };
  centroid: Point3D;
  dimensions: { width: number; depth: number; height: number };
  pointIndices: number[];
  confidence: number;
}

/**
 * A detected opening (door, window, etc.)
 */
export interface DetectedOpening {
  id: string;
  type: 'door' | 'window' | 'hatch' | 'opening';
  position: Point3D;
  dimensions: { width: number; height: number };
  normal: Vector3D;
  confidence: number;
}

/**
 * A detected edge (where surfaces meet)
 */
export interface DetectedEdge {
  id: string;
  type: 'wall-floor' | 'wall-wall' | 'wall-ceiling' | 'curb' | 'step';
  start: Point3D;
  end: Point3D;
  length: number;
  confidence: number;
}

// ============================================================================
// IMAGE ANALYSIS TYPES
// ============================================================================

/**
 * Image input for analysis
 */
export interface ImageInput {
  /** Unique identifier */
  id: string;

  /** Image data (base64 or URL) */
  data: string;

  /** Image format */
  format: 'jpeg' | 'png' | 'webp' | 'tiff';

  /** Image dimensions */
  width: number;
  height: number;

  /** Camera information */
  camera?: CameraInfo;

  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Camera information for perspective calculations
 */
export interface CameraInfo {
  /** Focal length (mm) */
  focalLength?: number;

  /** Sensor size (mm) */
  sensorSize?: { width: number; height: number };

  /** Field of view (degrees) */
  fov?: { horizontal: number; vertical: number };

  /** Camera position if known */
  position?: Point3D;

  /** Camera orientation */
  orientation?: { pitch: number; yaw: number; roll: number };
}

/**
 * Image analysis configuration
 */
export interface ImageAnalysisConfig {
  /** Detect floor/ground plane */
  detectFloor?: boolean;

  /** Detect walls */
  detectWalls?: boolean;

  /** Detect obstacles */
  detectObstacles?: boolean;

  /** Detect openings (doors, windows) */
  detectOpenings?: boolean;

  /** Detect edges and lines */
  detectEdges?: boolean;

  /** Detect vanishing points for perspective */
  detectVanishingPoints?: boolean;

  /** Confidence threshold (0-1) */
  confidenceThreshold?: number;
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult {
  /** Source image ID */
  imageId: string;

  /** Detected floor regions */
  floors: DetectedImageRegion[];

  /** Detected wall regions */
  walls: DetectedImageRegion[];

  /** Detected obstacles */
  obstacles: DetectedImageRegion[];

  /** Detected openings */
  openings: DetectedImageRegion[];

  /** Detected edges */
  edges: DetectedImageEdge[];

  /** Vanishing points */
  vanishingPoints: VanishingPoint[];

  /** Overall confidence */
  confidence: number;
}

/**
 * A region detected in an image
 */
export interface DetectedImageRegion {
  type: string;
  polygon: Array<{ x: number; y: number }>;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  properties?: Record<string, unknown>;
}

/**
 * An edge detected in an image
 */
export interface DetectedImageEdge {
  start: { x: number; y: number };
  end: { x: number; y: number };
  type: string;
  confidence: number;
}

/**
 * A vanishing point for perspective reconstruction
 */
export interface VanishingPoint {
  position: { x: number; y: number };
  direction: 'horizontal' | 'vertical' | 'depth';
  confidence: number;
  supportingLines: number;
}

// ============================================================================
// ENVIRONMENT MODEL TYPES
// ============================================================================

/**
 * A complete environment model
 */
export interface EnvironmentModel {
  /** Unique identifier */
  id: string;

  /** Bounding box */
  bounds: { min: Point3D; max: Point3D };

  /** Detected surfaces */
  surfaces: DetectedSurface[];

  /** Detected obstacles */
  obstacles: DetectedObstacle[];

  /** Detected openings */
  openings: DetectedOpening[];

  /** Detected edges */
  edges: DetectedEdge[];

  /** Potential attachment points */
  attachmentPoints: AttachmentPoint[];

  /** Clearance zones */
  clearanceZones: ClearanceZone[];

  /** Source data references */
  sources: EnvironmentSource[];

  /** Processing metadata */
  metadata: {
    createdAt: string;
    processedPoints: number;
    processedImages: number;
    processingTimeMs: number;
    confidence: number;
  };
}

/**
 * Source data for environment model
 */
export interface EnvironmentSource {
  type: 'point-cloud' | 'image' | 'manual';
  id: string;
  contribution: number; // 0-1
}

/**
 * A potential attachment point
 */
export interface AttachmentPoint {
  id: string;
  position: Point3D;
  normal: Vector3D;
  surfaceId: string;
  type: 'floor' | 'wall' | 'ceiling' | 'beam' | 'column';
  loadCapacity?: number; // N
  attachmentMethods: Array<'anchor-bolt' | 'weld' | 'clamp' | 'embed'>;
  clearance: { front: number; sides: number };
  confidence: number;
}

/**
 * A clearance zone that must remain clear
 */
export interface ClearanceZone {
  id: string;
  type: 'egress' | 'access' | 'equipment' | 'safety' | 'maintenance';
  bounds: { min: Point3D; max: Point3D };
  priority: 'required' | 'preferred' | 'optional';
  description: string;
}

// ============================================================================
// SCAN-TO-CAD TYPES
// ============================================================================

/**
 * Scan-to-CAD processing options
 */
export interface ScanToCADOptions {
  /** Source point cloud(s) */
  pointClouds?: PointCloud[];

  /** Source image(s) */
  images?: ImageInput[];

  /** Processing configuration */
  processing?: {
    /** Maximum feature size to detect (mm) */
    maxFeatureSize?: number;

    /** Minimum feature size to detect (mm) */
    minFeatureSize?: number;

    /** Surface simplification tolerance (mm) */
    simplificationTolerance?: number;

    /** Generate mesh from points */
    generateMesh?: boolean;

    /** Mesh resolution */
    meshResolution?: 'low' | 'medium' | 'high';
  };

  /** Output configuration */
  output?: {
    /** Generate CAD geometry */
    generateGeometry?: boolean;

    /** Export format */
    exportFormat?: 'step' | 'iges' | 'stl' | 'obj';
  };
}

/**
 * Result of scan-to-CAD processing
 */
export interface ScanToCADResult {
  /** Generated environment model */
  environment: EnvironmentModel;

  /** Generated geometry (if requested) */
  geometry?: {
    format: string;
    data: string; // Base64 encoded
    fileSize: number;
  };

  /** Processing statistics */
  statistics: {
    inputPoints: number;
    inputImages: number;
    surfacesDetected: number;
    obstaclesDetected: number;
    attachmentPointsFound: number;
    processingTimeMs: number;
    memoryUsedMB: number;
  };

  /** Quality metrics */
  quality: {
    coverage: number; // 0-100%
    averageConfidence: number;
    completeness: number; // 0-100%
    noiseLevel: number; // estimated noise in mm
  };

  /** Warnings and issues */
  issues: Array<{
    type: 'warning' | 'error';
    code: string;
    message: string;
    location?: Point3D;
  }>;
}

// ============================================================================
// CONSTRAINT EXTRACTION TYPES
// ============================================================================

/**
 * Extracted constraint from environment
 */
export interface ExtractedEnvironmentConstraint {
  type: 'attachment' | 'clearance' | 'alignment' | 'dimension' | 'obstacle';
  description: string;
  value: unknown;
  location?: Point3D;
  confidence: number;
  source: 'point-cloud' | 'image' | 'inference';
}

/**
 * Connection opportunity between points
 */
export interface ConnectionOpportunity {
  startPoint: AttachmentPoint;
  endPoint: AttachmentPoint;
  distance: number;
  elevationChange: number;
  clearPath: boolean;
  obstacles: DetectedObstacle[];
  suggestedSolutions: Array<{
    type: string;
    feasibility: number;
    notes: string;
  }>;
}
