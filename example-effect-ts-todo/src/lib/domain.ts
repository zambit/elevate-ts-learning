import { Effect, Ref } from 'effect';
import type { Todo, Todos, Filter, AppState } from './types.js';
import { TodoNotFound, StorageError } from './errors.js';
import { TodoStorage } from './storage.js';

// ============================================================================
// TIER 1 — Todos mutations (pure Effects over Todos, no state ref)
// ============================================================================
//
// elevate-ts: State<Todos, Todo>  — threads state implicitly through the monad
// effect-ts:  Effect<[Todo, Todos], never, never>  — returns the pair explicitly
//
// WHY: At this tier there is no global mutable state; passing Todos in and
// returning a new Todos out is clean. We use Effect here only to enable typed
// errors for operations that CAN fail (toggle/remove on missing ID).
// ============================================================================

/** Add a new todo with auto-incremented ID to the list */
export const addTodo = (title: string, todos: Todos): Effect.Effect<[Todo, Todos], never, never> =>
	Effect.sync(() => {
		const ids = todos.map((t) => t.id);
		const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
		const newTodo: Todo = { id: nextId, title, done: false };
		return [newTodo, [...todos, newTodo]];
	});

/** Toggle the done flag on a todo by ID, failing if not found */
export const toggleTodo = (id: number, todos: Todos): Effect.Effect<Todos, TodoNotFound, never> =>
	Effect.sync(() => {
		const todo = todos.find((t) => t.id === id);
		if (!todo) throw new TodoNotFound({ id });
		return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
	}).pipe(
		Effect.catchTag('TodoNotFound', (e) => Effect.fail(e)),
		Effect.catchAll(() => Effect.fail(new TodoNotFound({ id })))
	);

/** Remove a todo by ID, failing if not found */
export const removeTodo = (id: number, todos: Todos): Effect.Effect<Todos, TodoNotFound, never> =>
	Effect.sync(() => {
		const exists = todos.some((t) => t.id === id);
		if (!exists) throw new TodoNotFound({ id });
		return todos.filter((t) => t.id !== id);
	}).pipe(
		Effect.catchTag('TodoNotFound', (e) => Effect.fail(e)),
		Effect.catchAll(() => Effect.fail(new TodoNotFound({ id })))
	);

/** Remove all completed todos (never fails) */
export const clearCompleted = (todos: Todos): Effect.Effect<Todos, never, never> =>
	Effect.succeed(todos.filter((t) => !t.done));

// ============================================================================
// TIER 2 — Pure queries (plain functions, no Effect wrapper)
// ============================================================================
//
// NOTE: Queries have no side effects and no failure modes. Wrapping them in
// Effect<> would add noise with zero benefit. This is a deliberate choice:
// effect-ts is not a monad-everything framework. Use it only where the type
// system adds value.
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
// TIER 3 — AppState mutations via Ref
// ============================================================================
//
// elevate-ts weakness: callers must thread state manually through .run().
// The execute() in the UI is a workaround — but it only works synchronously
// and cannot be composed across async boundaries.
//
// effect-ts solution: Ref<AppState>
//
//   A Ref is a mutable cell inside the Effect runtime. Operations that need
//   to read or modify state call Ref.modify. The Ref itself is passed as a
//   parameter (explicit dependency), keeping data flow visible.
// ============================================================================

/** Add a todo and save the current state to history */
export const addWithHistory = (
	title: string,
	ref: Ref.Ref<AppState>
): Effect.Effect<Todo, never, never> =>
	Effect.gen(function* () {
		const state = yield* Ref.get(ref);
		const [newTodo, newTodos] = yield* addTodo(title, state.todos);
		yield* Ref.set(ref, {
			...state,
			todos: newTodos,
			history: [...state.history, state.todos],
			future: []
		});
		return newTodo;
	});

/** Toggle a todo and save history */
export const toggleWithHistory = (
	id: number,
	ref: Ref.Ref<AppState>
): Effect.Effect<void, TodoNotFound, never> =>
	Effect.gen(function* () {
		const state = yield* Ref.get(ref);
		const newTodos = yield* toggleTodo(id, state.todos);
		yield* Ref.set(ref, {
			...state,
			todos: newTodos,
			history: [...state.history, state.todos],
			future: []
		});
	});

