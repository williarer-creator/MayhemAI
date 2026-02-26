/**
 * Point Cloud Processor
 *
 * Processes point cloud data from LiDAR or photogrammetry:
 * - Filtering and downsampling
 * - Surface detection
 * - Obstacle identification
 * - Ground plane extraction
 */

import type { Point3D, Vector3D } from '../knowledge/types';
import type {
  PointCloud,
  PointCloudPoint,
  PointCloudProcessingConfig,
  PointCloudSource,
  DetectedSurface,
  DetectedObstacle,
  DetectedEdge,
  PlaneEquation,
} from './types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const defaultProcessingConfig: PointCloudProcessingConfig = {
  voxelSize: 50, // 50mm voxel
  removeOutliers: true,
  estimateNormals: true,
  normalRadius: 100, // 100mm
  detectGround: true,
  surfaceReconstruction: 'none',
};

// ============================================================================
// POINT CLOUD PROCESSOR CLASS
// ============================================================================

export class PointCloudProcessor {
  private config: PointCloudProcessingConfig;

  constructor(config: Partial<PointCloudProcessingConfig> = {}) {
    this.config = { ...defaultProcessingConfig, ...config };
  }

  /**
   * Load point cloud from various formats
   */
  loadFromArray(
    points: Array<{ x: number; y: number; z: number; r?: number; g?: number; b?: number }>,
    source: Partial<PointCloudSource> = {}
  ): PointCloud {
    const cloudPoints: PointCloudPoint[] = points.map(p => ({
      position: { x: p.x, y: p.y, z: p.z },
      color: p.r !== undefined ? { r: p.r, g: p.g!, b: p.b! } : undefined,
    }));

    const bounds = this.calculateBounds(cloudPoints);
    const density = this.calculateDensity(cloudPoints, bounds);

    return {
      id: `cloud-${Date.now()}`,
      source: {
        type: source.type || 'photogrammetry',
        ...source,
      },
      points: cloudPoints,
      bounds,
      density,
      metadata: {},
    };
  }

  /**
   * Calculate bounding box of point cloud
   */
  private calculateBounds(points: PointCloudPoint[]): { min: Point3D; max: Point3D } {
    if (points.length === 0) {
      return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
    }

    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const point of points) {
      min.x = Math.min(min.x, point.position.x);
      min.y = Math.min(min.y, point.position.y);
      min.z = Math.min(min.z, point.position.z);
      max.x = Math.max(max.x, point.position.x);
      max.y = Math.max(max.y, point.position.y);
      max.z = Math.max(max.z, point.position.z);
    }

