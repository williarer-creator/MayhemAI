/**
 * STRUCTURE Domain - Structural Frames
 *
 * Elements for structural support:
 * - Steel Frames (I-beams, HSS, channels)
 * - Aluminum Extrusion Frames (T-slot systems)
 */

// Element definitions
export {
  steelFrameElement,
  extrusionFrameElement,
  calculateSteelFrame,
  calculateExtrusionFrame,
  steelSections,
  steelGrades,
  extrusionProfiles,
} from './frames';

export type {
  SteelSectionData,
  ExtrusionProfileData,
  SteelFrameCalculationInput,
  SteelFrameCalculationResult,
  ExtrusionFrameCalculationInput,
  ExtrusionFrameCalculationResult,
} from './frames';

// All structure elements
import { steelFrameElement, extrusionFrameElement } from './frames';

export const structureElements = [
  steelFrameElement,
  extrusionFrameElement,
];

/**
 * Get element by ID
 */
export function getStructureElement(id: string) {
  return structureElements.find(e => e.id === id);
}
