// ============================================================================
// Storage Service — Plain interface + implementation
// ============================================================================
//
// elevate-ts: Reader<Env, A> can encode dependencies in the type, but
// it's stateless and cannot model resource acquisition/release.
//
// effect-ts: Context.Tag<Service> + Layer enable powerful composition
// and dependency injection with full resource lifecycle support.
//
// purify-ts: Just a plain interface + implementation. Dependencies are
// passed as explicit function parameters. Simpler to understand but
// less type-safe at scale (no compiler check at call site that you've
// provided the dependency).
// ============================================================================

import type { Todos } from './types.js';
import { EitherAsync, Either } from 'purify-ts';
import type { TodoError } from './errors.js';
import { storageError } from './errors.js';

export interface TodoStorage {
	save(todos: Todos): EitherAsync<TodoError, void>;
	load(): EitherAsync<TodoError, Todos>;
}

export const localStorageStorage: TodoStorage = {
	save: (todos) =>
		EitherAsync(async ({ liftEither }) =>
			liftEither(
				Either.encase(
					() => localStorage.setItem('todos', JSON.stringify(todos)),
					(cause) => storageError(cause)
				)
			)
		),
	load: () =>
		EitherAsync(async ({ liftEither }) =>
			liftEither(
				Either.encase(
					() => JSON.parse(localStorage.getItem('todos') ?? '[]') as Todos,
					(cause) => storageError(cause)
				)
			)
		)
};
