<script lang="ts">
	import '../styles/tokens.css';
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

	const stateRef = await AppRuntime.runPromise(
		Ref.make<AppState>({ todos: [], filter: 'All', history: [], future: [] })
	);

	let appState = $state<AppState>({ todos: [], filter: 'All', history: [], future: [] });
	let inputValue = $state('');
	let errorMessage = $state('');

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

	const handleAddTodo = () => {
		const title = inputValue.trim();
		if (title) {
			execute(addWithHistory(title, stateRef));
			inputValue = '';
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleAddTodo();
		}
	};

	const handleToggleTodo = (id: number) => {
		execute(toggleWithHistory(id, stateRef));
	};

	const handleRemoveTodo = (id: number) => {
		execute(removeWithHistory(id, stateRef));
	};

	const handleClearCompleted = () => {
		execute(clearCompletedWithHistory(stateRef));
	};

	const handleFilterChange = (filter: 'All' | 'Active' | 'Completed') => {
		execute(changeFilter(filter, stateRef));
	};

	const handleUndo = () => {
		execute(undo(stateRef));
	};

	const handleRedo = () => {
		execute(redo(stateRef));
	};

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

	let filtered = $derived(getFilteredTodos(appState.filter, appState.todos));
	let counts = $derived(countTodos(appState.todos));
	let canUndo = $derived(appState.history.length > 0);
	let canRedo = $derived(appState.future.length > 0);
</script>

<svelte:head>
	<title>📝 My Todos - effect-ts Learning App</title>
</svelte:head>

