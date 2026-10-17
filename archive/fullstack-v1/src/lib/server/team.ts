// Manager-side helpers: roster rollups, enrolling SEs, and assignments.
import { randomBytes } from 'node:crypto';
import { dateForDay } from '$lib/dates';
import type { EnrollmentView, OverallStatus, PitchStatus, Person } from '$lib/types';
import { hashPassword, type Role } from './auth';
import { program } from './content';
import { all, get, id, now, run, tx } from './db';
import { buildView, listEnrollments } from './progress';

export interface RosterRow {
	id: string;
	name: string;
	email: string;
	title: string | null;
	initials: string;
	startDate: string;
	day: number;
	currentModule: string | null;
	overall: OverallStatus;
	inCoaching: boolean;
	pitchStatus: PitchStatus;
	pitchScore: number | null;
	pitchTarget: number;
	pitchMax: number;
	modulesComplete: number;
	modulesTotal: number;
	checkpointsPassed: number;
	checkpointsTotal: number;
	flags: number;
	blockers: number;
	scenario: boolean;
	techEvaluator: string | null;
	pitchManager: string | null;
	pitchSales: string | null;
}

export interface OpenWindow {
	enrollmentId: string;
	name: string;
	initials: string;
	track: 'technical' | 'pitch';
	title: string;
	status: 'coaching' | 'retake';
	detail: string;
	windowEnd: string | null;
	href: string;
}

export function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.map((p) => p[0]!.toUpperCase())
		.join('')
		.slice(0, 2);
}

function toRow(v: EnrollmentView): RosterRow {
	return {
		id: v.enrollment.id,
		name: v.learner.name,
		email: v.learner.email,
		title: v.learner.title,
		initials: initials(v.learner.name),
		startDate: v.enrollment.start_date,
		day: v.day,
		currentModule: v.currentModule?.title ?? null,
		overall: v.overall,
		inCoaching: v.inCoaching,
		pitchStatus: v.pitch.status,
		pitchScore: v.pitch.latestScore,
		pitchTarget: v.pitch.target,
		pitchMax: v.pitch.max,
		modulesComplete: v.progress.modulesComplete,
		modulesTotal: v.progress.modulesTotal,
		checkpointsPassed: v.progress.checkpointsPassed,
		checkpointsTotal: v.progress.checkpointsTotal,
		flags: v.flags.length,
		blockers: v.flags.filter((f) => f.level === 'blocker').length,
		scenario: v.pitch.scenarioAssigned,
		techEvaluator: v.techEvaluator?.name ?? null,
		pitchManager: v.pitchManager?.name ?? null,
		pitchSales: v.pitchSales?.name ?? null
	};
}

/** Coaching and retake windows open for one SE, across both tracks. */
export function openWindows(v: EnrollmentView): OpenWindow[] {
	const base = { enrollmentId: v.enrollment.id, name: v.learner.name, initials: initials(v.learner.name) };
	const out: OpenWindow[] = [];
	for (const c of v.checkpoints) {
		if (c.status !== 'coaching' && c.status !== 'retake_scheduled') continue;
		const mods = c.coachingModules
			.map((m) => v.modules.find((x) => x.id === m)?.title ?? m)
			.join(', ');
		out.push({
			...base,
			track: 'technical',
			title: c.title,
			status: c.status === 'coaching' ? 'coaching' : 'retake',
			detail: mods ? `Needs work: ${mods}` : 'Needs work',
			windowEnd: c.retakeWindowEnd,
			href: `/evaluate/${v.enrollment.id}/checkpoint/${c.id}`
		});
	}
	if (v.pitch.status === 'coaching' || v.pitch.status === 'retake') {
		const dims = v.pitch.focusDimensions
			.map((d) => program().pitch.rubric.dimensions.find((x) => x.id === d)?.title ?? d)
			.join(', ');
		out.push({
			...base,
			track: 'pitch',
			title: 'Pitch bootcamp',
			status: v.pitch.status,
			detail:
				`Latest ${v.pitch.latestScore ?? '–'}/${v.pitch.max}` + (dims ? ` · focus: ${dims}` : ''),
			windowEnd: v.pitch.retakeWindowEnd,
			href: `/evaluate/${v.enrollment.id}/pitch`
		});
	}
	return out;
}

export function roster() {
	const views = listEnrollments().map((e) => buildView(e));
	const windows = views
		.flatMap(openWindows)
		.sort((a, b) => (a.windowEnd ?? '9999').localeCompare(b.windowEnd ?? '9999'));
	return { rows: views.map(toRow), windows };
}

export function peopleByRole(role: Role) {
	return all<Person>('SELECT id, name, email, role, title FROM users WHERE role = ? ORDER BY name', role);
}

export function evaluatorOptions() {
	return {
		tech: peopleByRole('tech_evaluator'),
		managers: peopleByRole('manager'),
		sales: peopleByRole('sales')
	};
}

