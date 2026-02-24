/**
 * MECHANICAL Domain - Hardware and Mounting
 *
 * Elements for mechanical connections and mounting:
 * - Brackets (L-brackets, angle brackets, gussets)
 * - Equipment Mounts (base plates, vibration isolators, anchoring)
 */

// Element definitions
export {
  bracketElement,
  mountElement,
  calculateBracket,
  calculateMount,
  standardBrackets,
  anchorBoltSizes,
} from './brackets';

export type {
  BracketCalculationInput,
  BracketCalculationResult,
  MountCalculationInput,
  MountCalculationResult,
} from './brackets';

// All mechanical elements
import { bracketElement, mountElement } from './brackets';

export const mechanicalElements = [
  bracketElement,
  mountElement,
];

/**
 * Get element by ID
 */
export function getMechanicalElement(id: string) {
  return mechanicalElements.find(e => e.id === id);
}
