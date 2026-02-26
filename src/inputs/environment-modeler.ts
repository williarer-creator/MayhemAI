/**
 * Environment Modeler
 *
 * Combines data from point clouds and images to build
 * a complete spatial model of the environment.
 */

import type { Point3D } from '../knowledge/types';
import type {
  PointCloud,
  ImageInput,
  DetectedSurface,
  DetectedObstacle,
  DetectedOpening,
  DetectedEdge,
  EnvironmentModel,
  AttachmentPoint,
  ClearanceZone,
  EnvironmentSource,
  ScanToCADOptions,
  ScanToCADResult,
  ExtractedEnvironmentConstraint,
  ConnectionOpportunity,
} from './types';

import { PointCloudProcessor } from './point-cloud';
import { ImageAnalyzer } from './image-analyzer';

// ============================================================================
// ENVIRONMENT MODELER CLASS
// ============================================================================

export class EnvironmentModeler {
  private pointCloudProcessor: PointCloudProcessor;
  private imageAnalyzer: ImageAnalyzer;

  constructor() {
    this.pointCloudProcessor = new PointCloudProcessor();
    this.imageAnalyzer = new ImageAnalyzer();
  }

  /**
   * Build environment model from multiple sources
   */
  buildModel(options: {
    pointClouds?: PointCloud[];
    images?: ImageInput[];
  }): EnvironmentModel {
    const startTime = Date.now();

    let allSurfaces: DetectedSurface[] = [];
    let allObstacles: DetectedObstacle[] = [];
    let allEdges: DetectedEdge[] = [];
    const allOpenings: DetectedOpening[] = [];
    const sources: EnvironmentSource[] = [];

    // Process point clouds
    if (options.pointClouds) {
      for (const cloud of options.pointClouds) {
        const result = this.pointCloudProcessor.process(cloud);
        allSurfaces.push(...result.surfaces);
        allObstacles.push(...result.obstacles);
        allEdges.push(...result.edges);

        sources.push({
          type: 'point-cloud',
          id: cloud.id,
          contribution: 1 / (options.pointClouds.length + (options.images?.length || 0)),
        });
      }
    }

    // Process images
    if (options.images) {
      for (const image of options.images) {
        const result = this.imageAnalyzer.analyze(image);

        // Convert image detections to 3D (simplified)
        // In reality, would use camera calibration and multi-view geometry
        for (const opening of result.openings) {
          allOpenings.push({
            id: `img-${image.id}-opening`,
            type: opening.type as DetectedOpening['type'],
            position: { x: opening.boundingBox.x, y: 0, z: opening.boundingBox.y },
            dimensions: {
              width: opening.boundingBox.width * 2, // Approximate scale
              height: opening.boundingBox.height * 2,
            },
            normal: { x: 0, y: 1, z: 0 },
            confidence: opening.confidence * 0.8, // Reduce confidence for image-only detection
          });
        }

        sources.push({
          type: 'image',
          id: image.id,
          contribution: 0.5 / (options.images.length + (options.pointClouds?.length || 0)),
        });
      }
    }

    // Merge duplicate detections
    allSurfaces = this.mergeSurfaces(allSurfaces);
    allObstacles = this.mergeObstacles(allObstacles);

    // Calculate overall bounds
    const bounds = this.calculateEnvironmentBounds(allSurfaces, allObstacles);

    // Identify attachment points
    const attachmentPoints = this.identifyAttachmentPoints(allSurfaces);

    // Identify clearance zones
    const clearanceZones = this.identifyClearanceZones(allSurfaces, allObstacles, allOpenings);

    // Calculate metadata
    const processingTimeMs = Date.now() - startTime;
    const processedPoints = options.pointClouds?.reduce((sum, c) => sum + c.points.length, 0) || 0;
    const avgConfidence = this.calculateAverageConfidence(allSurfaces, allObstacles);

    return {
      id: `env-${Date.now()}`,
      bounds,
      surfaces: allSurfaces,
      obstacles: allObstacles,
      openings: allOpenings,
      edges: allEdges,
      attachmentPoints,
      clearanceZones,
      sources,
      metadata: {
        createdAt: new Date().toISOString(),
        processedPoints,
        processedImages: options.images?.length || 0,
        processingTimeMs,
        confidence: avgConfidence,
      },
    };
  }

