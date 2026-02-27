/**
 * Run the Stairs Between Two Points Demo (Lightweight version)
 */

import { createPipeline, stairsBetweenTwoPoints } from './src/integration/index';

async function main() {
  console.log('='.repeat(60));
  console.log('MayhemAI - Stairs Between Two Points Demo');
  console.log('='.repeat(60));
  console.log('');
  console.log('Scenario:', stairsBetweenTwoPoints.name);
  console.log('Description:', stairsBetweenTwoPoints.description);
  console.log('');
  console.log('Input:');
  console.log('  Start:', JSON.stringify(stairsBetweenTwoPoints.input.endpoints?.start));
  console.log('  End:', JSON.stringify(stairsBetweenTwoPoints.input.endpoints?.end));
  console.log('  Description:', stairsBetweenTwoPoints.input.description);
  console.log('');

  // Create pipeline with manufacturing outputs disabled to avoid memory issues
  const pipeline = createPipeline({
    projectName: 'Stairs Demo',
    verbose: true,
    outputFormats: {
      gcode: false,  // Skip G-code generation (memory intensive)
      dxf: false,    // Skip DXF generation
      bom: true,
      cutList: true,
      assemblyInstructions: true,
      designReport: true,
    },
  });

  console.log('Running pipeline...\n');
  const result = await pipeline.run(stairsBetweenTwoPoints.input);

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log(`Success: ${result.success}`);
  console.log(`Processing Time: ${result.processingTimeMs}ms`);
  console.log('');

  if (result.aiResult) {
    console.log('AI REASONING');
    console.log('-'.repeat(40));
    console.log(`Primary Domain: ${result.aiResult.classification.primaryDomain}`);
    console.log(`Confidence: ${(result.aiResult.classification.confidence * 100).toFixed(0)}%`);
    console.log(`Element Type: ${result.aiResult.elementType.elementType}`);
    console.log(`Solutions Generated: ${result.aiResult.solutions.length}`);
    console.log('');

    const solution = result.aiResult.solutions[0];
    if (solution) {
      console.log('TOP SOLUTION');
      console.log('-'.repeat(40));
      console.log(`ID: ${solution.id}`);
      console.log(`Type: ${solution.elementType}`);
      console.log(`Material: ${solution.parameters.material || 'steel'}`);
      console.log('');
      console.log('Parameters:');
      Object.entries(solution.parameters).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log('');
      console.log('Compliance Checks:');
      solution.compliance.checks.forEach(check => {
        const icon = check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : '✗';
        console.log(`  [${icon}] ${check.code}: ${check.description}`);
      });
    }

    console.log('');
    console.log('DESIGN RATIONALE');
    console.log('-'.repeat(40));
    console.log(result.aiResult.rationale.summary);
    console.log('');
    if (result.aiResult.rationale.keyDecisions?.length > 0) {
      console.log('Key Decisions:');
      result.aiResult.rationale.keyDecisions.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.decision}`);
        console.log(`     Reason: ${d.reason}`);
      });
    }
  }

  if (result.package) {
    console.log('');
    console.log('MANUFACTURING PACKAGE');
    console.log('-'.repeat(40));
    console.log(`Project: ${result.package.project.name}`);
    console.log(`Components: ${result.package.geometry.componentCount}`);
    console.log(`Total Weight: ${result.package.geometry.totalWeight.toFixed(2)} kg`);
    console.log('');
    console.log('BOM Items:', result.package.bom.items.length);
    console.log('Cut List Items:', result.package.cutList.items.length);
    console.log('Assembly Steps:', result.package.assemblyInstructions.steps.length);
    console.log('');
    console.log('Validation:');
    console.log(`  Geometry Valid: ${result.package.validation.geometryValid}`);
    console.log(`  Code Compliant: ${result.package.validation.codeCompliant}`);
    console.log(`  Manufacturing Feasible: ${result.package.validation.manufacturingFeasible}`);
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log('ERRORS');
    console.log('-'.repeat(40));
    result.errors.forEach(e => console.log(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    console.log('');
    console.log('WARNINGS');
    console.log('-'.repeat(40));
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete');
  console.log('='.repeat(60));
}

main().catch(console.error);
