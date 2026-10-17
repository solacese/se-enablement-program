import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import yaml from 'js-yaml';
import { dev } from '$app/environment';
import { program } from '$lib/server/content';
import { requireRole } from '$lib/server/guards';

type Group = 'tracks' | 'modules' | 'checkpoints' | 'scenarios' | 'other';

interface FileEntry {
	path: string;
	name: string;
	title: string;
	group: Group;
	updated: string;
	stats: { label: string; value: string }[];
	note?: string;
}

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
		const p = join(dir, d.name);
		if (d.isDirectory()) return walk(p);
		return /\.(md|ya?ml)$/.test(d.name) ? [p] : [];
	});
}

export const load = (event) => {
	requireRole(event, 'manager');
	const root = resolve('content');
	const p = program();
	const files: FileEntry[] = walk(root).map((abs) => {
		const path = 'content/' + relative(root, abs).split('\\').join('/');
		const [folder] = relative(root, abs).split(/[\\/]/);
		const group: Group = (['tracks', 'modules', 'checkpoints', 'scenarios'] as const).includes(folder as never)
			? (folder as Group)
			: 'other';
		const base: FileEntry = {
			path,
			name: path.split('/').pop()!,
			title: path.split('/').pop()!,
			group,
			updated: localDate(statSync(abs).mtime),
			stats: []
		};
		try {
			if (group === 'modules') {
				const m = p.modules.find((x) => x.file === '/' + path);
				if (!m) return { ...base, note: 'Not loaded by the app' };
				return {
					...base,
					title: m.title,
					stats: [
						{ label: 'Block', value: String(m.block) },
						{ label: 'Steps', value: String(m.steps.length) },
						{ label: 'Weeks', value: m.weeks.join(', ') || '–' },
						{ label: 'Checkpoint', value: m.checkpoint || '–' }
					],
					note: m.exit_proof ? `Exit proof: ${m.exit_proof}` : 'No exit proof set'
				};
			}
			const doc = (yaml.load(readFileSync(abs, 'utf8')) ?? {}) as Record<string, unknown>;
			if (group === 'checkpoints') {
				const c = p.checkpoints.find((x) => x.id === doc.id);
				if (!c) return { ...base, note: 'Not loaded by the app' };
				const questions =
					c.general_questions.length + Object.values(c.question_bank ?? {}).reduce((n, q) => n + q.length, 0);
				return {
					...base,
					title: c.title,
					stats: [
						{ label: 'Day', value: String(c.day) },
						{ label: 'Format', value: c.format },
						{ label: 'Modules', value: String(c.modules.length) },
						{ label: 'Questions', value: String(questions) }
					],
					note: `Covers ${c.modules.map((id) => p.modules.find((m) => m.id === id)?.title ?? id).join(', ')}`
				};
			}
			if (group === 'tracks' && doc.id === p.platform.id) {
				return {
					...base,
					title: p.platform.title,
					stats: [
						{ label: 'Days', value: String(p.platform.duration_days) },
						{ label: 'Blocks', value: String(p.platform.blocks.length) },
						{ label: 'Setup tasks', value: String(p.platform.setup_tasks.length) },
						{ label: 'Outcomes', value: String(p.platform.outcomes.length) }
					],
					note: 'Blocks, checkpoints, setup tasks, OEM choice and outcomes'
				};
			}
			if (group === 'tracks' && doc.id === p.pitch.id) {
				return {
					...base,
					title: p.pitch.title,
					stats: [
						{ label: 'Starts', value: `Day ${p.pitch.start_day}` },
						{ label: 'Stages', value: String(p.pitch.stages.length) },
						{ label: 'Rubric', value: `${p.pitch.rubric.dimensions.length} dims` },
						{ label: 'Target', value: `${p.pitch.rubric.graduation_target}/${p.pitch.rubric.dimensions.length * p.pitch.rubric.max_per_dimension}` }
					],
					note: 'Components, stages, rubric, graduation target and retake rules'
				};
			}
			if (group === 'scenarios') {
				return {
					...base,
					title: 'Scenario template',
					stats: [
						{ label: 'Fields', value: String(p.scenarioTemplate.fields.length) },
						{ label: 'Verticals', value: String(p.scenarioTemplate.verticals.length) }
					],
					note: 'Fields managers fill in when assigning a pitch scenario'
				};
			}
			return { ...base, title: typeof doc.title === 'string' ? doc.title : base.title };
		} catch {
			return { ...base, note: 'Could not read this file' };
		}
	});

	const order: Group[] = ['tracks', 'modules', 'checkpoints', 'scenarios', 'other'];
	files.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.path.localeCompare(b.path));
	return { files, editable: dev };
};

/** The server's local calendar date, so "modified" matches the manager's day. */
function localDate(d: Date) {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
