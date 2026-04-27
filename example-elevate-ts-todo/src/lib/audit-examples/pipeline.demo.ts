import {
  runPipelineAudit,
  getPipelineEntries,
  getInputAt,
  getOutputAt,
  getEntryAt,
} from './pipeline';

/**
 * Interactive demo: Step-by-step walkthrough of a multi-step audit pipeline.
 *
 * This demonstrates how to track multiple operations in sequence,
 * and how to query the audit log for specific steps.
 */
export const demoPipelineAuditStepByStep = (): void => {
  console.log('=== Pipeline Audit Demo ===\n');

  console.log('Step 1: Run a two-step pipeline');
  const result = runPipelineAudit();
  const [finalOutput] = result;
  console.log(`✓ Final output: ${finalOutput}`);
  console.log('  (Step 1: double(5) = 10)');
  console.log('  (Step 2: addTen(10) = 20)\n');

  console.log('Step 2: Get all entries in the pipeline');
  const entries = getPipelineEntries(result);
  console.log(`✓ Found ${entries.length} operations recorded\n`);

  console.log('Step 3: Examine each operation');
  entries.forEach((entry, i) => {
    console.log(`  Operation ${i}:`);
    console.log(`    Name:   ${entry.operation}`);
    console.log(`    Input:  ${entry.input}`);
    console.log(`    Output: ${entry.output}`);
  });
  console.log();

  console.log('Step 4: Query specific operation inputs');
  const input0 = getInputAt(0, result);
  const input1 = getInputAt(1, result);
  if (input0.tag === 'Just') {
    console.log(`✓ Input to step 0 (double):  ${input0.value}`);
  } else {
    console.log('✗ Step 0 not found');
  }
  if (input1.tag === 'Just') {
    console.log(`✓ Input to step 1 (addTen): ${input1.value}`);
  } else {
    console.log('✗ Step 1 not found');
  }
  console.log();

  console.log('Step 5: Query specific operation outputs');
  const output0 = getOutputAt(0, result);
  const output1 = getOutputAt(1, result);
  if (output0.tag === 'Just') {
    console.log(`✓ Output from step 0 (double):  ${output0.value}`);
  } else {
    console.log('✗ Step 0 not found');
  }
  if (output1.tag === 'Just') {
    console.log(`✓ Output from step 1 (addTen): ${output1.value}`);
  } else {
    console.log('✗ Step 1 not found');
  }
  console.log();

  console.log('Step 6: Query a complete entry at an index');
  const entry0 = getEntryAt(0, result);
  if (entry0.tag === 'Just') {
    const e = entry0.value;
    console.log(`✓ Complete entry at index 0:`);
    console.log(`    Operation: ${e.operation}`);
    console.log(`    Input: ${e.input}`);
    console.log(`    Output: ${e.output}`);
    console.log(`    Timestamp: ${e.timestamp}`);
  } else {
    console.log('✗ Entry at index 0 not found');
  }
  console.log();

  console.log('Step 7: Query out-of-bounds index (returns Nothing)');
  const entry99 = getEntryAt(99, result);
  const isEmpty = entry99.tag === 'Nothing';
  console.log(`✓ Entry at index 99 is Nothing (empty): ${isEmpty}\n`);

  console.log('=== What happened? ===');
  console.log('1. We ran a pipeline of 2 operations: double → addTen');
  console.log('2. Each operation was tracked independently');
  console.log('3. We used Maybe types to safely query the audit log');
  console.log('4. We could retrieve inputs, outputs, or full entries by index');
  console.log('5. Out-of-bounds queries return Nothing instead of crashing');
  console.log('\n=== End Demo ===');
};
