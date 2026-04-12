import { Either, EitherAsync, Maybe } from 'purify-ts';
import type { Todo, Todos, Filter, AppState } from './types.js';
import { todoNotFound, type TodoError } from './errors.js';
import type { TodoStorage } from './storage.js';

// ============================================================================
// TIER 1 — Todos mutations (pure Either, no state ref)
// ============================================================================
//
// elevate-ts: State<Todos, Todo>  — threads state implicitly through the monad
// effect-ts:  Effect<[Todo, Todos], never, never> — returns pair explicitly
// purify-ts:  Either<TodoError, [Todo, Todos]> — eager Either for sync ops
//
// State is passed in explicitly and returned. Either<TodoError, A> forces
// callers to handle the typed failure or explicitly map/unwrap it.
// ============================================================================

export const addTodo = (title: string, todos: Todos): Either<never, [Todo, Todos]> => {
	const ids = todos.map((t) => t.id);
	const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
	const newTodo: Todo = { id: nextId, title, done: false };
	return Either.of([newTodo, [...todos, newTodo]]);
};

export const toggleTodo = (id: number, todos: Todos): Either<TodoError, Todos> =>
	Maybe.fromNullable(todos.find((t) => t.id === id))
		.toEither(todoNotFound(id))
		.map(() => todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

export const removeTodo = (id: number, todos: Todos): Either<TodoError, Todos> =>
	Maybe.fromNullable(todos.find((t) => t.id === id))
		.toEither(todoNotFound(id))
		.map(() => todos.filter((t) => t.id !== id));

export const clearCompleted = (todos: Todos): Either<never, Todos> =>
	Either.of(todos.filter((t) => !t.done));

// ============================================================================
// TIER 2 — Pure queries (plain functions, no Either wrapper)
// ============================================================================
//
// NOTE: Queries have no side effects and no failure modes. Wrapping them in
// Either<> would add noise with zero benefit. This is a deliberate choice:
// purify-ts is not a monad-everything framework. Use it only where needed.
// ============================================================================

export const getFilteredTodos = (filter: Filter, todos: Todos): readonly Todo[] => {
	if (filter === 'Active') return todos.filter((t) => !t.done);
	if (filter === 'Completed') return todos.filter((t) => t.done);
	return todos;
};

export const countTodos = (todos: Todos): { total: number; done: number; active: number } => ({
	total: todos.length,
	done: todos.filter((t) => t.done).length,
	active: todos.filter((t) => !t.done).length
});

// ============================================================================
// TIER 3 — AppState mutations via explicit state threading
// ============================================================================
//
// elevate-ts uses State monad to hide the threading.
// effect-ts uses Ref to manage mutable state inside the Effect runtime.
// purify-ts: State IN, new state OUT. Caller threads manually.
//
// This mirrors elevate-ts but with Either<TodoError, AppState> for fallibility.
// ============================================================================

export const addWithHistory = (title: string, state: AppState): Either<never, [Todo, AppState]> =>
	addTodo(title, state.todos).map(([newTodo, newTodos]) => [
		newTodo,
		{
			...state,
			todos: newTodos,
			history: [...state.history, state.todos],
			future: []
		}
	]);

export const toggleWithHistory = (id: number, state: AppState): Either<TodoError, AppState> =>
	toggleTodo(id, state.todos).map((newTodos) => ({
		...state,
		todos: newTodos,
		history: [...state.history, state.todos],
		future: []
	}));

export const removeWithHistory = (id: number, state: AppState): Either<TodoError, AppState> =>
	removeTodo(id, state.todos).map((newTodos) => ({
		...state,
		todos: newTodos,
		history: [...state.history, state.todos],
		future: []
	}));

export const clearCompletedWithHistory = (state: AppState): Either<never, AppState> =>
	clearCompleted(state.todos).map((newTodos) => ({
		...state,
		todos: newTodos,
		history: [...state.history, state.todos],
		future: []
	}));

export const changeFilter = (filter: Filter, state: AppState): AppState => ({
	...state,
	filter
});

export const undo = (state: AppState): AppState => {
	if (state.history.length === 0) return state;
	const previousTodos = state.history[state.history.length - 1];
	const newHistory = state.history.slice(0, -1);
	const newFuture = [...state.future, state.todos];
	return {
		...state,
		todos: previousTodos,
		history: newHistory,
		future: newFuture
	};
};

export const redo = (state: AppState): AppState => {
	if (state.future.length === 0) return state;
	const redoTodos = state.future[state.future.length - 1];
	const newFuture = state.future.slice(0, -1);
	const newHistory = [...state.history, state.todos];
	return {
		...state,
		todos: redoTodos,
		history: newHistory,
		future: newFuture
	};
};

// ============================================================================
// TIER 4 — Side effects with TodoStorage service
// ============================================================================
//
// These return EitherAsync, which is the async counterpart to Either.
// Storage is passed as an explicit parameter — no runtime context.
// ============================================================================

export const saveTodos = (todos: Todos, storage: TodoStorage): EitherAsync<TodoError, void> =>
	storage.save(todos);

export const loadTodos = (storage: TodoStorage): EitherAsync<TodoError, Todos> => storage.load();

// ============================================================================
// FAN-OUT EXAMPLE — Either.sequence
// ============================================================================
//
// elevate-ts weakness: if you want to compute multiple independent results
// at once you must lift each into the monad manually and sequence them.
//
// effect-ts: Effect.all runs effects concurrently.
//
// purify-ts: Either.sequence for sync, EitherAsync.all would be for async.
// Here we use a plain object since all three are simple queries.
// ============================================================================

export const getDashboard = (todos: Todos) => ({
	all: getFilteredTodos('All', todos),
	active: getFilteredTodos('Active', todos),
	completed: getFilteredTodos('Completed', todos)
});
