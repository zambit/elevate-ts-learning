import { State } from '/Volumes/AWCDrive/git/zambit/elevate-ts/dist/esm/State.js';

import type { Todo, Todos, Filter, AppState } from './types.js';

// ============================================================================
// Todo List Operations (pure functions over Todos)
// ============================================================================
//
// These functions use the State monad pattern to handle state changes
// functionally. Rather than mutating the todos array, each function:
//   1. Receives the current state as input
//   2. Returns a tuple: [result, newState]
//   3. The original state is never modified
//
// This makes state transformations explicit, testable, and composable.
// Use .run(currentState) to execute a State operation.
//
// ============================================================================

/**
 * Add a new todo to the list with an auto-incremented ID.
 *
 * State monad signature: State<Todos, Todo>
 *   - Input state: Todos (current todo list)
 *   - Return value: Todo (the newly created todo)
 *
 * @param title - The title of the new todo
 * @returns State monad that, when run with a todos list, produces:
 *          [newTodo, updatedTodos] where updatedTodos includes the new todo
 *
 * @example
 *   const [newTodo, todos] = addTodo('Learn FP').run([])
 *   // newTodo = { id: 1, title: 'Learn FP', done: false }
 *   // todos = [{ id: 1, title: 'Learn FP', done: false }]
 */
export const addTodo = (title: string): State<Todos, Todo> =>
	State((todos) => {
		// Extract all existing IDs to find the highest one
		const ids = todos.map((t) => t.id);
		// Generate next ID: if todos exist, increment the max ID; otherwise start at 1
		const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
		// Create the new todo with the computed ID and uncompleted status
		const newTodo: Todo = {
			id: nextId,
			title,
			done: false
		};
		// Return both the created todo AND the updated todos array
		// [what the caller gets, new state]
		return [newTodo, [...todos, newTodo]];
	});

/**
 * Toggle a todo's completion status (done ↔ not done).
 *
 * State monad signature: State<Todos, void>
 *   - Input state: Todos (current todo list)
 *   - Return value: void (we return `undefined` since we only care about state change)
 *
 * @param id - The ID of the todo to toggle
 * @returns State monad that, when run, produces [undefined, updatedTodos]
 *
 * @example
 *   const [_, todos] = toggleTodo(1).run([{ id: 1, title: 'Task', done: false }])
 *   // todos = [{ id: 1, title: 'Task', done: true }]
 */
export const toggleTodo = (id: number): State<Todos, void> =>
	State((todos) => [
		// Return undefined since toggling doesn't produce a meaningful result value
		undefined,
		// Map over todos: if ID matches, flip the done flag; otherwise keep unchanged
		todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
	]);

/**
 * Remove a todo from the list by ID.
 *
 * @param id - The ID of the todo to remove
 * @returns State monad that, when run, produces [undefined, updatedTodos]
 *          where the todo with the given ID is removed
 *
 * @example
 *   const [_, todos] = removeTodo(1).run([
 *     { id: 1, title: 'Task 1', done: false },
 *     { id: 2, title: 'Task 2', done: false }
 *   ])
 *   // todos = [{ id: 2, title: 'Task 2', done: false }]
 */
export const removeTodo = (id: number): State<Todos, void> =>
	State((todos) => [
		undefined,
		// Filter out the todo with matching ID, keeping all others
		todos.filter((t) => t.id !== id)
	]);

/**
 * Remove all completed todos from the list.
 *
 * @returns State monad that, when run, produces [undefined, updatedTodos]
 *          containing only incomplete todos
 *
 * @example
 *   const [_, todos] = clearCompleted().run([
 *     { id: 1, title: 'Done', done: true },
 *     { id: 2, title: 'TODO', done: false }
 *   ])
 *   // todos = [{ id: 2, title: 'TODO', done: false }]
 */
export const clearCompleted = (): State<Todos, void> =>
	State((todos) => [
		undefined,
		// Keep only todos that are NOT done
		todos.filter((t) => !t.done)
	]);

// ============================================================================
// Queries (pure functions that don't change state)
// ============================================================================
//
// Unlike State monad operations, these are simple pure functions that:
//   1. Take input parameters (todos list, filters, etc.)
//   2. Return a result without modifying state
//   3. Can be used directly without .run()
//
// Use these for filtering, displaying, and analyzing todos.
//
// ============================================================================

/**
 * Get todos filtered by their completion status.
 *
 * This is a pure function (not a State monad) because it only reads data
 * and doesn't modify state. Use it for UI filtering and display.
 *
 * @param filter - One of: 'All', 'Active', 'Completed'
 * @param todos - The todo list to filter
 * @returns A new array containing only todos matching the filter
 *
 * @example
 *   getFilteredTodos('Active', todos)   // only uncompleted todos
 *   getFilteredTodos('Completed', todos) // only completed todos
 *   getFilteredTodos('All', todos)      // all todos (no filter)
 */
export const getFilteredTodos = (filter: Filter, todos: Todos): readonly Todo[] =>
	filter === 'All'
		? todos // Show everything
		: filter === 'Active'
			? todos.filter((t) => !t.done) // Show only incomplete todos
			: todos.filter((t) => t.done); // Show only completed todos

