/**
 * ACCESS Domain Geometry Builders
 *
 * Builds 3D geometry for stairs, ladders, ramps, and platforms.
 */

import * as kernel from '../../core/kernel';
import {
  BaseGeometryBuilder,
  registerBuilder,
} from '../builder';
import type {
  GeometryResult,
  BuilderContext,
  ValidationResult,
} from '../types';

// ============================================================================
// STAIR BUILDER
// ============================================================================

export interface StairInput {
  totalRise: number; // Total height to climb (mm)
  riserHeight: number; // Individual step height (mm)
  treadDepth: number; // Step depth (mm)
  width: number; // Stair width (mm)
  stringerThickness: number; // Thickness of side stringers (mm)
  treadThickness: number; // Thickness of treads (mm)
  includeHandrails: boolean;
  handrailHeight: number; // Height above tread (mm)
}

export class StairBuilder extends BaseGeometryBuilder<StairInput> {
  elementType = 'stairs';

  async build(context: BuilderContext, input: StairInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting stair geometry generation');

    // Calculate number of steps
    const numSteps = Math.ceil(input.totalRise / input.riserHeight);
    const actualRise = input.totalRise / numSteps;
    const totalRun = numSteps * input.treadDepth;

    this.reportProgress(context, 10, `Creating ${numSteps} steps`);

    // Create stringers (side supports)
    const stringerLength = Math.sqrt(
      Math.pow(input.totalRise, 2) + Math.pow(totalRun, 2)
    );
    const stringerAngle = Math.atan2(input.totalRise, totalRun) * (180 / Math.PI);

    // Left stringer
    const leftStringer = await kernel.createBox(
      input.stringerThickness,
      stringerLength + 100, // Extra length for base
      input.width * 0.15 // Stringer depth
    );

    // Rotate and position left stringer
    await kernel.rotateShape(leftStringer.shapeId, 'X', -stringerAngle);
    await kernel.translateShape(
      leftStringer.shapeId,
      context.pointA.x - input.stringerThickness,
      context.pointA.y,
      context.pointA.z
    );

    this.reportProgress(context, 20, 'Created left stringer');

    // Right stringer
    const rightStringer = await kernel.createBox(
      input.stringerThickness,
      stringerLength + 100,
      input.width * 0.15
    );

    await kernel.rotateShape(rightStringer.shapeId, 'X', -stringerAngle);
    await kernel.translateShape(
      rightStringer.shapeId,
      context.pointA.x + input.width,
      context.pointA.y,
      context.pointA.z
    );

    this.reportProgress(context, 30, 'Created right stringer');

    // Create treads
    let combinedShape = leftStringer.shapeId;

    // Union right stringer
    const withRightStringer = await kernel.booleanUnion(
      combinedShape,
      rightStringer.shapeId
    );
    combinedShape = withRightStringer.shapeId;

    for (let i = 0; i < numSteps; i++) {
      const treadX = context.pointA.x;
      const treadY = context.pointA.y + i * input.treadDepth;
      const treadZ = context.pointA.z + (i + 1) * actualRise - input.treadThickness;

      const tread = await kernel.createBox(
        input.width,
        input.treadDepth,
        input.treadThickness
      );

      await kernel.translateShape(tread.shapeId, treadX, treadY, treadZ);

      const union = await kernel.booleanUnion(combinedShape, tread.shapeId);
      combinedShape = union.shapeId;

      this.reportProgress(
        context,
        30 + (i / numSteps) * 40,
        `Created tread ${i + 1} of ${numSteps}`
      );
    }

    // Create handrails if requested
    if (input.includeHandrails) {
      this.reportProgress(context, 75, 'Creating handrails');

      const handrailDiameter = 40; // Standard 40mm handrail
      const handrailLength = stringerLength + 200;

      // Left handrail
      const leftHandrail = await kernel.createCylinder(
        handrailDiameter / 2,
        handrailLength
      );
      await kernel.rotateShape(leftHandrail.shapeId, 'X', 90 - stringerAngle);
      await kernel.translateShape(
        leftHandrail.shapeId,
        context.pointA.x - input.stringerThickness / 2,
        context.pointA.y - 100,
        context.pointA.z + input.handrailHeight
      );

      const withLeftHR = await kernel.booleanUnion(combinedShape, leftHandrail.shapeId);
      combinedShape = withLeftHR.shapeId;

      // Right handrail
      const rightHandrail = await kernel.createCylinder(
        handrailDiameter / 2,
        handrailLength
      );
      await kernel.rotateShape(rightHandrail.shapeId, 'X', 90 - stringerAngle);
      await kernel.translateShape(
        rightHandrail.shapeId,
        context.pointA.x + input.width + input.stringerThickness / 2,
        context.pointA.y - 100,
        context.pointA.z + input.handrailHeight
      );

      const withRightHR = await kernel.booleanUnion(combinedShape, rightHandrail.shapeId);
      combinedShape = withRightHR.shapeId;

      this.reportProgress(context, 90, 'Handrails complete');
    }

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      combinedShape,
      'Stair Assembly',
      context.material,
      {
        numSteps,
        actualRise,
        treadDepth: input.treadDepth,
        totalRun,
        angle: stringerAngle,
      }
    );

