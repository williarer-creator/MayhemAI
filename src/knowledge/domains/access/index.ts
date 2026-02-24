/**
 * ACCESS Domain - Vertical and Horizontal Movement
 *
 * Elements for connecting different elevations and areas:
 * - Stairs (standard, industrial, ship's ladder)
 * - Ladders (fixed, caged)
 * - Ramps (ADA, vehicle, loading)
 * - Platforms (mezzanine, work platforms, landings)
 */

// Element definitions
export { stairsElement, calculateStairs } from './stairs';
export type { StairCalculationInput, StairCalculationResult } from './stairs';

export { ladderElement, calculateLadder } from './ladders';
export type { LadderCalculationInput, LadderCalculationResult } from './ladders';

export { rampElement, calculateRamp } from './ramps';
export type { RampCalculationInput, RampCalculationResult } from './ramps';

export { platformElement, calculatePlatform } from './platforms';
export type { PlatformCalculationInput, PlatformCalculationResult } from './platforms';

// Geometry generators
export { generateStairGeometry } from './stairGenerator';
export type { StairGeometryInput, StairGeometryResult } from './stairGenerator';

// All access elements
import { stairsElement } from './stairs';
import { ladderElement } from './ladders';
import { rampElement } from './ramps';
import { platformElement } from './platforms';

export const accessElements = [
  stairsElement,
  ladderElement,
  rampElement,
  platformElement,
];

/**
 * Get element by ID
 */
export function getAccessElement(id: string) {
  return accessElements.find(e => e.id === id);
}