/**
 * Count todos by their completion status.
 *
 * This is a pure query function that provides statistics about the todo list.
 * Use it to display progress and summary information.
 *
 * @param todos - The todo list to analyze
 * @returns An object with counts: { total, done, active }
 *
 * @example
 *   const counts = countTodos(todos)
 *   console.log(`${counts.active} of ${counts.total} tasks remaining`)
 */
export const countTodos = (
	todos: Todos
): { readonly total: number; readonly done: number; readonly active: number } => ({
	total: todos.length, // Total number of todos
	done: todos.filter((t) => t.done).length, // Number of completed todos
	active: todos.filter((t) => !t.done).length // Number of incomplete todos
});

// ============================================================================
// App State Operations (State<AppState, A>)
// ============================================================================
//
// These functions work with the full AppState (todos + filter + history).
// They compose the basic todo operations and add history tracking for undo.
//
// Key pattern: They call the basic operations (addTodo, toggleTodo, etc)
// using .run(), capture the result, and then wrap it in a larger AppState.
// This is how you build complex operations from simpler ones.
//
// ============================================================================

/**
 * Change the active filter without modifying todos or history.
 *
 * This is a simple state update that doesn't affect the todo list.
 *
 * @param filter - The filter to switch to ('All', 'Active', or 'Completed')
 * @returns State monad operating on AppState
 *
 * @example
 *   const [_, newState] = changeFilter('Active').run(appState)
 *   // newState has the same todos and history, but filter changed
 */
export const changeFilter = (filter: Filter): State<AppState, void> =>
	State((state) => [
		undefined,
		// Spread all current state but replace the filter
		{ ...state, filter }
	]);

/**
 * Add a todo and save the previous state in history for undo functionality.
 *
 * This demonstrates composition: it calls addTodo (the basic operation),
 * then captures the result and builds a new AppState with the updated todos
 * and history. This is the pattern for adding undo support to any operation.
 *
 * @param title - The title of the todo to add
 * @returns State monad that produces [newTodo, updatedAppState]
 *
 * @example
 *   const [newTodo, newState] = addWithHistory('Learn Monads').run(appState)
 *   // newState.todos contains the new todo
 *   // newState.history contains the previous todos for undo
 */
export const addWithHistory = (title: string): State<AppState, Todo> =>
	State((state) => {
		// Step 1: Run the basic addTodo operation on the current todos
		const [newTodo, newTodos] = addTodo(title).run(state.todos);

		// Step 2: Build the new AppState with:
		//   - Updated todos
		//   - Previous todos saved in history
		//   - Future cleared (new action invalidates redo chain)
		//   - Filter unchanged
		return [
			newTodo, // Return the created todo to the caller
			{
				...state, // Keep filter and other state
				todos: newTodos, // Updated todo list
				history: [...state.history, state.todos], // Save OLD todos for undo
				future: [] // Clear redo chain on new action
			}
		];
	});

/**
 * Toggle a todo's completion status and save history for undo.
 *
 * Follows the same composition pattern as addWithHistory:
 * run the basic operation, save the old state, return new AppState.
 *
 * @param id - The ID of the todo to toggle
 * @returns State monad operating on AppState
 *
 * @example
 *   const [_, newState] = toggleWithHistory(1).run(appState)
 *   // newState.todos[0].done is flipped
 *   // newState.history contains the previous todos
 */
export const toggleWithHistory = (id: number): State<AppState, void> =>
	State((state) => {
		// Run the basic toggle operation
		const [, newTodos] = toggleTodo(id).run(state.todos);
		return [
			undefined,
			{
				...state,
				todos: newTodos,
				history: [...state.history, state.todos], // Save for undo
				future: [] // Clear redo chain on new action
			}
		];
	});

/**
 * Remove a todo and save history for undo.
 *
 * @param id - The ID of the todo to remove
 * @returns State monad operating on AppState
 *
 * @example
 *   const [_, newState] = removeWithHistory(1).run(appState)
 *   // newState.todos no longer contains the todo with id 1
 *   // newState.history contains the previous todos (including the removed one)
 */
export const removeWithHistory = (id: number): State<AppState, void> =>
	State((state) => {
		const [, newTodos] = removeTodo(id).run(state.todos);
		return [
			undefined,
			{
				...state,
				todos: newTodos,
				history: [...state.history, state.todos], // Save for undo
				future: [] // Clear redo chain on new action
			}
		];
	});

/**
 * Clear all completed todos and save history for undo.
 *
 * @returns State monad operating on AppState
 *
 * @example
 *   const [_, newState] = clearCompletedWithHistory().run(appState)
 *   // newState.todos contains only incomplete todos
 *   // newState.history has the previous todos available for undo
 */
export const clearCompletedWithHistory = (): State<AppState, void> =>
	State((state) => {
		const [, newTodos] = clearCompleted().run(state.todos);
		return [
			undefined,
			{
				...state,
				todos: newTodos,
				history: [...state.history, state.todos], // Save for undo
				future: [] // Clear redo chain on new action
			}
		];
	});

