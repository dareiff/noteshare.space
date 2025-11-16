import { sveltekit } from '@sveltejs/kit/vite';
import { plugin as markdown } from 'vite-plugin-markdown';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		markdown({ mode: ['html'] })
	],
	optimizeDeps: {
		include: ['highlight.js', 'highlight.js/lib/core']
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['setupTest.js']
	}
};

export default config;
