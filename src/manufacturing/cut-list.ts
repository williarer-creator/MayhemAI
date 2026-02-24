/**
 * Cut List Generator
 *
 * Generates optimized cut lists from component lists.
 * Includes material summaries and nesting suggestions.
 */

import type {
  CutList,
  CutListItem,
  MaterialSummary,
  ProfileSummary,
} from './types';
import type { GeneratedComponent, ComponentCutListItem } from '../knowledge/types';

// =============================================================================
// CUT LIST GENERATION
// =============================================================================

export interface CutListInput {
  projectName: string;
  elementType: string;
  components: GeneratedComponent[];
  options?: CutListOptions;
}

export interface CutListOptions {
  includeHardware?: boolean;    // Include bolts, nuts, etc.
  groupByProfile?: boolean;     // Group items by profile
  groupByMaterial?: boolean;    // Group items by material
  addCuttingAllowance?: number; // mm to add for cutting
  roundLengths?: boolean;       // Round to standard lengths
}

/**
 * Generate a cut list from components
 */
export function generateCutList(input: CutListInput): CutList {
  const options = input.options || {};
  const items: CutListItem[] = [];

  // Process each component
  for (const component of input.components) {
    if (!component.cutList) continue;

    for (const cut of component.cutList) {
      // Apply cutting allowance if specified
      let length = cut.length;
      if (options.addCuttingAllowance) {
        length += options.addCuttingAllowance * 2; // Both ends
      }

      // Round to standard lengths if requested
      if (options.roundLengths) {
        length = roundToStandardLength(length);
      }

      const item: CutListItem = {
        id: `${component.name}-${cut.description}`.replace(/\s+/g, '-').toLowerCase(),
        partName: cut.description,
        material: cut.material,
        profile: cut.profile,
        quantity: cut.quantity,
        length: Math.round(length),
        weight: cut.weight,
        totalWeight: cut.weight * cut.quantity,
        operations: extractOperations(component, cut),
        notes: cut.notes,
      };

      // Add dimensions for plates
      if (cut.profile.includes('plate') || cut.profile.includes('PL')) {
        item.thickness = extractThickness(cut.profile);
        if (cut.width) {
          item.width = cut.width;
        }
      }

      items.push(item);
    }
  }

  // Sort items
  if (options.groupByMaterial) {
    items.sort((a, b) => a.material.localeCompare(b.material));
  } else if (options.groupByProfile) {
    items.sort((a, b) => a.profile.localeCompare(b.profile));
  }

  // Calculate totals
  const totalWeight = items.reduce((sum, item) => sum + item.totalWeight, 0);

  // Generate summaries
  const materialSummary = generateMaterialSummary(items);
  const profileSummary = generateProfileSummary(items);

  return {
    projectName: input.projectName,
    elementType: input.elementType,
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    totalWeight: Math.round(totalWeight * 100) / 100,
    items,
    materialSummary,
    profileSummary,
  };
}

/**
 * Generate material summary
 */
function generateMaterialSummary(items: CutListItem[]): MaterialSummary[] {
  const summary = new Map<string, MaterialSummary>();

  for (const item of items) {
    const existing = summary.get(item.material);
    if (existing) {
      existing.totalWeight += item.totalWeight;
      existing.itemCount += item.quantity;
    } else {
      summary.set(item.material, {
        material: item.material,
        totalWeight: item.totalWeight,
        itemCount: item.quantity,
      });
    }
  }

  return Array.from(summary.values())
    .sort((a, b) => b.totalWeight - a.totalWeight);
}

/**
 * Generate profile summary
 */
function generateProfileSummary(items: CutListItem[]): ProfileSummary[] {
  const summary = new Map<string, ProfileSummary>();

  for (const item of items) {
    const existing = summary.get(item.profile);
    if (existing) {
      existing.totalLength += item.length * item.quantity;
      existing.quantity += item.quantity;
    } else {
      summary.set(item.profile, {
        profile: item.profile,
        totalLength: item.length * item.quantity,
        quantity: item.quantity,
      });
    }
  }

  // Add nested length estimates
  const result = Array.from(summary.values());
  for (const profile of result) {
    profile.nestedLength = calculateNestedLength(profile.totalLength, profile.profile);
  }

  return result.sort((a, b) => b.totalLength - a.totalLength);
}

/**
 * Round to standard stock lengths
 */
function roundToStandardLength(length: number): number {
  // Standard stock lengths in mm
  const standardLengths = [
    1000, 1200, 1500, 2000, 2400, 2500, 3000,
    3600, 4000, 4500, 5000, 6000, 7000, 8000, 9000, 10000, 12000,
  ];

  // Find the smallest standard length that fits
  for (const stdLen of standardLengths) {
    if (stdLen >= length) {
      return length; // Keep actual length, but note standard available
    }
  }

  return length;
}

