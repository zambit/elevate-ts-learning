import { runSimpleAudit, getSimpleEntries } from './simple';

/**
 * Interactive demo: Step-by-step walkthrough of the audit process.
 *
 * This shows each stage of what happens when we audit a simple operation,
 * making it clear how the audit system captures input, output, and metadata.
 */
export const demoSimpleAuditStepByStep = (): void => {
  console.log('=== Simple Audit Demo ===\n');

  console.log('Step 1: Run the audited operation with input value 5');
  const result = runSimpleAudit(5);
  const [output] = result;
  console.log(`✓ Output: ${output} (5 + 5 = 10)\n`);

  console.log('Step 2: Extract the audit entries');
  const entries = getSimpleEntries(result);
  console.log(`✓ Found ${entries.length} recorded operation(s)\n`);

  console.log('Step 3: Examine the audit entry in detail');
  const entry = entries[0];
  console.log(`  Operation:  ${entry.operation}`);
  console.log(`  Input:      ${entry.input}`);
  console.log(`  Output:     ${entry.output}`);
  console.log(`  Monad Type: ${entry.monadType}`);
  console.log(`  Timestamp:  ${entry.timestamp}`);
  console.log(`  ID:         ${entry.id}\n`);

  console.log('=== What happened? ===');
  console.log('1. runSimpleAudit(5) created an audit session');
  console.log('2. It tracked the operation: addToSelf(5) = 10');
  console.log('3. The audit system recorded:');
  console.log('   - What operation ran (name: "add")');
  console.log('   - What type of value was processed (type: "number")');
  console.log('   - What input it received (5)');
  console.log('   - What output it produced (10)');
  console.log('   - When it happened (timestamp)');
  console.log('   - A unique identifier for tracing (id)');
  console.log('\n=== End Demo ===');
};