export function oemOptions() {
	const p = program();
	return p.platform.oem.modules.map((mid) => ({
		id: mid,
		title: p.modules.find((m) => m.id === mid)?.title ?? mid
	}));
}

/** Key dates that derive from the start date, for previews. */
export function milestoneDays() {
	const p = program();
	const cps = p.checkpoints.map((c) => ({ label: c.title, day: c.day, kind: 'checkpoint' as const }));
	return [
		{ label: 'Day 1 · start', day: 1, kind: 'start' as const },
		{ label: 'Pitch bootcamp starts', day: p.pitch.start_day, kind: 'pitch' as const },
		...cps
	].sort((a, b) => a.day - b.day);
}

export function milestoneDates(start: string) {
	return milestoneDays().map((m) => ({ ...m, date: dateForDay(start, m.day) }));
}

export function emailTaken(email: string, exceptUserId?: string) {
	const row = get<{ id: string }>('SELECT id FROM users WHERE lower(email) = lower(?)', email);
	return !!row && row.id !== exceptUserId;
}

export function tempPassword() {
	// Readable: no 0/O/1/l.
	const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	const bytes = randomBytes(12);
	let s = '';
	for (const b of bytes) s += alphabet[b % alphabet.length];
	return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export interface NewSE {
	name: string;
	email: string;
	title: string | null;
	password: string;
	startDate: string;
	primaryOem: string | null;
	techEvaluatorId: string | null;
	pitchManagerId: string | null;
	pitchSalesId: string | null;
}

export function enrollSE(se: NewSE) {
	const userId = id();
	const enrollmentId = id();
	const ts = now();
	tx(() => {
		run(
			'INSERT INTO users (id, name, email, role, title, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			userId, se.name, se.email.toLowerCase(), 'learner', se.title, hashPassword(se.password), ts
		);
		run(
			`INSERT INTO enrollments (id, user_id, start_date, primary_oem, tech_evaluator_id, pitch_manager_id, pitch_sales_id, gating_override, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
			enrollmentId, userId, se.startDate, se.primaryOem, se.techEvaluatorId, se.pitchManagerId, se.pitchSalesId, ts
		);
	});
	return enrollmentId;
}

export function updateEvaluators(
	enrollmentId: string,
	ev: { tech: string | null; manager: string | null; sales: string | null }
) {
	run(
		'UPDATE enrollments SET tech_evaluator_id = ?, pitch_manager_id = ?, pitch_sales_id = ? WHERE id = ?',
		ev.tech, ev.manager, ev.sales, enrollmentId
	);
}

export function updatePrimaryOem(enrollmentId: string, oem: string) {
	run('UPDATE enrollments SET primary_oem = ? WHERE id = ?', oem, enrollmentId);
}

export function updateStartDate(enrollmentId: string, start: string) {
	run('UPDATE enrollments SET start_date = ? WHERE id = ?', start, enrollmentId);
}

export function setGatingOverride(enrollmentId: string, on: boolean) {
	run('UPDATE enrollments SET gating_override = ? WHERE id = ?', on ? 1 : 0, enrollmentId);
}

export const SCENARIO_IDENTITY = [
	'vertical',
	'company',
	'company_profile',
	'contact_name',
	'contact_title',
	'contact_profile',
	'met_at'
] as const;
export type ScenarioIdentity = Record<(typeof SCENARIO_IDENTITY)[number], string | null>;

export function getScenarioIdentity(enrollmentId: string) {
	return get<ScenarioIdentity & { assigned_at: string; updated_at: string }>(
		`SELECT ${SCENARIO_IDENTITY.join(', ')}, assigned_at, updated_at FROM scenarios WHERE enrollment_id = ?`,
		enrollmentId
	);
}

/** Upserts only the identity fields. The learner's research, discovery and pitch plan are never touched. */
export function upsertScenarioIdentity(enrollmentId: string, s: ScenarioIdentity) {
	const ts = now();
	const vals = SCENARIO_IDENTITY.map((k) => s[k]);
	run(
		`INSERT INTO scenarios (enrollment_id, ${SCENARIO_IDENTITY.join(', ')}, research, discovery, pitch_plan, assigned_at, updated_at)
		 VALUES (?, ${SCENARIO_IDENTITY.map(() => '?').join(', ')}, '{}', '[]', '{}', ?, ?)
		 ON CONFLICT (enrollment_id) DO UPDATE SET
		 ${SCENARIO_IDENTITY.map((k) => `${k} = excluded.${k}`).join(', ')}, updated_at = excluded.updated_at`,
		enrollmentId, ...vals, ts, ts
	);
}

export function isISODate(s: string) {
	return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

/** A form value naming a user of the given role, or null when blank. Throws on a mismatch. */
export function personOfRole(value: FormDataEntryValue | null, role: Role): string | null {
	const v = String(value ?? '').trim();
	if (!v) return null;
	const p = get<{ role: Role }>('SELECT role FROM users WHERE id = ?', v);
	if (!p || p.role !== role) throw new Error('invalid');
	return v;
}
