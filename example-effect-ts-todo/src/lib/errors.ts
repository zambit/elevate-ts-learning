import { Data } from 'effect';

// ============================================================================
// Typed Errors — Effect's E parameter
// ============================================================================
//
// elevate-ts weakness: toggleTodo(999) silently does nothing — no error
// signal reaches the caller. You must inspect the returned state to discover
// that nothing happened.
//
// effect-ts solution: model "expected failures" as tagged data types.
// The error type appears in the Effect<A, E, R> signature, so the compiler
// forces every caller to handle it or explicitly ignore it.
//
// Data.TaggedError gives us:
//   - Structural equality (useful for Vitest assertions)
//   - A _tag discriminant for pattern matching
//   - instanceof support
// ============================================================================

/** Raised when toggle/remove is called with an ID that does not exist */
export class TodoNotFound extends Data.TaggedError('TodoNotFound')<{
	readonly id: number;
}> {}

/** Raised when localStorage fails (quota exceeded, private browsing, etc.) */
export class StorageError extends Data.TaggedError('StorageError')<{
	readonly cause: unknown;
}> {}
