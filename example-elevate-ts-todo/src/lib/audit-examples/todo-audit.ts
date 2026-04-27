import { Audit } from '@zambit/elevate-ts';
import { addWithHistory, toggleWithHistory } from '../domain';
import type { AppState } from '../types';

/**
 * Records a "add todo" operation in the audit log.
 *
 * This demonstrates auditing stateful operations. Unlike simple.ts and pipeline.ts
 * which audit pure functions, here we're auditing State monad operations that
 * transform application state.
 *
 * @param title - The title of the todo to add
 * @param initialState - The app state before the operation
 * @param session - The current audit session
 * @returns A tuple of the updated session and the audit log
 *
 * @example
 * const [session, log] = createAuditedAddition('Buy milk', initialState, session);
 * const entries = Audit.getEntries(log);
 * console.log(entries[0].operation); // 'addWithHistory'
 */
export const createAuditedAddition = (
  title: string,
  initialState: AppState,
  session: Audit.AuditSession
): readonly [Audit.AuditSession, Audit.AuditLog] => {
  // Execute the addWithHistory state monad
  // The State.run() method takes the initial state and returns [value, newState]
  const [, newState] = addWithHistory(title).run(initialState);

  // Manually record the operation in the audit log
  // Unlike Audit.track() which runs the function and records it,
  // Audit.record() takes the before/after states and records them
  const updated = Audit.record('addWithHistory')('State')(
    initialState
  )(newState)(session);

  return [updated, Audit.getLog(updated)];
};

/**
 * Records a "toggle todo" operation in the audit log.
 *
 * Similar to createAuditedAddition, this audits a state transformation.
 *
 * @param todoId - The ID of the todo to toggle
 * @param currentState - The app state before the operation
 * @param session - The current audit session
 * @returns A tuple of the updated session and the audit log
 *
 * @example
 * const [session, log] = createAuditedToggle(1, currentState, session);
 */
export const createAuditedToggle = (
  todoId: number,
  currentState: AppState,
  session: Audit.AuditSession
): readonly [Audit.AuditSession, Audit.AuditLog] => {
  // Execute the toggleWithHistory state monad
  const [, newState] = toggleWithHistory(todoId).run(currentState);

  // Record the state transformation in the audit log
  const updated = Audit.record('toggleWithHistory')('State')(
    currentState
  )(newState)(session);

  return [updated, Audit.getLog(updated)];
};

/**
 * Replays all recorded operations from an audit log.
 *
 * This is useful for reconstructing the sequence of operations
 * that led to the current state (useful for debugging, undo/redo, etc).
 *
 * @param log - The audit log to replay
 * @returns Array of all audit entries in execution order
 *
 * @example
 * const replay = replayOperations(log);
 * replay.forEach(entry => console.log(entry.operation));
 */
export const replayOperations = (
  log: Audit.AuditLog
): readonly Audit.AuditEntry[] => Audit.replay(log);

/**
 * Filters the audit log to only include "add" operations.
 *
 * Demonstrates filtering audit logs by operation type,
 * which is useful for analyzing specific types of changes.
 *
 * @param log - The audit log to filter
 * @returns A new audit log containing only 'addWithHistory' operations
 *
 * @example
 * const addOnlyLog = filterAddOperations(log);
 * const addEntries = Audit.getEntries(addOnlyLog);
 * console.log(addEntries.length); // Only addition operations
 */
export const filterAddOperations = (
  log: Audit.AuditLog
): Audit.AuditLog =>
  Audit.filterByOperation('addWithHistory')(log);

/**
 * Counts the total number of recorded operations.
 *
 * @param log - The audit log
 * @returns Total number of operations recorded
 *
 * @example
 * const count = getOperationCount(log);
 * console.log(count); // 3
 */
export const getOperationCount = (log: Audit.AuditLog): number =>
  Audit.getEntries(log).length;
