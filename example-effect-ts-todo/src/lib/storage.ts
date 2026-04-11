import { Context, Effect, Layer } from 'effect';
import type { Todos } from './types.js';
import { StorageError } from './errors.js';

// ============================================================================
// TodoStorage Service — Effect's R (Requirements) parameter
// ============================================================================
//
// elevate-ts weakness: saveTodos() and loadTodos() call localStorage directly.
// They are untestable in isolation because the dependency is hardcoded.
// There is no way to know from a function's type whether it uses storage.
//
// effect-ts solution: define a "service interface" with Context.Tag.
//
// Any Effect that needs storage has TodoStorage in its R parameter:
//   Effect<Todos, StorageError, TodoStorage>
//
// The compiler refuses to run this effect unless you provide a Layer that
// satisfies TodoStorage. This makes "requires storage" part of the type.
// ============================================================================

const STORAGE_KEY = 'effect-ts-todos';

export class TodoStorage extends Context.Tag('TodoStorage')<
	TodoStorage,
	{
		readonly save: (todos: Todos) => Effect.Effect<void, StorageError>;
		readonly load: () => Effect.Effect<Todos, StorageError>;
	}
>() {}

// ============================================================================
// Live Layer (browser localStorage)
// ============================================================================
//
// A Layer is a "recipe for constructing a service".
// TodoStorageLive tells the runtime: "to satisfy TodoStorage, use these
// implementations backed by window.localStorage."
//
// We provide this layer at the UI boundary (runtime.ts). Test code provides
// a TestStorageLive layer instead — no mocking frameworks needed.
// ============================================================================

export const TodoStorageLive = Layer.succeed(
	TodoStorage,
	TodoStorage.of({
		save: (todos) =>
			Effect.try({
				try: () => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)),
				catch: (cause) => new StorageError({ cause })
			}),

		load: () =>
			Effect.try({
				try: () => {
					const raw = localStorage.getItem(STORAGE_KEY);
					return raw ? (JSON.parse(raw) as Todos) : ([] as Todos);
				},
				catch: (cause) => new StorageError({ cause })
			})
	})
);
