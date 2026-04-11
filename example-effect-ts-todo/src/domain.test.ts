import { describe, it, expect } from 'vitest';
import { Effect, Ref, Exit } from 'effect';
import {
	addTodo,
	toggleTodo,
	removeTodo,
	clearCompleted,
	getFilteredTodos,
	countTodos,
	addWithHistory,
	toggleWithHistory,
	removeWithHistory,
	clearCompletedWithHistory,
	changeFilter,
	undo,
	redo,
	getDashboard
} from './lib/domain.js';
import type { Todos, AppState } from './lib/types.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Run a pure effect (no service requirements) synchronously */
const run = <A>(effect: Effect.Effect<A, never, never>): A => Effect.runSync(effect);

// ============================================================================
// Test fixtures
// ============================================================================

const emptyTodos: Todos = [];
const sampleTodos: Todos = [
	{ id: 1, title: 'Learn FP', done: false },
	{ id: 2, title: 'Build app', done: true }
];
const initialState: AppState = {
	todos: [],
	filter: 'All',
	history: [],
	future: []
};

describe('domain', () => {
	// ============================================================================
	// TIER 1 — addTodo
	// ============================================================================

	describe('addTodo', () => {
		it('creates a new todo with correct ID in empty list', () => {
			const [newTodo, todos] = run(addTodo('First', emptyTodos));
			expect(newTodo.id).toBe(1);
			expect(todos).toHaveLength(1);
		});

		it('increments ID correctly when todos exist', () => {
			const [todo1, todos1] = run(addTodo('First', emptyTodos));
			const [todo2] = run(addTodo('Second', todos1));
			expect(todo1.id).toBe(1);
			expect(todo2.id).toBe(2);
		});

		it('preserves existing todos', () => {
			const [, result] = run(addTodo('New task', sampleTodos));
			expect(result).toContain(sampleTodos[0]);
			expect(result).toContain(sampleTodos[1]);
			expect(result).toHaveLength(3);
		});

		it('new todo id is greater than all existing ids', () => {
			const [newTodo] = run(addTodo('Test', sampleTodos));
			expect(newTodo.id).toBeGreaterThan(2);
		});
	});

	// ============================================================================
	// TIER 1 — toggleTodo
	// ============================================================================

	describe('toggleTodo', () => {
		it('marks incomplete todo as done', () => {
			const result = run(toggleTodo(1, sampleTodos));
			expect(result[0].done).toBe(true);
		});

		it('marks completed todo as incomplete', () => {
			const result = run(toggleTodo(2, sampleTodos));
			expect(result[1].done).toBe(false);
		});

		it('fails with TodoNotFound when todo does not exist', () => {
			const exit = Effect.runSyncExit(toggleTodo(999, sampleTodos));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	// ============================================================================
	// TIER 1 — removeTodo
	// ============================================================================

	describe('removeTodo', () => {
		it('removes todo by id', () => {
			const result = run(removeTodo(1, sampleTodos));
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe(2);
		});

		it('fails when todo does not exist', () => {
			const exit = Effect.runSyncExit(removeTodo(999, sampleTodos));
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it('removes from empty list safely and fails', () => {
			const exit = Effect.runSyncExit(removeTodo(1, emptyTodos));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	// ============================================================================
	// TIER 1 — clearCompleted
	// ============================================================================

	describe('clearCompleted', () => {
		it('removes all completed todos', () => {
			const result = run(clearCompleted(sampleTodos));
			expect(result).toHaveLength(1);
			expect(result[0].done).toBe(false);
		});

		it('does nothing if no completed todos', () => {
			const onlyActive: Todos = [{ id: 1, title: 'Task', done: false }];
			const result = run(clearCompleted(onlyActive));
			expect(result).toEqual(onlyActive);
		});
	});

	// ============================================================================
	// TIER 2 — getFilteredTodos
	// ============================================================================

	describe('getFilteredTodos', () => {
		it('returns all todos when filter is All', () => {
			expect(getFilteredTodos('All', sampleTodos)).toEqual(sampleTodos);
		});

		it('returns only active todos when filter is Active', () => {
			const result = getFilteredTodos('Active', sampleTodos);
			expect(result).toHaveLength(1);
			expect(result[0].done).toBe(false);
		});

		it('returns only completed todos when filter is Completed', () => {
			const result = getFilteredTodos('Completed', sampleTodos);
			expect(result).toHaveLength(1);
			expect(result[0].done).toBe(true);
		});

		it('returns empty array for empty list', () => {
			expect(getFilteredTodos('All', emptyTodos)).toEqual([]);
		});
	});

	// ============================================================================
	// TIER 2 — countTodos
	// ============================================================================

	describe('countTodos', () => {
		it('counts correctly with mixed todos', () => {
			const counts = countTodos(sampleTodos);
			expect(counts).toEqual({ total: 2, done: 1, active: 1 });
		});

		it('counts empty list as zeros', () => {
			const counts = countTodos(emptyTodos);
			expect(counts).toEqual({ total: 0, done: 0, active: 0 });
		});

		it('counts all-done list', () => {
			const allDone: Todos = [
				{ id: 1, title: 'Done 1', done: true },
				{ id: 2, title: 'Done 2', done: true }
			];
			const counts = countTodos(allDone);
			expect(counts).toEqual({ total: 2, done: 2, active: 0 });
		});
	});

	// ============================================================================
	// TIER 3 — History Operations (Ref-based)
	// ============================================================================

	describe('History Operations', () => {
		it('addWithHistory saves previous state to history', async () => {
			const state1 = initialState;
			const ref = await Effect.runPromise(Ref.make(state1));
			await Effect.runPromise(addWithHistory('First', ref));
			const state2 = await Effect.runPromise(Ref.get(ref));
			expect(state2.history).toEqual([state1.todos]);
			expect(state2.todos).toHaveLength(1);
		});

		it('toggleWithHistory saves previous state', async () => {
			const state1: AppState = {
				todos: sampleTodos,
				filter: 'All',
				history: [],
				future: []
			};
			const ref = await Effect.runPromise(Ref.make(state1));
			await Effect.runPromise(toggleWithHistory(1, ref));
			const state2 = await Effect.runPromise(Ref.get(ref));
			expect(state2.history).toEqual([state1.todos]);
			expect(state2.todos[0].done).toBe(true);
			expect(state2.future).toHaveLength(0);
		});

		it('undo restores previous state', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			const state1 = await Effect.runPromise(Ref.get(ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			await Effect.runPromise(undo(ref));
			const undoneState = await Effect.runPromise(Ref.get(ref));
			expect(undoneState.todos).toEqual(state1.todos);
			expect(undoneState.history).toHaveLength(1);
			expect(undoneState.future).toHaveLength(1);
		});

		it('undo with empty history does nothing', async () => {
			const ref = await Effect.runPromise(Ref.make(initialState));
			await Effect.runPromise(undo(ref));
			const result = await Effect.runPromise(Ref.get(ref));
			expect(result).toEqual(initialState);
		});

		it('multiple operations build up history', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			await Effect.runPromise(addWithHistory('Third', ref));
			const state3 = await Effect.runPromise(Ref.get(ref));
			expect(state3.history).toHaveLength(3);
			expect(state3.todos).toHaveLength(3);
		});

		it('redo restores undone state', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			const state1 = await Effect.runPromise(Ref.get(ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			const state2 = await Effect.runPromise(Ref.get(ref));
			await Effect.runPromise(undo(ref));
			const state3 = await Effect.runPromise(Ref.get(ref));
			expect(state3.future).toHaveLength(1);
			expect(state3.todos).toEqual(state1.todos);
			await Effect.runPromise(redo(ref));
			const state4 = await Effect.runPromise(Ref.get(ref));
			expect(state4.todos).toEqual(state2.todos);
			expect(state4.history).toHaveLength(2);
			expect(state4.future).toHaveLength(0);
		});

		it('redo with empty future does nothing', async () => {
			const ref = await Effect.runPromise(Ref.make(initialState));
			await Effect.runPromise(redo(ref));
			const result = await Effect.runPromise(Ref.get(ref));
			expect(result).toEqual(initialState);
		});

		it('new action clears future (redo chain broken)', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			await Effect.runPromise(undo(ref));
			const state3 = await Effect.runPromise(Ref.get(ref));
			expect(state3.future).toHaveLength(1);
			await Effect.runPromise(addWithHistory('Third', ref));
			const state4 = await Effect.runPromise(Ref.get(ref));
			expect(state4.future).toHaveLength(0);
			expect(state4.todos).toHaveLength(2);
		});

		it('undo/redo cycle preserves state', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			await Effect.runPromise(addWithHistory('Third', ref));
			const state3 = await Effect.runPromise(Ref.get(ref));
			await Effect.runPromise(undo(ref));
			await Effect.runPromise(undo(ref));
			const state5 = await Effect.runPromise(Ref.get(ref));
			expect(state5.todos).toHaveLength(1);
			expect(state5.future).toHaveLength(2);
			await Effect.runPromise(redo(ref));
			await Effect.runPromise(redo(ref));
			const state7 = await Effect.runPromise(Ref.get(ref));
			expect(state7.todos).toEqual(state3.todos);
			expect(state7.history).toHaveLength(3);
			expect(state7.future).toHaveLength(0);
		});

		it('changeFilter does not touch history', async () => {
			const state: AppState = { ...initialState, todos: sampleTodos };
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(changeFilter('Active', ref));
			const result = await Effect.runPromise(Ref.get(ref));
			expect(result.filter).toBe('Active');
			expect(result.history).toHaveLength(0);
			expect(result.future).toHaveLength(0);
		});

		it('composing operations works', async () => {
			const state = initialState;
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(addWithHistory('First', ref));
			await Effect.runPromise(addWithHistory('Second', ref));
			await Effect.runPromise(toggleWithHistory(1, ref));
			const state3 = await Effect.runPromise(Ref.get(ref));
			expect(state3.todos).toHaveLength(2);
			expect(state3.todos[0].done).toBe(true);
			expect(state3.history).toHaveLength(3);
		});
	});

	describe('getDashboard', () => {
		it('returns all three filter views in one call', () => {
			const result = run(getDashboard(sampleTodos));
			expect(result.all).toEqual(sampleTodos);
			expect(result.active).toHaveLength(1);
			expect(result.completed).toHaveLength(1);
		});

		it('works with empty list', () => {
			const result = run(getDashboard(emptyTodos));
			expect(result.all).toHaveLength(0);
			expect(result.active).toHaveLength(0);
			expect(result.completed).toHaveLength(0);
		});

		it('works with all active todos', () => {
			const allActive: Todos = [
				{ id: 1, title: 'Task 1', done: false },
				{ id: 2, title: 'Task 2', done: false }
			];
			const result = run(getDashboard(allActive));
			expect(result.all).toHaveLength(2);
			expect(result.active).toHaveLength(2);
			expect(result.completed).toHaveLength(0);
		});

		it('works with all completed todos', () => {
			const allCompleted: Todos = [
				{ id: 1, title: 'Task 1', done: true },
				{ id: 2, title: 'Task 2', done: true }
			];
			const result = run(getDashboard(allCompleted));
			expect(result.all).toHaveLength(2);
			expect(result.active).toHaveLength(0);
			expect(result.completed).toHaveLength(2);
		});
	});

	describe('Edge cases and state consistency', () => {
		it('removeWithHistory properly clears future after mutation', async () => {
			const state: AppState = { ...initialState, todos: sampleTodos };
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(removeWithHistory(1, ref));
			const result = await Effect.runPromise(Ref.get(ref));
			expect(result.future).toHaveLength(0);
			expect(result.todos).toHaveLength(1);
		});

		it('clearCompletedWithHistory with no completed todos still pushes to history', async () => {
			const onlyActive: Todos = [{ id: 1, title: 'Active', done: false }];
			const state: AppState = { ...initialState, todos: onlyActive };
			const ref = await Effect.runPromise(Ref.make(state));
			await Effect.runPromise(clearCompletedWithHistory(ref));
			const result = await Effect.runPromise(Ref.get(ref));
			expect(result.history).toHaveLength(1);
			expect(result.todos).toEqual(onlyActive);
		});

		it('redo with empty future returns state unchanged', async () => {
			const ref = await Effect.runPromise(Ref.make(initialState));
			const stateBefore = await Effect.runPromise(Ref.get(ref));
			await Effect.runPromise(redo(ref));
			const stateAfter = await Effect.runPromise(Ref.get(ref));
			expect(stateAfter).toEqual(stateBefore);
		});
	});
});
