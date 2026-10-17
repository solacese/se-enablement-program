import { error, fail } from '@sveltejs/kit';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import yaml from 'js-yaml';
import { dev } from '$app/environment';
import { parseSteps, program } from '$lib/server/content';
import { requireRole } from '$lib/server/guards';

/** Resolve a `content/...` path safely, or null if it points anywhere else. */
function safePath(raw: string | null) {
	if (!raw) return null;
	const rel = raw.replace(/\\/g, '/').trim();
	if (rel.includes('..') || rel.includes('\0') || rel.startsWith('/')) return null;
	if (!/\.(md|yaml)$/.test(rel)) return null;
	const root = resolve('content');
	const abs = resolve(rel);
	if (!abs.startsWith(root + sep)) return null;
	return { rel, abs, kind: rel.endsWith('.md') ? ('markdown' as const) : ('yaml' as const) };
}

function knownIds() {
	const p = program();
	return new Set([...p.modules.map((m) => m.id), ...p.platform.setup_tasks.map((t) => t.id)]);
}

/** Returns a readable problem, or null when the file is valid. */
function validate(rel: string, kind: 'markdown' | 'yaml', text: string): { problem: string | null; summary: string } {
	try {
		if (kind === 'yaml') {
			const doc = yaml.load(text);
			if (doc == null || typeof doc !== 'object') return { problem: 'The file must contain a YAML mapping (key: value pairs).', summary: '' };
			const d = doc as Record<string, unknown>;
			if (rel.startsWith('content/checkpoints/') && Array.isArray(d.modules)) {
				const ids = new Set(program().modules.map((m) => m.id));
				const unknown = (d.modules as unknown[]).map(String).filter((x) => !ids.has(x));
				if (unknown.length) return { problem: `Unknown module: ${unknown.join(', ')}.`, summary: '' };
			}
			return { problem: null, summary: `${Object.keys(d).length} top-level keys` };
		}
		const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
		if (!fm) return { problem: 'Markdown files need YAML front matter between --- lines at the top.', summary: '' };
		const meta = yaml.load(fm[1]) as Record<string, unknown> | null;
		if (!meta || typeof meta !== 'object') return { problem: 'Front matter must be a YAML mapping.', summary: '' };
		if (!meta.id) return { problem: 'Front matter needs an id.', summary: '' };
		const steps = parseSteps(fm[2]);
		const ids = steps.map((s) => s.id);
		if (new Set(ids).size !== ids.length) return { problem: 'Two steps share the same id.', summary: '' };
		const opens = (fm[2].match(/<Step[\s>]/g) ?? []).length;
		const closes = (fm[2].match(/<\/Step>/g) ?? []).length;
		if (opens !== closes) return { problem: `Found ${opens} <Step> tags but ${closes} </Step> closing tags.`, summary: '' };
		const prereqs = Array.isArray(meta.prerequisites) ? (meta.prerequisites as unknown[]).map(String) : [];
		const known = knownIds();
		const unknown = prereqs.filter((x) => !known.has(x));
		if (unknown.length) return { problem: `Unknown prerequisite: ${unknown.join(', ')}. Use a module id or setup task id.`, summary: '' };
		return { problem: null, summary: `id “${meta.id}”, ${steps.length} steps` };
	} catch (e) {
		const msg = e instanceof yaml.YAMLException ? e.message : String(e);
		return { problem: `YAML doesn’t parse: ${msg}`, summary: '' };
	}
}

export const load = (event) => {
	requireRole(event, 'manager');
	const p = safePath(event.url.searchParams.get('path'));
	if (!p) error(400, 'That path isn’t a content file. Paths look like content/modules/02-ha-dr.md.');
	if (!existsSync(p.abs)) error(404, `No file at ${p.rel}.`);
	const text = readFileSync(p.abs, 'utf8');
	return {
		path: p.rel,
		kind: p.kind,
		text,
		updated: localDate(statSync(p.abs).mtime),
		editable: dev,
		check: validate(p.rel, p.kind, text)
	};
};

export const actions = {
	save: async (event) => {
		requireRole(event, 'manager');
		if (!dev) return fail(403, { message: 'Content is version-controlled. Edit the file in the repo and redeploy.' });
		const p = safePath(event.url.searchParams.get('path'));
		if (!p || !existsSync(p.abs)) return fail(400, { message: 'That path isn’t a content file.' });
		const f = await event.request.formData();
		const text = String(f.get('text') ?? '').replace(/\r\n/g, '\n');
		const { problem, summary } = validate(p.rel, p.kind, text);
		if (problem) return fail(400, { message: problem, text });
		writeFileSync(p.abs, text.endsWith('\n') ? text : text + '\n', 'utf8');
		return { ok: `Saved ${p.rel} (${summary}). The app reloads it automatically.` };
	}
};

/** The server's local calendar date, so "modified" matches the manager's day. */
function localDate(d: Date) {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
