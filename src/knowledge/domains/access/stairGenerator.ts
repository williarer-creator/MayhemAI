/**
 * Stair Geometry Generator
 *
 * Generates 3D geometry for stairs using OpenCascade kernel.
 */

import * as kernel from '../../../core/kernel';
import { calculateStairs, type StairCalculationInput, type StairCalculationResult } from './stairs';
import type { Point3D, GeneratedComponent, CutListItem } from '../../types';

export interface StairGeometryInput extends StairCalculationInput {
  /** Start point (bottom of stairs) */
  startPoint: Point3D;

  /** End point (top of stairs) - z difference defines total rise */
  endPoint: Point3D;

  /** Direction stairs face (angle in degrees from X axis) */
  direction?: number;

  /** Material selection */
  material?: 'steel' | 'aluminum';

  /** Stringer profile */
  stringerProfile?: 'C200x80' | 'C250x80' | 'C300x100' | 'PL10' | 'PL12';

  /** Tread type */
  treadType?: 'checkered-plate' | 'grating' | 'grip-strut';
  treadThickness?: number;  // mm
}

export interface StairGeometryResult {
  calculation: StairCalculationResult;
  components: GeneratedComponent[];
  cutList: CutListItem[];
  shapeIds: string[];
  totalWeight: number;  // kg
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };
}

/**
 * Generate complete stair geometry
 */
export async function generateStairGeometry(
  input: StairGeometryInput
): Promise<StairGeometryResult> {
  // Initialize kernel
  await kernel.initKernel();

  // Calculate stair parameters
  const totalRise = input.endPoint.z - input.startPoint.z;

  const calcInput: StairCalculationInput = {
    totalRise: Math.abs(totalRise),
    width: input.width,
    occupancyType: input.occupancyType,
    stairType: input.stairType,
    constructionType: input.constructionType,
  };

  const calculation = calculateStairs(calcInput);

  if (!calculation.valid) {
    throw new Error(`Invalid stair configuration: ${calculation.errors.join(', ')}`);
  }

  const components: GeneratedComponent[] = [];
  const cutList: CutListItem[] = [];
  const shapeIds: string[] = [];

  // Material defaults
  const material = input.material || 'steel';
  const stringerProfile = input.stringerProfile || 'C200x80';
  const treadThickness = input.treadThickness || 6;

  // Calculate direction vector
  const dx = input.endPoint.x - input.startPoint.x;
  const dy = input.endPoint.y - input.startPoint.y;
  // Calculate direction angle for positioning
  const dirAngle = Math.atan2(dy, dx);

  // Stringer dimensions (simplified - would come from database)
  const stringerHeight = 200;  // mm (C200)
  const stringerWidth = 80;    // mm

  // Generate stringers
  const stringerSpacing = input.width / (calculation.components.stringers - 1);

  for (let i = 0; i < calculation.components.stringers; i++) {
    const offsetFromCenter = (i - (calculation.components.stringers - 1) / 2) * stringerSpacing;

    // Calculate stringer position (perpendicular to stair direction)
    const stringerX = input.startPoint.x + Math.sin(dirAngle) * offsetFromCenter;
    const stringerY = input.startPoint.y - Math.cos(dirAngle) * offsetFromCenter;

    // Create stringer as angled box (simplified)
    // In real implementation, would create proper channel section
    const stringerResult = await kernel.createBox(
      calculation.stringerLength,
      stringerWidth,
      stringerHeight
    );

    // Rotate to match stair angle and direction
    const rotatedStringer = await kernel.rotateShape(
      stringerResult.shapeId,
      'Y',
      -calculation.stairAngle
    );

    const finalStringer = await kernel.rotateShape(
      rotatedStringer.shapeId,
      'Z',
      dirAngle * (180 / Math.PI)
    );

    // Translate to position
    const positionedStringer = await kernel.translateShape(
      finalStringer.shapeId,
      stringerX,
      stringerY,
      input.startPoint.z
    );

    shapeIds.push(positionedStringer.shapeId);

    components.push({
      id: `stringer-${i + 1}`,
      name: `Stringer ${i + 1}`,
      material: material,
      shape: stringerProfile,
      position: { x: stringerX, y: stringerY, z: input.startPoint.z },
      rotation: { x: -calculation.stairAngle, y: 0, z: dirAngle * (180 / Math.PI) },
      shapeId: positionedStringer.shapeId,
      dimensions: {
        length: calculation.stringerLength,
        profileHeight: 200, // C200x80
      },
      connections: [
        { to: 'base-plate', type: 'welded' },
        { to: 'top-plate', type: 'welded' },
      ],
    });

    // Add to cut list
    cutList.push({
      id: `cut-stringer-${i + 1}`,
      component: `stringer-${i + 1}`,
      material: material,
      stockShape: 'channel',
      stockSize: stringerProfile,
      quantity: 1,
      cutLength: calculation.stringerLength,
      operations: [
        { type: 'cut', parameters: { angle: calculation.stairAngle } },
        { type: 'cut', position: calculation.stringerLength, parameters: { angle: -calculation.stairAngle } },
      ],
      weight: calculateWeight('channel', stringerProfile, calculation.stringerLength, material),
    });
  }

  // Generate treads
  for (let i = 0; i < calculation.numTreads; i++) {
    const treadPosition = i * calculation.treadDepth;
    const treadHeight = (i + 1) * calculation.riserHeight;

    // Position along stair direction
    const treadX = input.startPoint.x + Math.cos(dirAngle) * treadPosition;
    const treadY = input.startPoint.y + Math.sin(dirAngle) * treadPosition;
    const treadZ = input.startPoint.z + treadHeight;

    // Create tread as plate
    const treadResult = await kernel.createBox(
      calculation.treadDepth + 25, // Include nosing
      input.width,
      treadThickness
    );

    // Rotate and position
    const rotatedTread = await kernel.rotateShape(
      treadResult.shapeId,
      'Z',
      dirAngle * (180 / Math.PI)
    );

    const positionedTread = await kernel.translateShape(
      rotatedTread.shapeId,
      treadX,
      treadY,
      treadZ
    );

    shapeIds.push(positionedTread.shapeId);

    components.push({
      id: `tread-${i + 1}`,
      name: `Tread ${i + 1}`,
      material: material,
      shape: 'plate',
      position: { x: treadX, y: treadY, z: treadZ },
      rotation: { x: 0, y: 0, z: dirAngle * (180 / Math.PI) },
      shapeId: positionedTread.shapeId,
      dimensions: {
        length: calculation.treadDepth + 25,
        width: input.width,
        thickness: treadThickness,
      },
      connections: [
        { to: `stringer-1`, type: 'welded' },
        { to: `stringer-${calculation.components.stringers}`, type: 'welded' },
      ],
    });

    cutList.push({
      id: `cut-tread-${i + 1}`,
      component: `tread-${i + 1}`,
      material: material,
      stockShape: 'plate',
      stockSize: `PL${treadThickness}`,
      quantity: 1,
      cutLength: calculation.treadDepth + 25,
      operations: [
        { type: 'cut', parameters: { width: input.width } },
      ],
      weight: calculateWeight('plate', `${treadThickness}`, (calculation.treadDepth + 25) * input.width, material),
    });
  }

  // Generate handrail posts
  const postSpacing = 1200; // mm maximum
  const numPostsPerSide = Math.ceil(calculation.stringerLength / postSpacing) + 1;

  for (let side = 0; side < 2; side++) {
    const sideOffset = (side === 0 ? -1 : 1) * (input.width / 2 + 25);

    for (let i = 0; i < numPostsPerSide; i++) {
      const postPositionAlongStair = i * (calculation.stringerLength / (numPostsPerSide - 1));
      const postHeight = 1067; // 42" guardrail height

      // Calculate 3D position
      const horizontalPos = (postPositionAlongStair / calculation.stringerLength) * calculation.totalRun;
      const verticalPos = (postPositionAlongStair / calculation.stringerLength) * totalRise;

      const postX = input.startPoint.x + Math.cos(dirAngle) * horizontalPos + Math.sin(dirAngle) * sideOffset;
      const postY = input.startPoint.y + Math.sin(dirAngle) * horizontalPos - Math.cos(dirAngle) * sideOffset;
      const postZ = input.startPoint.z + verticalPos;

      const postResult = await kernel.createBox(50, 50, postHeight);
      const positionedPost = await kernel.translateShape(
        postResult.shapeId,
        postX - 25,
        postY - 25,
        postZ
      );

      shapeIds.push(positionedPost.shapeId);

      components.push({
        id: `post-${side}-${i}`,
        name: `Post ${side === 0 ? 'L' : 'R'}${i + 1}`,
        material: material,
        shape: 'square-tube',
        position: { x: postX, y: postY, z: postZ },
        rotation: { x: 0, y: 0, z: 0 },
        shapeId: positionedPost.shapeId,
        dimensions: {
          width: 50,
          depth: 50,
          thickness: 3,
          height: postHeight,
        },
        connections: [
          { to: `stringer-${side === 0 ? 1 : calculation.components.stringers}`, type: 'welded' },
        ],
      });
    }
  }

  // Calculate total weight
  const totalWeight = cutList.reduce((sum, item) => sum + item.weight, 0);

  // Calculate bounding box
  const boundingBox = {
    min: {
      x: Math.min(input.startPoint.x, input.endPoint.x) - input.width / 2,
      y: Math.min(input.startPoint.y, input.endPoint.y) - input.width / 2,
      z: input.startPoint.z,
    },
    max: {
      x: Math.max(input.startPoint.x, input.endPoint.x) + input.width / 2,
      y: Math.max(input.startPoint.y, input.endPoint.y) + input.width / 2,
      z: input.endPoint.z + 1100, // Add handrail height
    },
  };

  return {
    calculation,
    components,
    cutList,
    shapeIds,
    totalWeight,
    boundingBox,
  };
}

