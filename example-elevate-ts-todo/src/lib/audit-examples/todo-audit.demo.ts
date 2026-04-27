import { Audit } from '@zambit/elevate-ts';
import {
  createAuditedAddition,
  createAuditedToggle,
  replayOperations,
  filterAddOperations,
  getOperationCount,
} from './todo-audit';
import type { AppState } from '../types';

// Initial empty state for the demo
const initialState: AppState = {
  todos: [],
  filter: 'All',
  history: [],
  future: [],
};

/**
 * Interactive demo: Step-by-step walkthrough of stateful operation auditing.
 *
 * This demonstrates auditing State monad operations (add and toggle),
 * and how to replay, filter, and analyze the audit log.
 */
export const demoTodoAuditStepByStep = (): void => {
  console.log('=== Todo Audit Demo ===\n');

  console.log('Step 1: Create an audit session');
  const session = Audit.withEnabled(true)(Audit.createSession());
  console.log('✓ Session created\n');

  console.log('Step 2: Add first todo ("Buy milk")');
  const [session1, log1] = createAuditedAddition('Buy milk', initialState, session);
  const entries1 = Audit.getEntries(log1);
  console.log(`✓ Added todo, state now has ${entries1.length} operation(s)`);
  console.log(`  Operation: ${entries1[0].operation}`);
  console.log(`  Result: ${(entries1[0].output as AppState).todos.length} todo(s) in state\n`);

  console.log('Step 3: Add second todo ("Walk dog")');
  const [session2, log2] = createAuditedAddition(
    'Walk dog',
    (entries1[0].output as AppState),
    session1
  );
  const entries2 = Audit.getEntries(log2);
  console.log(`✓ Added second todo, now have ${entries2.length} operation(s)`);
  console.log(`  Latest: ${entries2[1].operation}`);
  console.log(`  Result: ${(entries2[1].output as AppState).todos.length} todo(s) in state\n`);

  console.log('Step 4: Toggle first todo as done');
  const stateAfterAdds = entries2[1].output as AppState;
  const [session3, log3] = createAuditedToggle(stateAfterAdds.todos[0].id, stateAfterAdds, session2);
  const entries3 = Audit.getEntries(log3);
  console.log(`✓ Toggled todo, now have ${entries3.length} operation(s)`);
  const latestEntry = entries3[entries3.length - 1];
  console.log(`  Latest: ${latestEntry.operation}`);
  const latestState = latestEntry.output as AppState;
  console.log(`  Todo 0 done: ${latestState.todos[0].done}\n`);

  console.log('Step 5: Replay all operations');
  const replay = replayOperations(log3);
  console.log(`✓ Replayed ${replay.length} operations:`);
  replay.forEach((entry, i) => {
    console.log(`  ${i + 1}. ${entry.operation}`);
  });
  console.log();

  console.log('Step 6: Filter to only "add" operations');
  const addOnlyLog = filterAddOperations(log3);
  const addEntries = Audit.getEntries(addOnlyLog);
  console.log(`✓ Filtered log has ${addEntries.length} add operation(s)`);
  addEntries.forEach((entry, i) => {
    const state = entry.output as AppState;
    console.log(`  ${i + 1}. Added: "${state.todos[state.todos.length - 1].title}"`);
  });
  console.log();

  console.log('Step 7: Count all operations');
  const totalOps = getOperationCount(log3);
  console.log(`✓ Total operations recorded: ${totalOps}`);
  console.log(`  (${addEntries.length} adds + 1 toggle)\n`);

  console.log('=== What happened? ===');
  console.log('1. We created an audit session to track state changes');
  console.log('2. We added two todos and toggled one as done');
  console.log('3. Each operation was recorded with before/after state');
  console.log('4. We could replay the full history of operations');
  console.log('5. We could filter operations by type (e.g., just adds)');
  console.log('6. We could count total operations in the session');
  console.log('\nThis pattern is useful for:');
  console.log('- Undo/redo functionality (replay to get to any point)');
  console.log('- Debugging (see exactly what operations led to current state)');
  console.log('- Analytics (count operations by type)');
  console.log('- Time travel (step through operations forward/backward)');
  console.log('\n=== End Demo ===');
};