    return { min, max };
  }

  /**
   * Calculate point density
   */
  private calculateDensity(
    points: PointCloudPoint[],
    bounds: { min: Point3D; max: Point3D }
  ): number {
    const volume =
      (bounds.max.x - bounds.min.x) *
      (bounds.max.y - bounds.min.y) *
      (bounds.max.z - bounds.min.z);

    if (volume <= 0) return 0;

    // Convert mm³ to m³
    const volumeM3 = volume / 1e9;
    return points.length / volumeM3;
  }

  /**
   * Downsample point cloud using voxel grid
   */
  voxelDownsample(cloud: PointCloud, voxelSize?: number): PointCloud {
    const size = voxelSize || this.config.voxelSize || 50;
    const voxelMap = new Map<string, PointCloudPoint[]>();

    // Group points into voxels
    for (const point of cloud.points) {
      const voxelKey = `${Math.floor(point.position.x / size)},${Math.floor(point.position.y / size)},${Math.floor(point.position.z / size)}`;

      if (!voxelMap.has(voxelKey)) {
        voxelMap.set(voxelKey, []);
      }
      voxelMap.get(voxelKey)!.push(point);
    }

    // Average points in each voxel
    const downsampledPoints: PointCloudPoint[] = [];
    for (const points of voxelMap.values()) {
      const avgPoint = this.averagePoints(points);
      downsampledPoints.push(avgPoint);
    }

    return {
      ...cloud,
      id: `${cloud.id}-downsampled`,
      points: downsampledPoints,
      bounds: this.calculateBounds(downsampledPoints),
      density: this.calculateDensity(downsampledPoints, cloud.bounds),
    };
  }

  /**
   * Average multiple points into one
   */
  private averagePoints(points: PointCloudPoint[]): PointCloudPoint {
    const n = points.length;
    let x = 0, y = 0, z = 0;
    let r = 0, g = 0, b = 0;
    let hasColor = false;

    for (const p of points) {
      x += p.position.x;
      y += p.position.y;
      z += p.position.z;
      if (p.color) {
        r += p.color.r;
        g += p.color.g;
        b += p.color.b;
        hasColor = true;
      }
    }

    return {
      position: { x: x / n, y: y / n, z: z / n },
      color: hasColor ? { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) } : undefined,
    };
  }

  /**
   * Remove statistical outliers
   */
  removeOutliers(cloud: PointCloud, k: number = 20, stdRatio: number = 2.0): PointCloud {
    if (cloud.points.length < k) {
      return cloud;
    }

    // Calculate average distance to k nearest neighbors for each point
    const avgDistances: number[] = [];
    for (let i = 0; i < cloud.points.length; i++) {
      const distances = this.findKNearestDistances(cloud.points, i, k);
      const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
      avgDistances.push(avgDist);
    }

    // Calculate mean and standard deviation
    const mean = avgDistances.reduce((a, b) => a + b, 0) / avgDistances.length;
    const variance = avgDistances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / avgDistances.length;
    const std = Math.sqrt(variance);

    // Filter points
    const threshold = mean + stdRatio * std;
    const filteredPoints = cloud.points.filter((_, i) => avgDistances[i] < threshold);

    return {
      ...cloud,
      id: `${cloud.id}-filtered`,
      points: filteredPoints,
      bounds: this.calculateBounds(filteredPoints),
    };
  }

  /**
   * Find distances to k nearest neighbors
   */
  private findKNearestDistances(
    points: PointCloudPoint[],
    index: number,
    k: number
  ): number[] {
    const target = points[index].position;
    const distances: number[] = [];

    for (let i = 0; i < points.length; i++) {
      if (i === index) continue;
      const p = points[i].position;
      const dist = Math.sqrt(
        Math.pow(p.x - target.x, 2) +
        Math.pow(p.y - target.y, 2) +
        Math.pow(p.z - target.z, 2)
      );
      distances.push(dist);
    }

    distances.sort((a, b) => a - b);
    return distances.slice(0, k);
  }

  /**
   * Estimate normals for each point
   */
  estimateNormals(cloud: PointCloud, radius?: number): PointCloud {
    const searchRadius = radius || this.config.normalRadius || 100;

    const pointsWithNormals = cloud.points.map((point, index) => {
      const neighbors = this.findNeighborsInRadius(cloud.points, index, searchRadius);
      if (neighbors.length < 3) {
        return { ...point, normal: { x: 0, y: 0, z: 1 } };
      }

      const normal = this.estimateNormalPCA(neighbors);
      return { ...point, normal };
    });

    return {
      ...cloud,
      points: pointsWithNormals,
    };
  }

  /**
   * Find neighbors within radius
   */
  private findNeighborsInRadius(
    points: PointCloudPoint[],
    index: number,
    radius: number
  ): PointCloudPoint[] {
    const target = points[index].position;
    const neighbors: PointCloudPoint[] = [];
    const radiusSq = radius * radius;

    for (let i = 0; i < points.length; i++) {
      if (i === index) continue;
      const p = points[i].position;
      const distSq =
        Math.pow(p.x - target.x, 2) +
        Math.pow(p.y - target.y, 2) +
        Math.pow(p.z - target.z, 2);

      if (distSq < radiusSq) {
        neighbors.push(points[i]);
      }
    }

    return neighbors;
  }

  /**
   * Estimate normal using PCA (simplified)
   */
  private estimateNormalPCA(points: PointCloudPoint[]): Vector3D {
    // Calculate centroid
    let cx = 0, cy = 0, cz = 0;
    for (const p of points) {
      cx += p.position.x;
      cy += p.position.y;
      cz += p.position.z;
    }
    cx /= points.length;
    cy /= points.length;
    cz /= points.length;

    // Build covariance matrix (simplified - use smallest eigenvector direction)
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    for (const p of points) {
      const dx = p.position.x - cx;
      const dy = p.position.y - cy;
      const dz = p.position.z - cz;
      xx += dx * dx;
      xy += dx * dy;
      xz += dx * dz;
      yy += dy * dy;
      yz += dy * dz;
      zz += dz * dz;
    }

    // Simplified: assume nearly horizontal or vertical surface
    // Real implementation would compute eigenvalues/eigenvectors
    const horizontal = Math.abs(zz) > Math.max(xx, yy);
    if (horizontal) {
      return { x: 0, y: 0, z: 1 };
    }

    // Mostly vertical - normal in xy plane
    const mag = Math.sqrt(xx + yy);
    if (mag < 0.001) return { x: 0, y: 0, z: 1 };
    return { x: xy / mag, y: yy / mag, z: 0 };
  }

  /**
   * Detect ground/floor plane using RANSAC
   */
  detectGroundPlane(cloud: PointCloud): DetectedSurface | null {
    const points = cloud.points;
    if (points.length < 100) return null;

    // RANSAC parameters
    const iterations = 100;
    const threshold = 50; // mm
    let bestPlane: PlaneEquation | null = null;
    let bestInliers: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Sample 3 random points
      const sample = this.randomSample(points, 3);

      // Fit plane
      const plane = this.fitPlane(sample);
      if (!plane) continue;

      // Check if plane is roughly horizontal (ground)
      if (Math.abs(plane.c) < 0.8) continue; // Normal should be mostly vertical

      // Count inliers
      const inliers: number[] = [];
      for (let j = 0; j < points.length; j++) {
        const dist = this.pointToPlaneDistance(points[j].position, plane);
        if (dist < threshold) {
          inliers.push(j);
        }
      }

      if (inliers.length > bestInliers.length) {
        bestPlane = plane;
        bestInliers = inliers;
      }
    }

    if (!bestPlane || bestInliers.length < 50) return null;

    // Calculate bounds of ground plane
    const groundPoints = bestInliers.map(i => points[i]);
    const bounds = this.calculateBounds(groundPoints);

    // Calculate area
    const area = (bounds.max.x - bounds.min.x) * (bounds.max.y - bounds.min.y);

    return {
      id: `surface-ground`,
      type: 'floor',
      plane: bestPlane,
      normal: { x: bestPlane.a, y: bestPlane.b, z: bestPlane.c },
      bounds,
      area,
      pointIndices: bestInliers,
      confidence: bestInliers.length / points.length,
    };
  }

  /**
   * Random sample from array
   */
  private randomSample<T>(array: T[], count: number): T[] {
    const result: T[] = [];
    const indices = new Set<number>();

    while (indices.size < count && indices.size < array.length) {
      const idx = Math.floor(Math.random() * array.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        result.push(array[idx]);
      }
    }

    return result;
  }

  /**
   * Fit plane to 3 points
   */
  private fitPlane(points: PointCloudPoint[]): PlaneEquation | null {
    if (points.length < 3) return null;

    const p1 = points[0].position;
    const p2 = points[1].position;
    const p3 = points[2].position;

    // Calculate normal
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

    const n = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };

    const mag = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    if (mag < 0.0001) return null;

    const a = n.x / mag;
    const b = n.y / mag;
    const c = n.z / mag;
    const d = -(a * p1.x + b * p1.y + c * p1.z);

    return { a, b, c, d };
  }

  /**
   * Distance from point to plane
   */
  private pointToPlaneDistance(point: Point3D, plane: PlaneEquation): number {
    return Math.abs(
      plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d
    );
  }

  /**
   * Detect walls (vertical surfaces)
   */
  detectWalls(cloud: PointCloud, minArea: number = 500000): DetectedSurface[] {
    const walls: DetectedSurface[] = [];
    const remainingPoints = new Set(cloud.points.map((_, i) => i));

    // Remove ground points first
    const ground = this.detectGroundPlane(cloud);
    if (ground) {
      for (const idx of ground.pointIndices) {
        remainingPoints.delete(idx);
      }
    }

    // Try to find vertical planes
    const points = cloud.points;
    const iterations = 50;
    const threshold = 50;

    for (let wallNum = 0; wallNum < 10 && remainingPoints.size > 100; wallNum++) {
      let bestPlane: PlaneEquation | null = null;
      let bestInliers: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const available = Array.from(remainingPoints);
        if (available.length < 3) break;

        const sampleIndices = this.randomSample(available, 3);
        const sample = sampleIndices.map(idx => points[idx]);

        const plane = this.fitPlane(sample);
        if (!plane) continue;

        // Check if plane is vertical (normal mostly horizontal)
        if (Math.abs(plane.c) > 0.3) continue;

        const inliers: number[] = [];
        for (const idx of remainingPoints) {
          const dist = this.pointToPlaneDistance(points[idx].position, plane);
          if (dist < threshold) {
            inliers.push(idx);
          }
        }

        if (inliers.length > bestInliers.length) {
          bestPlane = plane;
          bestInliers = inliers;
        }
      }

      if (!bestPlane || bestInliers.length < 30) break;

      const wallPoints = bestInliers.map(i => points[i]);
      const bounds = this.calculateBounds(wallPoints);
      const area = (bounds.max.x - bounds.min.x) * (bounds.max.z - bounds.min.z) +
                   (bounds.max.y - bounds.min.y) * (bounds.max.z - bounds.min.z);

      if (area >= minArea) {
        walls.push({
          id: `surface-wall-${wallNum}`,
          type: 'wall',
          plane: bestPlane,
          normal: { x: bestPlane.a, y: bestPlane.b, z: bestPlane.c },
          bounds,
          area,
          pointIndices: bestInliers,
          confidence: bestInliers.length / cloud.points.length,
        });
      }

      // Remove these points from consideration
      for (const idx of bestInliers) {
        remainingPoints.delete(idx);
      }
    }

    return walls;
  }

  /**
   * Detect obstacles (clustered points not part of surfaces)
   */
  detectObstacles(
    cloud: PointCloud,
    surfaces: DetectedSurface[]
  ): DetectedObstacle[] {
    // Get indices of all points that are part of surfaces
    const surfacePoints = new Set<number>();
    for (const surface of surfaces) {
      for (const idx of surface.pointIndices) {
        surfacePoints.add(idx);
      }
    }

    // Get remaining points
    const remainingIndices: number[] = [];
    for (let i = 0; i < cloud.points.length; i++) {
      if (!surfacePoints.has(i)) {
        remainingIndices.push(i);
      }
    }

    if (remainingIndices.length < 10) return [];

    // Simple clustering using distance threshold
    const obstacles: DetectedObstacle[] = [];
    const clusterRadius = 200; // mm
    const visited = new Set<number>();

    let obstacleNum = 0;
    for (const seedIdx of remainingIndices) {
      if (visited.has(seedIdx)) continue;

      // Grow cluster from this seed
      const cluster: number[] = [];
      const queue = [seedIdx];
      visited.add(seedIdx);

      while (queue.length > 0) {
        const currentIdx = queue.shift()!;
        cluster.push(currentIdx);

        // Find neighbors
        for (const neighborIdx of remainingIndices) {
          if (visited.has(neighborIdx)) continue;

          const current = cloud.points[currentIdx].position;
          const neighbor = cloud.points[neighborIdx].position;
          const dist = Math.sqrt(
            Math.pow(neighbor.x - current.x, 2) +
            Math.pow(neighbor.y - current.y, 2) +
            Math.pow(neighbor.z - current.z, 2)
          );

          if (dist < clusterRadius) {
            visited.add(neighborIdx);
            queue.push(neighborIdx);
          }
        }
      }

      // Create obstacle from cluster
      if (cluster.length >= 5) {
        const clusterPoints = cluster.map(i => cloud.points[i]);
        const bounds = this.calculateBounds(clusterPoints);

        // Calculate centroid
        let cx = 0, cy = 0, cz = 0;
        for (const p of clusterPoints) {
          cx += p.position.x;
          cy += p.position.y;
          cz += p.position.z;
        }

        obstacles.push({
          id: `obstacle-${obstacleNum++}`,
          type: this.classifyObstacle(bounds),
          bounds,
          centroid: {
            x: cx / clusterPoints.length,
            y: cy / clusterPoints.length,
            z: cz / clusterPoints.length,
          },
          dimensions: {
            width: bounds.max.x - bounds.min.x,
            depth: bounds.max.y - bounds.min.y,
            height: bounds.max.z - bounds.min.z,
          },
          pointIndices: cluster,
          confidence: 0.6,
        });
      }
    }

    return obstacles;
  }

  /**
   * Classify obstacle type based on dimensions
   */
  private classifyObstacle(
    bounds: { min: Point3D; max: Point3D }
  ): DetectedObstacle['type'] {
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.y - bounds.min.y;
    const height = bounds.max.z - bounds.min.z;

    // Circular cross-section (pipe or column)
    if (Math.abs(width - depth) < 100 && height > 500) {
      if (width < 300) return 'pipe';
      return 'column';
    }

    // Long and thin (beam or duct)
    if (height > 200 && height < 800 && (width > height * 2 || depth > height * 2)) {
      if (Math.min(width, depth) < 200) return 'beam';
      return 'duct';
    }

    // Large (equipment)
    if (width > 500 && depth > 500 && height > 500) {
      return 'equipment';
    }

    return 'unknown';
  }

  /**
   * Detect edges where surfaces meet
   */
  detectEdges(surfaces: DetectedSurface[]): DetectedEdge[] {
    const edges: DetectedEdge[] = [];
    let edgeNum = 0;

    for (let i = 0; i < surfaces.length; i++) {
      for (let j = i + 1; j < surfaces.length; j++) {
        const s1 = surfaces[i];
        const s2 = surfaces[j];

        // Check if surfaces are adjacent
        const intersection = this.findSurfaceIntersection(s1, s2);
        if (intersection) {
          edges.push({
            id: `edge-${edgeNum++}`,
            type: this.classifyEdge(s1.type, s2.type),
            start: intersection.start,
            end: intersection.end,
            length: Math.sqrt(
              Math.pow(intersection.end.x - intersection.start.x, 2) +
              Math.pow(intersection.end.y - intersection.start.y, 2) +
              Math.pow(intersection.end.z - intersection.start.z, 2)
            ),
            confidence: Math.min(s1.confidence, s2.confidence),
          });
        }
      }
    }

    return edges;
  }

  /**
   * Find intersection line between two surfaces
   */
  private findSurfaceIntersection(
    s1: DetectedSurface,
    s2: DetectedSurface
  ): { start: Point3D; end: Point3D } | null {
    // Check if bounds overlap
    const overlap =
      s1.bounds.min.x < s2.bounds.max.x &&
      s1.bounds.max.x > s2.bounds.min.x &&
      s1.bounds.min.y < s2.bounds.max.y &&
      s1.bounds.max.y > s2.bounds.min.y &&
      s1.bounds.min.z < s2.bounds.max.z &&
      s1.bounds.max.z > s2.bounds.min.z;

    if (!overlap) return null;

    // Simplified: return edge based on shared bounds
    const edge = {
      start: {
        x: Math.max(s1.bounds.min.x, s2.bounds.min.x),
        y: Math.max(s1.bounds.min.y, s2.bounds.min.y),
        z: Math.max(s1.bounds.min.z, s2.bounds.min.z),
      },
      end: {
        x: Math.min(s1.bounds.max.x, s2.bounds.max.x),
        y: Math.min(s1.bounds.max.y, s2.bounds.max.y),
        z: Math.min(s1.bounds.max.z, s2.bounds.max.z),
      },
    };

    return edge;
  }

  /**
   * Classify edge type
   */
  private classifyEdge(
    type1: DetectedSurface['type'],
    type2: DetectedSurface['type']
  ): DetectedEdge['type'] {
    if ((type1 === 'wall' && type2 === 'floor') ||
        (type1 === 'floor' && type2 === 'wall')) {
      return 'wall-floor';
    }
    if (type1 === 'wall' && type2 === 'wall') {
      return 'wall-wall';
    }
    if ((type1 === 'wall' && type2 === 'ceiling') ||
        (type1 === 'ceiling' && type2 === 'wall')) {
      return 'wall-ceiling';
    }
    return 'curb';
  }

  /**
   * Process complete point cloud
   */
  process(cloud: PointCloud): {
    processedCloud: PointCloud;
    surfaces: DetectedSurface[];
    obstacles: DetectedObstacle[];
    edges: DetectedEdge[];
  } {
    let processed = cloud;

    // Downsample
    if (this.config.voxelSize) {
      processed = this.voxelDownsample(processed, this.config.voxelSize);
    }

    // Remove outliers
    if (this.config.removeOutliers) {
      processed = this.removeOutliers(processed);
    }

    // Estimate normals
    if (this.config.estimateNormals) {
      processed = this.estimateNormals(processed);
    }

    // Detect surfaces
    const surfaces: DetectedSurface[] = [];

    if (this.config.detectGround) {
      const ground = this.detectGroundPlane(processed);
      if (ground) surfaces.push(ground);
    }

    const walls = this.detectWalls(processed);
    surfaces.push(...walls);

    // Detect obstacles
    const obstacles = this.detectObstacles(processed, surfaces);

    // Detect edges
    const edges = this.detectEdges(surfaces);

    return {
      processedCloud: processed,
      surfaces,
      obstacles,
      edges,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPointCloudProcessor(
  config?: Partial<PointCloudProcessingConfig>
): PointCloudProcessor {
  return new PointCloudProcessor(config);
}
