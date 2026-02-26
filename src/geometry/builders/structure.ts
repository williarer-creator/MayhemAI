/**
 * STRUCTURE Domain Geometry Builders
 *
 * Builds 3D geometry for beams, columns, bracing, and connections.
 */

import * as kernel from '../../core/kernel';
import {
  BaseGeometryBuilder,
  distance3D,
  vectorFromPoints,
  normalizeVector,
  registerBuilder,
} from '../builder';
import type {
  GeometryResult,
  BuilderContext,
  ValidationResult,
} from '../types';

// ============================================================================
// BEAM BUILDER
// ============================================================================

export interface BeamInput {
  profile: 'w-flange' | 'channel' | 'tube-square' | 'tube-rect' | 'angle';
  depth: number; // Overall depth (mm)
  width: number; // Flange width (mm)
  webThickness: number; // Web thickness (mm)
  flangeThickness: number; // Flange thickness (mm)
  length: number; // Beam length (mm)
  orientation: 'horizontal' | 'vertical' | 'custom';
  customAngle?: { x: number; y: number; z: number };
}

export class BeamBuilder extends BaseGeometryBuilder<BeamInput> {
  elementType = 'beam';

  async build(context: BuilderContext, input: BeamInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting beam geometry generation');

    let shapeId: string;

    switch (input.profile) {
      case 'w-flange':
        shapeId = await this.createWFlange(context, input);
        break;
      case 'channel':
        shapeId = await this.createChannel(context, input);
        break;
      case 'tube-square':
        shapeId = await this.createSquareTube(context, input);
        break;
      case 'tube-rect':
        shapeId = await this.createRectTube(context, input);
        break;
      case 'angle':
        shapeId = await this.createAngle(context, input);
        break;
      default:
        shapeId = await this.createWFlange(context, input);
    }

    this.reportProgress(context, 80, 'Profile created');

    // Position beam between points
    const direction = vectorFromPoints(context.pointA, context.pointB);
    const normalized = normalizeVector(direction);

    // Calculate rotation angles
    const yaw = Math.atan2(normalized.x, normalized.y) * (180 / Math.PI);
    const pitch = Math.asin(normalized.z) * (180 / Math.PI);

    if (yaw !== 0) {
      const rotated = await kernel.rotateShape(shapeId, 'Z', yaw);
      shapeId = rotated.shapeId;
    }
    if (pitch !== 0) {
      const rotated = await kernel.rotateShape(shapeId, 'X', pitch);
      shapeId = rotated.shapeId;
    }

    // Translate to start point
    const translated = await kernel.translateShape(
      shapeId,
      context.pointA.x,
      context.pointA.y,
      context.pointA.z
    );
    shapeId = translated.shapeId;

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      shapeId,
      `${input.profile.toUpperCase()} Beam`,
      context.material,
      {
        profile: input.profile,
        depth: input.depth,
        width: input.width,
        length: input.length,
      }
    );

    this.reportProgress(context, 100, 'Beam geometry complete');

