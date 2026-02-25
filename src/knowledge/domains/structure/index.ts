/**
 * STRUCTURE Domain - Complete Structural Elements
 *
 * Elements for structural support:
 * - Steel Frames (I-beams, HSS, channels)
 * - Aluminum Extrusion Frames (T-slot systems)
 * - Individual Beams (steel, wood)
 * - Columns (steel, wood with buckling)
 * - Base Plates & Anchors
 * - Bracing Systems (diagonal, horizontal)
 * - Connections (bolted, welded)
 */

// ============================================================================
// FRAMES
// ============================================================================

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

// ============================================================================
// BEAMS
// ============================================================================

export {
  steelBeamElement,
  woodBeamElement,
  calculateSteelBeam,
  calculateWoodBeam,
  steelBeamSections,
  steelGradeProps,
  woodSections,
  woodGrades,
} from './beams';

export type {
  SteelBeamInput,
  SteelBeamResult,
  WoodBeamInput,
  WoodBeamResult,
} from './beams';

// ============================================================================
// COLUMNS
// ============================================================================

export {
  steelColumnElement,
  woodColumnElement,
  calculateSteelColumn,
  calculateWoodColumn,
  steelColumnSections,
  woodColumnSections,
  kFactors,
} from './columns';

export type {
  SteelColumnInput,
  SteelColumnResult,
  WoodColumnInput,
  WoodColumnResult,
} from './columns';

// ============================================================================
// BASE PLATES & ANCHORS
// ============================================================================

export {
  basePlateElement,
  anchorRodElement,
  calculateBasePlate,
  anchorTable,
  concreteStrengths,
  plateGrades,
} from './base-plates';

export type {
  BasePlateInput,
  BasePlateResult,
} from './base-plates';

// ============================================================================
// BRACING
// ============================================================================

export {
  diagonalBracingElement,
  horizontalBracingElement,
  calculateDiagonalBracing,
  braceSections,
  braceGrades,
} from './bracing';

export type {
  DiagonalBracingInput,
  DiagonalBracingResult,
} from './bracing';

// ============================================================================
// CONNECTIONS
// ============================================================================

export {
  boltedConnectionElement,
  weldedConnectionElement,
  calculateBoltedConnection,
  calculateWeldedConnection,
  boltTable,
  boltStrengths,
  weldStrengths,
} from './connections';

export type {
  BoltedConnectionInput,
  BoltedConnectionResult,
  WeldedConnectionInput,
  WeldedConnectionResult,
} from './connections';

// ============================================================================
// AGGREGATE EXPORTS
// ============================================================================

import { steelFrameElement, extrusionFrameElement } from './frames';
import { steelBeamElement, woodBeamElement } from './beams';
import { steelColumnElement, woodColumnElement } from './columns';
import { basePlateElement, anchorRodElement } from './base-plates';
import { diagonalBracingElement, horizontalBracingElement } from './bracing';
import { boltedConnectionElement, weldedConnectionElement } from './connections';

/**
 * All structure domain elements
 */
export const structureElements = [
  // Frames
  steelFrameElement,
  extrusionFrameElement,
  // Individual Beams
  steelBeamElement,
  woodBeamElement,
  // Columns
  steelColumnElement,
  woodColumnElement,
  // Foundation
  basePlateElement,
  anchorRodElement,
  // Bracing
  diagonalBracingElement,
  horizontalBracingElement,
  // Connections
  boltedConnectionElement,
  weldedConnectionElement,
];

/**
 * Get element by ID
 */
export function getStructureElement(id: string) {
  return structureElements.find(e => e.id === id);
}

/**
 * Get elements by category
 */
export function getStructureElementsByCategory(category: string) {
  const categories: Record<string, string[]> = {
    'frames': ['steel-frame', 'extrusion-frame'],
    'beams': ['steel-beam', 'wood-beam'],
    'columns': ['steel-column', 'wood-column'],
    'foundation': ['base-plate', 'anchor-rod'],
    'bracing': ['diagonal-bracing', 'horizontal-bracing'],
    'connections': ['bolted-connection', 'welded-connection'],
  };

  const elementIds = categories[category] || [];
  return structureElements.filter(e => elementIds.includes(e.id));
}

/**
 * Structure domain summary
 */
export const structureDomainInfo = {
  id: 'STRUCTURE',
  name: 'Structural Systems',
  description: 'Complete structural engineering elements including frames, beams, columns, foundations, bracing, and connections',
  categories: [
    {
      id: 'frames',
      name: 'Structural Frames',
      elements: ['steel-frame', 'extrusion-frame'],
    },
    {
      id: 'beams',
      name: 'Individual Beams',
      elements: ['steel-beam', 'wood-beam'],
    },
    {
      id: 'columns',
      name: 'Columns & Posts',
      elements: ['steel-column', 'wood-column'],
    },
    {
      id: 'foundation',
      name: 'Foundation Connections',
      elements: ['base-plate', 'anchor-rod'],
    },
    {
      id: 'bracing',
      name: 'Bracing Systems',
      elements: ['diagonal-bracing', 'horizontal-bracing'],
    },
    {
      id: 'connections',
      name: 'Member Connections',
      elements: ['bolted-connection', 'welded-connection'],
    },
  ],
  standards: [
    'AISC 360 - Specification for Structural Steel Buildings',
    'AISC 341 - Seismic Provisions for Structural Steel Buildings',
    'ACI 318 - Building Code Requirements for Structural Concrete',
    'NDS - National Design Specification for Wood Construction',
    'AWS D1.1 - Structural Welding Code',
  ],
  elementCount: structureElements.length,
};
