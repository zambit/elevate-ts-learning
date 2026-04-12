import { describe, it, expect } from 'vitest';
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
	saveTodos,
	loadTodos,
	getDashboard
} from './lib/domain.js';
import type { Todos, AppState } from './lib/types.js';
import type { TodoStorage } from './lib/storage.js';
import { EitherAsync } from 'purify-ts';
import { todoNotFound, storageError } from './lib/errors.js';

// ============================================================================
// Test Helpers
// ============================================================================

const mockStorage = (initial: Todos = []): TodoStorage => {
	let store = initial;
	return {
		save: (todos) =>
			EitherAsync(async ({ liftEither }) => {
				store = todos;
				return liftEither(Either.of<TodoError, void>(undefined));
			}),
		load: () =>
			EitherAsync(async ({ liftEither }) => {
				return liftEither(Either.of<TodoError, Todos>(store));
			})
	};
};

const initialState: AppState = {
	todos: [],
	filter: 'All',
	history: [],
	future: []
};

// ============================================================================
// Error helpers
// ============================================================================

describe('Error constructors', () => {
	it('todoNotFound creates a TodoNotFound error', () => {
		const error = todoNotFound(42);
		expect(error._tag).toBe('TodoNotFound');
		expect(error.id).toBe(42);
	});

	it('storageError creates a StorageError', () => {
		const cause = new Error('disk full');
		const error = storageError(cause);
		expect(error._tag).toBe('StorageError');
		expect(error.cause).toBe(cause);
	});
});

describe('Barrel exports from lib/index', () => {
	it('exports domain functions', async () => {
		const { addTodo: add } = await import('./lib/index.js');
		const result = add('test', []);
		expect(result.isRight()).toBe(true);
	});

	it('exports error constructors', async () => {
		const { todoNotFound: notFound } = await import('./lib/index.js');
		const error = notFound(1);
		expect(error._tag).toBe('TodoNotFound');
	});
});

// ============================================================================
// TIER 1 — Todos mutations
// ============================================================================

describe('Tier 1: addTodo', () => {
	it('creates a new todo with auto-incremented ID', () => {
		const result = addTodo('Learn purify-ts', []);
		expect(result.isRight()).toBe(true);
		const [newTodo] = result.extract();
		expect(newTodo.id).toBe(1);
		expect(newTodo.title).toBe('Learn purify-ts');
		expect(newTodo.done).toBe(false);
	});

	it('returns both the new todo and updated list', () => {
		const todos: Todos = [{ id: 1, title: 'Existing', done: false }];
		const result = addTodo('New', todos);
		expect(result.isRight()).toBe(true);
		const [newTodo, newTodos] = result.extract();
		expect(newTodo.id).toBe(2);
		expect(newTodos.length).toBe(2);
		expect(newTodos[1]).toBe(newTodo);
	});

	it('increments ID based on max existing ID', () => {
		const todos: Todos = [
			{ id: 5, title: 'First', done: false },
			{ id: 10, title: 'Second', done: true }
		];
		const result = addTodo('Third', todos);
		const [newTodo] = result.extract();
		expect(newTodo.id).toBe(11);
	});
});

describe('Tier 1: toggleTodo', () => {
	it('toggles done flag when todo exists', () => {
		const todos: Todos = [
			{ id: 1, title: 'Task', done: false },
			{ id: 2, title: 'Another', done: true }
		];
		const result = toggleTodo(1, todos);
		expect(result.isRight()).toBe(true);
		const newTodos = result.extract();
		expect(newTodos[0].done).toBe(true);
		expect(newTodos[1].done).toBe(true);
	});

	it('returns TodoNotFound when ID does not exist', () => {
		const todos: Todos = [{ id: 1, title: 'Task', done: false }];
		const result = toggleTodo(999, todos);
		expect(result.isRight()).toBe(false);
		const error = result.extract();
		expect(error._tag).toBe('TodoNotFound');
		expect(error.id).toBe(999);
	});

	it('does not modify other todos when toggling', () => {
		const todos: Todos = [
			{ id: 1, title: 'Task1', done: false },
			{ id: 2, title: 'Task2', done: false }
		];
		const result = toggleTodo(1, todos);
		const newTodos = result.extract();
		expect(newTodos[0].done).toBe(true);
		expect(newTodos[1].done).toBe(false);
	});
});

