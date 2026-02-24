/**
 * File Inspector
 *
 * Inspects and analyzes input files of various formats.
 * Extracts relevant information for engineering reasoning.
 */

import type {
  InputFile,
  InputFileType,
  FileInspectionResult,
  PointCloudData,
  MeshData,
  CADData,
  ImageData,
  MeasurementData,
  DetectedPlane,
} from './types';
import type { BoundingBox3D } from '../../knowledge/types';

// =============================================================================
// FILE TYPE DETECTION
// =============================================================================

const EXTENSION_MAP: Record<string, InputFileType> = {
  // Point clouds
  '.ply': 'pointcloud-ply',
  '.pcd': 'pointcloud-pcd',
  '.xyz': 'pointcloud-xyz',
  '.las': 'pointcloud-las',
  '.laz': 'pointcloud-las',
  '.e57': 'pointcloud-e57',

  // Meshes
  '.stl': 'mesh-stl',
  '.obj': 'mesh-obj',
  '.fbx': 'mesh-fbx',
  '.gltf': 'mesh-gltf',
  '.glb': 'mesh-gltf',

  // CAD
  '.step': 'cad-step',
  '.stp': 'cad-step',
  '.iges': 'cad-iges',
  '.igs': 'cad-iges',
  '.dxf': 'cad-dxf',
  '.dwg': 'cad-dwg',

  // Images
  '.jpg': 'image-jpg',
  '.jpeg': 'image-jpg',
  '.png': 'image-png',
  '.tiff': 'image-tiff',
  '.tif': 'image-tiff',

  // Measurements
  '.csv': 'measurement-csv',
  '.json': 'measurement-json',
  '.xml': 'measurement-xml',
};

/**
 * Detect file type from filename
 */
export function detectFileType(filename: string): InputFileType {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return EXTENSION_MAP[ext] || 'unknown';
}

// =============================================================================
// FILE INSPECTOR CLASS
// =============================================================================

export class FileInspector {
  /**
   * Inspect a file and extract relevant information
   */
  async inspect(file: File | InputFile): Promise<FileInspectionResult> {
    const inputFile: InputFile = 'path' in file
      ? file
      : {
          name: file.name,
          path: file.name,
          size: file.size,
          type: detectFileType(file.name),
          mimeType: file.type,
          lastModified: new Date(file.lastModified),
        };

    const result: FileInspectionResult = {
      file: inputFile,
      valid: false,
      errors: [],
      warnings: [],
      data: null,
    };

    try {
      const fileContent = file instanceof File
        ? await this.readFile(file)
        : null;

      switch (inputFile.type) {
        case 'pointcloud-ply':
        case 'pointcloud-pcd':
        case 'pointcloud-xyz':
          result.data = await this.inspectPointCloud(inputFile, fileContent);
          break;

        case 'mesh-stl':
        case 'mesh-obj':
          result.data = await this.inspectMesh(inputFile, fileContent);
          break;

        case 'cad-step':
        case 'cad-iges':
        case 'cad-dxf':
          result.data = await this.inspectCAD(inputFile, fileContent);
          break;

        case 'image-jpg':
        case 'image-png':
        case 'image-tiff':
          result.data = await this.inspectImage(inputFile, fileContent);
          break;

        case 'measurement-csv':
        case 'measurement-json':
        case 'measurement-xml':
          result.data = await this.inspectMeasurement(inputFile, fileContent);
          break;

        default:
          result.errors.push(`Unsupported file type: ${inputFile.type}`);
          return result;
      }

      if (result.data) {
        result.valid = true;
        result.boundingBox = this.extractBoundingBox(result.data);
      }
    } catch (error) {
      result.errors.push(`Failed to inspect file: ${error}`);
    }

    return result;
  }