/**
 * Undo the last action by restoring the previous todos state.
 *
 * How it works:
 *   1. Check if there's anything in the history
 *   2. If yes, pop the last item from history (that's our previous state)
 *   3. Save the current todos to future (so we can redo)
 *   4. Restore those todos and update history/future
 *   5. If no history, do nothing (can't undo with empty history)
 *
 * The current todos are moved to the future stack, allowing redo.
 * The filter is preserved across undo operations (only todos, history, and future change).
 *
 * @returns State monad that either undoes the last action or does nothing
 *
 * @example
 *   // After: addWithHistory('Task 1'), addWithHistory('Task 2')
 *   const [_, newState] = undo().run(appState)
 *   // newState.todos is back to having only 'Task 1'
 *   // newState.history has one fewer entry
 *   // newState.future contains 'Task 2' state for potential redo
 *
 *   // If history is empty:
 *   const [_, sameState] = undo().run(appState)
 *   // sameState === appState (nothing changed)
 */
export const undo = (): State<AppState, void> =>
	State((state) => {
		// Guard: if no history, return state unchanged
		if (state.history.length === 0) {
			return [undefined, state];
		}

		// Get the last entry in history (the state before the previous action)
		const previousTodos = state.history[state.history.length - 1];
		// Remove that entry from history (it's no longer "previous", it's current)
		const newHistory = state.history.slice(0, -1);
		// Save current todos to future so we can redo this action
		const newFuture = [...state.future, state.todos];

		return [
			undefined,
			{
				// Restore the todos to their previous state
				todos: previousTodos,
				// Keep the filter unchanged (undo doesn't affect filter)
				filter: state.filter,
				// Shrink history to remove what we just restored
				history: newHistory,
				// Grow future to enable redo
				future: newFuture
			}
		];
	});

/**
 * Redo the last undone action by restoring todos from the future stack.
 *
 * How it works:
 *   1. Check if there's anything in the future (i.e., an undone action)
 *   2. If yes, pop the last item from future
 *   3. Save the current todos to history
 *   4. Restore those todos and update history/future
 *   5. If no future, do nothing (can't redo with empty future)
 *
 * The current todos are moved to history, allowing another undo if desired.
 * The filter is preserved across redo operations.
 *
 * @returns State monad that either redoes the last undone action or does nothing
 *
 * @example
 *   // After: addWithHistory('Task 1'), addWithHistory('Task 2'), undo()
 *   const [_, newState] = redo().run(appState)
 *   // newState.todos is back to having 'Task 2'
 *   // newState.history has one more entry
 *   // newState.future is shorter by one
 *
 *   // If future is empty:
 *   const [_, sameState] = redo().run(appState)
 *   // sameState === appState (nothing changed)
 */
export const redo = (): State<AppState, void> =>
	State((state) => {
		// Guard: if no future, return state unchanged
		if (state.future.length === 0) {
			return [undefined, state];
		}

		// Get the last entry in future (the state we're redoing)
		const redoTodos = state.future[state.future.length - 1];
		// Remove that entry from future (it's no longer "future", it's current)
		const newFuture = state.future.slice(0, -1);
		// Save current todos to history so we can undo again
		const newHistory = [...state.history, state.todos];

		return [
			undefined,
			{
				// Restore the todos to the redone state
				todos: redoTodos,
				// Keep the filter unchanged (redo doesn't affect filter)
				filter: state.filter,
				// Grow history to enable undo
				history: newHistory,
				// Shrink future since we're consuming it
				future: newFuture
			}
		];
	});

// ============================================================================
// Persistence (side effects, but predictable)
// ============================================================================
//
// These are NOT State monad operations because they perform side effects
// (reading/writing to localStorage). They're kept separate so the rest
// of the code stays pure and testable.
//
// Use these at the UI boundary to save/load state.
//
// ============================================================================

const STORAGE_KEY = 'elevate-ts-todos';

/**
 * Save todos to browser localStorage.
 *
 * This performs a side effect (writing to the browser's storage).
 * Call this after mutations to persist changes across page refreshes.
 *
 * @param todos - The todo list to save
 *
 * @example
 *   const [_, newState] = addWithHistory('New task').run(appState)
 *   saveTodos(newState.todos)  // Persist to localStorage
 */
export const saveTodos = (todos: Todos): void => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
};

/**
 * Load todos from browser localStorage.
 *
 * This performs a side effect (reading from the browser's storage).
 * Call this on app startup to restore the saved todo list.
 *
 * Note: Only todos are persisted to localStorage. History and future are
 * session-only and reset on page refresh (this is intentional - undo/redo
 * should not survive across browser sessions).
 *
 * @returns The saved todos, or an empty array if nothing is stored
 *
 * @example
 *   const todos = loadTodos()  // Restore on app load
 *   const initialState = {
 *     todos,
 *     filter: 'All',
 *     history: [],
 *     future: []
 *   }
 */
export const loadTodos = (): Todos => {
	const saved = localStorage.getItem(STORAGE_KEY);
	return saved ? JSON.parse(saved) : [];
};
