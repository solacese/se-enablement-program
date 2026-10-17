import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';

// Module bodies are Markdown compiled to Svelte components by mdsvex.
const bodies = import.meta.glob('/content/modules/*.md') as Record<string, () => Promise<{ default: Component }>>;

export const load = async ({ data }) => {
	const loader = bodies[data.module.file];
	if (!loader) error(404, 'Module content file is missing.');
	return { ...data, Body: (await loader()).default };
};
