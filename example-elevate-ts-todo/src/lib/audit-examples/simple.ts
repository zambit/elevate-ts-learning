import { Audit } from '@zambit/elevate-ts';

// Simple arithmetic function that adds two numbers
const add = (a: number, b: number): number => a + b;

/**
 * Demonstrates basic audit tracking of a single function call.
 *
 * This is the simplest audit example: we create a session, enable auditing,
 * and track a single operation (adding a number to itself).
 *
 * @param input - The number to process (will be added to itself)
 * @returns A tuple containing the result and the audit session with recorded entries
 *
 * @example
 * const [output, session] = runSimpleAudit(5);
 * console.log(output); // 10
 */
export const runSimpleAudit = (
  input: number
): readonly [number, Audit.AuditSession] => {
  // Create a new audit session and enable auditing
  const session = Audit.withEnabled(true)(Audit.createSession());

  // Wrap the two-argument 'add' function to match Audit.track's expectation
  // Audit.track expects a function that takes a single input value
  const addToSelf = (n: number): number => add(n, n);

  // Track the operation:
  // - 'add' is the operation name (for logging)
  // - 'number' is the monad type (the type being tracked)
  // - addToSelf is the function to execute
  // - input is the value to pass to the function
  // - session is the audit session to record into
  return Audit.track('add')('number')(addToSelf)(input)(session);
};

/**
 * Extracts audit entries from a simple audit result.
 *
 * This is a convenience function to retrieve the audit log entries
 * that were recorded during the execution of runSimpleAudit.
 *
 * @param result - The tuple returned from runSimpleAudit
 * @returns An array of audit entries showing what operations were tracked
 *
 * @example
 * const result = runSimpleAudit(5);
 * const entries = getSimpleEntries(result);
 * console.log(entries[0].operation); // 'add'
 * console.log(entries[0].input); // 5
 * console.log(entries[0].output); // 10
 */
export const getSimpleEntries = (
  result: readonly [number, Audit.AuditSession]
): readonly Audit.AuditEntry[] => {
  // Destructure: ignore the output value, keep the session
  const [, session] = result;

  // Get the audit log from the session
  const log = Audit.getLog(session);

  // Extract all recorded entries from the log
  return Audit.getEntries(log);
};
