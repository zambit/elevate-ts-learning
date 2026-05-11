import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

// Read the installed FP-library version so the About panel can surface
// exactly what the demo was built against (not the declared range).
const libVersion = JSON.parse(
	readFileSync('./node_modules/effect/package.json', 'utf-8')
).version;

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__LIB_VERSION__: JSON.stringify(libVersion)
	},
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/**/*.ts'],
			exclude: ['src/lib/**/*.test.ts', 'src/lib/**/*.spec.ts', 'src/**/*.d.ts']
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'jsdom',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
