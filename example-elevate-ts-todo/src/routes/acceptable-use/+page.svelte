<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Acceptable Use Policy</title>
</svelte:head>

<div class="policy-container">
	<div class="policy-content">
		<h1>Acceptable Use Policy</h1>
		<p class="last-updated">Last updated: April 2026</p>

		<section>
			<h2>1. Overview</h2>
			<p>
				This Acceptable Use Policy ("Policy") outlines the acceptable and unacceptable uses of the
				elevate-ts Todo Learning Application ("Service"). By using this Service, you agree to comply
				with this Policy.
			</p>
		</section>

		<section>
			<h2>2. Permitted Uses</h2>
			<p>You may use this Service for:</p>
			<ul>
				<li>Learning functional programming patterns with elevate-ts</li>
				<li>Educational and personal experimentation</li>
				<li>Understanding the Audit system and State management</li>
				<li>Non-commercial development and testing</li>
			</ul>
		</section>

		<section>
			<h2>3. Prohibited Uses</h2>
			<p>You may not use this Service to:</p>
			<ul>
				<li>Engage in any illegal activity</li>
				<li>Attempt to gain unauthorized access to the system</li>
				<li>Transmit malware or harmful code</li>
				<li>Disrupt or degrade the performance of the Service</li>
				<li>Use the Service in a manner that violates any applicable laws</li>
				<li>Reverse engineer or extract proprietary information</li>
			</ul>
		</section>

		<section>
			<h2>4. Intellectual Property</h2>
			<p>
				All code, documentation, and materials provided in this Service are owned by Zambit
				Technologies Corp. and protected by intellectual property laws.
			</p>
		</section>

		<section>
			<h2>5. Disclaimer of Warranties</h2>
			<p>
				This Service is provided "as-is" without warranty of any kind, express or implied, including
				but not limited to merchantability or fitness for a particular purpose.
			</p>
		</section>

		<section>
			<h2>6. Limitation of Liability</h2>
			<p>
				Zambit Technologies Corp. shall not be liable for any indirect, incidental, special,
				consequential, or punitive damages arising out of or relating to your use of the Service.
			</p>
		</section>

		<section>
			<h2>7. Changes to This Policy</h2>
			<p>
				We reserve the right to modify this Policy at any time. Your continued use of the Service
				constitutes acceptance of the updated Policy.
			</p>
		</section>

		<section>
			<h2>8. Contact</h2>
			<p>For questions about this Policy, please contact us at info@zambit.com</p>
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
