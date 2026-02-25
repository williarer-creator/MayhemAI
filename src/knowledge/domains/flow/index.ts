/**
 * FLOW Domain - Fluid, Air, and Cable Conveyance
 *
 * Elements for transporting fluids, gases, and cables:
 * - Pipes (pressure piping, process piping)
 * - Ducts (HVAC ductwork, exhaust systems)
 * - Cable Trays (cable routing, conduit)
 * - Supports (pipe hangers, duct supports, tray supports)
 */

// Pipes
export { pipeElement, calculatePipe, pipeSizes } from './pipes';
export type {
  PipeCalculationInput,
  PipeCalculationResult,
  PipeSizeData,
} from './pipes';

// Ducts
export { ductElement, calculateDuct, sizeDuct } from './ducts';
export type {
  DuctCalculationInput,
  DuctCalculationResult,
  DuctSizingInput,
  DuctSizingResult,
} from './ducts';

// Cable Trays
export {
  cableTrayElement,
  conduitElement,
  cableTraySizes,
  conduitSizes,
  calculateCableFill,
  calculateCableTray,
  calculateConduitFill,
} from './cable-trays';
export type {
  CableTraySizeData,
  CableFillInput,
  CableFillResult,
  CableTrayCalculationInput,
  CableTrayCalculationResult,
  ConduitSizeData,
  ConduitFillInput,
  ConduitFillResult,
} from './cable-trays';

// Supports
export {
  pipeSupportElement,
  ductSupportElement,
  traySupportElement,
  threadedRodSizes,
  trapezeChannelSizes,
  calculateSupportLoad,
  calculatePipeSupportSpacing,
  generateSupportBOM,
} from './supports';
export type {
  ThreadedRodData,
  TrapezeChannelData,
  SupportLoadInput,
  SupportLoadResult,
  PipeSupportSpacingInput,
  PipeSupportSpacingResult,
  SupportBOMInput,
  SupportBOMItem,
} from './supports';

// All flow elements
import { pipeElement } from './pipes';
import { ductElement } from './ducts';
import { cableTrayElement, conduitElement } from './cable-trays';
import { pipeSupportElement, ductSupportElement, traySupportElement } from './supports';

export const flowElements = [
  // Conveyance
  pipeElement,
  ductElement,
  cableTrayElement,
  conduitElement,
  // Supports
  pipeSupportElement,
  ductSupportElement,
  traySupportElement,
];

/**
 * Get element by ID
 */
export function getFlowElement(id: string) {
  return flowElements.find((e) => e.id === id);
}
