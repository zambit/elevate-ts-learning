<script lang="ts">
	import { onMount } from 'svelte';
	import { Effect, Ref } from 'effect';
	import {
		addWithHistory,
		toggleWithHistory,
		removeWithHistory,
		clearCompletedWithHistory,
		changeFilter,
		getFilteredTodos,
		countTodos,
		saveTodosEffect,
		loadTodosEffect,
		undo,
		redo
	} from '$lib/domain.js';
	import { AppRuntime } from '$lib/runtime.js';
	import type { AppState } from '$lib/types.js';
	import { TodoNotFound, StorageError } from '$lib/errors.js';

	// ============================================================================
	// initialize Ref at module load (top-level await in SvelteKit)
	// ============================================================================
	//
	// elevate-ts: const [, todos] = addTodo('...').run([])
	// effect-ts:  const stateRef = await AppRuntime.runPromise(Ref.make(...))
	//
	// The Ref lives for the lifetime of the component. Svelte's onMount ensures
	// it's ready before any UI interaction occurs.
	// ============================================================================

	const stateRef = await AppRuntime.runPromise(
		Ref.make<AppState>({ todos: [], filter: 'All', history: [], future: [] })
	);

	let appState = $state<AppState>({ todos: [], filter: 'All', history: [], future: [] });
	let inputValue = $state('');
	let errorMessage = $state('');

	// ============================================================================
	// execute() — the effect-ts equivalent of elevate-ts's execute()
	// ============================================================================
	//
	// elevate-ts execute(): runs a State monad synchronously, extracts new state.
	// No way to carry async operations. Errors are silent (no E parameter).
	//
	// effect-ts execute(): runs an Effect against the Ref via ManagedRuntime.
	//   - Can run async Effects (storage, fetch, etc.) transparently
	//   - TodoNotFound errors are caught and can be shown in the UI
	//   - saveTodosEffect is composed inside the pipeline — not tacked on after
	//
	// The pattern:
	//   1. Run the domain Effect (mutates the Ref internally)
	//   2. Read the new state out of the Ref
	//   3. Persist via saveTodosEffect (which requires TodoStorage — satisfied)
	//   4. Mirror into appState (Svelte reactive variable)
	// ============================================================================

	const execute = async (
		domainEffect: Effect.Effect<unknown, TodoNotFound | StorageError, never>
	): Promise<void> => {
		try {
			await AppRuntime.runPromise(
				Effect.gen(function* () {
					yield* domainEffect;
					const newState = yield* Ref.get(stateRef);
					appState = newState;
					yield* saveTodosEffect(newState.todos);
				}).pipe(
					Effect.catchTag('TodoNotFound', (e) => {
						errorMessage = `Todo ${e.id} not found`;
						return Effect.logWarning(`Todo ${e.id} not found — ignoring`);
					}),
					Effect.catchTag('StorageError', (e) => {
						errorMessage = `Storage error: ${String(e.cause)}`;
						return Effect.logWarning(`Storage failed: ${String(e.cause)}`);
					})
				)
			);
			errorMessage = '';
		} catch (err) {
			errorMessage = `Unexpected error: ${String(err)}`;
			console.error(err);
		}
	};

	/** Handle adding a new todo */
	const handleAddTodo = () => {
		const title = inputValue.trim();
		if (title) {
			execute(addWithHistory(title, stateRef));
			inputValue = '';
		}
	};

	/** Handle toggling a todo's done status */
	const handleToggleTodo = (id: number) => {
		execute(toggleWithHistory(id, stateRef));
	};

	/** Handle removing a todo */
	const handleRemoveTodo = (id: number) => {
		execute(removeWithHistory(id, stateRef));
	};

	/** Handle clearing completed todos */
	const handleClearCompleted = () => {
		execute(clearCompletedWithHistory(stateRef));
	};

	/** Handle filter change */
	const handleFilterChange = (filter: 'All' | 'Active' | 'Completed') => {
		execute(changeFilter(filter, stateRef));
	};

	/** Handle undo */
	const handleUndo = () => {
		execute(undo(stateRef));
	};

	/** Handle redo */
	const handleRedo = () => {
		execute(redo(stateRef));
	};

	// ============================================================================
	// Load persisted todos on mount
	// ============================================================================
	onMount(async () => {
		await AppRuntime.runPromise(
			Effect.gen(function* () {
				const todos = yield* loadTodosEffect();
				yield* Ref.set(stateRef, {
					todos,
					filter: 'All',
					history: [],
					future: []
				});
				appState = yield* Ref.get(stateRef);
			}).pipe(Effect.catchTag('StorageError', () => Effect.void))
		);
	});

	// ============================================================================
	// Reactive derived values (plain Svelte runes)
	// ============================================================================
	let filtered = $derived(getFilteredTodos(appState.filter, appState.todos));
	let counts = $derived(countTodos(appState.todos));
	let canUndo = $derived(appState.history.length > 0);
	let canRedo = $derived(appState.future.length > 0);
</script>

