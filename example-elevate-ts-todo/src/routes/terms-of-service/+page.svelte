<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Terms of Service</title>
</svelte:head>

<div class="policy-container">
	<div class="policy-content">
		<h1>Terms of Service</h1>
		<p class="last-updated">Last updated: April 2026</p>

		<section>
			<h2>1. Agreement to Terms</h2>
			<p>
				By accessing and using the elevate-ts Todo Learning Application ("Service"), you accept and
				agree to be bound by the terms and provision of this agreement. If you do not agree to abide
				by the above, please do not use this Service.
			</p>
		</section>

		<section>
			<h2>2. License to Use</h2>
			<p>
				Zambit Technologies Corp. grants you a limited, non-exclusive, non-transferable license to
				use this Service for educational and personal purposes only.
			</p>
		</section>

		<section>
			<h2>3. Use Restrictions</h2>
			<p>You agree not to:</p>
			<ul>
				<li>Use the Service for any illegal purpose or in violation of any laws</li>
				<li>Attempt to gain unauthorized access to the Service or its systems</li>
				<li>Interfere with the proper functioning of the Service</li>
				<li>Reverse engineer, decompile, or disassemble the Service</li>
				<li>Use the Service in any manner that could damage, disable, or impair it</li>
				<li>Reproduce, duplicate, copy, or resell any portion of the Service</li>
			</ul>
		</section>

		<section>
			<h2>4. Intellectual Property Rights</h2>
			<p>
				The Service and all its content, including but not limited to code, documentation, and
				design, are owned by Zambit Technologies Corp. and protected by copyright law. You may not
				claim ownership of or republish this content without proper attribution and permission.
			</p>
		</section>

		<section>
			<h2>5. User Data</h2>
			<p>
				All data you create and store in this Service (todos, state changes) remains your
				responsibility. We recommend regularly backing up important data. Zambit Technologies Corp.
				is not responsible for loss of data.
			</p>
		</section>

		<section>
			<h2>6. Disclaimer of Warranties</h2>
			<p>
				THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES,
				EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
				NON-INFRINGEMENT.
			</p>
		</section>

		<section>
			<h2>7. Limitation of Liability</h2>
			<p>
				IN NO EVENT SHALL ZAMBIT TECHNOLOGIES CORP. BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
				CONSEQUENTIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
			</p>
		</section>

		<section>
			<h2>8. Indemnification</h2>
			<p>
				You agree to indemnify and hold harmless Zambit Technologies Corp. from any claims,
				damages, losses, or expenses arising from your use of the Service or violation of these
				Terms.
			</p>
		</section>

		<section>
			<h2>9. Termination</h2>
			<p>
				We may terminate or suspend your access to the Service at any time, with or without cause,
				and without notice or liability.
			</p>
		</section>

		<section>
			<h2>10. Changes to Terms</h2>
			<p>
				We reserve the right to modify these Terms at any time. Your continued use of the Service
				constitutes acceptance of the modified Terms.
			</p>
		</section>

		<section>
			<h2>11. Governing Law</h2>
			<p>
				These Terms and your use of the Service are governed by and construed in accordance with the
				laws of the jurisdiction in which Zambit Technologies Corp. operates.
			</p>
		</section>

		<section>
			<h2>12. Contact</h2>
			<p>For questions about these Terms, please contact us at info@zambit.com</p>
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
