/**
 * Manufacturing Output Module
 *
 * Generators for manufacturing outputs:
 * - Cut lists
 * - DXF files for laser/plasma/CNC
 * - G-code for milling/routing
 * - Construction drawings
 * - Part nesting optimization
 */

// Types
export * from './types';

// Cut list generation
export {
  generateCutList,
  formatCutListAsText,
  formatCutListAsCSV,
  formatCutListAsJSON,
} from './cut-list';
export type { CutListInput, CutListOptions } from './cut-list';

// DXF export
export {
  generateDXF,
  createRectangle,
  createHole,
  createBoltPattern,
  createSlot,
  createLabel,
  generateBasePlateProfile,
} from './dxf-export';
export type { BasePlateProfile } from './dxf-export';

// G-code generation
export {
  generateGCode,
  rapid,
  linear,
  arcCW,
  arcCCW,
  drill,
  toolChange,
  spindleOn,
  comment,
  rectanglePocket,
  drillHolePattern,
  profileContour,
} from './gcode';
export type { GCodeProgram, ContourOptions } from './gcode';

// Drawing generation
export {
  generateDrawing,
  generateBOM,
  generateStairFrontView,
  generateStairSideView,
} from './drawing';
export type { DrawingContent, ViewContent, DrawingElement } from './drawing';

// Nesting optimization
export {
  nestParts,
  nestLinearParts,
  formatNestingReport,
  formatLinearNestingReport,
} from './nesting';
export type { LinearNestingInput, LinearNestingResult } from './nesting';