  /**
   * Calculate environment bounds from all detected features
   */
  private calculateEnvironmentBounds(
    surfaces: DetectedSurface[],
    obstacles: DetectedObstacle[]
  ): { min: Point3D; max: Point3D } {
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const surface of surfaces) {
      min.x = Math.min(min.x, surface.bounds.min.x);
      min.y = Math.min(min.y, surface.bounds.min.y);
      min.z = Math.min(min.z, surface.bounds.min.z);
      max.x = Math.max(max.x, surface.bounds.max.x);
      max.y = Math.max(max.y, surface.bounds.max.y);
      max.z = Math.max(max.z, surface.bounds.max.z);
    }

    for (const obstacle of obstacles) {
      min.x = Math.min(min.x, obstacle.bounds.min.x);
      min.y = Math.min(min.y, obstacle.bounds.min.y);
      min.z = Math.min(min.z, obstacle.bounds.min.z);
      max.x = Math.max(max.x, obstacle.bounds.max.x);
      max.y = Math.max(max.y, obstacle.bounds.max.y);
      max.z = Math.max(max.z, obstacle.bounds.max.z);
    }

    // Handle empty case
    if (min.x === Infinity) {
      return { min: { x: 0, y: 0, z: 0 }, max: { x: 10000, y: 10000, z: 5000 } };
    }

