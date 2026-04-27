<script lang="ts">
	import '../styles/tokens.css';
	import { getContext, onMount } from 'svelte';
	import {
		addWithHistory,
		toggleWithHistory,
		removeWithHistory,
		clearCompletedWithHistory,
		changeFilter,
		getFilteredTodos,
		countTodos,
		saveTodos,
		loadTodos,
		undo,
		redo
	} from '$lib/domain.js';
	import type { AppState, AuditEntry } from '$lib/types.js';

	interface AuditContext {
		enabled: boolean;
		debugEnabled: boolean;
		record: (op: string, before: AppState, after: AppState) => void;
		reset: () => void;
		getEntryCount: () => number;
		getEntries: () => AuditEntry[];
		updateTrigger: number;
	}

	type StateMonad = { run(state: AppState): readonly [unknown, AppState] };


	// Default no-op audit context for SSR
	const defaultAudit: AuditContext = {
		enabled: false,
		debugEnabled: false,
		record: () => {},
		reset: () => {},
		getEntryCount: () => 0,
		getEntries: (): AuditEntry[] => [],
		updateTrigger: 0
	};

	// Get audit context (safely, for browser only)
	let audit: AuditContext = defaultAudit;
	try {
		audit = getContext<AuditContext>('audit') ?? defaultAudit;
	} catch {
		// Context not available during SSR
		audit = defaultAudit;
	}

	let appState = $state<AppState>({
		todos: [],
		filter: 'All',
		history: [],
		future: []
	});

	let inputValue = $state('');

	onMount(() => {
		const loaded = loadTodos();
		appState = {
			todos: loaded,
			filter: 'All',
			history: [],
			future: []
		};
	});

	/** Run a domain function and persist state, optionally recording to audit */
	const execute = (opName: string) => (fn: StateMonad) => {
		const before = appState;
		const [, newState] = fn.run(appState);
		appState = newState;
		if (audit.enabled) {
			audit.record(opName, before, newState);
		}
		saveTodos(appState.todos);
	};

	/** Handle adding a new todo */
	const handleAddTodo = () => {
		const title = inputValue.trim();
		if (title) {
			execute('addWithHistory')(addWithHistory(title));
			inputValue = '';
		}
	};

	/** Handle adding on Enter key */
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleAddTodo();
		}
	};

	// Reactive derived values
	let filtered = $derived(getFilteredTodos(appState.filter, appState.todos));
	let counts = $derived(countTodos(appState.todos));
	let canUndo = $derived(appState.history.length > 0);
	let canRedo = $derived(appState.future.length > 0);

	// Track update trigger separately to ensure reactivity
	let triggerVersion = $state(0);
	$effect(() => {
		const newTrigger = audit.updateTrigger;
		if (newTrigger !== triggerVersion) {
			if (audit.debugEnabled) {
				console.log(`[Page] Trigger changed from ${triggerVersion} to ${newTrigger}`);
			}
			triggerVersion = newTrigger;
		}
	});

	// Audit entries in newest-first order, capped at 50
	let auditEntries = $derived.by(() => {
		triggerVersion; // Access to track dependency
		if (!audit || !audit.enabled) {
			return [];
		}
		return audit.getEntries().slice(-50).reverse();
	});

	// All audit entries (for debug view)
	let allAuditEntries = $derived.by(() => {
		triggerVersion; // Access to track dependency
		if (!audit || !audit.enabled) {
			return [];
		}
		return audit.getEntries();
	});
</script>

<svelte:head>
	<title>📝 My Todos - elevate-ts Learning App</title>
</svelte:head>

