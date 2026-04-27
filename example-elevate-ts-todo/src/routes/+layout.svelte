<script lang="ts">
	import '../styles/tokens.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { AppState, AuditEntry } from '$lib/types.js';
	import { setContext } from 'svelte';

	interface AuditState {
		enabled: boolean;
		debugEnabled: boolean;
		record: (op: string, before: AppState, after: AppState) => void;
		reset: () => void;
		getEntryCount: () => number;
		getEntries: () => AuditEntry[];
		updateTrigger: number;
	}

	let { children } = $props();
	let open = $state(false);
	let auditEnabled = $state(false);
	let debugEnabled = $state(false);
	let auditSession = $state<unknown>(null);
	let updateTrigger = $state(0);
	let Audit: any = null;

	const recordAudit = (operationName: string, before: AppState, after: AppState): void => {
		if (auditEnabled && Audit) {
			if (debugEnabled) console.log(`[Audit] Recording: ${operationName}`);

			const recordFn = Audit.record(operationName)('State')(before)(after);
			const newSession = recordFn(auditSession);
			auditSession = newSession;

			if (debugEnabled) {
				const log = Audit.getLog(auditSession);
				const entries = Audit.getEntries(log);
				console.log(`[Audit] Entries: ${entries.length}`);
			}

			updateTrigger += 1;
		}
	};

	const resetAudit = (): void => {
		if (Audit) {
			if (debugEnabled) console.log('[Audit] Resetting session');
			auditSession = Audit.withEnabled(true)(Audit.createSession());
		}
	};

	const toggleAudit = async (): Promise<void> => {
		if (!auditEnabled) {
			if (!Audit) {
				const module = await import('@zambit/elevate-ts');
				Audit = module.Audit;
				auditSession = Audit.withEnabled(true)(Audit.createSession());
				if (debugEnabled) console.log('[Audit] Module loaded and session initialized');
			}
			auditEnabled = true;
		} else {
			auditEnabled = false;
			resetAudit();
		}
	};

	const getAuditEntryCount = (): number => {
		if (!Audit || !auditSession) return 0;
		return Audit.getEntries(Audit.getLog(auditSession)).length;
	};

	const getAuditEntries = (): AuditEntry[] => {
		if (!Audit || !auditSession) return [];
		return Audit.getEntries(Audit.getLog(auditSession)) as AuditEntry[];
	};

	// Set context during initialization (not in effects - setContext must be called at init time)
	setContext<AuditState>('audit', {
		get enabled() {
			return auditEnabled;
		},
		get debugEnabled() {
			return debugEnabled;
		},
		record: recordAudit,
		reset: resetAudit,
		getEntryCount: getAuditEntryCount,
		getEntries: getAuditEntries,
		get updateTrigger() {
			return updateTrigger;
		}
	});

	let auditEntryCount = $derived(getAuditEntryCount());
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<button class="hamburger" onclick={() => (open = true)} aria-label="Open about menu">
	<span></span><span></span><span></span>
</button>

{#if auditEnabled}
	<div class="audit-badge">
		● AUDIT ACTIVE <span class="count">({auditEntryCount})</span>
	</div>
{/if}

{#if open}
	<div class="backdrop" onclick={() => (open = false)} role="presentation"></div>
	<aside class="about-panel">
		<button class="close-btn" onclick={() => (open = false)} aria-label="Close">&#x2715;</button>
		<h2>About</h2>
		<p>This app demonstrates functional programming patterns using:</p>
		<p class="lib-name">@zambit/elevate-ts</p>
		<section>
			<h3>Install</h3>
			<pre><code>npm install @zambit/elevate-ts</code></pre>
		</section>
		<section>
			<h3>Import</h3>
			<pre><code>import {'{ State, Audit }'} from '@zambit/elevate-ts'</code></pre>
		</section>
		<section>
			<h3>Audit System</h3>
			<p>Track all operations in real-time to see the audit log in action.</p>
			<button class="audit-toggle-btn" onclick={toggleAudit}>
				{auditEnabled ? '✓ Hide Audit Log' : '▶ Show Audit Log'}
			</button>
			{#if auditEnabled}
				<p style="margin-top: 0.75rem; font-size: 0.85rem;">
					<label style="display: flex; gap: 0.5rem; align-items: center; cursor: pointer;">
						<input type="checkbox" bind:checked={debugEnabled} />
						<span>Debug Info</span>
					</label>
				</p>
			{/if}
		</section>
	</aside>
{/if}

{@render children()}

<style>
	.hamburger {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
		gap: 5px;
		background: #43464d;
		border: none;
		border-radius: var(--radius-md);
		padding: 10px;
		cursor: pointer;
	}
	.hamburger span {
		display: block;
		width: 22px;
		height: 2px;
		background: #d6e032;
		border-radius: 2px;
	}
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: var(--z-modal);
	}
	.about-panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100%;
		width: 300px;
		background: white;
		z-index: var(--z-modal);
		padding: 2rem 1.5rem;
		box-shadow: var(--shadow-xl);
		overflow-y: auto;
	}
	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #43464d;
	}
	h2 {
		color: #43464d;
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}
	h3 {
		color: #43464d;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 1.25rem 0 0.4rem;
	}
	.lib-name {
		font-weight: 700;
		color: #43464d;
		font-size: 1rem;
		margin: 0.25rem 0 1rem;
	}
	pre {
		background: #f4f4f4;
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.8rem;
		overflow-x: auto;
	}
	code {
		font-size: 0.8rem;
		font-family: monospace;
		color: #333;
	}
	.audit-badge {
		position: fixed;
		top: 70px;
		right: 1rem;
		background: #d6e032;
		color: #43464d;
		padding: 8px 14px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
		z-index: calc(var(--z-modal) - 1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	.audit-badge .count {
		font-weight: 500;
		opacity: 0.8;
	}
	.audit-toggle-btn {
		width: 100%;
		padding: 10px 14px;
		margin-top: 0.5rem;
		background: #d6e032;
		color: #43464d;
		border: none;
		border-radius: var(--radius-sm);
		font-weight: 600;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}
	.audit-toggle-btn:hover {
		background: #c5cf2b;
	}
	.audit-toggle-btn:active {
		transform: scale(0.98);
	}
</style>
