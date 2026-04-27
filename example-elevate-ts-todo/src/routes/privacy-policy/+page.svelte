<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Privacy Policy</title>
</svelte:head>

<div class="policy-container">
	<div class="policy-content">
		<h1>Privacy Policy</h1>
		<p class="last-updated">Last updated: April 2026</p>

		<section>
			<h2>1. Introduction</h2>
			<p>
				Zambit Technologies Corp. ("we" or "us") operates the elevate-ts Todo Learning Application
				(the "Service"). This Privacy Policy explains how we collect, use, and safeguard your
				information.
			</p>
		</section>

		<section>
			<h2>2. Information We Collect</h2>
			<p>
				This application runs entirely in your browser. We do not collect, store, or transmit any
				personal information unless explicitly configured to do so.
			</p>
			<p>
				Any data you enter (todos, state changes) is stored locally in your browser and is not sent
				to external servers.
			</p>
		</section>

		<section>
			<h2>3. Cookies and Tracking</h2>
			<p>
				This Service does not use cookies or tracking mechanisms to monitor your activity. All data
				remains on your device.
			</p>
		</section>

		<section>
			<h2>4. Third-Party Links</h2>
			<p>
				This Service may contain links to external websites. We are not responsible for the privacy
				practices of third-party sites. Please review their privacy policies before providing any
				information.
			</p>
		</section>

		<section>
			<h2>5. Data Security</h2>
			<p>
				Your data is stored locally in your browser's storage. We recommend using a secure browser
				and keeping your device updated with security patches.
			</p>
		</section>

		<section>
			<h2>6. Your Rights</h2>
			<p>
				Since we do not collect personal information, there is no data to access, modify, or delete
				via our systems. You can clear your browser's local storage to remove application data at
				any time.
			</p>
		</section>

		<section>
			<h2>7. Changes to This Policy</h2>
			<p>
				We may update this Privacy Policy from time to time. We will notify you of any material
				changes by updating the date at the top of this policy.
			</p>
		</section>

		<section>
			<h2>8. Contact Us</h2>
			<p>
				If you have questions about this Privacy Policy, please contact us at info@zambit.com
			</p>
		</section>

		<button class="back-btn" onclick={() => goto('/')}>← Back to Todos</button>
	</div>
</div>

<style>
	.policy-container {
		background-color: var(--color-neutral-50);
		padding: 40px 20px;
	}

	.policy-content {
		max-width: 800px;
		margin: 0 auto;
		background: white;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	h1 {
		color: var(--color-neutral-900);
		margin-bottom: 10px;
		font-size: 32px;
	}

	.last-updated {
		color: var(--color-neutral-400);
		font-size: 14px;
		margin-bottom: 30px;
	}

	section {
		margin-bottom: 30px;
	}

	h2 {
		color: var(--color-neutral-800);
		font-size: 20px;
		margin: 20px 0 10px 0;
	}

	p {
		color: var(--color-neutral-700);
		line-height: 1.6;
		margin: 10px 0;
	}

	ul {
		margin: 15px 0;
		padding-left: 30px;
		color: var(--color-neutral-700);
	}

	li {
		margin: 8px 0;
		line-height: 1.6;
	}

	.back-btn {
		margin-top: 40px;
		padding: 12px 24px;
		background: #43464d;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		transition: background 0.2s;
	}

	.back-btn:hover {
		background: #5a5d65;
	}
</style>