    return result;
  }

  private async createWFlange(context: BuilderContext, input: BeamInput): Promise<string> {
    this.reportProgress(context, 10, 'Creating W-flange profile');

    // Top flange
    const topFlange = await kernel.createBox(
      input.width,
      input.length,
      input.flangeThickness
    );
    await kernel.translateShape(
      topFlange.shapeId,
      -input.width / 2,
      0,
      input.depth / 2 - input.flangeThickness
    );

    // Bottom flange
    const bottomFlange = await kernel.createBox(
      input.width,
      input.length,
      input.flangeThickness
    );
    await kernel.translateShape(
      bottomFlange.shapeId,
      -input.width / 2,
      0,
      -input.depth / 2
    );

    // Web
    const webHeight = input.depth - 2 * input.flangeThickness;
    const web = await kernel.createBox(
      input.webThickness,
      input.length,
      webHeight
    );
    await kernel.translateShape(
      web.shapeId,
      -input.webThickness / 2,
      0,
      -input.depth / 2 + input.flangeThickness
    );

    this.reportProgress(context, 50, 'Combining W-flange components');

    // Combine all parts
    let combined = await kernel.booleanUnion(topFlange.shapeId, bottomFlange.shapeId);
    combined = await kernel.booleanUnion(combined.shapeId, web.shapeId);

    return combined.shapeId;
  }

  private async createChannel(context: BuilderContext, input: BeamInput): Promise<string> {
    this.reportProgress(context, 10, 'Creating channel profile');

    // Web
    const web = await kernel.createBox(
      input.webThickness,
      input.length,
      input.depth
    );

    // Top flange
    const topFlange = await kernel.createBox(
      input.width,
      input.length,
      input.flangeThickness
    );
    await kernel.translateShape(
      topFlange.shapeId,
      0,
      0,
      input.depth / 2 - input.flangeThickness
    );

    // Bottom flange
    const bottomFlange = await kernel.createBox(
      input.width,
      input.length,
      input.flangeThickness
    );
    await kernel.translateShape(
      bottomFlange.shapeId,
      0,
      0,
      -input.depth / 2
    );

    this.reportProgress(context, 50, 'Combining channel components');

    let combined = await kernel.booleanUnion(web.shapeId, topFlange.shapeId);
    combined = await kernel.booleanUnion(combined.shapeId, bottomFlange.shapeId);

    return combined.shapeId;
  }

  private async createSquareTube(context: BuilderContext, input: BeamInput): Promise<string> {
    this.reportProgress(context, 10, 'Creating square tube profile');

    const outer = await kernel.createBox(input.depth, input.length, input.depth);

    const innerSize = input.depth - 2 * input.webThickness;
    const inner = await kernel.createBox(innerSize, input.length + 10, innerSize);
    await kernel.translateShape(inner.shapeId, input.webThickness, -5, input.webThickness);

    const hollowed = await kernel.booleanSubtract(outer.shapeId, inner.shapeId);

    await kernel.translateShape(hollowed.shapeId, -input.depth / 2, 0, -input.depth / 2);

    return hollowed.shapeId;
  }

  private async createRectTube(context: BuilderContext, input: BeamInput): Promise<string> {
    this.reportProgress(context, 10, 'Creating rectangular tube profile');

    const outer = await kernel.createBox(input.width, input.length, input.depth);

    const innerWidth = input.width - 2 * input.webThickness;
    const innerDepth = input.depth - 2 * input.flangeThickness;
    const inner = await kernel.createBox(innerWidth, input.length + 10, innerDepth);
    await kernel.translateShape(inner.shapeId, input.webThickness, -5, input.flangeThickness);

    const hollowed = await kernel.booleanSubtract(outer.shapeId, inner.shapeId);

    await kernel.translateShape(hollowed.shapeId, -input.width / 2, 0, -input.depth / 2);

    return hollowed.shapeId;
  }

  private async createAngle(context: BuilderContext, input: BeamInput): Promise<string> {
    this.reportProgress(context, 10, 'Creating angle profile');

    // Horizontal leg
    const horizLeg = await kernel.createBox(
      input.width,
      input.length,
      input.webThickness
    );

    // Vertical leg
    const vertLeg = await kernel.createBox(
      input.webThickness,
      input.length,
      input.depth
    );

    let combined = await kernel.booleanUnion(horizLeg.shapeId, vertLeg.shapeId);

    await kernel.translateShape(combined.shapeId, -input.webThickness / 2, 0, -input.webThickness / 2);

    return combined.shapeId;
  }

  validate(_context: BuilderContext, input: BeamInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // Basic dimensional checks
    if (input.depth < 50) {
      warnings.push({
        code: 'DEPTH_SMALL',
        severity: 'warning',
        message: 'Beam depth less than 50mm may have limited structural capacity',
      });
    }

    // Span-to-depth ratio check
    const spanDepthRatio = input.length / input.depth;
    if (spanDepthRatio > 24) {
      warnings.push({
        code: 'HIGH_SPAN_RATIO',
        severity: 'warning',
        message: `Span-to-depth ratio ${spanDepthRatio.toFixed(1)} exceeds typical limit of 24`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      clearanceChecks: [],
    };
  }
}

// ============================================================================
// COLUMN BUILDER
// ============================================================================

export interface ColumnInput {
  profile: 'w-flange' | 'tube-square' | 'tube-round' | 'pipe';
  size: number; // Nominal size (mm)
  wallThickness: number; // For tubes/pipes (mm)
  height: number; // Column height (mm)
  includeBasePlate: boolean;
  basePlateSize: number; // Square base plate size (mm)
  basePlateThickness: number; // Base plate thickness (mm)
  includeCapPlate: boolean;
}

export class ColumnBuilder extends BaseGeometryBuilder<ColumnInput> {
  elementType = 'column';

  async build(context: BuilderContext, input: ColumnInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting column geometry generation');

    let shapeId: string;

    switch (input.profile) {
      case 'tube-square':
        const outer = await kernel.createBox(input.size, input.size, input.height);
        const inner = await kernel.createBox(
          input.size - 2 * input.wallThickness,
          input.size - 2 * input.wallThickness,
          input.height + 10
        );
        await kernel.translateShape(inner.shapeId, input.wallThickness, input.wallThickness, -5);
        const hollowed = await kernel.booleanSubtract(outer.shapeId, inner.shapeId);
        shapeId = hollowed.shapeId;
        break;

      case 'tube-round':
      case 'pipe':
        const outerCyl = await kernel.createCylinder(input.size / 2, input.height);
        const innerCyl = await kernel.createCylinder(
          input.size / 2 - input.wallThickness,
          input.height + 10
        );
        await kernel.translateShape(innerCyl.shapeId, 0, 0, -5);
        const pipe = await kernel.booleanSubtract(outerCyl.shapeId, innerCyl.shapeId);
        shapeId = pipe.shapeId;
        break;

      default:
        // W-flange column (simplified as solid)
        const wCol = await kernel.createBox(input.size, input.size * 0.9, input.height);
        shapeId = wCol.shapeId;
    }

    this.reportProgress(context, 40, 'Column shaft created');

    // Add base plate if requested
    if (input.includeBasePlate) {
      const basePlate = await kernel.createBox(
        input.basePlateSize,
        input.basePlateSize,
        input.basePlateThickness
      );

      // Center base plate under column
      const offset = (input.basePlateSize - input.size) / 2;
      await kernel.translateShape(basePlate.shapeId, -offset, -offset, -input.basePlateThickness);

      const withBase = await kernel.booleanUnion(shapeId, basePlate.shapeId);
      shapeId = withBase.shapeId;

      // Add anchor bolt holes
      const boltInset = input.basePlateSize * 0.15;
      const boltDiameter = input.basePlateThickness;
      const boltPositions = [
        { x: boltInset - offset, y: boltInset - offset },
        { x: input.basePlateSize - boltInset - offset, y: boltInset - offset },
        { x: boltInset - offset, y: input.basePlateSize - boltInset - offset },
        { x: input.basePlateSize - boltInset - offset, y: input.basePlateSize - boltInset - offset },
      ];

      for (const pos of boltPositions) {
        const hole = await kernel.createCylinder(boltDiameter / 2, input.basePlateThickness + 10);
        await kernel.translateShape(hole.shapeId, pos.x, pos.y, -input.basePlateThickness - 5);
        const withHole = await kernel.booleanSubtract(shapeId, hole.shapeId);
        shapeId = withHole.shapeId;
      }

      this.reportProgress(context, 60, 'Base plate added');
    }

    // Add cap plate if requested
    if (input.includeCapPlate) {
      const capPlate = await kernel.createBox(
        input.size * 1.2,
        input.size * 1.2,
        input.basePlateThickness
      );

      const capOffset = (input.size * 1.2 - input.size) / 2;
      await kernel.translateShape(capPlate.shapeId, -capOffset, -capOffset, input.height);

      const withCap = await kernel.booleanUnion(shapeId, capPlate.shapeId);
      shapeId = withCap.shapeId;

      this.reportProgress(context, 80, 'Cap plate added');
    }

    // Position at point A
    const translated = await kernel.translateShape(
      shapeId,
      context.pointA.x,
      context.pointA.y,
      context.pointA.z
    );
    shapeId = translated.shapeId;

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      shapeId,
      `${input.profile.toUpperCase()} Column`,
      context.material,
      {
        profile: input.profile,
        size: input.size,
        height: input.height,
        hasBasePlate: input.includeBasePlate,
        hasCapPlate: input.includeCapPlate,
      }
    );

    this.reportProgress(context, 100, 'Column geometry complete');

    return result;
  }

  validate(_context: BuilderContext, input: ColumnInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // Slenderness check
    const slenderness = input.height / input.size;
    if (slenderness > 50) {
      warnings.push({
        code: 'HIGH_SLENDERNESS',
        severity: 'warning',
        message: `Slenderness ratio ${slenderness.toFixed(1)} may require buckling analysis`,
      });
    }

    // Base plate check
    if (input.includeBasePlate && input.basePlateSize < input.size * 1.5) {
      warnings.push({
        code: 'SMALL_BASE_PLATE',
        severity: 'warning',
        message: 'Base plate may be undersized for proper load distribution',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      clearanceChecks: [],
    };
  }
}

// ============================================================================
// BRACING BUILDER
// ============================================================================

export interface BracingInput {
  type: 'diagonal' | 'x-brace' | 'k-brace' | 'v-brace';
  profile: 'angle' | 'tube-round' | 'flat-bar';
  size: number; // Profile size (mm)
  thickness: number; // Wall/thickness (mm)
}

export class BracingBuilder extends BaseGeometryBuilder<BracingInput> {
  elementType = 'bracing';

  async build(context: BuilderContext, input: BracingInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting bracing geometry generation');

    const length = distance3D(context.pointA, context.pointB);

    let shapeId: string;

    switch (input.profile) {
      case 'tube-round':
        const tube = await kernel.createCylinder(input.size / 2, length);
        if (input.size > input.thickness * 4) {
          const inner = await kernel.createCylinder(
            input.size / 2 - input.thickness,
            length + 10
          );
          await kernel.translateShape(inner.shapeId, 0, 0, -5);
          const hollowed = await kernel.booleanSubtract(tube.shapeId, inner.shapeId);
          shapeId = hollowed.shapeId;
        } else {
          shapeId = tube.shapeId;
        }
        break;

      case 'flat-bar':
        const bar = await kernel.createBox(input.size, input.thickness, length);
        shapeId = bar.shapeId;
        break;

      default: // angle
        const horizLeg = await kernel.createBox(input.size, length, input.thickness);
        const vertLeg = await kernel.createBox(input.thickness, length, input.size);
        const angle = await kernel.booleanUnion(horizLeg.shapeId, vertLeg.shapeId);
        shapeId = angle.shapeId;
    }

    this.reportProgress(context, 50, 'Profile created');

    // Rotate to align with A-B direction
    const direction = vectorFromPoints(context.pointA, context.pointB);
    const normalized = normalizeVector(direction);

    // Rotate from Z-up to direction
    const yaw = Math.atan2(normalized.x, normalized.y) * (180 / Math.PI);
    // const pitch = Math.asin(normalized.z) * (180 / Math.PI); // Reserved for future 3D rotation

    // First rotate to horizontal
    const rotated1 = await kernel.rotateShape(shapeId, 'X', 90);
    shapeId = rotated1.shapeId;

    if (yaw !== 0) {
      const rotated2 = await kernel.rotateShape(shapeId, 'Z', yaw);
      shapeId = rotated2.shapeId;
    }

    this.reportProgress(context, 75, 'Oriented to span');

    // Translate to point A
    const translated = await kernel.translateShape(
      shapeId,
      context.pointA.x,
      context.pointA.y,
      context.pointA.z
    );
    shapeId = translated.shapeId;

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      shapeId,
      `${input.type.toUpperCase()} Brace`,
      context.material,
      {
        type: input.type,
        profile: input.profile,
        size: input.size,
        length,
      }
    );

    this.reportProgress(context, 100, 'Bracing geometry complete');

    return result;
  }

  validate(context: BuilderContext, input: BracingInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    const length = distance3D(context.pointA, context.pointB);
    const slenderness = length / input.size;

    if (slenderness > 200) {
      errors.push({
        code: 'EXCESSIVE_SLENDERNESS',
        severity: 'error',
        message: `Slenderness ratio ${slenderness.toFixed(0)} exceeds limit of 200`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      clearanceChecks: [],
    };
  }
}

// ============================================================================
// REGISTER BUILDERS
// ============================================================================

export function registerStructureBuilders(): void {
  registerBuilder(new BeamBuilder());
  registerBuilder(new ColumnBuilder());
  registerBuilder(new BracingBuilder());
}
