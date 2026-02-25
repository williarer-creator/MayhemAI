/**
 * MECHANICAL Domain - Motion and Power Transmission
 *
 * Elements for mechanical connections and motion:
 * - Brackets (L-brackets, angle brackets, gussets)
 * - Equipment Mounts (base plates, vibration isolators, anchoring)
 * - Linkages (four-bar, slider-crank, bell cranks)
 * - Shafts (power transmission, torque, deflection)
 * - Couplings (rigid, flexible, universal)
 * - Bearings (ball, roller, plain)
 */

// Brackets
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

// Linkages
export {
  linkageElement,
  bellCrankElement,
  analyzeFourBar,
  analyzeSliderCrank,
  analyzeBellCrank,
  selectPivotBearing,
  pivotBearings,
} from './linkages';
export type {
  FourBarInput,
  FourBarResult,
  SliderCrankInput,
  SliderCrankResult,
  BellCrankInput,
  BellCrankResult,
  PivotBearingData,
} from './linkages';

// Shafts, Couplings, and Bearings
export {
  shaftElement,
  couplingElement,
  bearingElement,
  designShaft,
  selectBearing,
  selectCoupling,
  getKeywaySize,
  getShaftMaterial,
  calculatePower,
  calculateTorque,
  shaftMaterials,
  keywayStandard,
  ballBearings6200Series,
  ballBearings6300Series,
  couplingDatabase,
} from './shafts';
export type {
  ShaftMaterial,
  KeywaySize,
  BearingSize,
  CouplingData,
  ShaftDesignInput,
  ShaftDesignResult,
  BearingSelectionInput,
  BearingSelectionResult,
  CouplingSelectionInput,
  CouplingSelectionResult,
} from './shafts';

// All mechanical elements
import { bracketElement, mountElement } from './brackets';
import { linkageElement, bellCrankElement } from './linkages';
import { shaftElement, couplingElement, bearingElement } from './shafts';

export const mechanicalElements = [
  // Mounting
  bracketElement,
  mountElement,
  // Linkages
  linkageElement,
  bellCrankElement,
  // Power Transmission
  shaftElement,
  couplingElement,
  bearingElement,
];

/**
 * Get element by ID
 */
export function getMechanicalElement(id: string) {
  return mechanicalElements.find((e) => e.id === id);
}
