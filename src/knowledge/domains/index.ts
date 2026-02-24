/**
 * Knowledge Domains Index
 *
 * Five primary domains:
 * 1. ACCESS - Stairs, ladders, ramps, platforms
 * 2. ENCLOSURE - Guards, covers, housings, panels
 * 3. FLOW - Pipes, ducts, conduits
 * 4. MECHANICAL - Brackets, mounts, hardware
 * 5. STRUCTURE - Beams, frames, extrusions
 */

// ACCESS Domain
export * from './access';

// ENCLOSURE Domain
export * from './enclosure';

// FLOW Domain
export * from './flow';

// MECHANICAL Domain
export * from './mechanical';

// STRUCTURE Domain
export * from './structure';

// Aggregate all elements
import { accessElements } from './access';
import { enclosureElements } from './enclosure';
import { flowElements } from './flow';
import { mechanicalElements } from './mechanical';
import { structureElements } from './structure';

export const allElements = [
  ...accessElements,
  ...enclosureElements,
  ...flowElements,
  ...mechanicalElements,
  ...structureElements,
];

/**
 * Get all elements organized by domain
 */
export function getElementsByDomain() {
  return {
    ACCESS: accessElements,
    ENCLOSURE: enclosureElements,
    FLOW: flowElements,
    MECHANICAL: mechanicalElements,
    STRUCTURE: structureElements,
  };
}