/** Remove a todo and save history */
export const removeWithHistory = (
	id: number,
	ref: Ref.Ref<AppState>
): Effect.Effect<void, TodoNotFound, never> =>
	Effect.gen(function* () {
		const state = yield* Ref.get(ref);
		const newTodos = yield* removeTodo(id, state.todos);
		yield* Ref.set(ref, {
			...state,
			todos: newTodos,
			history: [...state.history, state.todos],
			future: []
		});
	});

/** Clear all completed todos and save history */
export const clearCompletedWithHistory = (
	ref: Ref.Ref<AppState>
): Effect.Effect<void, never, never> =>
	Effect.gen(function* () {
		const state = yield* Ref.get(ref);
		const newTodos = yield* clearCompleted(state.todos);
		yield* Ref.set(ref, {
			...state,
			todos: newTodos,
			history: [...state.history, state.todos],
			future: []
		});
	});

/** Change the filter without touching history */
export const changeFilter = (
	filter: Filter,
	ref: Ref.Ref<AppState>
): Effect.Effect<void, never, never> =>
	Ref.modify(ref, (state) => [undefined, { ...state, filter }]);

/** Undo the last action by popping history */
export const undo = (ref: Ref.Ref<AppState>): Effect.Effect<void, never, never> =>
	Ref.modify(ref, (state) => {
		if (state.history.length === 0) return [undefined, state];
		const previousTodos = state.history[state.history.length - 1];
		const newHistory = state.history.slice(0, -1);
		const newFuture = [...state.future, state.todos];
		return [
			undefined,
			{
				...state,
				todos: previousTodos,
				history: newHistory,
				future: newFuture
			}
		];
	});

/** Redo the last undone action by popping future */
export const redo = (ref: Ref.Ref<AppState>): Effect.Effect<void, never, never> =>
	Ref.modify(ref, (state) => {
		if (state.future.length === 0) return [undefined, state];
		const redoTodos = state.future[state.future.length - 1];
		const newFuture = state.future.slice(0, -1);
		const newHistory = [...state.history, state.todos];
		return [
			undefined,
			{
				...state,
				todos: redoTodos,
				history: newHistory,
				future: newFuture
			}
		];
	});

// ============================================================================
// TIER 4 — Side effects with TodoStorage service in R parameter
// ============================================================================
//
// These have R = TodoStorage in their type.
// That makes the dependency visible at the call site and enforced by
// the compiler — you cannot run them without providing a storage layer.
// ============================================================================

/** Save todos to storage (requires TodoStorage service) */
export const saveTodosEffect = (todos: Todos): Effect.Effect<void, StorageError, TodoStorage> =>
	Effect.flatMap(TodoStorage, (service) => service.save(todos));

/** Load todos from storage (requires TodoStorage service) */
export const loadTodosEffect = (): Effect.Effect<Todos, StorageError, TodoStorage> =>
	Effect.flatMap(TodoStorage, (service) => service.load());

// ============================================================================
// FAN-OUT EXAMPLE — Effect.all
// ============================================================================
//
// elevate-ts weakness: if you want to compute multiple independent results
// at once you must lift each into the monad manually and sequence them.
//
// effect-ts: Effect.all runs a struct/tuple of Effects concurrently by default
// and collects all results. This is the "fan-out" pattern — fire many
// computations, collect all results without manual lifting.
//
// Usage: getDashboard runs getFilteredTodos for ALL three filters at once,
// returning a summary record. In practice you'd call this once to hydrate
// a summary panel without three sequential reads.
// ============================================================================

export const getDashboard = (
	todos: Todos
): Effect.Effect<
	{ all: readonly Todo[]; active: readonly Todo[]; completed: readonly Todo[] },
	never,
	never
> =>
	Effect.all({
		all: Effect.succeed(getFilteredTodos('All', todos)),
		active: Effect.succeed(getFilteredTodos('Active', todos)),
		completed: Effect.succeed(getFilteredTodos('Completed', todos))
	});
