/**
 * Run All MayhemAI Demo Scenarios
 */

import { createDemoRunner, getAllDemoScenarios } from './src/integration/index';

async function main() {
  console.log('='.repeat(60));
  console.log('MayhemAI - Running All Demo Scenarios');
  console.log('='.repeat(60));
  console.log('');

  const scenarios = getAllDemoScenarios();
  console.log(`Total scenarios: ${scenarios.length}`);
  scenarios.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} - ${s.description}`);
  });
  console.log('');

  const runner = createDemoRunner();
  const results = await runner.runAllDemos();

  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Scenarios: ${results.totalScenarios}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');
  console.log('Results by Scenario:');
  results.results.forEach((r, i) => {
    const status = r.success && r.matchesExpected ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${i + 1}. [${status}] ${r.scenario}`);
  });
  console.log('');
  console.log('='.repeat(60));
}

main().catch(console.error);