/**
 * Calculate weight of a component
 */
function calculateWeight(
  shapeType: string,
  size: string,
  lengthOrArea: number,
  material: 'steel' | 'aluminum'
): number {
  // Material density (kg/m³)
  const density = material === 'steel' ? 7850 : 2700;

  // Simplified weight calculations
  // In real implementation, would use actual section properties
  switch (shapeType) {
    case 'channel':
      // Approximate weight per meter for common channels
      const channelWeights: Record<string, number> = {
        'C200x80': 21.4,
        'C250x80': 26.0,
        'C300x100': 36.8,
      };
      return (channelWeights[size] || 25) * (lengthOrArea / 1000);

    case 'plate':
      // Weight = volume * density
      const thickness = parseInt(size.replace('PL', '')) || 6;
      const volume = lengthOrArea * thickness / 1e9; // mm² * mm → m³
      return volume * density;

    case 'square-tube':
      // Approximate for 50x50x3
      return 4.25 * (lengthOrArea / 1000);

    default:
      return 0;
  }
}

/**
 * Union all stair components into single shape
 */
export async function unionStairComponents(shapeIds: string[]): Promise<string> {
  if (shapeIds.length === 0) return '';
  if (shapeIds.length === 1) return shapeIds[0];

  let resultId = shapeIds[0];

  for (let i = 1; i < shapeIds.length; i++) {
    const unionResult = await kernel.booleanUnion(resultId, shapeIds[i]);
    resultId = unionResult.shapeId;
  }

  return resultId;
}
