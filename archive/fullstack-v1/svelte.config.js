import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from 'mdsvex';

/**
 * Components content authors can use inside any Markdown file under /content
 * without importing them. Keep this list in sync with src/lib/components/content.
 */
const CONTENT_COMPONENTS = ['Step', 'Callout', 'Verify'];

/**
 * Inject `import X from '$lib/components/content/X.svelte'` into content Markdown
 * so module bodies stay plain Markdown + a few tags. Runs before mdsvex.
 */
function contentComponents() {
	return {
		name: 'content-components',
		markup({ content, filename }) {
			if (!filename?.endsWith('.md') || !filename.includes('/content/')) return;
			const used = CONTENT_COMPONENTS.filter((c) => new RegExp(`<${c}[\\s>/]`).test(content));
			if (used.length === 0) return;
			const imports = used
				.map((c) => `import ${c} from '$lib/components/content/${c}.svelte';`)
				.join('\n');
			const script = `<script>\n${imports}\n</script>\n`;
			// Place the script after front matter, if any.
			const fm = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
			const code = fm ? fm[0] + script + content.slice(fm[0].length) : script + content;
			return { code };
		}
	};
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		contentComponents(),
		mdsvex({
			extensions: ['.md'],
			smartypants: { dashes: 'oldschool' },
			highlight: {
				// Plain, escaped code blocks; styled by .prose in app.css.
				highlighter: (code, lang) => {
					const escaped = escapeSvelte(
						code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
					);
					return `<pre class="code-block" data-lang="${lang ?? ''}"><code>{@html \`${escaped}\`}</code></pre>`;
				}
			}
		}),
		vitePreprocess()
	],
	kit: {
		adapter: adapter(),
		alias: {
			$content: 'content'
		}
	}
};

export default config;
