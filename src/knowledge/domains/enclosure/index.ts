/**
 * ENCLOSURE Domain - Protective Containment
 *
 * Elements for protecting equipment and personnel:
 * - Guards (machine guards, safety barriers)
 * - Covers (equipment housings, enclosures, cabinets)
 * - Panels (access panels, doors, windows, louvers)
 * - Fencing (perimeter fencing, gates, interlocks)
 * - Sheet Metal (fabrication rules, bend calculations)
 */

// Guards
export { guardElement, calculateGuard, calculateSafetyDistance } from './guards';
export type {
  GuardCalculationInput,
  GuardCalculationResult,
  SafetyDistanceInput,
  SafetyDistanceResult,
} from './guards';

// Covers
export { coverElement, calculateEnclosure, ipRatings } from './covers';
export type {
  EnclosureCalculationInput,
  EnclosureCalculationResult,
  IPRatingInfo,
} from './covers';

// Panels (access panels, doors, windows, louvers)
export {
  accessPanelElement,
  accessDoorElement,
  windowElement,
  louverElement,
  calculateAccessPanel,
  calculateLouver,
} from './panels';
export type {
  AccessPanelInput,
  AccessPanelResult,
  LouverInput,
  LouverResult,
} from './panels';

// Fencing (perimeter fencing, gates, interlocks)
export {
  perimeterFenceElement,
  safetyGateElement,
  safetyInterlockElement,
  getMinSafetyDistance,
  getMaxOpeningSize,
  calculatePostSize,
  calculateMeshSpec,
  calculateFenceLayout,
  generateFenceBOM,
} from './fencing';
export type {
  FenceLayoutInput,
  FenceLayoutResult,
  FenceComponent,
} from './fencing';

// Sheet Metal fabrication
export {
  sheetMetalPartElement,
  sheetMetalMaterials,
  gaugeTable,
  toleranceTable,
  minFeatureRules,
  calculateBend,
  calculateFlatPattern,
  validateMinFeatures,
  getMaterial,
  getGaugeThickness,
  getTolerance,
} from './sheet-metal';
export type {
  SheetMetalMaterial,
  GaugeData,
  ToleranceData,
  MinFeatureRules,
  BendCalculationInput,
  BendCalculationResult,
  FlatPatternInput,
  FlatPatternResult,
  MinFeaturesInput,
  MinFeaturesResult,
} from './sheet-metal';

// All enclosure elements
import { guardElement } from './guards';
import { coverElement } from './covers';
import { accessPanelElement, accessDoorElement, windowElement, louverElement } from './panels';
import { perimeterFenceElement, safetyGateElement, safetyInterlockElement } from './fencing';
import { sheetMetalPartElement } from './sheet-metal';

export const enclosureElements = [
  // Guards & Covers
  guardElement,
  coverElement,
  // Panels
  accessPanelElement,
  accessDoorElement,
  windowElement,
  louverElement,
  // Fencing
  perimeterFenceElement,
  safetyGateElement,
  safetyInterlockElement,
  // Sheet Metal
  sheetMetalPartElement,
];

/**
 * Get element by ID
 */
export function getEnclosureElement(id: string) {
  return enclosureElements.find((e) => e.id === id);
}
