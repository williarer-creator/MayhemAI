/**
 * Input Processing Module
 *
 * Processes real-world inputs for design automation:
 * - Point clouds from LiDAR/photogrammetry
 * - Images for feature extraction
 * - Environment modeling and constraint extraction
 */

// Export types
export type {
  // Point cloud types
  PointCloudPoint,
  PointClassification,
  PointCloud,
  PointCloudSource,
  PointCloudProcessingConfig,

  // Detected geometry types
  DetectedSurface,
  PlaneEquation,
  DetectedObstacle,
  DetectedOpening,
  DetectedEdge,

  // Image types
  ImageInput,
  CameraInfo,
  ImageAnalysisConfig,
  ImageAnalysisResult,
  DetectedImageRegion,
  DetectedImageEdge,
  VanishingPoint,

  // Environment model types
  EnvironmentModel,
  EnvironmentSource,
  AttachmentPoint,
  ClearanceZone,

  // Scan-to-CAD types
  ScanToCADOptions,
  ScanToCADResult,

  // Constraint extraction types
  ExtractedEnvironmentConstraint,
  ConnectionOpportunity,
} from './types';

// Export point cloud processor
export {
  PointCloudProcessor,
  createPointCloudProcessor,
  defaultProcessingConfig,
} from './point-cloud';

// Export image analyzer
export {
  ImageAnalyzer,
  createImageAnalyzer,
  defaultImageAnalysisConfig,
} from './image-analyzer';

// Export environment modeler
export {
  EnvironmentModeler,
  createEnvironmentModeler,
} from './environment-modeler';

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { createPointCloudProcessor } from './point-cloud';
import { createImageAnalyzer } from './image-analyzer';
import { createEnvironmentModeler } from './environment-modeler';
import type {
  PointCloud,
  ImageInput,
  EnvironmentModel,
  ScanToCADResult,
  ConnectionOpportunity,
} from './types';

/**
 * Quick point cloud processing
 */
export function processPointCloud(
  points: Array<{ x: number; y: number; z: number }>,
  options?: {
    voxelSize?: number;
    removeOutliers?: boolean;
  }
): {
  surfaces: number;
  obstacles: number;
  edges: number;
  bounds: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
} {
  const processor = createPointCloudProcessor(options);
  const cloud = processor.loadFromArray(points);
  const result = processor.process(cloud);

  return {
    surfaces: result.surfaces.length,
    obstacles: result.obstacles.length,
    edges: result.edges.length,
    bounds: result.processedCloud.bounds,
  };
}

/**
 * Quick image analysis
 */
export function analyzeImage(
  imageData: string,
  width: number,
  height: number
): {
  floors: number;
  walls: number;
  obstacles: number;
  openings: number;
  confidence: number;
} {
  const analyzer = createImageAnalyzer();
  const image: ImageInput = {
    id: `img-${Date.now()}`,
    data: imageData,
    format: 'jpeg',
    width,
    height,
    metadata: {},
  };

  const result = analyzer.analyze(image);

  return {
    floors: result.floors.length,
    walls: result.walls.length,
    obstacles: result.obstacles.length,
    openings: result.openings.length,
    confidence: result.confidence,
  };
}

/**
 * Quick environment modeling
 */
export async function buildEnvironmentModel(options: {
  pointClouds?: PointCloud[];
  images?: ImageInput[];
}): Promise<EnvironmentModel> {
  const modeler = createEnvironmentModeler();
  return modeler.buildModel(options);
}

/**
 * Quick scan-to-CAD processing
 */
export async function scanToCAD(options: {
  pointClouds?: PointCloud[];
  images?: ImageInput[];
}): Promise<ScanToCADResult> {
  const modeler = createEnvironmentModeler();
  return modeler.scanToCAD(options);
}

/**
 * Find connection opportunities in an environment
 */
export function findConnections(
  model: EnvironmentModel,
  options?: {
    maxDistance?: number;
  }
): ConnectionOpportunity[] {
  const modeler = createEnvironmentModeler();
  return modeler.findConnectionOpportunities(model, options);
}

/**
 * Create a simple point cloud from coordinates
 */
export function createPointCloud(
  points: Array<{ x: number; y: number; z: number; r?: number; g?: number; b?: number }>,
  sourceType: 'lidar' | 'photogrammetry' | 'depth-camera' = 'photogrammetry'
): PointCloud {
  const processor = createPointCloudProcessor();
  return processor.loadFromArray(points, { type: sourceType });
}

/**
 * Create an image input from base64 data
 */
export function createImageInput(
  data: string,
  width: number,
  height: number,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): ImageInput {
  return {
    id: `img-${Date.now()}`,
    data,
    format,
    width,
    height,
    metadata: {},
  };
}
