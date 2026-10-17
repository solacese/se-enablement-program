import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		// Module Markdown under /content is imported by the client in dev.
		fs: { allow: ['content'] }
	},
	ssr: {
		external: ['node:sqlite']
	}
});
