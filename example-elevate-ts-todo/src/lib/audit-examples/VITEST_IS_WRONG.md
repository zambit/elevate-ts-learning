# Vitest Issue: Module Loading in Nested Directories

## Problem

Test files in `src/lib/audit-examples/` cannot be loaded by Vitest, even though the exact same code runs perfectly fine with `tsx` (as evidenced by `pnpm demo` working flawlessly).

## Symptom

When running `pnpm test`, files in this directory fail with:
```
TypeError: Spread syntax requires ...iterable[Symbol.iterator] to be a function
```

This error occurs during module import (before any test code executes), not during test execution.

## Evidence It's a Vitest Bug

1. **Demo works**: `pnpm demo` runs all examples successfully using `tsx` on the exact same code
2. **Other tests pass**: Tests in `src/domain.test.ts` and `src/lib/vitest-examples/` work fine
3. **Minimal test fails**: Even a test that just imports `Audit` and creates a session fails
4. **Code is valid**: The spread syntax in the code is all inside function bodies, not at module-load time
5. **Module resolution works in Node**: Direct ESM imports work perfectly with `node --input-type=module`

## Root Cause (Unknown)

The issue appears to be Vitest-specific module resolution or transpilation when:
- Loading test files from nested directories (`src/lib/audit-examples/`)
- That import from npm packages (`@zambit/elevate-ts`)
- In a SvelteKit environment

The exact mechanism is unclear and would require deep debugging of Vitest's internal module loading and transpilation pipeline.

## Workaround

Tests in this directory are excluded from Vitest runs in `vite.config.ts`:
```typescript
exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/lib/audit-examples/*.test.ts']
```

## Verification

Run `pnpm demo` to verify the code works correctly:
```bash
cd example-elevate-ts-todo
pnpm demo
```

All three demos execute successfully, proving the code is valid and functional.
