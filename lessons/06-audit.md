# Lesson 6: Audit — Operation Tracking and Time-Travel Replay

## Overview

The **Audit subsystem** provides observability for functional programs by tracking operations with timestamps and enabling time-travel through your computation history. Unlike logging, Audit is purely functional: it threads state through your pipeline without side effects.

This lesson covers three usage tiers: simple, intermediate, and advanced.

---

## Tier 1: Simple — Track a Single Operation

The simplest use case is recording a single function call:

```typescript
import { Audit } from '@zambit/elevate-ts';

const add = (a: number, b: number): number => a + b;

const session = Audit.withEnabled(true)(Audit.createSession());

const [result, updatedSession] = Audit.track('add')('number')
  (add)
  (5)
  (session);

console.log(result); // 10
console.log(Audit.getEntries(Audit.getLog(updatedSession))); 
// [{ operation: 'add', monadType: 'number', input: 5, output: 10, ... }]
```

**Key points:**

- `Audit.createSession()` creates a session with tracking **disabled by default** (zero overhead in production)
- `Audit.withEnabled(true)` enables recording
- `Audit.track(operationName)(monadType)(fn)` returns a function that takes input and session, producing `[result, updatedSession]`
- `Audit.getLog()` extracts the log from the session
- `Audit.getEntries()` converts the log to a readable array

---

## Tier 2: Intermediate — Thread Through a Pipeline

Operations are tracked as they flow through multiple steps. Thread the `AuditSession` alongside your result:

```typescript
import { Audit } from '@zambit/elevate-ts';

const double = (n: number): number => n * 2;
const addTen = (n: number): number => n + 10;

const session = Audit.withEnabled(true)(Audit.createSession());

// Step 1: Track double
const [after1, s1] = Audit.track('double')('number')(double)(5)(session);

// Step 2: Track addTen
const [after2, s2] = Audit.track('addTen')('number')(addTen)(after1)(s1);

const log = Audit.getLog(s2);
const entries = Audit.getEntries(log);

// entries[0] = { operation: 'double', input: 5, output: 10, ... }
// entries[1] = { operation: 'addTen', input: 10, output: 20, ... }

// Inspect specific entries
const firstInput = Audit.inputAt(0)(log); // Just(5)
const firstOutput = Audit.outputAt(0)(log); // Just(10)
const secondEntry = Audit.entryAt(1)(log); // Just({ operation: 'addTen', ... })
```

**Key points:**

- Each step carries `[result, session]` to the next
- `Audit.inputAt(index)` / `Audit.outputAt(index)` return `Maybe<unknown>` — use `.caseOf()` to extract
- `Audit.entryAt(index)` returns the complete entry with all metadata (timestamp, id, etc.)
- This pure threading integrates seamlessly with functional pipelines

---

## Tier 3: Advanced — Time-Travel Over a Stateful Domain

The todo app domain already uses `State` monads. Wrapping operations in Audit lets you inspect the full execution trace:

```typescript
import { Audit } from '@zambit/elevate-ts';
import { State } from '@zambit/elevate-ts/State';
import { addWithHistory, toggleWithHistory } from './domain';

const session = Audit.withEnabled(true)(Audit.createSession());

// Define a function that runs a State operation through Audit
const auditState = (operationName: string) =>
  (stateOp: State<AppState, void>) =>
    (input: AppState) =>
      (s: AuditSession): readonly [void, AuditSession] => {
        const [result, newState] = stateOp.run(input);
        return Audit.record(operationName)('State')(input)(newState)(s);
      };

// Track a sequence of operations
const runAudit = auditState('addWithHistory')
  (addWithHistory('Buy milk'))
  (initialAppState)
  (session);

const [, session2] = runAudit;

// Replay: iterate every operation in order
const replay = Audit.replay(Audit.getLog(session2));
replay.forEach(entry => console.log(`${entry.operation} → output`));

// Filter: see only 'addWithHistory' operations
const addOps = Audit.filterByOperation('addWithHistory')(Audit.getLog(session2));
console.log(Audit.getEntries(addOps).length);
```

**Key concepts:**

- `Audit.record()` captures results of operations that don't return values through Audit
- `Audit.replay()` iterates the log in order, useful for debugging
- `Audit.filterByOperation()` narrows to a specific operation type
- `Audit.filterByMonadType()` filters by monad (e.g., `'State'`, `'Either'`, `'Task'`)
- Chain filters to progressively narrow results

---

## Production Considerations

### Privacy & Compliance

In production, you have three strategies for sensitive data:

1. **Disable entirely** (zero overhead)
   ```typescript
   const prod = Audit.createSession(); // enabled: false by default
   // No recording happens; Audit.track still works but is a no-op
   ```

2. **Disable capture** (log operations without values)
   ```typescript
   const private = Audit.withCaptureInputs(false)
     (Audit.withCaptureOutputs(false)
       (Audit.withEnabled(true)(Audit.createSession())));
   // Entries record operation name, timestamp, monadType — not input/output
   ```

3. **Scrub before transmission** (record everything locally, sanitize before shipping)
   ```typescript
   const scrubPII = (entry: AuditEntry): AuditEntry => ({
     ...entry,
     input: entry.input.email ? { ...entry.input, email: '[REDACTED]' } : entry.input,
   });

   const log = Audit.getLog(session);
   const safe = {
     ...log,
     entries: Audit.getEntries(log).map(scrubPII),
   };
   ```

### Custom IDs

By default, Audit generates UUIDs. For distributed tracing, use monotonically-sortable IDs:

```typescript
import { cuid } from '@paralleldrive/cuid2';

const traced = Audit.withGenerateId(() => cuid())(session);
```

---

## Common Patterns

### 1. Audit a fetch operation

```typescript
const fetchUser = (id: string): EitherAsync<Error, User> => { ... };

const [user, s] = Audit.track('fetchUser')('EitherAsync')
  (fetchUser)
  ('user-123')
  (session);
```

### 2. Branch on audit state

```typescript
if (Audit.getEntries(Audit.getLog(session)).length > 100) {
  console.warn('Audit log is large; consider archiving');
}
```

### 3. Compose audit configs

```typescript
const withLogging = (s: AuditSession): AuditSession =>
  Audit.withCaptureInputs(false)
    (Audit.withCaptureOutputs(false)
      (Audit.withEnabled(true)(s)));
```

---

## References

- **Type**: `AuditSession`, `AuditLog`, `AuditEntry`, `AuditConfig`
- **Creation**: `createSession(config?)`
- **Config**: `withEnabled`, `withCaptureInputs`, `withCaptureOutputs`, `withGenerateId`
- **Recording**: `track`, `record`
- **Extraction**: `getLog`, `getEntries`, `entryAt`, `inputAt`, `outputAt`
- **Replay & Filter**: `replay`, `filterByOperation`, `filterByMonadType`

---

## Next Steps

1. Run the colocated examples in `src/lib/audit-examples/` to see each tier in action
2. Integrate Audit into your domain functions to trace real workflows
3. Build dashboards that replay execution traces for debugging
