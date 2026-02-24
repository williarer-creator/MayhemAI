/**
 * FLOW Domain - Fluid and Air Conveyance
 *
 * Elements for transporting fluids and gases:
 * - Pipes (pressure piping, process piping)
 * - Ducts (HVAC ductwork, exhaust systems)
 */

// Element definitions
export { pipeElement, calculatePipe, pipeSizes } from './pipes';
export type { PipeCalculationInput, PipeCalculationResult, PipeSizeData } from './pipes';

export { ductElement, calculateDuct, sizeDuct } from './ducts';
export type { DuctCalculationInput, DuctCalculationResult, DuctSizingInput, DuctSizingResult } from './ducts';

// All flow elements
import { pipeElement } from './pipes';
import { ductElement } from './ducts';

export const flowElements = [
  pipeElement,
  ductElement,
];

/**
 * Get element by ID
 */
export function getFlowElement(id: string) {
  return flowElements.find(e => e.id === id);
}
