// ============================================================================
// Typed Errors — Plain discriminated union
// ============================================================================
//
// elevate-ts weakness: toggleTodo(999) silently does nothing — no error
// signal reaches the caller. You must inspect the returned state to discover
// that nothing happened.
//
// effect-ts solution: Data.TaggedError from the library.
//
// purify-ts solution: Plain TypeScript discriminated union. No library overhead.
// The compiler still forces Either<TodoError, A> — meaning callers must handle
// the error or explicitly ignore it. The union pattern is idiomatic TS.
// ============================================================================

export type TodoError =
	| { readonly _tag: 'TodoNotFound'; readonly id: number }
	| { readonly _tag: 'StorageError'; readonly cause: unknown };

export const todoNotFound = (id: number): TodoError => ({
	_tag: 'TodoNotFound',
	id
});

export const storageError = (cause: unknown): TodoError => ({
	_tag: 'StorageError',
	cause
});
