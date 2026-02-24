/**
 * Spatial Reasoning Primitives
 *
 * Core geometric operations for understanding space and connections.
 */

import type { Point3D, Vector3D, BoundingBox3D } from '../knowledge/types';

// =============================================================================
// VECTOR OPERATIONS
// =============================================================================

/**
 * Create a vector from two points
 */
export function vectorFromPoints(from: Point3D, to: Point3D): Vector3D {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
    z: to.z - from.z,
  };
}

/**
 * Vector magnitude (length)
 */
export function magnitude(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector3D): Vector3D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * Dot product
 */
export function dot(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Cross product
 */
export function cross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Scale a vector
 */
export function scale(v: Vector3D, s: number): Vector3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * Add vectors
 */
export function add(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Subtract vectors
 */
export function subtract(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

// =============================================================================
// DISTANCE AND ANGLE CALCULATIONS
// =============================================================================

/**
 * Distance between two points
 */
export function distance(a: Point3D, b: Point3D): number {
  return magnitude(vectorFromPoints(a, b));
}

/**
 * Horizontal distance (ignoring Z)
 */
export function horizontalDistance(a: Point3D, b: Point3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Vertical distance (Z only)
 */
export function verticalDistance(a: Point3D, b: Point3D): number {
  return Math.abs(b.z - a.z);
}

/**
 * Angle between two vectors (radians)
 */
export function angleBetween(a: Vector3D, b: Vector3D): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const cosAngle = dot(a, b) / (magA * magB);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

/**
 * Angle from horizontal (for slopes)
 */
export function angleFromHorizontal(v: Vector3D): number {
  const horizontal = Math.sqrt(v.x * v.x + v.y * v.y);
  return Math.atan2(v.z, horizontal);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// CONNECTION ANALYSIS
// =============================================================================

export interface ConnectionAnalysis {
  /** Start point */
  from: Point3D;
  /** End point */
  to: Point3D;

  /** Total 3D distance */
  totalDistance: number;
  /** Horizontal distance */
  horizontalDistance: number;
  /** Vertical distance (rise) */
  verticalDistance: number;

  /** Angle from horizontal (degrees) */
  slopeAngle: number;
  /** Slope as ratio (rise/run) */
  slopeRatio: number;

  /** Direction vector (normalized) */
  direction: Vector3D;
  /** Horizontal direction (normalized, Z=0) */
  horizontalDirection: Vector3D;

  /** Connection type based on geometry */
  suggestedType: 'horizontal' | 'vertical' | 'sloped' | 'steep';

  /** Access method suggestions */
  accessMethods: AccessMethodSuggestion[];
}

export interface AccessMethodSuggestion {
  method: 'stairs' | 'ramp' | 'ladder' | 'elevator' | 'walkway';
  suitability: 'ideal' | 'acceptable' | 'possible' | 'not_recommended';
  reason: string;
}

/**
 * Analyze connection between two points
 */
export function analyzeConnection(from: Point3D, to: Point3D): ConnectionAnalysis {
  const vec = vectorFromPoints(from, to);
  const hDist = horizontalDistance(from, to);
  const vDist = verticalDistance(from, to);
  const totalDist = distance(from, to);

  const slopeAngle = toDegrees(angleFromHorizontal(vec));
  const slopeRatio = hDist > 0 ? vDist / hDist : Infinity;

  const direction = normalize(vec);
  const horizontalDir = normalize({ x: vec.x, y: vec.y, z: 0 });

  // Determine connection type
  let suggestedType: ConnectionAnalysis['suggestedType'];
  if (Math.abs(slopeAngle) < 5) {
    suggestedType = 'horizontal';
  } else if (Math.abs(slopeAngle) > 75) {
    suggestedType = 'vertical';
  } else if (Math.abs(slopeAngle) > 50) {
    suggestedType = 'steep';
  } else {
    suggestedType = 'sloped';
  }

  // Generate access method suggestions
  const accessMethods = suggestAccessMethods(vDist, hDist, slopeAngle);

  return {
    from,
    to,
    totalDistance: totalDist,
    horizontalDistance: hDist,
    verticalDistance: vDist,
    slopeAngle,
    slopeRatio,
    direction,
    horizontalDirection: horizontalDir,
    suggestedType,
    accessMethods,
  };
}

/**
 * Suggest appropriate access methods
 */
function suggestAccessMethods(
  vDist: number,
  _hDist: number,
  slopeAngle: number
): AccessMethodSuggestion[] {
  const methods: AccessMethodSuggestion[] = [];
  const absAngle = Math.abs(slopeAngle);

  // Walkway (horizontal or nearly horizontal)
  if (absAngle < 5) {
    methods.push({
      method: 'walkway',
      suitability: 'ideal',
      reason: 'Level or nearly level path',
    });
  } else if (absAngle < 8.3) {  // < 1:12 slope
    methods.push({
      method: 'walkway',
      suitability: 'acceptable',
      reason: 'Gentle slope, accessible without handrails',
    });
  }

  // Ramp
  if (absAngle <= 8.3) {  // 1:12 maximum for ADA ramps
    methods.push({
      method: 'ramp',
      suitability: 'ideal',
      reason: 'Slope within ADA-compliant range (1:12)',
    });
  } else if (absAngle <= 12) {  // Steeper but still possible
    methods.push({
      method: 'ramp',
      suitability: 'acceptable',
      reason: 'Steeper ramp, may require special consideration',
    });
  } else if (absAngle <= 20) {
    methods.push({
      method: 'ramp',
      suitability: 'possible',
      reason: 'Very steep ramp, limited use cases (vehicle ramps)',
    });
  }

  // Stairs
  if (absAngle >= 20 && absAngle <= 50) {
    const suitability = absAngle >= 30 && absAngle <= 37
      ? 'ideal'
      : absAngle >= 25 && absAngle <= 45
        ? 'acceptable'
        : 'possible';
    methods.push({
      method: 'stairs',
      suitability,
      reason: absAngle >= 30 && absAngle <= 37
        ? 'Optimal stair angle for comfort'
        : 'Stair angle acceptable',
    });
  } else if (absAngle > 50 && absAngle <= 70) {
    methods.push({
      method: 'stairs',
      suitability: 'possible',
      reason: 'Very steep stairs (ship ladder style)',
    });
  }

  // Ladder
  if (absAngle >= 60 && absAngle <= 90) {
    methods.push({
      method: 'ladder',
      suitability: absAngle >= 75 ? 'ideal' : 'acceptable',
      reason: absAngle >= 75
        ? 'Optimal ladder angle'
        : 'Ladder possible but steep',
    });
  }

  // Elevator (for any significant vertical rise)
  if (vDist > 3000) {  // > 3m
    methods.push({
      method: 'elevator',
      suitability: 'acceptable',
      reason: 'Significant vertical rise - consider mechanical lift',
    });
  }

  // Sort by suitability
  const suitabilityOrder = { ideal: 0, acceptable: 1, possible: 2, not_recommended: 3 };
  methods.sort((a, b) => suitabilityOrder[a.suitability] - suitabilityOrder[b.suitability]);

  return methods;
}

// =============================================================================
// SPACE ANALYSIS
// =============================================================================

export interface SpaceAnalysis {
  boundingBox: BoundingBox3D;
  volume: number;
  floorArea: number;

  /** Detected floor level */
  floorLevel: number;
  /** Detected ceiling level (if any) */
  ceilingLevel?: number;
  /** Clear height */
  clearHeight?: number;

  /** Available directions for paths */
  availableDirections: AvailableDirection[];

  /** Obstacles that must be avoided */
  obstacles: ObstacleInfo[];
}

export interface AvailableDirection {
  direction: Vector3D;
  maxDistance: number;
  clearanceWidth: number;
  obstructedBy?: string;
}

export interface ObstacleInfo {
  id: string;
  type: string;
  boundingBox: BoundingBox3D;
  avoidanceMargin: number;
}

/**
 * Analyze available space between two points
 */
export function analyzeSpace(
  from: Point3D,
  to: Point3D,
  obstacles: ObstacleInfo[] = [],
  boundingBox?: BoundingBox3D
): SpaceAnalysis {
  // Calculate bounding box if not provided
  const bbox = boundingBox || {
    min: {
      x: Math.min(from.x, to.x) - 1000,
      y: Math.min(from.y, to.y) - 1000,
      z: Math.min(from.z, to.z),
    },
    max: {
      x: Math.max(from.x, to.x) + 1000,
      y: Math.max(from.y, to.y) + 1000,
      z: Math.max(from.z, to.z) + 3000,
    },
  };

  const size = {
    x: bbox.max.x - bbox.min.x,
    y: bbox.max.y - bbox.min.y,
    z: bbox.max.z - bbox.min.z,
  };

  const volume = size.x * size.y * size.z;
  const floorArea = size.x * size.y;
  const floorLevel = Math.min(from.z, to.z);

  // Analyze available directions
  const directions: AvailableDirection[] = [];

  // Direct path
  const directVec = normalize(vectorFromPoints(from, to));
  const directDist = distance(from, to);
  directions.push({
    direction: directVec,
    maxDistance: directDist,
    clearanceWidth: 1000, // Default, would check obstacles
  });

  // Horizontal-then-vertical
  if (from.z !== to.z) {
    directions.push({
      direction: normalize({ x: directVec.x, y: directVec.y, z: 0 }),
      maxDistance: horizontalDistance(from, to),
      clearanceWidth: 1000,
    });
    directions.push({
      direction: { x: 0, y: 0, z: directVec.z > 0 ? 1 : -1 },
      maxDistance: verticalDistance(from, to),
      clearanceWidth: 1000,
    });
  }

  return {
    boundingBox: bbox,
    volume,
    floorArea,
    floorLevel,
    clearHeight: size.z,
    availableDirections: directions,
    obstacles,
  };
}

// =============================================================================
// PATH PLANNING
// =============================================================================

export interface PathSegment {
  from: Point3D;
  to: Point3D;
  type: 'horizontal' | 'vertical' | 'sloped';
  method: 'walkway' | 'stairs' | 'ramp' | 'ladder' | 'platform';
  length: number;
}

export interface PlannedPath {
  segments: PathSegment[];
  totalLength: number;
  totalRise: number;
  numDirectionChanges: number;
  estimatedComponents: string[];
}

/**
 * Plan a path between two points
 */
export function planPath(
  from: Point3D,
  to: Point3D,
  preferredMethod?: 'stairs' | 'ramp' | 'ladder'
): PlannedPath {
  const connection = analyzeConnection(from, to);
  const segments: PathSegment[] = [];

  // Simple path planning - would be more sophisticated in full implementation
  if (connection.suggestedType === 'horizontal') {
    // Single horizontal segment
    segments.push({
      from,
      to,
      type: 'horizontal',
      method: 'walkway',
      length: connection.horizontalDistance,
    });
  } else if (connection.suggestedType === 'vertical') {
    // Vertical only
    const method = preferredMethod === 'ladder' ? 'ladder' : 'ladder';
    segments.push({
      from,
      to,
      type: 'vertical',
      method,
      length: connection.verticalDistance,
    });
  } else {
    // Sloped - use stairs, ramp, or split into segments
    const method = preferredMethod || (connection.slopeAngle > 20 ? 'stairs' : 'ramp');

    if (method === 'stairs' || method === 'ramp') {
      segments.push({
        from,
        to,
        type: 'sloped',
        method,
        length: connection.totalDistance,
      });
    } else {
      // Split into horizontal + vertical
      const midPoint: Point3D = {
        x: to.x,
        y: to.y,
        z: from.z,
      };

      if (connection.horizontalDistance > 0) {
        segments.push({
          from,
          to: midPoint,
          type: 'horizontal',
          method: 'walkway',
          length: connection.horizontalDistance,
        });
      }

      segments.push({
        from: midPoint,
        to,
        type: 'vertical',
        method: 'ladder',
        length: connection.verticalDistance,
      });
    }
  }

  // Calculate totals
  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const totalRise = connection.verticalDistance;
  const numDirectionChanges = segments.length - 1;

  // Estimate components
  const estimatedComponents = segments.flatMap(s => {
    switch (s.method) {
      case 'stairs': return ['stringers', 'treads', 'handrails', 'posts'];
      case 'ramp': return ['ramp-surface', 'handrails', 'posts'];
      case 'ladder': return ['ladder-rails', 'rungs', 'cage'];
      case 'walkway': return ['decking', 'frame', 'handrails'];
      case 'platform': return ['deck', 'frame', 'legs', 'handrails'];
      default: return [];
    }
  });

  return {
    segments,
    totalLength,
    totalRise,
    numDirectionChanges,
    estimatedComponents: [...new Set(estimatedComponents)],
  };
}
