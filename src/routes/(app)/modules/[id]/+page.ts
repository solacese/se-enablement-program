import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import { blockForModule, getCheckpoint, getModule, orderedModules, program } from '$lib/content/program';

// Module bodies are Markdown compiled to Svelte components by mdsvex.
const bodies = import.meta.glob('/content/modules/*.md') as Record<string, () => Promise<{ default: Component }>>;

/** Prerender a page for every module. */
export const entries = () => program().modules.map((m) => ({ id: m.id }));

export const load = async ({ params }) => {
	const m = getModule(params.id);
	if (!m) error(404, 'We couldn’t find that module.');
	const loader = bodies[m.file];
	if (!loader) error(404, 'Module content file is missing.');
	const ordered = orderedModules();
	const i = ordered.findIndex((x) => x.id === m.id);
	const block = blockForModule(m.id)!;
	const cp = getCheckpoint(m.checkpoint);
	const p = program();
	return {
		module: m,
		index: i + 1,
		total: ordered.length,
		block: { number: block.number, theme: block.theme },
		prev: ordered[i - 1] ? { id: ordered[i - 1].id, title: ordered[i - 1].title } : null,
		next: ordered[i + 1] ? { id: ordered[i + 1].id, title: ordered[i + 1].title } : null,
		prerequisites: m.prerequisites.map((id) => ({
			id,
			title: p.modules.find((x) => x.id === id)?.title ?? p.platform.setup_tasks.find((t) => t.id === id)?.title ?? id,
			isModule: p.modules.some((x) => x.id === id)
		})),
		checkpoint: cp ? { id: cp.id, title: cp.title, day: cp.day, general: cp.general_questions } : null,
		Body: (await loader()).default
	};
};
