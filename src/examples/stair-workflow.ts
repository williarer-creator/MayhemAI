/**
 * Stair Design Workflow Example
 *
 * Demonstrates the complete workflow:
 * 1. Analyze connection requirements
 * 2. Calculate stair parameters
 * 3. Produce manufacturing outputs
 */

import { analyzeConnection } from '../spatial';
import { calculateStairs } from '../knowledge/domains/access';
import {
  generateCutList,
  formatCutListAsText,
  generateDXF,
  createRectangle,
  createHole,
  generateGCode,
  toolChange,
  spindleOn,
  comment,
  drillHolePattern,
  nestLinearParts,
  formatLinearNestingReport,
} from '../manufacturing';
import type { Point3D, GeneratedComponent } from '../knowledge/types';

// =============================================================================
// EXAMPLE: DESIGN STAIRS FROM FLOOR TO PLATFORM
// =============================================================================

export function designStaircase(
  startPoint: Point3D,
  endPoint: Point3D,
  options: {
    preferredWidth?: number;
    material?: 'steel' | 'aluminum';
    includeHandrails?: boolean;
  } = {}
) {
  console.log('='.repeat(60));
  console.log('MAYHEM AI - STAIR DESIGN WORKFLOW');
  console.log('='.repeat(60));

  // Step 1: Analyze the connection
  console.log('\n1. ANALYZING CONNECTION...\n');
  const connection = analyzeConnection(startPoint, endPoint);

  console.log(`   From: (${startPoint.x}, ${startPoint.y}, ${startPoint.z})`);
  console.log(`   To: (${endPoint.x}, ${endPoint.y}, ${endPoint.z})`);
  console.log(`   Vertical rise: ${connection.verticalDistance}mm`);
  console.log(`   Horizontal run: ${connection.horizontalDistance}mm`);
  console.log(`   Slope angle: ${connection.slopeAngle.toFixed(1)}°`);
  console.log(`   Suggested type: ${connection.suggestedType}`);

  // Check if stairs are appropriate
  const stairSuggestion = connection.accessMethods.find(m => m.method === 'stairs');
  if (!stairSuggestion) {
    console.log('\n   WARNING: Stairs may not be the best choice for this connection.');
    console.log('   Consider:', connection.accessMethods.map(m => m.method).join(', '));
  } else {
    console.log(`   Stair suitability: ${stairSuggestion.suitability}`);
    console.log(`   Reason: ${stairSuggestion.reason}`);
  }

  // Step 2: Calculate stair parameters
  console.log('\n2. CALCULATING STAIR PARAMETERS...\n');

  const stairWidth = options.preferredWidth || 900;
  const stairCalc = calculateStairs({
    totalRise: connection.verticalDistance,
    width: stairWidth,
    occupancyType: 'industrial',
    stairType: 'straight',
    constructionType: 'steel-open',
  });

  if (!stairCalc.valid) {
    console.log('   ERRORS:');
    for (const error of stairCalc.errors) {
      console.log(`   - ${error}`);
    }
    return null;
  }

  console.log(`   Riser height: ${stairCalc.riserHeight}mm`);
  console.log(`   Tread depth: ${stairCalc.treadDepth}mm`);
  console.log(`   Number of risers: ${stairCalc.numRisers}`);
  console.log(`   Total run: ${stairCalc.totalRun}mm`);
  console.log(`   Stringer length: ${stairCalc.stringerLength}mm`);

  if (stairCalc.warnings.length > 0) {
    console.log('\n   WARNINGS:');
    for (const warning of stairCalc.warnings) {
      console.log(`   - ${warning}`);
    }
  }

  // Step 3: Create mock components for cut list demonstration
  console.log('\n3. GENERATING CUT LIST...\n');

  const components: GeneratedComponent[] = [
    {
      id: 'stringer-left',
      name: 'Left Stringer',
      material: options.material || 'steel',
      shape: 'channel',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { length: stairCalc.stringerLength, width: 200, height: 80 },
      connections: [],
      cutList: [
        {
          description: 'Left stringer channel',
          material: options.material || 'steel',
          profile: 'C200x80',
          quantity: 1,
          length: stairCalc.stringerLength,
          weight: stairCalc.stringerLength * 0.02,
        },
      ],
    },
    {
      id: 'stringer-right',
      name: 'Right Stringer',
      material: options.material || 'steel',
      shape: 'channel',
      position: { x: stairWidth, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { length: stairCalc.stringerLength, width: 200, height: 80 },
      connections: [],
      cutList: [
        {
          description: 'Right stringer channel',
          material: options.material || 'steel',
          profile: 'C200x80',
          quantity: 1,
          length: stairCalc.stringerLength,
          weight: stairCalc.stringerLength * 0.02,
        },
      ],
    },
    {
      id: 'treads',
      name: 'Treads',
      material: options.material || 'steel',
      shape: 'plate',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { length: stairWidth, width: stairCalc.treadDepth, thickness: 6 },
      connections: [],
      cutList: [
        {
          description: 'Tread plate',
          material: options.material || 'steel',
          profile: 'PL6',
          quantity: stairCalc.numRisers,
          length: stairWidth,
          width: stairCalc.treadDepth,
          weight: (stairWidth * stairCalc.treadDepth * 6 * 7.85) / 1e9,
        },
      ],
    },
  ];

  const cutList = generateCutList({
    projectName: 'Industrial Stair',
    elementType: 'Stair',
    components,
    options: {
      groupByMaterial: true,
      addCuttingAllowance: 5,
    },
  });

  console.log(formatCutListAsText(cutList));

  // Step 4: Generate DXF for base plates
  console.log('\n4. GENERATING DXF FILES...\n');

  const basePlateEntities = [
    createRectangle(0, 0, 200, 200, 'PROFILE'),
    createHole(50, 50, 14, 'HOLES'),
    createHole(150, 50, 14, 'HOLES'),
    createHole(50, 150, 14, 'HOLES'),
    createHole(150, 150, 14, 'HOLES'),
  ];

  const basePlateDXF = generateDXF(
    basePlateEntities,
    'stair-base-plate',
    { units: 'mm', scale: 1, includeLabels: true, includeDimensions: false }
  );

  console.log(`   Generated: ${basePlateDXF.filename}`);
  console.log(`   Bounding box: ${basePlateDXF.boundingBox.maxX}x${basePlateDXF.boundingBox.maxY}mm`);
  console.log(`   Entities: ${basePlateDXF.entities.length}`);

  // Step 5: Generate G-code for drilling
  console.log('\n5. GENERATING G-CODE...\n');

  const drillOps = [
    comment('BASE PLATE DRILLING'),
    toolChange(1, '14mm drill'),
    spindleOn(800),
    ...drillHolePattern(
      [
        { x: 50, y: 50, diameter: 14, depth: 15 },
        { x: 150, y: 50, diameter: 14, depth: 15 },
        { x: 50, y: 150, diameter: 14, depth: 15 },
        { x: 150, y: 150, diameter: 14, depth: 15 },
      ],
      { safeZ: 10, feedRate: 100 }
    ),
  ];

  const gcode = generateGCode(
    drillOps,
    {
      machineType: 'mill',
      units: 'mm',
      feedRate: 100,
      rapidRate: 3000,
      spindleSpeed: 800,
      safeZ: 10,
    },
    'base-plate-drill'
  );

  console.log(`   Generated: ${gcode.filename}`);
  console.log(`   Operations: ${gcode.summary.totalMoves}`);
  console.log(`   Estimated time: ${gcode.estimatedTime.toFixed(1)} minutes`);

  // Step 6: Generate nesting for bar stock
  console.log('\n6. OPTIMIZING BAR STOCK NESTING...\n');

  const linearParts = [
    { id: 'stringer', length: stairCalc.stringerLength, quantity: 2 },
    { id: 'handrail-post', length: 1100, quantity: Math.ceil(stairCalc.numRisers / 2) },
  ];

  const nesting = nestLinearParts({
    parts: linearParts,
    stockLength: 6000, // 6m bars
    kerf: 3,
  });

  console.log(formatLinearNestingReport(nesting, 6000));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('WORKFLOW COMPLETE');
  console.log('='.repeat(60));
  console.log('\nOutputs generated:');
  console.log(`  - Cut list: ${cutList.totalItems} items, ${cutList.totalWeight.toFixed(1)}kg total`);
  console.log(`  - DXF files: 1 (base plate)`);
  console.log(`  - G-code files: 1 (drilling)`);
  console.log(`  - Bar stock: ${nesting.totalBars} x 6m bars (${(nesting.efficiency * 100).toFixed(1)}% efficiency)`);

  return {
    calculation: stairCalc,
    components,
    cutList,
    dxf: basePlateDXF,
    gcode,
    nesting,
  };
}

// Export default for easy testing
export default designStaircase;
