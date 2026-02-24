/**
 * ENCLOSURE Domain - Protective Containment
 *
 * Elements for protecting equipment and personnel:
 * - Guards (machine guards, safety barriers)
 * - Covers (equipment housings, enclosures, cabinets)
 */

// Element definitions
export { guardElement, calculateGuard, calculateSafetyDistance } from './guards';
export type { GuardCalculationInput, GuardCalculationResult, SafetyDistanceInput, SafetyDistanceResult } from './guards';

export { coverElement, calculateEnclosure, ipRatings } from './covers';
export type { EnclosureCalculationInput, EnclosureCalculationResult, IPRatingInfo } from './covers';

// All enclosure elements
import { guardElement } from './guards';
import { coverElement } from './covers';

export const enclosureElements = [
  guardElement,
  coverElement,
];

/**
 * Get element by ID
 */
export function getEnclosureElement(id: string) {
  return enclosureElements.find(e => e.id === id);
}