<main>
	<div class="container">
		<div class="header">
			<h1>Effect-TS Todo App</h1>
			<p class="subtitle">Learning effect-ts with functional programming</p>
		</div>

		{#if errorMessage}
			<div class="error-banner">
				{errorMessage}
			</div>
		{/if}

		<div class="input-group">
			<input
				type="text"
				placeholder="Add a new todo..."
				bind:value={inputValue}
				onkeydown={(e) => e.key === 'Enter' && handleAddTodo()}
				aria-label="New todo input"
			/>
			<button onclick={handleAddTodo} aria-label="Add todo">Add</button>
		</div>

		<div class="stats">
			<span>Total: {counts.total}</span>
			<span>Done: {counts.done}</span>
			<span>Active: {counts.active}</span>
		</div>

		<div class="controls">
			<div class="filter-buttons">
				<button
					class={appState.filter === 'All' ? 'active' : ''}
					onclick={() => handleFilterChange('All')}
					aria-label="Show all todos"
				>
					All
				</button>
				<button
					class={appState.filter === 'Active' ? 'active' : ''}
					onclick={() => handleFilterChange('Active')}
					aria-label="Show active todos"
				>
					Active
				</button>
				<button
					class={appState.filter === 'Completed' ? 'active' : ''}
					onclick={() => handleFilterChange('Completed')}
					aria-label="Show completed todos"
				>
					Completed
				</button>
			</div>

			<div class="action-buttons">
				<button
					disabled={!canUndo}
					onclick={handleUndo}
					aria-label="Undo last action"
					title={canUndo ? 'Undo' : 'Nothing to undo'}
				>
					↶ Undo
				</button>
				<button
					disabled={!canRedo}
					onclick={handleRedo}
					aria-label="Redo last undone action"
					title={canRedo ? 'Redo' : 'Nothing to redo'}
				>
					↷ Redo
				</button>
				<button
					disabled={counts.done === 0}
					onclick={handleClearCompleted}
					aria-label="Clear completed todos"
					title={counts.done > 0 ? `Clear ${counts.done} completed` : 'No completed todos'}
				>
					Clear Done
				</button>
			</div>
		</div>

		{#if filtered.length === 0}
			<p class="empty-state">
				{appState.filter === 'All'
					? 'No todos yet. Add one above!'
					: `No ${appState.filter.toLowerCase()} todos.`}
			</p>
		{:else}
			<ul class="todo-list">
				{#each filtered as todo (todo.id)}
					<li class={todo.done ? 'done' : ''}>
						<input
							type="checkbox"
							checked={todo.done}
							onchange={() => handleToggleTodo(todo.id)}
							aria-label={`Mark "${todo.title}" as ${todo.done ? 'incomplete' : 'complete'}`}
						/>
						<span>{todo.title}</span>
						<button
							class="delete-btn"
							onclick={() => handleRemoveTodo(todo.id)}
							aria-label={`Delete "${todo.title}"`}
						>
							×
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<footer>
			<p>&copy; 2026 <a href="https://zambit.com" target="_blank">Zambit Technologies Corp.</a></p>
			<nav>
				<a href="#">Acceptable Use</a>
				<a href="#">Privacy Policy</a>
				<a href="#">Terms of Service</a>
			</nav>
		</footer>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	main {
		width: 100%;
		padding: 20px;
	}

	.container {
		max-width: 600px;
		margin: 0 auto;
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		padding: 40px;
	}

	.header {
		text-align: center;
		margin-bottom: 30px;
	}

	h1 {
		margin: 0 0 10px 0;
		color: #333;
		font-size: 28px;
	}

	.subtitle {
		margin: 0;
		color: #666;
		font-size: 14px;
	}

	.error-banner {
		background: #fee;
		color: #c33;
		padding: 12px;
		border-radius: 4px;
		margin-bottom: 20px;
		font-size: 14px;
	}

	.input-group {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	input[type='text'] {
		flex: 1;
		padding: 12px;
		border: 2px solid #ddd;
		border-radius: 4px;
		font-size: 16px;
	}

	input[type='text']:focus {
		outline: none;
		border-color: #667eea;
	}

	button {
		padding: 12px 24px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 16px;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #5568d3;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.stats {
		display: flex;
		gap: 30px;
		margin-bottom: 20px;
		font-size: 14px;
		color: #666;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 15px;
		margin-bottom: 30px;
	}

	.filter-buttons,
	.action-buttons {
		display: flex;
		gap: 10px;
	}

	.filter-buttons button {
		flex: 1;
		background: #f0f0f0;
		color: #333;
		padding: 10px 16px;
		font-size: 14px;
	}

	.filter-buttons button.active {
		background: #667eea;
		color: white;
	}

	.action-buttons button {
		flex: 1;
		font-size: 14px;
		padding: 10px 16px;
	}

	.empty-state {
		text-align: center;
		color: #999;
		padding: 40px 20px;
		font-size: 16px;
	}

	.todo-list {
		list-style: none;
		padding: 0;
		margin: 0 0 30px 0;
		border-top: 1px solid #eee;
	}

	li {
		display: flex;
		align-items: center;
		padding: 15px 0;
		border-bottom: 1px solid #eee;
		gap: 12px;
	}

	li.done span {
		text-decoration: line-through;
		color: #999;
	}

	input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: #667eea;
	}

	li span {
		flex: 1;
		word-break: break-word;
	}

	.delete-btn {
		background: #f0f0f0;
		color: #333;
		padding: 6px 12px;
		font-size: 18px;
		min-width: auto;
	}

	.delete-btn:hover {
		background: #e0e0e0;
	}

	footer {
		text-align: center;
		border-top: 1px solid #eee;
		padding-top: 20px;
		margin-top: 30px;
		font-size: 12px;
		color: #999;
	}

	footer p {
		margin: 0 0 10px 0;
	}

	footer a {
		color: #667eea;
		text-decoration: none;
		margin: 0 10px;
	}

	footer a:hover {
		text-decoration: underline;
	}

	footer nav {
		display: flex;
		justify-content: center;
		gap: 0;
	}
</style>