describe('Tier 1: removeTodo', () => {
	it('removes todo when ID exists', () => {
		const todos: Todos = [
			{ id: 1, title: 'Keep', done: false },
			{ id: 2, title: 'Remove', done: false }
		];
		const result = removeTodo(2, todos);
		expect(result.isRight()).toBe(true);
		const newTodos = result.extract();
		expect(newTodos.length).toBe(1);
		expect(newTodos[0].id).toBe(1);
	});

	it('returns TodoNotFound when ID does not exist', () => {
		const todos: Todos = [{ id: 1, title: 'Task', done: false }];
		const result = removeTodo(999, todos);
		expect(result.isRight()).toBe(false);
		const error = result.extract();
		expect(error._tag).toBe('TodoNotFound');
	});
});

describe('Tier 1: clearCompleted', () => {
	it('removes all completed todos', () => {
		const todos: Todos = [
			{ id: 1, title: 'Active', done: false },
			{ id: 2, title: 'Done1', done: true },
			{ id: 3, title: 'Done2', done: true }
		];
		const result = clearCompleted(todos);
		const newTodos = result.extract();
		expect(newTodos.length).toBe(1);
		expect(newTodos[0].done).toBe(false);
	});

	it('returns all todos when none are completed', () => {
		const todos: Todos = [
			{ id: 1, title: 'Active1', done: false },
			{ id: 2, title: 'Active2', done: false }
		];
		const result = clearCompleted(todos);
		const newTodos = result.extract();
		expect(newTodos.length).toBe(2);
	});

	it('handles empty list gracefully', () => {
		const result = clearCompleted([]);
		const newTodos = result.extract();
		expect(newTodos.length).toBe(0);
	});
});

// ============================================================================
// TIER 2 — Pure queries
// ============================================================================

describe('Tier 2: getFilteredTodos', () => {
	const todos: Todos = [
		{ id: 1, title: 'Active', done: false },
		{ id: 2, title: 'Completed', done: true },
		{ id: 3, title: 'Active2', done: false }
	];

	it('returns all todos for All filter', () => {
		const result = getFilteredTodos('All', todos);
		expect(result.length).toBe(3);
	});

	it('returns only active todos for Active filter', () => {
		const result = getFilteredTodos('Active', todos);
		expect(result.length).toBe(2);
		expect(result.every((t) => !t.done)).toBe(true);
	});

	it('returns only completed todos for Completed filter', () => {
		const result = getFilteredTodos('Completed', todos);
		expect(result.length).toBe(1);
		expect(result[0].done).toBe(true);
	});
});

describe('Tier 2: countTodos', () => {
	it('counts todos correctly', () => {
		const todos: Todos = [
			{ id: 1, title: 'Done1', done: true },
			{ id: 2, title: 'Active1', done: false },
			{ id: 3, title: 'Done2', done: true }
		];
		const counts = countTodos(todos);
		expect(counts.total).toBe(3);
		expect(counts.done).toBe(2);
		expect(counts.active).toBe(1);
	});

	it('handles empty list', () => {
		const counts = countTodos([]);
		expect(counts.total).toBe(0);
		expect(counts.done).toBe(0);
		expect(counts.active).toBe(0);
	});
});

// ============================================================================
// TIER 3 — AppState mutations
// ============================================================================

describe('Tier 3: addWithHistory', () => {
	it('adds todo and saves history', () => {
		const result = addWithHistory('New task', initialState);
		expect(result.isRight()).toBe(true);
		const [, newState] = result.extract();
		expect(newState.todos.length).toBe(1);
		expect(newState.history.length).toBe(1);
		expect(newState.future.length).toBe(0);
	});
});

describe('Tier 3: toggleWithHistory', () => {
	it('toggles and saves history', () => {
		const state: AppState = {
			todos: [{ id: 1, title: 'Task', done: false }],
			filter: 'All',
			history: [],
			future: []
		};
		const result = toggleWithHistory(1, state);
		expect(result.isRight()).toBe(true);
		const newState = result.extract();
		expect(newState.todos[0].done).toBe(true);
		expect(newState.history.length).toBe(1);
	});

	it('clears future when toggling', () => {
		const state: AppState = {
			todos: [{ id: 1, title: 'Task', done: false }],
			filter: 'All',
			history: [],
			future: [[{ id: 2, title: 'Old', done: false }]]
		};
		const result = toggleWithHistory(1, state);
		const newState = result.extract();
		expect(newState.future.length).toBe(0);
	});

	it('propagates error when toggling non-existent todo', () => {
		const result = toggleWithHistory(999, initialState);
		expect(result.isRight()).toBe(false);
	});
});