    return { min, max };
  }

  /**
   * Merge similar surfaces from multiple sources
   */
  private mergeSurfaces(surfaces: DetectedSurface[]): DetectedSurface[] {
    const merged: DetectedSurface[] = [];
    const used = new Set<number>();

    for (let i = 0; i < surfaces.length; i++) {
      if (used.has(i)) continue;

      const s1 = surfaces[i];
      let bestMerge: DetectedSurface | null = null;

      // Find overlapping surfaces
      for (let j = i + 1; j < surfaces.length; j++) {
        if (used.has(j)) continue;

        const s2 = surfaces[j];
        if (s1.type !== s2.type) continue;

        // Check for overlap
        const overlap = this.surfacesOverlap(s1, s2);
        if (overlap > 0.5) {
          used.add(j);
          bestMerge = this.mergeTwoSurfaces(s1, s2);
        }
      }

      merged.push(bestMerge || s1);
    }

    return merged;
  }

  /**
   * Check if two surfaces overlap
   */
  private surfacesOverlap(s1: DetectedSurface, s2: DetectedSurface): number {
    const overlapX = Math.max(0,
      Math.min(s1.bounds.max.x, s2.bounds.max.x) -
      Math.max(s1.bounds.min.x, s2.bounds.min.x)
    );
    const overlapY = Math.max(0,
      Math.min(s1.bounds.max.y, s2.bounds.max.y) -
      Math.max(s1.bounds.min.y, s2.bounds.min.y)
    );

    const overlapArea = overlapX * overlapY;
    const s1Area = (s1.bounds.max.x - s1.bounds.min.x) * (s1.bounds.max.y - s1.bounds.min.y);

    return s1Area > 0 ? overlapArea / s1Area : 0;
  }

  /**
   * Merge two overlapping surfaces
   */
  private mergeTwoSurfaces(s1: DetectedSurface, s2: DetectedSurface): DetectedSurface {
    return {
      id: s1.id,
      type: s1.type,
      plane: s1.plane, // Use first surface's plane
      normal: s1.normal,
      bounds: {
        min: {
          x: Math.min(s1.bounds.min.x, s2.bounds.min.x),
          y: Math.min(s1.bounds.min.y, s2.bounds.min.y),
          z: Math.min(s1.bounds.min.z, s2.bounds.min.z),
        },
        max: {
          x: Math.max(s1.bounds.max.x, s2.bounds.max.x),
          y: Math.max(s1.bounds.max.y, s2.bounds.max.y),
          z: Math.max(s1.bounds.max.z, s2.bounds.max.z),
        },
      },
      area: Math.max(s1.area, s2.area),
      pointIndices: [...s1.pointIndices, ...s2.pointIndices],
      confidence: Math.max(s1.confidence, s2.confidence),
    };
  }

  /**
   * Merge similar obstacles
   */
  private mergeObstacles(obstacles: DetectedObstacle[]): DetectedObstacle[] {
    // Simple deduplication based on centroid proximity
    const merged: DetectedObstacle[] = [];
    const used = new Set<number>();

    for (let i = 0; i < obstacles.length; i++) {
      if (used.has(i)) continue;

      const o1 = obstacles[i];

      for (let j = i + 1; j < obstacles.length; j++) {
        if (used.has(j)) continue;

        const o2 = obstacles[j];
        const dist = Math.sqrt(
          Math.pow(o2.centroid.x - o1.centroid.x, 2) +
          Math.pow(o2.centroid.y - o1.centroid.y, 2) +
          Math.pow(o2.centroid.z - o1.centroid.z, 2)
        );

        if (dist < 500) { // Within 500mm = same obstacle
          used.add(j);
        }
      }

      merged.push(o1);
    }

    return merged;
  }

  /**
   * Identify potential attachment points on surfaces
   */
  private identifyAttachmentPoints(surfaces: DetectedSurface[]): AttachmentPoint[] {
    const points: AttachmentPoint[] = [];
    let pointId = 0;

    for (const surface of surfaces) {
      // Generate attachment points based on surface type
      if (surface.type === 'floor') {
        // Grid of points on floor
        const stepX = 1000; // 1m spacing
        const stepY = 1000;

        for (let x = surface.bounds.min.x + stepX / 2; x < surface.bounds.max.x; x += stepX) {
          for (let y = surface.bounds.min.y + stepY / 2; y < surface.bounds.max.y; y += stepY) {
            points.push({
              id: `attachment-${pointId++}`,
              position: { x, y, z: surface.bounds.min.z },
              normal: { x: 0, y: 0, z: 1 },
              surfaceId: surface.id,
              type: 'floor',
              loadCapacity: 50000, // 50kN default
              attachmentMethods: ['anchor-bolt', 'embed'],
              clearance: { front: 500, sides: 300 },
              confidence: surface.confidence * 0.9,
            });
          }
        }
      } else if (surface.type === 'wall') {
        // Vertical grid on wall
        const stepZ = 500;
        const stepX = 1000;

        for (let z = surface.bounds.min.z + 500; z < surface.bounds.max.z; z += stepZ) {
          for (let x = surface.bounds.min.x + stepX / 2; x < surface.bounds.max.x; x += stepX) {
            points.push({
              id: `attachment-${pointId++}`,
              position: { x, y: surface.bounds.min.y, z },
              normal: surface.normal,
              surfaceId: surface.id,
              type: 'wall',
              loadCapacity: 10000, // 10kN for wall
              attachmentMethods: ['anchor-bolt', 'weld'],
              clearance: { front: 300, sides: 200 },
              confidence: surface.confidence * 0.8,
            });
          }
        }
      }
    }

    return points;
  }

  /**
   * Identify clearance zones
   */
  private identifyClearanceZones(
    _surfaces: DetectedSurface[],
    obstacles: DetectedObstacle[],
    openings: DetectedOpening[]
  ): ClearanceZone[] {
    const zones: ClearanceZone[] = [];
    let zoneId = 0;

    // Egress zones around openings (doors)
    for (const opening of openings) {
      if (opening.type === 'door') {
        zones.push({
          id: `zone-${zoneId++}`,
          type: 'egress',
          bounds: {
            min: {
              x: opening.position.x - opening.dimensions.width / 2 - 500,
              y: opening.position.y - 1000,
              z: opening.position.z,
            },
            max: {
              x: opening.position.x + opening.dimensions.width / 2 + 500,
              y: opening.position.y + 1000,
              z: opening.position.z + opening.dimensions.height,
            },
          },
          priority: 'required',
          description: 'Door swing and egress clearance',
        });
      }
    }

    // Equipment access zones
    for (const obstacle of obstacles) {
      if (obstacle.type === 'equipment') {
        const margin = 750; // 750mm access zone
        zones.push({
          id: `zone-${zoneId++}`,
          type: 'equipment',
          bounds: {
            min: {
              x: obstacle.bounds.min.x - margin,
              y: obstacle.bounds.min.y - margin,
              z: obstacle.bounds.min.z,
            },
            max: {
              x: obstacle.bounds.max.x + margin,
              y: obstacle.bounds.max.y + margin,
              z: obstacle.bounds.max.z + 500,
            },
          },
          priority: 'preferred',
          description: 'Equipment access and maintenance zone',
        });
      }
    }

    return zones;
  }

  /**
   * Calculate average confidence across all detections
   */
  private calculateAverageConfidence(
    surfaces: DetectedSurface[],
    obstacles: DetectedObstacle[]
  ): number {
    const allConfidences = [
      ...surfaces.map(s => s.confidence),
      ...obstacles.map(o => o.confidence),
    ];

    if (allConfidences.length === 0) return 0;
    return allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
  }

  /**
   * Extract environment constraints for design
   */
  extractConstraints(model: EnvironmentModel): ExtractedEnvironmentConstraint[] {
    const constraints: ExtractedEnvironmentConstraint[] = [];

    // Floor elevation constraints
    for (const surface of model.surfaces) {
      if (surface.type === 'floor') {
        constraints.push({
          type: 'attachment',
          description: `Floor surface available at elevation ${surface.bounds.min.z}mm`,
          value: { elevation: surface.bounds.min.z, area: surface.area },
          location: {
            x: (surface.bounds.min.x + surface.bounds.max.x) / 2,
            y: (surface.bounds.min.y + surface.bounds.max.y) / 2,
            z: surface.bounds.min.z,
          },
          confidence: surface.confidence,
          source: 'point-cloud',
        });
      }
    }

    // Obstacle clearance constraints
    for (const obstacle of model.obstacles) {
      constraints.push({
        type: 'obstacle',
        description: `${obstacle.type} obstacle requires ${500}mm clearance`,
        value: {
          bounds: obstacle.bounds,
          clearance: 500,
        },
        location: obstacle.centroid,
        confidence: obstacle.confidence,
        source: 'point-cloud',
      });
    }

    // Opening constraints
    for (const opening of model.openings) {
      constraints.push({
        type: 'clearance',
        description: `${opening.type} opening requires egress clearance`,
        value: {
          position: opening.position,
          dimensions: opening.dimensions,
          requiredClearance: 1000,
        },
        location: opening.position,
        confidence: opening.confidence,
        source: 'inference',
      });
    }

    return constraints;
  }

  /**
   * Find connection opportunities between attachment points
   */
  findConnectionOpportunities(
    model: EnvironmentModel,
    options?: {
      maxDistance?: number;
      requireClearPath?: boolean;
    }
  ): ConnectionOpportunity[] {
    const maxDist = options?.maxDistance || 20000; // 20m default
    const opportunities: ConnectionOpportunity[] = [];

    // Find pairs of attachment points that could be connected
    for (let i = 0; i < model.attachmentPoints.length; i++) {
      for (let j = i + 1; j < model.attachmentPoints.length; j++) {
        const p1 = model.attachmentPoints[i];
        const p2 = model.attachmentPoints[j];

        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(p2.position.x - p1.position.x, 2) +
          Math.pow(p2.position.y - p1.position.y, 2) +
          Math.pow(p2.position.z - p1.position.z, 2)
        );

        if (distance > maxDist) continue;
        if (distance < 500) continue; // Too close

        const elevationChange = p2.position.z - p1.position.z;

        // Check for obstacles in path
        const obstacles = this.findObstaclesInPath(
          p1.position,
          p2.position,
          model.obstacles
        );

        const clearPath = obstacles.length === 0 ||
          !options?.requireClearPath;

        // Determine suggested solutions
        const suggestedSolutions = this.suggestSolutions(
          distance,
          elevationChange,
          p1.type,
          p2.type,
          obstacles.length > 0
        );

        opportunities.push({
          startPoint: p1,
          endPoint: p2,
          distance,
          elevationChange,
          clearPath,
          obstacles,
          suggestedSolutions,
        });
      }
    }

    // Sort by feasibility and distance
    opportunities.sort((a, b) => {
      const aScore = (a.clearPath ? 1 : 0) + a.suggestedSolutions[0]?.feasibility || 0;
      const bScore = (b.clearPath ? 1 : 0) + b.suggestedSolutions[0]?.feasibility || 0;
      return bScore - aScore;
    });

    return opportunities.slice(0, 20); // Return top 20
  }

  /**
   * Find obstacles in a straight-line path
   */
  private findObstaclesInPath(
    start: Point3D,
    end: Point3D,
    obstacles: DetectedObstacle[]
  ): DetectedObstacle[] {
    const blocking: DetectedObstacle[] = [];

    for (const obstacle of obstacles) {
      // Simple AABB ray intersection
      if (this.lineIntersectsBox(start, end, obstacle.bounds)) {
        blocking.push(obstacle);
      }
    }

    return blocking;
  }

  /**
   * Check if line intersects AABB
   */
  private lineIntersectsBox(
    start: Point3D,
    end: Point3D,
    box: { min: Point3D; max: Point3D }
  ): boolean {
    const dir = {
      x: end.x - start.x,
      y: end.y - start.y,
      z: end.z - start.z,
    };

    // Check each slab
    let tmin = 0;
    let tmax = 1;

    for (const axis of ['x', 'y', 'z'] as const) {
      if (Math.abs(dir[axis]) < 0.0001) {
        if (start[axis] < box.min[axis] || start[axis] > box.max[axis]) {
          return false;
        }
      } else {
        const t1 = (box.min[axis] - start[axis]) / dir[axis];
        const t2 = (box.max[axis] - start[axis]) / dir[axis];

        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
      }
    }

    return tmin <= tmax;
  }

  /**
   * Suggest solutions for a connection
   */
  private suggestSolutions(
    distance: number,
    elevationChange: number,
    _startType: string,
    _endType: string,
    hasObstacles: boolean
  ): Array<{ type: string; feasibility: number; notes: string }> {
    const suggestions: Array<{ type: string; feasibility: number; notes: string }> = [];

    const slope = Math.abs(elevationChange) / Math.max(distance, 1);

    // No elevation change - walkway or platform
    if (Math.abs(elevationChange) < 50) {
      suggestions.push({
        type: 'walkway',
        feasibility: hasObstacles ? 0.5 : 0.9,
        notes: 'Direct horizontal path',
      });
      return suggestions;
    }

    // Moderate slope - could use ramp or stairs
    if (slope < 0.1 && Math.abs(elevationChange) < 750) {
      suggestions.push({
        type: 'ramp',
        feasibility: 0.85,
        notes: 'ADA-compliant ramp possible',
      });
    }

    // Standard elevation change - stairs preferred
    if (Math.abs(elevationChange) > 300 && Math.abs(elevationChange) < 5000) {
      suggestions.push({
        type: 'stairs',
        feasibility: 0.9,
        notes: 'Standard stairway',
      });
    }

    // Tall elevation - ladder or multiple flights
    if (Math.abs(elevationChange) >= 3000) {
      suggestions.push({
        type: 'ladder',
        feasibility: 0.7,
        notes: 'Fixed ladder with cage',
      });

      if (Math.abs(elevationChange) > 4000) {
        suggestions.push({
          type: 'stairs-with-landings',
          feasibility: 0.8,
          notes: 'Multi-flight stairway with intermediate landings',
        });
      }
    }

    // Sort by feasibility
    suggestions.sort((a, b) => b.feasibility - a.feasibility);

    return suggestions;
  }

  /**
   * Run complete scan-to-CAD pipeline
   */
  async scanToCAD(options: ScanToCADOptions): Promise<ScanToCADResult> {
    const startTime = Date.now();

    // Build environment model
    const environment = this.buildModel({
      pointClouds: options.pointClouds,
      images: options.images,
    });

    // Calculate statistics
    const inputPoints = options.pointClouds?.reduce((sum, c) => sum + c.points.length, 0) || 0;

    const statistics = {
      inputPoints,
      inputImages: options.images?.length || 0,
      surfacesDetected: environment.surfaces.length,
      obstaclesDetected: environment.obstacles.length,
      attachmentPointsFound: environment.attachmentPoints.length,
      processingTimeMs: Date.now() - startTime,
      memoryUsedMB: Math.round(inputPoints * 0.0001), // Rough estimate
    };

    // Calculate quality metrics
    const quality = {
      coverage: Math.min(100, environment.surfaces.length * 20),
      averageConfidence: environment.metadata.confidence,
      completeness: environment.attachmentPoints.length > 0 ? 75 : 50,
      noiseLevel: 5, // Estimated noise in mm
    };

    // Generate issues/warnings
    const issues: ScanToCADResult['issues'] = [];

    if (inputPoints < 1000) {
      issues.push({
        type: 'warning',
        code: 'LOW_POINT_DENSITY',
        message: 'Low point cloud density may affect accuracy',
      });
    }

    if (environment.surfaces.length === 0) {
      issues.push({
        type: 'error',
        code: 'NO_SURFACES',
        message: 'No surfaces could be detected',
      });
    }

    return {
      environment,
      statistics,
      quality,
      issues,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createEnvironmentModeler(): EnvironmentModeler {
  return new EnvironmentModeler();
}