    this.reportProgress(context, 100, 'Stair geometry complete');

    return result;
  }

  validate(_context: BuilderContext, input: StairInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // IBC code checks
    if (input.riserHeight > 178) {
      // 7" max
      errors.push({
        code: 'RISER_TOO_HIGH',
        severity: 'error',
        message: `Riser height ${input.riserHeight}mm exceeds IBC maximum of 178mm (7")`,
      });
    }

    if (input.treadDepth < 279) {
      // 11" min
      errors.push({
        code: 'TREAD_TOO_SHALLOW',
        severity: 'error',
        message: `Tread depth ${input.treadDepth}mm is below IBC minimum of 279mm (11")`,
      });
    }

    if (input.width < 914) {
      // 36" min
      warnings.push({
        code: 'WIDTH_NARROW',
        severity: 'warning',
        message: `Stair width ${input.width}mm is below IBC minimum of 914mm (36")`,
      });
    }

    // Check riser/tread relationship
    const combined = 2 * input.riserHeight + input.treadDepth;
    if (combined < 610 || combined > 660) {
      warnings.push({
        code: 'COMFORT_RATIO',
        severity: 'warning',
        message: `2R + T = ${combined}mm (recommended 610-660mm for comfort)`,
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
// LADDER BUILDER
// ============================================================================

export interface LadderInput {
  height: number; // Total climb height (mm)
  width: number; // Width between rails (mm)
  rungSpacing: number; // Distance between rungs (mm)
  rungDiameter: number; // Rung diameter (mm)
  railWidth: number; // Side rail width (mm)
  railDepth: number; // Side rail depth (mm)
  includeCage: boolean;
  cageStartHeight: number; // Height where cage starts (mm)
}

export class LadderBuilder extends BaseGeometryBuilder<LadderInput> {
  elementType = 'ladder';

  async build(context: BuilderContext, input: LadderInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting ladder geometry generation');

    // Create side rails
    const leftRail = await kernel.createBox(
      input.railWidth,
      input.railDepth,
      input.height + 1000 // Extend above top
    );

    await kernel.translateShape(
      leftRail.shapeId,
      context.pointA.x - input.railWidth,
      context.pointA.y,
      context.pointA.z
    );

    const rightRail = await kernel.createBox(
      input.railWidth,
      input.railDepth,
      input.height + 1000
    );

    await kernel.translateShape(
      rightRail.shapeId,
      context.pointA.x + input.width,
      context.pointA.y,
      context.pointA.z
    );

    let combinedShape = leftRail.shapeId;
    const withRight = await kernel.booleanUnion(combinedShape, rightRail.shapeId);
    combinedShape = withRight.shapeId;

    this.reportProgress(context, 20, 'Created side rails');

    // Create rungs
    const numRungs = Math.floor(input.height / input.rungSpacing);

    for (let i = 0; i < numRungs; i++) {
      const rungZ = context.pointA.z + (i + 1) * input.rungSpacing;

      const rung = await kernel.createCylinder(input.rungDiameter / 2, input.width);

      await kernel.rotateShape(rung.shapeId, 'Y', 90);
      await kernel.translateShape(
        rung.shapeId,
        context.pointA.x,
        context.pointA.y + input.railDepth / 2,
        rungZ
      );

      const union = await kernel.booleanUnion(combinedShape, rung.shapeId);
      combinedShape = union.shapeId;

      this.reportProgress(
        context,
        20 + (i / numRungs) * 50,
        `Created rung ${i + 1} of ${numRungs}`
      );
    }

    // Create cage if required (OSHA requirement for >6m)
    if (input.includeCage && input.height > input.cageStartHeight) {
      this.reportProgress(context, 75, 'Creating safety cage');

      const cageHeight = input.height - input.cageStartHeight;
      const cageRadius = input.width / 2 + 200; // 200mm clearance
      const numHoops = Math.floor(cageHeight / 750); // Hoops every 750mm

      for (let i = 0; i < numHoops; i++) {
        const hoopZ = context.pointA.z + input.cageStartHeight + (i + 1) * 750;

        // Create hoop as torus section
        const hoop = await kernel.createTorus(cageRadius, 15); // 15mm tube

        await kernel.translateShape(
          hoop.shapeId,
          context.pointA.x + input.width / 2,
          context.pointA.y + cageRadius,
          hoopZ
        );

        // Cut to half (back half only)
        const cutter = await kernel.createBox(cageRadius * 3, cageRadius * 2, 100);
        await kernel.translateShape(
          cutter.shapeId,
          context.pointA.x + input.width / 2 - cageRadius * 1.5,
          context.pointA.y - cageRadius,
          hoopZ - 50
        );

        const halfHoop = await kernel.booleanSubtract(hoop.shapeId, cutter.shapeId);

        const union = await kernel.booleanUnion(combinedShape, halfHoop.shapeId);
        combinedShape = union.shapeId;
      }

      this.reportProgress(context, 90, 'Safety cage complete');
    }

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      combinedShape,
      'Ladder Assembly',
      context.material,
      {
        height: input.height,
        numRungs,
        hasCage: input.includeCage,
      }
    );

    this.reportProgress(context, 100, 'Ladder geometry complete');

    return result;
  }

  validate(_context: BuilderContext, input: LadderInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // OSHA 1910.23 checks
    if (input.rungSpacing > 305) {
      // 12" max
      errors.push({
        code: 'RUNG_SPACING_EXCEEDED',
        severity: 'error',
        message: `Rung spacing ${input.rungSpacing}mm exceeds OSHA maximum of 305mm (12")`,
      });
    }

    if (input.width < 406) {
      // 16" min
      errors.push({
        code: 'WIDTH_TOO_NARROW',
        severity: 'error',
        message: `Ladder width ${input.width}mm is below OSHA minimum of 406mm (16")`,
      });
    }

    if (input.height > 6096 && !input.includeCage) {
      // 20' requires cage
      errors.push({
        code: 'CAGE_REQUIRED',
        severity: 'error',
        message: 'Safety cage required for ladders over 6096mm (20 ft)',
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
// RAMP BUILDER
// ============================================================================

export interface RampInput {
  totalRise: number; // Height change (mm)
  slope: number; // Slope ratio (e.g., 12 for 1:12)
  width: number; // Ramp width (mm)
  surfaceThickness: number; // Walking surface thickness (mm)
  includeHandrails: boolean;
  includeLandings: boolean;
  maxRunLength: number; // Max run before landing (mm)
}

export class RampBuilder extends BaseGeometryBuilder<RampInput> {
  elementType = 'ramp';

  async build(context: BuilderContext, input: RampInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting ramp geometry generation');

    // Calculate total run
    const totalRun = input.totalRise * input.slope;
    const rampAngle = Math.atan2(input.totalRise, totalRun) * (180 / Math.PI);

    // Determine if landings are needed
    const numSegments = input.includeLandings
      ? Math.ceil(totalRun / input.maxRunLength)
      : 1;

    const segmentRun = totalRun / numSegments;
    const segmentRise = input.totalRise / numSegments;
    const landingLength = 1500; // Standard landing length

    this.reportProgress(context, 10, `Creating ${numSegments} ramp segments`);

    // Create ramp surface profile
    const rampLength = Math.sqrt(
      Math.pow(segmentRise, 2) + Math.pow(segmentRun, 2)
    );

    let combinedShape: string | null = null;
    let currentZ = context.pointA.z;
    let currentY = context.pointA.y;

    for (let i = 0; i < numSegments; i++) {
      // Create ramp segment
      const segment = await kernel.createBox(
        input.width,
        rampLength,
        input.surfaceThickness
      );

      await kernel.rotateShape(segment.shapeId, 'X', -rampAngle);
      await kernel.translateShape(segment.shapeId, context.pointA.x, currentY, currentZ);

      if (combinedShape === null) {
        combinedShape = segment.shapeId;
      } else {
        const union = await kernel.booleanUnion(combinedShape, segment.shapeId);
        combinedShape = union.shapeId;
      }

      currentY += segmentRun;
      currentZ += segmentRise;

      // Add landing if not last segment
      if (i < numSegments - 1 && input.includeLandings) {
        const landing = await kernel.createBox(
          input.width,
          landingLength,
          input.surfaceThickness
        );

        await kernel.translateShape(landing.shapeId, context.pointA.x, currentY, currentZ);

        const union = await kernel.booleanUnion(combinedShape, landing.shapeId);
        combinedShape = union.shapeId;

        currentY += landingLength;
      }

      this.reportProgress(
        context,
        10 + (i / numSegments) * 60,
        `Created segment ${i + 1} of ${numSegments}`
      );
    }

    // Add handrails if requested
    if (input.includeHandrails && combinedShape) {
      this.reportProgress(context, 75, 'Creating handrails');

      const handrailHeight = 865; // ADA compliant height
      const handrailDiameter = 40;

      // Simplified handrail - straight sections
      const leftHR = await kernel.createCylinder(
        handrailDiameter / 2,
        totalRun + (numSegments - 1) * landingLength + 300
      );
      await kernel.rotateShape(leftHR.shapeId, 'X', 90);
      await kernel.translateShape(
        leftHR.shapeId,
        context.pointA.x - 50,
        context.pointA.y - 150,
        context.pointA.z + handrailHeight
      );

      const withLeftHR = await kernel.booleanUnion(combinedShape, leftHR.shapeId);
      combinedShape = withLeftHR.shapeId;

      const rightHR = await kernel.createCylinder(
        handrailDiameter / 2,
        totalRun + (numSegments - 1) * landingLength + 300
      );
      await kernel.rotateShape(rightHR.shapeId, 'X', 90);
      await kernel.translateShape(
        rightHR.shapeId,
        context.pointA.x + input.width + 50,
        context.pointA.y - 150,
        context.pointA.z + handrailHeight
      );

      const withRightHR = await kernel.booleanUnion(combinedShape, rightHR.shapeId);
      combinedShape = withRightHR.shapeId;
    }

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      combinedShape!,
      'Ramp Assembly',
      context.material,
      {
        totalRise: input.totalRise,
        totalRun,
        slope: `1:${input.slope}`,
        angle: rampAngle,
        numSegments,
      }
    );

    this.reportProgress(context, 100, 'Ramp geometry complete');

    return result;
  }

  validate(_context: BuilderContext, input: RampInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // ADA compliance checks
    if (input.slope < 12) {
      errors.push({
        code: 'SLOPE_TOO_STEEP',
        severity: 'error',
        message: `Slope 1:${input.slope} exceeds ADA maximum of 1:12`,
      });
    }

    if (input.width < 914) {
      errors.push({
        code: 'WIDTH_TOO_NARROW',
        severity: 'error',
        message: `Ramp width ${input.width}mm is below ADA minimum of 914mm (36")`,
      });
    }

    const runLength = input.totalRise * input.slope;
    if (runLength > 9144 && !input.includeLandings) {
      // 30' max run
      errors.push({
        code: 'LANDING_REQUIRED',
        severity: 'error',
        message: 'Landing required for runs exceeding 9144mm (30 ft)',
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
// PLATFORM BUILDER
// ============================================================================

export interface PlatformInput {
  width: number; // Platform width (mm)
  depth: number; // Platform depth (mm)
  height: number; // Platform height from ground (mm)
  deckThickness: number; // Deck plate thickness (mm)
  frameSize: number; // Frame member size (mm)
  includeGuardrails: boolean;
  guardrailHeight: number;
  includeToeBoard: boolean;
  toeBoardHeight: number;
  includeGrating: boolean;
  gratingBarSpacing: number;
}

export class PlatformBuilder extends BaseGeometryBuilder<PlatformInput> {
  elementType = 'platform';

  async build(context: BuilderContext, input: PlatformInput): Promise<GeometryResult> {
    await kernel.initKernel();

    this.reportProgress(context, 0, 'Starting platform geometry generation');

    // Create deck surface
    const deck = await kernel.createBox(
      input.width,
      input.depth,
      input.deckThickness
    );

    await kernel.translateShape(
      deck.shapeId,
      context.pointA.x,
      context.pointA.y,
      context.pointA.z + input.height - input.deckThickness
    );

    let combinedShape = deck.shapeId;

    this.reportProgress(context, 15, 'Created deck');

    // Create frame
    // Front beam
    const frontBeam = await kernel.createBox(
      input.width,
      input.frameSize,
      input.frameSize
    );
    await kernel.translateShape(
      frontBeam.shapeId,
      context.pointA.x,
      context.pointA.y,
      context.pointA.z + input.height - input.deckThickness - input.frameSize
    );
    const withFront = await kernel.booleanUnion(combinedShape, frontBeam.shapeId);
    combinedShape = withFront.shapeId;

    // Back beam
    const backBeam = await kernel.createBox(
      input.width,
      input.frameSize,
      input.frameSize
    );
    await kernel.translateShape(
      backBeam.shapeId,
      context.pointA.x,
      context.pointA.y + input.depth - input.frameSize,
      context.pointA.z + input.height - input.deckThickness - input.frameSize
    );
    const withBack = await kernel.booleanUnion(combinedShape, backBeam.shapeId);
    combinedShape = withBack.shapeId;

    this.reportProgress(context, 30, 'Created frame beams');

    // Create legs (4 corners)
    const legPositions = [
      { x: 0, y: 0 },
      { x: input.width - input.frameSize, y: 0 },
      { x: 0, y: input.depth - input.frameSize },
      { x: input.width - input.frameSize, y: input.depth - input.frameSize },
    ];

    for (let i = 0; i < legPositions.length; i++) {
      const leg = await kernel.createBox(
        input.frameSize,
        input.frameSize,
        input.height - input.deckThickness
      );

      await kernel.translateShape(
        leg.shapeId,
        context.pointA.x + legPositions[i].x,
        context.pointA.y + legPositions[i].y,
        context.pointA.z
      );

      const union = await kernel.booleanUnion(combinedShape, leg.shapeId);
      combinedShape = union.shapeId;

      this.reportProgress(context, 30 + (i / 4) * 20, `Created leg ${i + 1} of 4`);
    }

    // Add guardrails if requested
    if (input.includeGuardrails) {
      this.reportProgress(context, 55, 'Creating guardrails');

      const railDiameter = 40;
      const postSize = 50;

      // Corner posts
      for (const pos of legPositions) {
        const post = await kernel.createBox(
          postSize,
          postSize,
          input.guardrailHeight
        );

        await kernel.translateShape(
          post.shapeId,
          context.pointA.x + pos.x,
          context.pointA.y + pos.y,
          context.pointA.z + input.height
        );

        const union = await kernel.booleanUnion(combinedShape, post.shapeId);
        combinedShape = union.shapeId;
      }

      // Top rails (simplified - just 4 sides)
      const topRailZ = context.pointA.z + input.height + input.guardrailHeight - railDiameter;

      // Front rail
      const frontRail = await kernel.createCylinder(railDiameter / 2, input.width);
      await kernel.rotateShape(frontRail.shapeId, 'Y', 90);
      await kernel.translateShape(
        frontRail.shapeId,
        context.pointA.x,
        context.pointA.y + postSize / 2,
        topRailZ
      );
      const withFrontRail = await kernel.booleanUnion(combinedShape, frontRail.shapeId);
      combinedShape = withFrontRail.shapeId;

      // Back rail
      const backRail = await kernel.createCylinder(railDiameter / 2, input.width);
      await kernel.rotateShape(backRail.shapeId, 'Y', 90);
      await kernel.translateShape(
        backRail.shapeId,
        context.pointA.x,
        context.pointA.y + input.depth - postSize / 2,
        topRailZ
      );
      const withBackRail = await kernel.booleanUnion(combinedShape, backRail.shapeId);
      combinedShape = withBackRail.shapeId;

      this.reportProgress(context, 75, 'Guardrails complete');
    }

    // Add toe boards if requested
    if (input.includeToeBoard) {
      this.reportProgress(context, 80, 'Creating toe boards');

      const toeThickness = 6;

      // Front toe board
      const frontToe = await kernel.createBox(
        input.width,
        toeThickness,
        input.toeBoardHeight
      );
      await kernel.translateShape(
        frontToe.shapeId,
        context.pointA.x,
        context.pointA.y,
        context.pointA.z + input.height
      );
      const withFrontToe = await kernel.booleanUnion(combinedShape, frontToe.shapeId);
      combinedShape = withFrontToe.shapeId;

      this.reportProgress(context, 90, 'Toe boards complete');
    }

    this.reportProgress(context, 95, 'Finalizing geometry');

    const result = await this.createGeometryResult(
      combinedShape,
      'Platform Assembly',
      context.material,
      {
        width: input.width,
        depth: input.depth,
        height: input.height,
        hasGuardrails: input.includeGuardrails,
        hasToeBoard: input.includeToeBoard,
      }
    );

    this.reportProgress(context, 100, 'Platform geometry complete');

    return result;
  }

  validate(_context: BuilderContext, input: PlatformInput): ValidationResult {
    const errors: { code: string; severity: 'error' | 'warning'; message: string }[] = [];
    const warnings: { code: string; severity: 'error' | 'warning'; message: string }[] = [];

    // OSHA guardrail requirements
    if (input.height > 1219 && !input.includeGuardrails) {
      // 4' fall protection
      errors.push({
        code: 'GUARDRAIL_REQUIRED',
        severity: 'error',
        message: 'Guardrails required for platforms over 1219mm (4 ft)',
      });
    }

    if (input.includeGuardrails && input.guardrailHeight < 1067) {
      // 42" min
      errors.push({
        code: 'GUARDRAIL_TOO_LOW',
        severity: 'error',
        message: `Guardrail height ${input.guardrailHeight}mm below OSHA minimum of 1067mm (42")`,
      });
    }

    if (input.includeToeBoard && input.toeBoardHeight < 89) {
      // 3.5" min
      warnings.push({
        code: 'TOEBOARD_TOO_LOW',
        severity: 'warning',
        message: `Toe board height ${input.toeBoardHeight}mm below OSHA minimum of 89mm (3.5")`,
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

export function registerAccessBuilders(): void {
  registerBuilder(new StairBuilder());
  registerBuilder(new LadderBuilder());
  registerBuilder(new RampBuilder());
  registerBuilder(new PlatformBuilder());
}
