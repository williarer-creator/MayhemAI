/**
 * Coordinate System Module
 *
 * This addresses the fundamental problem: CAD software doesn't match machine tool orientation.
 *
 * Internal representation: Always Z-up (matches most CNC mills)
 * Display/Export: Transformed to match target machine
 *
 * Why this matters:
 * - Mill: Z+ is spindle up - matches our internal representation
 * - Lathe: Z+ is toward tailstock, X is diameter
 * - 3D Printer: Z+ is up - same as mill
 * - Traditional CAD (SolidWorks default): Y+ is up - WRONG for manufacturing
 */

import { Matrix4, Euler, Vector3 as ThreeVector3 } from 'three';
import type {
  MachineType,
  CoordinateSystem,
  Vector3,
  MeshData,
} from '../types';
import { COORDINATE_SYSTEMS } from '../types';

// ============================================================================
// COORDINATE SYSTEM MANAGER
// ============================================================================

export class CoordinateSystemManager {
  private currentSystem: MachineType = 'mill';
  private displayMatrix: Matrix4 = new Matrix4();
  private inverseMatrix: Matrix4 = new Matrix4();

  constructor(initialSystem: MachineType = 'mill') {
    this.setSystem(initialSystem);
  }

  /**
   * Set the active coordinate system
   */
  setSystem(system: MachineType): void {
    this.currentSystem = system;
    const config = COORDINATE_SYSTEMS[system];

    // Build Three.js matrix from our stored Float32Array
    this.displayMatrix.fromArray(config.toSystemMatrix);
    this.inverseMatrix.fromArray(config.fromSystemMatrix);

    console.log(`[Coordinates] Switched to ${system}: ${config.description}`);
  }

  /**
   * Get current system
   */
  getSystem(): MachineType {
    return this.currentSystem;
  }

  /**
   * Get current system configuration
   */
  getConfig(): CoordinateSystem {
    return COORDINATE_SYSTEMS[this.currentSystem];
  }

  /**
   * Transform a point from internal (Z-up) to display coordinates
   */
  toDisplay(point: Vector3): Vector3 {
    const v = new ThreeVector3(point.x, point.y, point.z);
    v.applyMatrix4(this.displayMatrix);
    return { x: v.x, y: v.y, z: v.z };
  }

  /**
   * Transform a point from display to internal (Z-up) coordinates
   */
  fromDisplay(point: Vector3): Vector3 {
    const v = new ThreeVector3(point.x, point.y, point.z);
    v.applyMatrix4(this.inverseMatrix);
    return { x: v.x, y: v.y, z: v.z };
  }

  /**
   * Get the display matrix for Three.js
   */
  getDisplayMatrix(): Matrix4 {
    return this.displayMatrix.clone();
  }

  /**
   * Transform mesh data for display
   * This is used when rendering - the mesh is stored in internal coords
   * but displayed in the user's chosen system
   */
  transformMeshForDisplay(mesh: MeshData): MeshData {
    if (this.currentSystem === 'mill' || this.currentSystem === '3d_printer') {
      // No transform needed - internal is already Z-up
      return mesh;
    }

    const positions = new Float32Array(mesh.positions.length);
    const normals = new Float32Array(mesh.normals.length);

    const tempVec = new ThreeVector3();

    // Transform positions
    for (let i = 0; i < mesh.positions.length; i += 3) {
      tempVec.set(
        mesh.positions[i],
        mesh.positions[i + 1],
        mesh.positions[i + 2]
      );
      tempVec.applyMatrix4(this.displayMatrix);
      positions[i] = tempVec.x;
      positions[i + 1] = tempVec.y;
      positions[i + 2] = tempVec.z;
    }

    // Transform normals (use normal matrix)
    const normalMatrix = new Matrix4()
      .copy(this.displayMatrix)
      .invert()
      .transpose();

    for (let i = 0; i < mesh.normals.length; i += 3) {
      tempVec.set(
        mesh.normals[i],
        mesh.normals[i + 1],
        mesh.normals[i + 2]
      );
      tempVec.applyMatrix4(normalMatrix).normalize();
      normals[i] = tempVec.x;
      normals[i + 1] = tempVec.y;
      normals[i + 2] = tempVec.z;
    }

    // Transform bounds
    const minVec = new ThreeVector3(
      mesh.bounds.min.x,
      mesh.bounds.min.y,
      mesh.bounds.min.z
    ).applyMatrix4(this.displayMatrix);

    const maxVec = new ThreeVector3(
      mesh.bounds.max.x,
      mesh.bounds.max.y,
      mesh.bounds.max.z
    ).applyMatrix4(this.displayMatrix);

    return {
      positions,
      normals,
      indices: mesh.indices, // Indices don't change
      bounds: {
        min: { x: Math.min(minVec.x, maxVec.x), y: Math.min(minVec.y, maxVec.y), z: Math.min(minVec.z, maxVec.z) },
        max: { x: Math.max(minVec.x, maxVec.x), y: Math.max(minVec.y, maxVec.y), z: Math.max(minVec.z, maxVec.z) },
      },
    };
  }
}

