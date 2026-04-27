import { Audit, Maybe } from '@zambit/elevate-ts';

// Multiplies a number by 2
const double = (n: number): number => n * 2;

// Adds 10 to a number
const addTen = (n: number): number => n + 10;

/**
 * Demonstrates audit tracking of a multi-step pipeline.
 *
 * This example chains two operations in sequence:
 * 1. double(5) -> 10
 * 2. addTen(10) -> 20
 *
 * Each step is tracked independently in the audit log,
 * creating a complete record of the computation pipeline.
 *
 * @returns A tuple containing the final result (20) and the audit session
 *
 * @example
 * const [output, session] = runPipelineAudit();
 * console.log(output); // 20
 */
export const runPipelineAudit = (): readonly [
  number,
  Audit.AuditSession,
] => {
  // Create and enable a new audit session
  const session = Audit.withEnabled(true)(Audit.createSession());

  // First step: double the input (5)
  // Audit.track returns a tuple of [result, updatedSession]
  const [after1, s1] = Audit.track('double')('number')(double)(5)(session);

  // Second step: add ten to the result (10 -> 20)
  // Use the updated session from the first step
  return Audit.track('addTen')('number')(addTen)(after1)(s1);
};

/**
 * Extracts all audit entries from a pipeline audit result.
 *
 * @param result - The tuple returned from runPipelineAudit
 * @returns Array of audit entries in execution order
 *
 * @example
 * const result = runPipelineAudit();
 * const entries = getPipelineEntries(result);
 * console.log(entries.length); // 2
 */
export const getPipelineEntries = (
  result: readonly [number, Audit.AuditSession]
): readonly Audit.AuditEntry[] => {
  // Extract the session from the result tuple
  const [, session] = result;
  // Get the log and extract all entries
  return Audit.getEntries(Audit.getLog(session));
};

/**
 * Retrieves the input value of an operation at a specific index.
 *
 * Returns a Maybe type because the index might be out of bounds.
 *
 * @param index - The operation index in the pipeline (0-based)
 * @param result - The tuple returned from runPipelineAudit
 * @returns Just(value) if index is valid, Nothing if out of bounds
 *
 * @example
 * const result = runPipelineAudit();
 * const firstInput = getInputAt(0, result);
 * firstInput.caseOf({
 *   Just: (val) => console.log(val), // 5
 *   Nothing: () => console.log('Index out of bounds')
 * });
 */
export const getInputAt = (
  index: number,
  result: readonly [number, Audit.AuditSession]
): Maybe.Maybe<unknown> => {
  const [, session] = result;
  const log = Audit.getLog(session);
  // inputAt returns Maybe since the index might not exist
  return Audit.inputAt(index)(log);
};

/**
 * Retrieves the output value of an operation at a specific index.
 *
 * Returns a Maybe type because the index might be out of bounds.
 *
 * @param index - The operation index in the pipeline (0-based)
 * @param result - The tuple returned from runPipelineAudit
 * @returns Just(value) if index is valid, Nothing if out of bounds
 *
 * @example
 * const result = runPipelineAudit();
 * const firstOutput = getOutputAt(0, result);
 * firstOutput.caseOf({
 *   Just: (val) => console.log(val), // 10
 *   Nothing: () => console.log('Index out of bounds')
 * });
 */
export const getOutputAt = (
  index: number,
  result: readonly [number, Audit.AuditSession]
): Maybe.Maybe<unknown> => {
  const [, session] = result;
  const log = Audit.getLog(session);
  // outputAt returns Maybe since the index might not exist
  return Audit.outputAt(index)(log);
};

/**
 * Retrieves an entire audit entry (including metadata) at a specific index.
 *
 * Returns a Maybe type because the index might be out of bounds.
 *
 * @param index - The operation index in the pipeline (0-based)
 * @param result - The tuple returned from runPipelineAudit
 * @returns Just(entry) if index is valid, Nothing if out of bounds
 *
 * @example
 * const result = runPipelineAudit();
 * const entry = getEntryAt(0, result);
 * entry.caseOf({
 *   Just: (e) => console.log(e.operation), // 'double'
 *   Nothing: () => console.log('Index out of bounds')
 * });
 */
export const getEntryAt = (
  index: number,
  result: readonly [number, Audit.AuditSession]
): Maybe.Maybe<Audit.AuditEntry> => {
  const [, session] = result;
  const log = Audit.getLog(session);
  // entryAt returns Maybe since the index might not exist
  return Audit.entryAt(index)(log);
};