<div class="page-wrapper">
	<main>
		<section class="header">
			<h1>📝 My Todos</h1>
			<p>Learning elevate-ts with functional programming</p>
		</section>

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
			<button
				onclick={() => execute('changeFilter')(changeFilter('All'))}
				class:active={appState.filter === 'All'}
			>
				All <span class="count">{counts.total}</span>
			</button>
			<button
				onclick={() => execute('changeFilter')(changeFilter('Active'))}
				class:active={appState.filter === 'Active'}
			>
				Active <span class="count">{counts.active}</span>
			</button>
			<button
				onclick={() => execute('changeFilter')(changeFilter('Completed'))}
				class:active={appState.filter === 'Completed'}
			>
				Done <span class="count">{counts.done}</span>
			</button>
			{#if canUndo}
				<button onclick={() => execute('undo')(undo())} class="undo-btn"> ↶ Undo </button>
			{/if}
			{#if canRedo}
				<button onclick={() => execute('redo')(redo())} class="redo-btn"> ↷ Redo </button>
			{/if}
			{#if counts.done > 0}
				<button
					onclick={() => execute('clearCompletedWithHistory')(clearCompletedWithHistory())}
					class="clear-btn"
				>
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
								onchange={() => execute('toggleWithHistory')(toggleWithHistory(todo.id))}
								aria-label={`Toggle todo: ${todo.title}`}
							/>
							<span class="title">{todo.title}</span>
							<button
								onclick={() => execute('removeWithHistory')(removeWithHistory(todo.id))}
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

		{#if audit.enabled}
			<section class="audit-panel">
				<h2>Audit Log</h2>
				{#if auditEntries.length === 0}
					<p class="audit-empty">No operations recorded yet.</p>
				{:else}
					<div class="audit-entries">
						{#each auditEntries as entry (entry.id)}
							{@const input = entry.input as AppState}
							{@const output = entry.output as AppState}
							<div class="audit-entry">
								<div class="op-header">
									<span class="op-name">{entry.operation}</span>
									<span class="timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
								</div>
								<div class="state-diff">
									<div class="state-before">
										Todos: {input.todos.length} | History: {input.history.length}
									</div>
									<div class="arrow">→</div>
									<div class="state-after">
										Todos: {output.todos.length} | History: {output.history.length}
									</div>
								</div>
							</div>
						{/each}
					</div>
					<button class="clear-audit-btn" onclick={() => audit.reset()}>Clear Log</button>
				{/if}
			</section>
		{/if}
	</main>

		{#if audit.enabled && audit.debugEnabled}
			<section class="debug-panel">
				<h2>Debug Info</h2>
				<div class="debug-content">
					<div class="debug-section">
						<h3>Audit Status</h3>
						<p><strong>Total Entries:</strong> {allAuditEntries.length}</p>
						<p><strong>Displayed:</strong> {auditEntries.length} (newest first, capped at 50)</p>
						<p><strong>Update Trigger:</strong> {audit.updateTrigger}</p>
					</div>

					<div class="debug-section">
						<h3>Current App State</h3>
						<p><strong>Todos:</strong> {appState.todos.length}</p>
						<p><strong>Filter:</strong> {appState.filter}</p>
						<p><strong>History Depth:</strong> {appState.history.length}</p>
						<p><strong>Future Depth:</strong> {appState.future.length}</p>
					</div>

					<div class="debug-section">
						<h3>Latest Operation</h3>
						{#if allAuditEntries.length > 0}
							{@const latest = allAuditEntries[allAuditEntries.length - 1]}
							<p><strong>Operation:</strong> {latest.operation}</p>
							<p><strong>Time:</strong> {new Date(latest.timestamp).toLocaleTimeString()}</p>
							<p><strong>Monad Type:</strong> {latest.monadType}</p>
						{:else}
							<p style="color: var(--color-neutral-400);">No operations yet</p>
						{/if}
					</div>
				</div>
			</section>
		{/if}

	<footer class="footer">
		<p>&copy; 2026 <a href="https://zambit.com" target="_blank">Zambit Technologies Corp.</a></p>
		<nav>
			<a href="#">Acceptable Use</a>
			<a href="#">Privacy Policy</a>
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

	.audit-panel {
		padding: var(--spacing-5);
		background: var(--color-neutral-50);
		border-top: 2px solid #d6e032;
		margin-top: var(--spacing-5);
	}

	.audit-panel h2 {
		margin: 0 0 var(--spacing-4);
		font-size: var(--font-size-lg);
		color: var(--color-neutral-900);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.audit-empty {
		text-align: center;
		color: var(--color-neutral-400);
		padding: var(--spacing-5);
		font-size: var(--font-size-sm);
	}

	.audit-entries {
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: var(--spacing-3);
		border: 1px solid var(--color-neutral-200);
		border-radius: var(--radius-lg);
		background: white;
	}

	.audit-entry {
		padding: var(--spacing-3);
		border-bottom: 1px solid var(--color-neutral-100);
		font-size: var(--font-size-xs);
	}

	.audit-entry:last-child {
		border-bottom: none;
	}

	.op-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-2);
	}

	.op-name {
		font-weight: var(--font-weight-semibold);
		color: var(--color-neutral-900);
		font-family: var(--font-mono);
		background: var(--color-neutral-100);
		padding: var(--spacing-1) var(--spacing-2);
		border-radius: var(--radius-sm);
	}

	.timestamp {
		font-size: var(--font-size-xs);
		color: var(--color-neutral-400);
		font-family: var(--font-mono);
	}

	.state-diff {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--spacing-2);
		align-items: center;
		margin-top: var(--spacing-2);
	}

	.state-before,
	.state-after {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-neutral-600);
		padding: var(--spacing-2);
		background: var(--color-neutral-100);
		border-radius: var(--radius-sm);
	}

	.arrow {
		text-align: center;
		color: #d6e032;
		font-weight: var(--font-weight-semibold);
	}

	.clear-audit-btn {
		width: 100%;
		padding: var(--spacing-3);
		background: var(--color-error-dark);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		font-weight: var(--font-weight-semibold);
		cursor: pointer;
		font-size: var(--font-size-sm);
		transition: background var(--transition-fast);
	}

	.clear-audit-btn:hover {
		background: var(--color-error);
		opacity: 0.9;
	}

	.clear-audit-btn:active {
		transform: scale(0.98);
	}

	.debug-panel {
		padding: var(--spacing-5);
		background: var(--color-brand-light);
		border-top: 2px solid var(--color-brand);
		margin-top: var(--spacing-5);
	}

	.debug-panel h2 {
		margin: 0 0 var(--spacing-4);
		font-size: var(--font-size-lg);
		color: var(--color-neutral-900);
	}

	.debug-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-4);
	}

	.debug-section {
		background: white;
		padding: var(--spacing-3);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-brand-light);
	}

	.debug-section h3 {
		margin: 0 0 var(--spacing-2);
		font-size: var(--font-size-sm);
		color: var(--color-brand);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.debug-section p {
		margin: var(--spacing-2) 0;
		font-size: var(--font-size-xs);
		color: var(--color-neutral-600);
		font-family: var(--font-mono);
	}

	.debug-section strong {
		color: var(--color-neutral-900);
		font-weight: var(--font-weight-semibold);
	}
</style>