<div class="page-wrapper">
	<main>
		<section class="header">
			<h1>📝 My Todos</h1>
			<p>Learning effect-ts with functional programming</p>
		</section>

		{#if errorMessage}
			<div class="error-banner">
				{errorMessage}
			</div>
		{/if}

		<section class="input-section">
			<input
				type="text"
				placeholder="Add a new todo... (press Enter)"
				bind:value={inputValue}
				onkeydown={handleKeydown}
				class="todo-input"
			/>
			<button onclick={handleAddTodo} class="add-btn">Add</button>
		</section>

		<section class="filters">
			<button onclick={() => handleFilterChange('All')} class:active={appState.filter === 'All'}>
				All <span class="count">{counts.total}</span>
			</button>
			<button onclick={() => handleFilterChange('Active')} class:active={appState.filter === 'Active'}>
				Active <span class="count">{counts.active}</span>
			</button>
			<button
				onclick={() => handleFilterChange('Completed')}
				class:active={appState.filter === 'Completed'}
			>
				Done <span class="count">{counts.done}</span>
			</button>
			{#if canUndo}
				<button onclick={handleUndo} class="undo-btn"> ↶ Undo </button>
			{/if}
			{#if canRedo}
				<button onclick={handleRedo} class="redo-btn"> ↷ Redo </button>
			{/if}
			{#if counts.done > 0}
				<button onclick={handleClearCompleted} class="clear-btn">
					Clear Done
				</button>
			{/if}
		</section>

		<section class="todos">
			{#if filtered.length === 0}
				<p class="empty-state">
					{appState.filter === 'All'
						? 'No todos yet. Add one to get started!'
						: `No ${appState.filter.toLowerCase()} todos.`}
				</p>
			{:else}
				<ul>
					{#each filtered as todo (todo.id)}
						<li class:done={todo.done}>
							<input
								type="checkbox"
								checked={todo.done}
								onchange={() => handleToggleTodo(todo.id)}
								aria-label={`Toggle todo: ${todo.title}`}
							/>
							<span class="title">{todo.title}</span>
							<button
								onclick={() => handleRemoveTodo(todo.id)}
								class="delete-btn"
								aria-label={`Delete todo: ${todo.title}`}
							>
								✕
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</main>

	<footer class="footer">
		<p>&copy; 2026 <a href="https://zambit.com" target="_blank">Zambit Technologies Corp.</a></p>
		<nav>
			<!-- svelte-ignore a11y_invalid_attribute -->
			<a href="#">Acceptable Use</a>
			<!-- svelte-ignore a11y_invalid_attribute -->
			<a href="#">Privacy Policy</a>
			<!-- svelte-ignore a11y_invalid_attribute -->
			<a href="#">Terms of Service</a>
		</nav>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #f4f4f4;
		min-height: 100vh;
		margin: 0;
		padding: 20px;
	}

	.page-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		max-width: 600px;
		margin: 0 auto;
	}

	main {
		flex: 1;
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		margin-bottom: 20px;
	}

	.header {
		background: #43464d;
		color: white;
		padding: 30px;
		text-align: center;
	}

	.header h1 {
		margin: 0 0 8px 0;
		font-size: 28px;
		color: #d6e032;
	}

	.header p {
		margin: 0;
		color: #999b07;
		font-size: 14px;
		font-weight: 500;
	}

	.error-banner {
		background: #fee;
		color: #c33;
		padding: 12px 20px;
		margin: 12px 20px 0 20px;
		border-radius: 4px;
		font-size: 14px;
	}

	.input-section {
		padding: 20px;
		border-bottom: 1px solid #eee;
		display: flex;
		gap: 10px;
	}

	.todo-input {
		flex: 1;
		padding: 12px 16px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 16px;
		transition: border-color 0.2s;
	}

	.todo-input:focus {
		outline: none;
		border-color: #d6e032;
	}

	.add-btn {
		padding: 12px 24px;
		background: #d6e032;
		color: #43464d;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-btn:hover {
		background: #c5cf2b;
	}

	.add-btn:active {
		transform: scale(0.98);
	}

	.filters {
		padding: 15px 20px;
		border-bottom: 1px solid #eee;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}

	.filters button {
		padding: 8px 16px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.filters button:hover {
		background: #f9f9f9;
	}

	.filters button.active {
		background: #d6e032;
		color: #43464d;
		border-color: #d6e032;
	}

	.filters button.undo-btn {
		margin-left: auto;
	}

	.filters button.clear-btn {
		background: #e74c3c;
		color: white;
		border-color: #e74c3c;
	}

	.filters button.clear-btn:hover {
		background: #c0392b;
	}

	.count {
		font-weight: 600;
		font-size: 12px;
	}

	.todos {
		padding: 20px;
	}

	.empty-state {
		text-align: center;
		color: #999;
		padding: 40px 20px;
		font-size: 16px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		padding: 12px;
		border-radius: 6px;
		transition: background 0.2s;
		gap: 12px;
	}

	li:hover {
		background: #f9f9f9;
	}

	li:hover .delete-btn {
		opacity: 1;
	}

	li.done .title {
		text-decoration: line-through;
		opacity: 0.5;
	}

	li input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
	}

	.title {
		flex: 1;
		font-size: 16px;
	}

	.delete-btn {
		padding: 6px 10px;
		background: transparent;
		border: none;
		color: #ff6b6b;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s;
		font-size: 18px;
	}

	.delete-btn:hover {
		color: #e74c3c;
	}

	.footer {
		background: #43464d;
		color: white;
		padding: 20px;
		text-align: center;
		border-radius: 12px;
		margin-top: auto;
	}

	.footer p {
		margin: 0 0 12px 0;
		font-size: 14px;
	}

	.footer a {
		color: #d6e032;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.footer a:hover {
		opacity: 0.8;
	}

	.footer nav {
		display: flex;
		gap: 20px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.footer nav a {
		font-size: 12px;
	}

	@media (max-width: 600px) {
		.page-wrapper {
			max-width: 100%;
		}

		main {
			margin: 0;
			border-radius: 0;
		}

		.header {
			padding: 20px;
		}

		.header h1 {
			font-size: 24px;
		}

		.filters {
			flex-direction: column;
			gap: 10px;
		}

		.filters button {
			width: 100%;
		}

		.filters button.undo-btn,
		.filters button.clear-btn {
			margin-left: 0;
		}

		.input-section {
			flex-direction: column;
		}

		.add-btn {
			width: 100%;
		}

		.footer {
			border-radius: 0;
			margin: 0;
		}

		.footer nav {
			flex-direction: column;
			gap: 10px;
		}
	}
</style>