// ============================================================================
// AXIS INDICATOR HELPERS
// ============================================================================

/**
 * Get axis labels for current coordinate system
 */
export function getAxisLabels(system: MachineType): {
  x: string;
  y: string;
  z: string;
  xPositive: string;
  yPositive: string;
  zPositive: string;
} {
  switch (system) {
    case 'mill':
      return {
        x: 'X',
        y: 'Y',
        z: 'Z',
        xPositive: 'Right',
        yPositive: 'Back',
        zPositive: 'Up (Spindle)',
      };
    case 'lathe':
      return {
        x: 'X',
        y: 'Y',
        z: 'Z',
        xPositive: 'Diameter+',
        yPositive: 'N/A',
        zPositive: 'Tailstock',
      };
    case '3d_printer':
      return {
        x: 'X',
        y: 'Y',
        z: 'Z',
        xPositive: 'Right',
        yPositive: 'Back',
        zPositive: 'Up (Nozzle)',
      };
    case 'cad_standard':
      return {
        x: 'X',
        y: 'Y',
        z: 'Z',
        xPositive: 'Right',
        yPositive: 'Up',
        zPositive: 'Toward viewer',
      };
  }
}

/**
 * Get axis colors (standard: X=Red, Y=Green, Z=Blue)
 */
export function getAxisColors(): {
  x: number;
  y: number;
  z: number;
} {
  return {
    x: 0xff4444, // Red
    y: 0x44ff44, // Green
    z: 0x4444ff, // Blue
  };
}

// ============================================================================
// ORIENTATION PRESETS FOR COMMON OPERATIONS
// ============================================================================

export interface OrientationPreset {
  name: string;
  description: string;
  /** Rotation to apply to get this orientation (Euler angles in radians) */
  rotation: { x: number; y: number; z: number };
  /** Which machine type this is best for */
  recommendedFor: MachineType[];
}

/**
 * Common orientation presets for manufacturing
 */
export const ORIENTATION_PRESETS: OrientationPreset[] = [
  {
    name: 'Top Down (Mill)',
    description: 'Part sits on XY plane, machined from Z+',
    rotation: { x: 0, y: 0, z: 0 },
    recommendedFor: ['mill', '3d_printer'],
  },
  {
    name: 'Front Face',
    description: 'Part faces operator, machined from Y-',
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
    recommendedFor: ['mill'],
  },
  {
    name: 'Right Side',
    description: 'Part right side up, machined from X+',
    rotation: { x: 0, y: 0, z: -Math.PI / 2 },
    recommendedFor: ['mill'],
  },
  {
    name: 'Lathe Centerline',
    description: 'Axis of revolution along Z',
    rotation: { x: 0, y: 0, z: 0 },
    recommendedFor: ['lathe'],
  },
  {
    name: 'Print Flat',
    description: 'Largest flat surface on build plate',
    rotation: { x: 0, y: 0, z: 0 },
    recommendedFor: ['3d_printer'],
  },
  {
    name: 'Print Minimal Support',
    description: 'Oriented to minimize overhangs',
    rotation: { x: 0, y: 0, z: 0 }, // Auto-calculated
    recommendedFor: ['3d_printer'],
  },
];

/**
 * Apply an orientation preset to get the final transform
 */
export function applyOrientationPreset(
  preset: OrientationPreset,
  baseSystem: MachineType
): Matrix4 {
  const sysConfig = COORDINATE_SYSTEMS[baseSystem];

  // Start with system transform
  const matrix = new Matrix4().fromArray(sysConfig.toSystemMatrix);

  // Apply preset rotation
  const rotation = new Euler(
    preset.rotation.x,
    preset.rotation.y,
    preset.rotation.z,
    'XYZ'
  );
  const rotationMatrix = new Matrix4().makeRotationFromEuler(rotation);

  return matrix.multiply(rotationMatrix);
}

// Singleton manager for app-wide coordinate system
export const coordinateManager = new CoordinateSystemManager('mill');
