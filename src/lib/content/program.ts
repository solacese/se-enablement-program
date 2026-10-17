import yaml from 'js-yaml';
import type {
	Checkpoint,
	Module,
	ModuleStep,
	PitchTrack,
	PlatformTrack,
	Program,
	ScenarioTemplate
} from './types';

// Program content is bundled at build time, so editing a file in /content hot-reloads
// in dev and ships with the next build. No code changes needed. This module is
// universal: the static site evaluates it in the browser, and a future backend can
// import the same loader.
const yamlFiles = import.meta.glob('/content/**/*.yaml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const moduleFiles = import.meta.glob('/content/modules/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function loadYaml<T>(path: string): T {
	const raw = yamlFiles[path];
	if (raw === undefined) throw new Error(`Missing content file: ${path}`);
	return yaml.load(raw) as T;
}

function parseAttrs(source: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (const m of source.matchAll(/([a-zA-Z_][\w-]*)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = m[2];
	return attrs;
}

/** Ordered steps come from `<Step id="…" title="…" minutes="…">` tags in the module body. */
export function parseSteps(body: string): ModuleStep[] {
	const steps: ModuleStep[] = [];
	for (const m of body.matchAll(/<Step\s+([^>]*)>/g)) {
		const a = parseAttrs(m[1]);
		if (!a.id) continue;
		steps.push({ id: a.id, title: a.title ?? a.id, minutes: a.minutes ? Number(a.minutes) : null });
	}
	return steps;
}

function parseModule(file: string, raw: string): Module {
	const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!fm) throw new Error(`${file}: missing YAML front matter`);
	const meta = (yaml.load(fm[1]) ?? {}) as Record<string, unknown>;
	const str = (k: string, d = '') => (typeof meta[k] === 'string' ? (meta[k] as string).trim() : d);
	const arr = <T>(k: string) => (Array.isArray(meta[k]) ? (meta[k] as T[]) : []);
	if (!meta.id) throw new Error(`${file}: front matter needs an id`);
	return {
		id: String(meta.id),
		file,
		title: str('title', String(meta.id)),
		track: str('track', 'platform-90-day'),
		block: Number(meta.block ?? 1),
		order: Number(meta.order ?? 99),
		weeks: arr<number>('weeks'),
		estimated_hours: meta.estimated_hours != null ? Number(meta.estimated_hours) : null,
		icon: str('icon', 'broker'),
		oem: meta.oem === true,
		summary: str('summary'),
		why_it_matters: str('why_it_matters'),
		prerequisites: arr<string>('prerequisites'),
		exit_proof: str('exit_proof'),
		evidence_types: arr('evidence_types'),
		checkpoint: str('checkpoint'),
		prep_questions: arr<string>('prep_questions'),
		steps: parseSteps(fm[2])
	};
}

function build(): Program {
	const platform = loadYaml<PlatformTrack>('/content/tracks/platform-90-day.yaml');
	const pitch = loadYaml<PitchTrack>('/content/tracks/pitch-bootcamp.yaml');
	const scenarioTemplate = loadYaml<ScenarioTemplate>('/content/scenarios/_template.yaml');
	const checkpoints = Object.entries(yamlFiles)
		.filter(([p]) => p.startsWith('/content/checkpoints/'))
		.map(([p]) => loadYaml<Checkpoint>(p))
		.sort((a, b) => a.day - b.day);
	const modules = Object.entries(moduleFiles)
		.map(([file, raw]) => parseModule(file, raw))
		.sort((a, b) => a.order - b.order);

	validate({ platform, pitch, modules, checkpoints, scenarioTemplate });
	return { platform, pitch, modules, checkpoints, scenarioTemplate };
}

/** Catch broken references early with a readable message instead of a blank page. */
function validate(p: Program) {
	const moduleIds = new Set(p.modules.map((m) => m.id));
	const taskIds = new Set(p.platform.setup_tasks.map((t) => t.id));
	const cpIds = new Set(p.checkpoints.map((c) => c.id));
	const problems: string[] = [];
	for (const b of p.platform.blocks) {
		for (const id of b.modules) if (!moduleIds.has(id)) problems.push(`Block ${b.number} lists unknown module "${id}"`);
		if (!cpIds.has(b.checkpoint)) problems.push(`Block ${b.number} lists unknown checkpoint "${b.checkpoint}"`);
	}
	for (const m of p.modules) {
		for (const pre of m.prerequisites)
			if (!moduleIds.has(pre) && !taskIds.has(pre)) problems.push(`${m.file}: unknown prerequisite "${pre}"`);
		const ids = m.steps.map((s) => s.id);
		if (new Set(ids).size !== ids.length) problems.push(`${m.file}: duplicate step ids`);
	}
	for (const c of p.checkpoints)
		for (const id of c.modules) if (!moduleIds.has(id)) problems.push(`Checkpoint ${c.id} lists unknown module "${id}"`);
	if (problems.length) throw new Error('Content problems:\n  - ' + problems.join('\n  - '));
}

let cached: Program | null = null;

export function program(): Program {
	// Vite re-evaluates this module when a content file changes, resetting the cache.
	cached ??= build();
	return cached;
}

export function getModule(id: string) {
	return program().modules.find((m) => m.id === id);
}

export function getCheckpoint(id: string) {
	return program().checkpoints.find((c) => c.id === id);
}

/** Modules in path order: by block, then by the order they're listed in the block. */
export function orderedModules(): Module[] {
	const p = program();
	return p.platform.blocks.flatMap((b) =>
		b.modules.map((id) => p.modules.find((m) => m.id === id)!).filter(Boolean)
	);
}

export function blockForModule(id: string) {
	return program().platform.blocks.find((b) => b.modules.includes(id));
}
