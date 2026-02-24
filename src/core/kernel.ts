/**
 * Geometry Kernel Interface
 *
 * This module provides a clean API for geometry operations.
 * All heavy lifting happens in Web Workers - the main thread stays responsive.
 *
 * Key design: Operations return Promises and can be cancelled.
 * This solves the "frozen UI" problem that plagues SolidWorks.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  MeshData,
} from '../types';

// Track pending requests for cancellation
const pendingRequests = new Map<
  string,
  {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    onProgress?: (progress: number) => void;
  }
>();

let worker: Worker | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Generate unique request ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Initialize the geometry kernel
 * Call this early - OpenCascade takes a few seconds to load
 */
export async function initKernel(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Create worker from public folder (plain JS, no module issues)
    worker = new Worker('/geometry.worker.js');

    // Set up message handling
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, success, payload, error, progress } = event.data;

      const pending = pendingRequests.get(id);
      if (!pending) return;

      // Handle progress updates
      if (progress !== undefined && pending.onProgress) {
        pending.onProgress(progress);
        return; // Don't resolve yet
      }

      // Handle completion
      pendingRequests.delete(id);

      if (success) {
        pending.resolve(payload);
      } else {
        pending.reject(new Error(error || 'Unknown error'));
      }
    };

    worker.onerror = (error) => {
      console.error('[Kernel] Worker error:', error);
    };

    // Initialize OpenCascade in worker
    await sendRequest('init', null);
    isInitialized = true;
    console.log('[Kernel] Initialized');
  })();

  return initPromise;
}

/**
 * Send request to worker and wait for response
 */
function sendRequest<T>(
  type: WorkerRequest['type'],
  payload: unknown,
  onProgress?: (progress: number) => void
): Promise<T> {
  if (!worker) {
    return Promise.reject(new Error('Kernel not initialized'));
  }

  return new Promise((resolve, reject) => {
    const id = generateId();

    pendingRequests.set(id, { resolve, reject, onProgress });

    const request: WorkerRequest = { id, type, payload };
    worker!.postMessage(request);
  });
}

/**
 * Cancel a pending operation
 */
export function cancelOperation(operationId: string): void {
  const pending = pendingRequests.get(operationId);
  if (pending) {
    pending.reject(new Error('Operation cancelled'));
    pendingRequests.delete(operationId);

    // Tell worker to cancel too
    worker?.postMessage({
      id: generateId(),
      type: 'cancel',
      payload: { targetId: operationId },
    });
  }
}

// ============================================================================
// GEOMETRY OPERATIONS - Clean API for the rest of the app
// ============================================================================

export interface ComputeOptions {
  onProgress?: (progress: number) => void;
}

export interface PrimitiveResult {
  mesh: MeshData;
  shapeId: string;
}

/**
 * Create a box primitive
 */