/**
 * Extract operations from component
 */
function extractOperations(
  component: GeneratedComponent,
  _cut: ComponentCutListItem
): string[] {
  const operations: string[] = [];

  // Add based on component type and features
  if (component.name.includes('stringer') || component.name.includes('rail')) {
    operations.push('Notch for treads');
  }

  if (component.name.includes('post')) {
    operations.push('Drill mounting holes');
    operations.push('Chamfer top');
  }

  if (component.name.includes('tread')) {
    operations.push('Edge treatment');
  }

  return operations;
}

/**
 * Extract thickness from profile string
 */
function extractThickness(profile: string): number {
  // Parse "PL10" or "6mm plate" etc.
  const match = profile.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 6;
}

/**
 * Calculate nested length considering standard bar lengths
 */
function calculateNestedLength(totalLength: number, profile: string): number {
  // Standard bar lengths: 6m for most profiles, 12m for some
  const standardBarLength = profile.includes('tube') ? 6000 : 6000;

  // How many full bars needed
  const barsNeeded = Math.ceil(totalLength / standardBarLength);

  // This is a simplified calculation - real nesting would be more complex
  return barsNeeded * standardBarLength;
}

// =============================================================================
// CUT LIST FORMATTING
// =============================================================================

/**
 * Format cut list as text
 */
export function formatCutListAsText(cutList: CutList): string {
  const lines: string[] = [];

  lines.push('=' .repeat(80));
  lines.push(`CUT LIST: ${cutList.projectName}`);
  lines.push(`Element: ${cutList.elementType}`);
  lines.push(`Generated: ${cutList.generatedAt}`);
  lines.push('=' .repeat(80));
  lines.push('');

  // Items table
  lines.push('PARTS LIST');
  lines.push('-'.repeat(80));
  lines.push(
    'Part Name'.padEnd(25) +
    'Material'.padEnd(12) +
    'Profile'.padEnd(15) +
    'Qty'.padStart(5) +
    'Length'.padStart(10) +
    'Weight'.padStart(10)
  );
  lines.push('-'.repeat(80));

  for (const item of cutList.items) {
    lines.push(
      item.partName.substring(0, 24).padEnd(25) +
      item.material.substring(0, 11).padEnd(12) +
      item.profile.substring(0, 14).padEnd(15) +
      String(item.quantity).padStart(5) +
      `${item.length}mm`.padStart(10) +
      `${item.totalWeight.toFixed(1)}kg`.padStart(10)
    );

    if (item.operations && item.operations.length > 0) {
      lines.push('    Operations: ' + item.operations.join(', '));
    }
  }

  lines.push('-'.repeat(80));
  lines.push(`Total Items: ${cutList.totalItems}`);
  lines.push(`Total Weight: ${cutList.totalWeight.toFixed(1)} kg`);
  lines.push('');

  // Material summary
  lines.push('MATERIAL SUMMARY');
  lines.push('-'.repeat(40));
  for (const mat of cutList.materialSummary) {
    lines.push(
      mat.material.padEnd(20) +
      `${mat.totalWeight.toFixed(1)} kg`.padStart(10) +
      `(${mat.itemCount} pcs)`.padStart(10)
    );
  }
  lines.push('');

  // Profile summary
  lines.push('PROFILE SUMMARY');
  lines.push('-'.repeat(40));
  for (const prof of cutList.profileSummary) {
    const lengthM = (prof.totalLength / 1000).toFixed(2);
    lines.push(
      prof.profile.padEnd(20) +
      `${lengthM}m`.padStart(10) +
      `(${prof.quantity} pcs)`.padStart(10)
    );
  }

  return lines.join('\n');
}

/**
 * Format cut list as CSV
 */
export function formatCutListAsCSV(cutList: CutList): string {
  const lines: string[] = [];

  // Header
  lines.push([
    'Part Number',
    'Part Name',
    'Material',
    'Profile',
    'Quantity',
    'Length (mm)',
    'Width (mm)',
    'Thickness (mm)',
    'Weight (kg)',
    'Total Weight (kg)',
    'Operations',
    'Notes',
  ].join(','));

  // Items
  for (let i = 0; i < cutList.items.length; i++) {
    const item = cutList.items[i];
    lines.push([
      i + 1,
      `"${item.partName}"`,
      `"${item.material}"`,
      `"${item.profile}"`,
      item.quantity,
      item.length,
      item.width || '',
      item.thickness || '',
      item.weight.toFixed(2),
      item.totalWeight.toFixed(2),
      `"${(item.operations || []).join('; ')}"`,
      `"${item.notes || ''}"`,
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Format cut list as JSON
 */
export function formatCutListAsJSON(cutList: CutList): string {
  return JSON.stringify(cutList, null, 2);
}