describe('Tier 3: removeWithHistory', () => {
	it('removes and saves history', () => {
		const state: AppState = {
			todos: [
				{ id: 1, title: 'Keep', done: false },
				{ id: 2, title: 'Remove', done: false }
			],
			filter: 'All',
			history: [],
			future: []
		};
		const result = removeWithHistory(2, state);
		expect(result.isRight()).toBe(true);
		const newState = result.extract();
		expect(newState.todos.length).toBe(1);
		expect(newState.history.length).toBe(1);
	});

	it('propagates error when removing non-existent todo', () => {
		const result = removeWithHistory(999, initialState);
		expect(result.isRight()).toBe(false);
	});
});

describe('Tier 3: clearCompletedWithHistory', () => {
	it('clears completed todos and saves history', () => {
		const state: AppState = {
			todos: [
				{ id: 1, title: 'Active', done: false },
				{ id: 2, title: 'Done', done: true }
			],
			filter: 'All',
			history: [],
			future: []
		};
		const result = clearCompletedWithHistory(state);
		expect(result.isRight()).toBe(true);
		const newState = result.extract();
		expect(newState.todos.length).toBe(1);
		expect(newState.history.length).toBe(1);
	});
});

describe('Tier 3: changeFilter', () => {
	it('changes filter without history', () => {
		const newState = changeFilter('Active', initialState);
		expect(newState.filter).toBe('Active');
		expect(newState.history.length).toBe(0);
	});
});

describe('Tier 3: undo/redo', () => {
	it('undoes previous state', () => {
		const state: AppState = {
			todos: [{ id: 1, title: 'Current', done: false }],
			filter: 'All',
			history: [[{ id: 2, title: 'Previous', done: true }]],
			future: []
		};
		const undone = undo(state);
		expect(undone.todos.length).toBe(1);
		expect(undone.todos[0].id).toBe(2);
		expect(undone.future.length).toBe(1);
	});

	it('redoes after undo', () => {
		const state: AppState = {
			todos: [{ id: 2, title: 'Previous', done: true }],
			filter: 'All',
			history: [],
			future: [[{ id: 1, title: 'Current', done: false }]]
		};
		const redone = redo(state);
		expect(redone.todos.length).toBe(1);
		expect(redone.todos[0].id).toBe(1);
	});

	it('does nothing when no history to undo', () => {
		const unchanged = undo(initialState);
		expect(unchanged).toEqual(initialState);
	});

	it('does nothing when no future to redo', () => {
		const unchanged = redo(initialState);
		expect(unchanged).toEqual(initialState);
	});
});

// ============================================================================
// TIER 4 — Storage side effects
// ============================================================================

describe('Tier 4: saveTodos and loadTodos', () => {
	it('saveTodos accepts a storage parameter', () => {
		const todos: Todos = [{ id: 1, title: 'Task', done: false }];
		const storage = mockStorage();
		const result = saveTodos(todos, storage);
		expect(result).toBeDefined();
	});

	it('loadTodos accepts a storage parameter', () => {
		const storage = mockStorage([{ id: 1, title: 'Task', done: false }]);
		const result = loadTodos(storage);
		expect(result).toBeDefined();
	});
});

// ============================================================================
// Fan-out
// ============================================================================

describe('Fan-out: getDashboard', () => {
	it('returns all three filtered views', () => {
		const todos: Todos = [
			{ id: 1, title: 'Active', done: false },
			{ id: 2, title: 'Done', done: true }
		];
		const dashboard = getDashboard(todos);
		expect(dashboard.all.length).toBe(2);
		expect(dashboard.active.length).toBe(1);
		expect(dashboard.completed.length).toBe(1);
	});

	it('handles all-active todos', () => {
		const todos: Todos = [
			{ id: 1, title: 'Task1', done: false },
			{ id: 2, title: 'Task2', done: false }
		];
		const dashboard = getDashboard(todos);
		expect(dashboard.all.length).toBe(2);
		expect(dashboard.active.length).toBe(2);
		expect(dashboard.completed.length).toBe(0);
	});

	it('handles all-completed todos', () => {
		const todos: Todos = [
			{ id: 1, title: 'Task1', done: true },
			{ id: 2, title: 'Task2', done: true }
		];
		const dashboard = getDashboard(todos);
		expect(dashboard.all.length).toBe(2);
		expect(dashboard.active.length).toBe(0);
		expect(dashboard.completed.length).toBe(2);
	});

	it('handles empty todos', () => {
		const dashboard = getDashboard([]);
		expect(dashboard.all.length).toBe(0);
		expect(dashboard.active.length).toBe(0);
		expect(dashboard.completed.length).toBe(0);
	});
});