export async function createBox(
  width: number,
  height: number,
  depth: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'box',
      params: { width, height, depth },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create a cylinder primitive
 */
export async function createCylinder(
  radius: number,
  height: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'cylinder',
      params: { radius, height },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create a sphere primitive
 */
export async function createSphere(
  radius: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'sphere',
      params: { radius },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create a cone primitive
 */
export async function createCone(
  radius: number,
  height: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'cone',
      params: { radius, height },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create a torus primitive
 * @param majorRadius - Distance from center of torus to center of tube
 * @param minorRadius - Radius of the tube
 */
export async function createTorus(
  majorRadius: number,
  minorRadius: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'torus',
      params: { majorRadius, minorRadius },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Extrude a 2D profile
 */
export async function extrude(
  profile: Array<{ x: number; y: number }>,
  height: number,
  plane: 'XY' | 'XZ' | 'YZ' = 'XY',
  planeOffset: number = 0,
  options?: ComputeOptions
): Promise<MeshData> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData }>(
    'compute',
    {
      operation: 'extrude',
      params: { profile, height, plane, planeOffset },
    },
    options?.onProgress
  );

  return result.mesh;
}

/**
 * Extrude a rectangle
 */
export async function extrudeRectangle(
  corner1: { x: number; y: number },
  corner2: { x: number; y: number },
  height: number,
  plane: 'XY' | 'XZ' | 'YZ' = 'XY',
  planeOffset: number = 0,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'extrudeRectangle',
      params: { corner1, corner2, height, plane, planeOffset },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Extrude a circle
 */
export async function extrudeCircle(
  center: { x: number; y: number },
  radius: number,
  height: number,
  plane: 'XY' | 'XZ' | 'YZ' = 'XY',
  planeOffset: number = 0,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'extrudeCircle',
      params: { center, radius, height, plane, planeOffset },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Revolve a rectangle profile around an axis
 * @param corner1 - First corner of rectangle (in sketch 2D coordinates)
 * @param corner2 - Second corner of rectangle (in sketch 2D coordinates)
 * @param angle - Revolution angle in degrees (360 for full revolution)
 * @param plane - Sketch plane
 * @param planeOffset - Offset of the sketch plane
 * @param axis - Revolution axis ('X', 'Y', or 'Z')
 */
export async function revolveRectangle(
  corner1: { x: number; y: number },
  corner2: { x: number; y: number },
  angle: number = 360,
  plane: 'XY' | 'XZ' | 'YZ' = 'XY',
  planeOffset: number = 0,
  axis: 'X' | 'Y' | 'Z' = 'Y',
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'revolveRectangle',
      params: { corner1, corner2, angle, plane, planeOffset, axis },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// BOOLEAN OPERATIONS
// ============================================================================

export interface BooleanResult {
  mesh: MeshData;
  shapeId: string;
}

/**
 * Boolean Union - Combines two shapes into one
 */
export async function booleanUnion(
  shapeId1: string,
  shapeId2: string,
  options?: ComputeOptions
): Promise<BooleanResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'booleanUnion',
      params: { shapeId1, shapeId2 },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Boolean Subtract - Subtracts second shape from first
 */
export async function booleanSubtract(
  shapeId1: string,
  shapeId2: string,
  options?: ComputeOptions
): Promise<BooleanResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'booleanSubtract',
      params: { shapeId1, shapeId2 },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Boolean Intersect - Keeps only common volume
 */
export async function booleanIntersect(
  shapeId1: string,
  shapeId2: string,
  options?: ComputeOptions
): Promise<BooleanResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'booleanIntersect',
      params: { shapeId1, shapeId2 },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Delete a shape from the kernel's registry
 */
export async function deleteShape(shapeId: string): Promise<void> {
  await initKernel();

  await sendRequest<{ success: boolean }>(
    'compute',
    {
      operation: 'deleteShape',
      params: { shapeId },
    }
  );
}

// ============================================================================
// EDGE MODIFICATION OPERATIONS (Fillet, Chamfer)
// ============================================================================

export interface EdgeModifyResult {
  mesh: MeshData;
  shapeId: string;
}

/**
 * Apply fillet (rounded edges) to all edges of a shape
 * @param shapeId - ID of the shape to fillet
 * @param radius - Fillet radius
 */
export async function filletAllEdges(
  shapeId: string,
  radius: number,
  options?: ComputeOptions
): Promise<EdgeModifyResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'filletAllEdges',
      params: { shapeId, radius },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Apply chamfer (beveled edges) to all edges of a shape
 * @param shapeId - ID of the shape to chamfer
 * @param distance - Chamfer distance
 */
export async function chamferAllEdges(
  shapeId: string,
  distance: number,
  options?: ComputeOptions
): Promise<EdgeModifyResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'chamferAllEdges',
      params: { shapeId, distance },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Apply fillet to specific edges by index
 * @param shapeId - ID of the shape
 * @param radius - Fillet radius
 * @param edgeIndices - Array of edge indices to fillet (1-based)
 */
export async function filletEdges(
  shapeId: string,
  radius: number,
  edgeIndices: number[],
  options?: ComputeOptions
): Promise<EdgeModifyResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'filletEdges',
      params: { shapeId, radius, edgeIndices },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// SHELL OPERATION
// ============================================================================

/**
 * Shell operation - hollows out a solid with given wall thickness
 * @param shapeId - ID of the shape to shell
 * @param thickness - Wall thickness (positive = inward)
 * @param faceIndices - Optional face indices to remove (open faces)
 */
export async function shellShape(
  shapeId: string,
  thickness: number,
  faceIndices: number[] = [],
  options?: ComputeOptions
): Promise<EdgeModifyResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'shell',
      params: { shapeId, thickness, faceIndices },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// MIRROR OPERATION
// ============================================================================

/**
 * Mirror a shape across a plane
 * @param shapeId - ID of the shape to mirror
 * @param plane - 'XY', 'XZ', or 'YZ'
 * @param offset - Plane offset from origin
 * @param keepOriginal - If true, returns union of original and mirrored
 */
export async function mirrorShape(
  shapeId: string,
  plane: 'XY' | 'XZ' | 'YZ',
  offset: number = 0,
  keepOriginal: boolean = true,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'mirror',
      params: { shapeId, plane, offset, keepOriginal },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

/**
 * Linear pattern - repeat shape along a direction
 * @param shapeId - ID of the shape to pattern
 * @param direction - Direction vector {x, y, z}
 * @param count - Number of copies (including original)
 * @param spacing - Distance between copies
 */
export async function linearPattern(
  shapeId: string,
  direction: { x: number; y: number; z: number },
  count: number,
  spacing: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'linearPattern',
      params: { shapeId, direction, count, spacing },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Circular pattern - repeat shape around an axis
 * @param shapeId - ID of the shape to pattern
 * @param axis - 'X', 'Y', or 'Z'
 * @param count - Number of copies (including original)
 * @param angle - Total angle in degrees (360 for full circle)
 * @param center - Center point of rotation
 */
export async function circularPattern(
  shapeId: string,
  axis: 'X' | 'Y' | 'Z',
  count: number,
  angle: number = 360,
  center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'circularPattern',
      params: { shapeId, axis, count, angle, center },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// SWEEP & LOFT OPERATIONS
// ============================================================================

/**
 * Sweep a profile along a linear path
 * @param profile - 2D profile points
 * @param start - Start point of path
 * @param end - End point of path
 * @param profilePlane - Plane of profile: 'XY', 'XZ', 'YZ'
 */
export async function sweepProfile(
  profile: Array<{ x: number; y: number }>,
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  profilePlane: 'XY' | 'XZ' | 'YZ' = 'XY',
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'sweep',
      params: { profile, start, end, profilePlane },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Loft between two profiles
 * @param profile1 - First 2D profile points
 * @param profile2 - Second 2D profile points
 * @param z1 - Z position of first profile
 * @param z2 - Z position of second profile
 */
export async function loftProfiles(
  profile1: Array<{ x: number; y: number }>,
  profile2: Array<{ x: number; y: number }>,
  z1: number,
  z2: number,
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'loft',
      params: { profile1, profile2, z1, z2 },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// HELIX / THREAD OPERATIONS
// ============================================================================

/**
 * Create a helix (spring) by sweeping a circular profile along a helical path
 * @param radius - Helix radius (distance from center axis)
 * @param pitch - Distance between turns
 * @param height - Total height of the helix
 * @param profileRadius - Radius of the circular cross-section
 * @param leftHanded - If true, creates left-handed helix
 * @param position - Starting position
 */
export async function createHelix(
  radius: number,
  pitch: number,
  height: number,
  profileRadius: number,
  leftHanded: boolean = false,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'helix',
      params: { radius, pitch, height, profileRadius, leftHanded, position },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create thread (external thread geometry)
 * @param shapeId - Optional base shape to union thread with (null for standalone thread)
 * @param outerRadius - Outer radius (major diameter / 2)
 * @param innerRadius - Inner radius (minor diameter / 2)
 * @param pitch - Thread pitch
 * @param height - Height of threaded section
 * @param leftHanded - Left-handed thread if true
 * @param position - Starting position
 */
export async function createThread(
  shapeId: string | null,
  outerRadius: number,
  innerRadius: number,
  pitch: number,
  height: number,
  leftHanded: boolean = false,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  options?: ComputeOptions
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'thread',
      params: { shapeId, outerRadius, innerRadius, pitch, height, leftHanded, position },
    },
    options?.onProgress
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// MEASUREMENT OPERATIONS
// ============================================================================

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
}

export interface MassProperties {
  volume: number;
  surfaceArea: number;
  centerOfMass: { x: number; y: number; z: number };
}

export interface DistanceMeasurement {
  distance: number;
  point1: { x: number; y: number; z: number };
  point2: { x: number; y: number; z: number };
}

/**
 * Get bounding box of a shape
 */
export async function getBoundingBox(shapeId: string): Promise<BoundingBox> {
  await initKernel();

  const result = await sendRequest<{ data: BoundingBox }>(
    'compute',
    {
      operation: 'boundingBox',
      params: { shapeId },
    }
  );

  return result.data;
}

/**
 * Get mass properties (volume, surface area, center of mass)
 */
export async function getMassProperties(shapeId: string): Promise<MassProperties> {
  await initKernel();

  const result = await sendRequest<{ data: MassProperties }>(
    'compute',
    {
      operation: 'massProperties',
      params: { shapeId },
    }
  );

  return result.data;
}

/**
 * Measure minimum distance between two shapes
 */
export async function measureDistance(
  shapeId1: string,
  shapeId2: string
): Promise<DistanceMeasurement> {
  await initKernel();

  const result = await sendRequest<{ data: DistanceMeasurement }>(
    'compute',
    {
      operation: 'measureDistance',
      params: { shapeId1, shapeId2 },
    }
  );

  return result.data;
}

// ============================================================================
// FILE EXPORT OPERATIONS
// ============================================================================

/**
 * Export shape to STL format (binary)
 * @param shapeId - Shape to export
 * @returns Binary STL data as ArrayBuffer
 */
export async function exportSTL(shapeId: string): Promise<ArrayBuffer> {
  await initKernel();

  const result = await sendRequest<{ data: ArrayBuffer; format: string }>(
    'compute',
    {
      operation: 'exportSTL',
      params: { shapeId },
    }
  );

  return result.data;
}

/**
 * Export shape to STEP format
 * @param shapeId - Shape to export
 * @returns STEP file content as string
 */
export async function exportSTEP(shapeId: string): Promise<string> {
  await initKernel();

  const result = await sendRequest<{ data: string; format: string }>(
    'compute',
    {
      operation: 'exportSTEP',
      params: { shapeId },
    }
  );

  return result.data;
}

/**
 * Export shape to OBJ format
 * @param shapeId - Shape to export
 * @returns OBJ file content as string
 */
export async function exportOBJ(shapeId: string): Promise<string> {
  await initKernel();

  const result = await sendRequest<{ data: string; format: string }>(
    'compute',
    {
      operation: 'exportOBJ',
      params: { shapeId },
    }
  );

  return result.data;
}

// ============================================================================
// TRANSFORM OPERATIONS
// ============================================================================

/**
 * Translate (move) a shape
 * @param shapeId - Shape to translate
 * @param dx - X offset
 * @param dy - Y offset
 * @param dz - Z offset
 * @param copy - If true, create a copy instead of replacing
 */
export async function translateShape(
  shapeId: string,
  dx: number,
  dy: number,
  dz: number,
  copy: boolean = false
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'translate',
      params: { shapeId, dx, dy, dz, copy },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Scale a shape uniformly
 * @param shapeId - Shape to scale
 * @param factor - Scale factor
 * @param center - Center point for scaling
 */
export async function scaleShape(
  shapeId: string,
  factor: number,
  center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'scale',
      params: { shapeId, factor, center },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Rotate a shape
 * @param shapeId - Shape to rotate
 * @param axis - 'X', 'Y', or 'Z'
 * @param angle - Angle in degrees
 * @param center - Center point for rotation
 */
export async function rotateShape(
  shapeId: string,
  axis: 'X' | 'Y' | 'Z',
  angle: number,
  center: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'rotate',
      params: { shapeId, axis, angle, center },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Split a shape with a plane
 * @param shapeId - Shape to split
 * @param plane - 'XY', 'XZ', or 'YZ'
 * @param offset - Plane offset along normal
 */
export async function splitShape(
  shapeId: string,
  plane: 'XY' | 'XZ' | 'YZ',
  offset: number = 0
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'split',
      params: { shapeId, plane, offset },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Apply draft angle to a shape (for injection molding)
 * @param shapeId - ID of the shape to draft
 * @param angle - Draft angle in degrees
 * @param direction - Direction axis ('X', 'Y', or 'Z')
 */
export async function draftShape(
  shapeId: string,
  angle: number,
  direction: 'X' | 'Y' | 'Z' = 'Z'
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'draft',
      params: { shapeId, angle, direction },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

/**
 * Create a hole in a body
 * @param shapeId - ID of the body to create hole in
 * @param diameter - Hole diameter
 * @param depth - Hole depth (0 = through all)
 * @param position - Position of hole center {x, y, z}
 * @param direction - Direction of hole ('X', 'Y', or 'Z')
 */
export async function createHole(
  shapeId: string,
  diameter: number,
  depth: number = 0,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  direction: 'X' | 'Y' | 'Z' = 'Z'
): Promise<PrimitiveResult> {
  await initKernel();

  const result = await sendRequest<{ mesh: MeshData; shapeId: string }>(
    'compute',
    {
      operation: 'hole',
      params: { shapeId, diameter, depth, position, direction },
    }
  );

  return { mesh: result.mesh, shapeId: result.shapeId };
}

// ============================================================================
// MULTI-WORKER POOL (for true parallel operations)
// ============================================================================

/**
 * Worker pool for parallel mesh generation, analysis, etc.
 * This is where we really beat single-threaded CAD systems.
 */
class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(private size: number = navigator.hardwareConcurrency || 4) {}

  async initialize(): Promise<void> {
    // Create worker pool using plain JS worker from public folder
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker('/geometry.worker.js');

      this.workers.push(worker);
      this.available.push(worker);
    }

    // Initialize all workers in parallel
    await Promise.all(
      this.workers.map((w) =>
        new Promise<void>((resolve, reject) => {
          const id = generateId();

          const handler = (event: MessageEvent<WorkerResponse>) => {
            if (event.data.id === id) {
              w.removeEventListener('message', handler);
              if (event.data.success) {
                resolve();
              } else {
                reject(new Error(event.data.error));
              }
            }
          };

          w.addEventListener('message', handler);
          w.postMessage({ id, type: 'init', payload: null });
        })
      )
    );

    console.log(`[WorkerPool] Initialized ${this.size} workers`);
  }

  /**
   * Execute tasks in parallel across the pool
   */
  async parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map((task) => this.execute(task)));
  }

  private async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.available.length === 0 || this.queue.length === 0) return;

    const worker = this.available.pop()!;
    const { task, resolve, reject } = this.queue.shift()!;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.available.push(worker);
      this.processQueue();
    }
  }

  terminate(): void {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.available = [];
  }
}

// Export singleton pool
export const workerPool = new WorkerPool();

/**
 * Check if kernel is ready
 */
export function isKernelReady(): boolean {
  return isInitialized;
}