  /**
   * Read file contents
   */
  private async readFile(file: File): Promise<ArrayBuffer | string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer | string);
      reader.onerror = () => reject(reader.error);

      // Read as text for text-based formats, binary otherwise
      const textFormats = ['csv', 'json', 'xml', 'xyz', 'obj', 'ply'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (textFormats.includes(ext)) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  // ===========================================================================
  // POINT CLOUD INSPECTION
  // ===========================================================================

  private async inspectPointCloud(
    file: InputFile,
    content: ArrayBuffer | string | null
  ): Promise<PointCloudData> {
    // Parse based on format
    let points: Float32Array = new Float32Array(0);
    let colors: Uint8Array | undefined;
    let normals: Float32Array | undefined;

    if (file.type === 'pointcloud-xyz' && typeof content === 'string') {
      const parsed = this.parseXYZ(content);
      points = parsed.points;
    } else if (file.type === 'pointcloud-ply') {
      const parsed = await this.parsePLY(content);
      points = parsed.points;
      colors = parsed.colors;
      normals = parsed.normals;
    }

    const numPoints = points.length / 3;

    // Calculate bounding box
    const boundingBox = this.calculatePointsBoundingBox(points);

    // Detect planes using RANSAC (simplified)
    const detectedPlanes = numPoints > 100
      ? this.detectPlanesRANSAC(points)
      : [];

    return {
      type: 'pointcloud',
      numPoints,
      hasColors: !!colors,
      hasNormals: !!normals,
      hasIntensity: false,
      boundingBox,
      detectedPlanes,
      detectedObjects: [],
      getPoints: () => points,
      getColors: colors ? () => colors! : undefined,
      getNormals: normals ? () => normals! : undefined,
    };
  }

  /**
   * Parse XYZ point cloud (simple space-separated format)
   */
  private parseXYZ(content: string): { points: Float32Array } {
    const lines = content.trim().split('\n');
    const points: number[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const z = parseFloat(parts[2]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          points.push(x, y, z);
        }
      }
    }

    return { points: new Float32Array(points) };
  }

  /**
   * Parse PLY point cloud
   */
  private async parsePLY(
    content: ArrayBuffer | string | null
  ): Promise<{ points: Float32Array; colors?: Uint8Array; normals?: Float32Array }> {
    // Simplified PLY parser
    // Full implementation would handle binary/ASCII, different element types

    if (typeof content !== 'string') {
      // Binary PLY - would need full implementation
      return { points: new Float32Array(0) };
    }

    const lines = content.split('\n');
    let headerEnd = 0;
    let vertexCount = 0;
    let hasColors = false;
    let hasNormals = false;

    // Parse header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === 'end_header') {
        headerEnd = i + 1;
        break;
      }
      if (line.startsWith('element vertex')) {
        vertexCount = parseInt(line.split(' ')[2]);
      }
      if (line.includes('red') || line.includes('diffuse_red')) {
        hasColors = true;
      }
      if (line.includes(' nx ') || line.startsWith('property float nx')) {
        hasNormals = true;
      }
    }

    // Parse vertices
    const points: number[] = [];
    const colors: number[] = [];
    const normals: number[] = [];

    for (let i = headerEnd; i < headerEnd + vertexCount && i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 3) {
        points.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));

        if (hasNormals && parts.length >= 6) {
          normals.push(parseFloat(parts[3]), parseFloat(parts[4]), parseFloat(parts[5]));
        }

        if (hasColors) {
          const colorOffset = hasNormals ? 6 : 3;
          if (parts.length >= colorOffset + 3) {
            colors.push(
              parseInt(parts[colorOffset]),
              parseInt(parts[colorOffset + 1]),
              parseInt(parts[colorOffset + 2])
            );
          }
        }
      }
    }

    return {
      points: new Float32Array(points),
      colors: colors.length > 0 ? new Uint8Array(colors) : undefined,
      normals: normals.length > 0 ? new Float32Array(normals) : undefined,
    };
  }

  /**
   * Simple RANSAC plane detection
   */
  private detectPlanesRANSAC(points: Float32Array): DetectedPlane[] {
    const planes: DetectedPlane[] = [];
    const numPoints = points.length / 3;

    if (numPoints < 100) return planes;

    // Simplified: detect horizontal plane (floor)
    // Full implementation would use proper RANSAC algorithm

    // Find min Z (likely floor)
    let minZ = Infinity;
    let maxZ = -Infinity;
    let sumZ = 0;

    for (let i = 0; i < numPoints; i++) {
      const z = points[i * 3 + 2];
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      sumZ += z;
    }

    // Count points near floor
    const floorThreshold = minZ + (maxZ - minZ) * 0.05;
    let floorPoints = 0;
    let floorSumX = 0, floorSumY = 0;

    for (let i = 0; i < numPoints; i++) {
      if (points[i * 3 + 2] <= floorThreshold) {
        floorPoints++;
        floorSumX += points[i * 3];
        floorSumY += points[i * 3 + 1];
      }
    }

    if (floorPoints > numPoints * 0.1) {
      planes.push({
        id: 'floor-0',
        type: 'floor',
        normal: { x: 0, y: 0, z: 1 },
        center: {
          x: floorSumX / floorPoints,
          y: floorSumY / floorPoints,
          z: minZ,
        },
        area: 0, // Would calculate from point spread
        confidence: floorPoints / numPoints,
        inlierCount: floorPoints,
        equation: { a: 0, b: 0, c: 1, d: -minZ },
      });
    }

    return planes;
  }

  // ===========================================================================
  // MESH INSPECTION
  // ===========================================================================

  private async inspectMesh(
    file: InputFile,
    content: ArrayBuffer | string | null
  ): Promise<MeshData> {
    let vertices: Float32Array = new Float32Array(0);
    let triangles = 0;

    if (file.type === 'mesh-obj' && typeof content === 'string') {
      const parsed = this.parseOBJ(content);
      vertices = parsed.vertices;
      triangles = parsed.triangles;
    } else if (file.type === 'mesh-stl' && content instanceof ArrayBuffer) {
      const parsed = this.parseSTLBinary(content);
      vertices = parsed.vertices;
      triangles = parsed.triangles;
    }

    const boundingBox = this.calculatePointsBoundingBox(vertices);

    return {
      type: 'mesh',
      numVertices: vertices.length / 3,
      numTriangles: triangles,
      hasNormals: true,
      hasUVs: false,
      hasColors: false,
      boundingBox,
      surfaceArea: 0, // Would calculate
      isWatertight: false, // Would check
      numShells: 1,
      numEdges: triangles * 3,
      hasNonManifold: false,
    };
  }

  /**
   * Parse OBJ mesh (simplified)
   */
  private parseOBJ(content: string): { vertices: Float32Array; triangles: number } {
    const vertices: number[] = [];
    let triangles = 0;

    for (const line of content.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === 'v' && parts.length >= 4) {
        vertices.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
      } else if (parts[0] === 'f') {
        triangles++;
      }
    }

    return { vertices: new Float32Array(vertices), triangles };
  }

  /**
   * Parse binary STL
   */
  private parseSTLBinary(buffer: ArrayBuffer): { vertices: Float32Array; triangles: number } {
    const view = new DataView(buffer);
    const triangles = view.getUint32(80, true);
    const vertices: number[] = [];

    for (let i = 0; i < triangles; i++) {
      const offset = 84 + i * 50;
      // Skip normal (12 bytes), read 3 vertices (36 bytes), skip attribute (2 bytes)
      for (let v = 0; v < 3; v++) {
        vertices.push(
          view.getFloat32(offset + 12 + v * 12, true),
          view.getFloat32(offset + 12 + v * 12 + 4, true),
          view.getFloat32(offset + 12 + v * 12 + 8, true)
        );
      }
    }

    return { vertices: new Float32Array(vertices), triangles };
  }

  // ===========================================================================
  // CAD INSPECTION
  // ===========================================================================

  private async inspectCAD(
    file: InputFile,
    _content: ArrayBuffer | string | null
  ): Promise<CADData> {
    // CAD inspection would use OpenCascade for STEP/IGES
    // and a DXF parser for DXF files

    // Placeholder - would need actual implementation
    const format = file.type === 'cad-step' ? 'step' :
                   file.type === 'cad-iges' ? 'iges' :
                   file.type === 'cad-dxf' ? 'dxf' : 'dwg';

    return {
      type: 'cad',
      format: format as 'step' | 'iges' | 'dxf' | 'dwg',
      numBodies: 0,
      numFaces: 0,
      numEdges: 0,
      is2D: format === 'dxf' || format === 'dwg',
      layers: [],
    };
  }

  // ===========================================================================
  // IMAGE INSPECTION
  // ===========================================================================

  private async inspectImage(
    _file: InputFile,
    _content: ArrayBuffer | string | null
  ): Promise<ImageData> {
    // Would use image processing library
    // For now, return basic info

    return {
      type: 'image',
      width: 0,
      height: 0,
      channels: 3,
      bitDepth: 8,
      isTechnicalDrawing: false,
      hasExif: false,
    };
  }

  // ===========================================================================
  // MEASUREMENT INSPECTION
  // ===========================================================================

  private async inspectMeasurement(
    file: InputFile,
    content: ArrayBuffer | string | null
  ): Promise<MeasurementData> {
    if (file.type === 'measurement-json' && typeof content === 'string') {
      return this.parseMeasurementJSON(content);
    }

    if (file.type === 'measurement-csv' && typeof content === 'string') {
      return this.parseMeasurementCSV(content);
    }

    return {
      type: 'measurement',
      format: 'json',
      points: [],
      distances: [],
    };
  }

  /**
   * Parse measurement JSON
   */
  private parseMeasurementJSON(content: string): MeasurementData {
    try {
      const data = JSON.parse(content);

      return {
        type: 'measurement',
        format: 'json',
        points: data.points || [],
        distances: data.distances || [],
        angles: data.angles || [],
        measuredBy: data.measuredBy,
        measurementDate: data.date ? new Date(data.date) : undefined,
        instrument: data.instrument,
        accuracy: data.accuracy,
      };
    } catch {
      return {
        type: 'measurement',
        format: 'json',
        points: [],
        distances: [],
      };
    }
  }

  /**
   * Parse measurement CSV
   */
  private parseMeasurementCSV(content: string): MeasurementData {
    const lines = content.trim().split('\n');
    const points: MeasurementData['points'] = [];

    // Assume format: id, name, x, y, z
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        points.push({
          id: parts[0].trim(),
          name: parts[1]?.trim(),
          position: {
            x: parseFloat(parts[2]),
            y: parseFloat(parts[3]),
            z: parseFloat(parts[4]) || 0,
          },
        });
      }
    }

    return {
      type: 'measurement',
      format: 'csv',
      points,
      distances: [],
    };
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Calculate bounding box from points array
   */
  private calculatePointsBoundingBox(points: Float32Array): BoundingBox3D {
    if (points.length < 3) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (let i = 0; i < points.length; i += 3) {
      min.x = Math.min(min.x, points[i]);
      min.y = Math.min(min.y, points[i + 1]);
      min.z = Math.min(min.z, points[i + 2]);
      max.x = Math.max(max.x, points[i]);
      max.y = Math.max(max.y, points[i + 1]);
      max.z = Math.max(max.z, points[i + 2]);
    }

    return { min, max };
  }

  /**
   * Extract bounding box from any data type
   */
  private extractBoundingBox(
    data: PointCloudData | MeshData | CADData | ImageData | MeasurementData
  ): BoundingBox3D | undefined {
    if ('boundingBox' in data && data.boundingBox) {
      return data.boundingBox;
    }
    return undefined;
  }
}

// Export singleton
export const fileInspector = new FileInspector();
