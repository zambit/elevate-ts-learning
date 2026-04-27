<script lang="ts">
	import '../styles/tokens.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let open = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<button class="hamburger" onclick={() => (open = true)} aria-label="Open about menu">
	<span></span><span></span><span></span>
</button>

{#if open}
	<div class="backdrop" onclick={() => (open = false)} role="presentation"></div>
	<aside class="about-panel">
		<button class="close-btn" onclick={() => (open = false)} aria-label="Close">&#x2715;</button>
		<h2>About</h2>
		<p>This app demonstrates functional programming patterns using:</p>
		<p class="lib-name">purify-ts</p>
		<section>
			<h3>Install</h3>
			<pre><code>npm install purify-ts</code></pre>
		</section>
		<section>
			<h3>Import</h3>
			<pre><code>import {"{ Either, Maybe }"} from 'purify-ts'</code></pre>
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
</style>
