// Pitch Bootcamp: scenario workspace (research, discovery, plan) and evaluator sessions.
import { addDays } from '$lib/dates';
import type { EnrollmentRow, PitchSession, PitchStageId, PitchState } from '$lib/types';
import { program } from './content';
import { all, get, id, now, run } from './db';
import { getPerson, loadPitchSessions, stageTitle } from './progress';

export interface DiscoveryQuestion {
	question: string;
	priority: string;
}

export interface PitchPlan {
	sections: { name: string; reason: string }[];
	objections: { objection: string; response: string }[];
	next_step: string;
}

export interface Scenario {
	enrollment_id: string;
	vertical: string;
	company: string;
	company_profile: string | null;
	contact_name: string;
	contact_title: string | null;
	contact_profile: string | null;
	met_at: string | null;
	research: Record<string, string>;
	priority_restatement: string | null;
	discovery: DiscoveryQuestion[];
	pitch_plan: PitchPlan;
	assigned_at: string;
	updated_at: string;
}

type ScenarioRow = Omit<Scenario, 'research' | 'discovery' | 'pitch_plan'> & {
	research: string;
	discovery: string;
	pitch_plan: string;
};

function parse<T>(s: string | null | undefined, fallback: T): T {
	if (!s) return fallback;
	try {
		return (JSON.parse(s) as T) ?? fallback;
	} catch {
		return fallback;
	}
}

export function loadScenario(enrollmentId: string): Scenario | null {
	const r = get<ScenarioRow>('SELECT * FROM scenarios WHERE enrollment_id = ?', enrollmentId);
	if (!r) return null;
	const plan = parse<Partial<PitchPlan>>(r.pitch_plan, {});
	const discovery = parse<DiscoveryQuestion[]>(r.discovery, []);
	return {
		...r,
		research: parse<Record<string, string>>(r.research, {}),
		discovery: Array.isArray(discovery) ? discovery : [],
		pitch_plan: {
			sections: Array.isArray(plan.sections) ? plan.sections : [],
			objections: Array.isArray(plan.objections) ? plan.objections : [],
			next_step: plan.next_step ?? ''
		}
	};
}

/** Split the "stated priorities" research answer into individual priorities for the discovery datalist. */
export function statedPriorities(s: Scenario | null): string[] {
	const text = s?.research.stated_priorities ?? '';
	const parts = text
		.split(/\n|;|(?:^|\s)\d+[).]\s+/)
		.map((x) => x.replace(/^[\s\-*•]+/, '').replace(/[\s.]+$/, '').trim())
		.filter((x) => x.length > 2);
	const out = [...new Set(parts.map((p) => p[0].toUpperCase() + p.slice(1)))];
	return out;
}

const clean = (v: FormDataEntryValue | null, max = 4000) => String(v ?? '').trim().slice(0, max);

export function saveResearch(enrollmentId: string, form: FormData) {
	const research: Record<string, string> = {};
	for (const p of program().pitch.research_prompts) research[p.id] = clean(form.get(`r_${p.id}`));
	const restatement = clean(form.get('priority_restatement'));
	run(
		'UPDATE scenarios SET research = ?, priority_restatement = ?, updated_at = ? WHERE enrollment_id = ?',
		JSON.stringify(research), restatement || null, now(), enrollmentId
	);
}

export function saveDiscovery(enrollmentId: string, form: FormData) {
	const qs = form.getAll('question').map((v) => clean(v, 1000));
	const ps = form.getAll('priority').map((v) => clean(v, 300));
	const rows = qs.map((question, i) => ({ question, priority: ps[i] ?? '' })).filter((r) => r.question);
	if (rows.length > 50) return { error: 'Keep it to 50 questions or fewer.' };
	run('UPDATE scenarios SET discovery = ?, updated_at = ? WHERE enrollment_id = ?', JSON.stringify(rows), now(), enrollmentId);
	return { rows };
}

export function savePlan(enrollmentId: string, form: FormData) {
	const deck = program().pitch.deck.sections;
	const chosen = new Set(form.getAll('section').map(String));
	const sections = deck
		.map((name, i) => ({ name, reason: clean(form.get(`reason_${i}`), 1000) }))
		.filter((s) => chosen.has(s.name));
	const objs = form.getAll('objection').map((v) => clean(v, 500));
	const resps = form.getAll('response').map((v) => clean(v, 2000));
	const common = new Set(program().pitch.common_objections);
	const objections = objs
		.map((objection, i) => ({ objection, response: resps[i] ?? '' }))
		// Seeded common objections only count once answered; custom ones are kept as written.
		.filter((o) => o.objection && (o.response || !common.has(o.objection)));
	const plan: PitchPlan = { sections, objections, next_step: clean(form.get('next_step'), 2000) };
	run('UPDATE scenarios SET pitch_plan = ?, updated_at = ? WHERE enrollment_id = ?', JSON.stringify(plan), now(), enrollmentId);
	return plan;
}

/** How much of the prep workspace is filled in (for tab badges and evaluator readiness). */
export function prepProgress(s: Scenario | null) {
	if (!s) return { research: false, discovery: false, plan: false };
	const prompts = program().pitch.research_prompts;
	return {
		research: prompts.every((p) => s.research[p.id]?.trim()) && !!s.priority_restatement?.trim(),
		discovery: s.discovery.length > 0,
		plan: s.pitch_plan.sections.length > 0 && !!s.pitch_plan.next_step.trim()
	};
}

// ---------- Sessions ----------

const BASE_STAGES: PitchStageId[] = ['baseline', 'coaching', 'practice', 'graded'];
export const SCORED_STAGES: PitchStageId[] = ['baseline', 'practice', 'graded', 'retake'];
export const EVAL_STAGES: PitchStageId[] = ['graded', 'retake'];

export interface SchedulableStage {
	stage: PitchStageId;
	attempt: number;
	title: string;
}

/** Stages an evaluator may schedule next. Retake rounds open only after a graded/retake eval below target. */
export function schedulableStages(sessions: PitchSession[], pitch: PitchState): SchedulableStage[] {
	if (pitch.passed) return [];
	const out: SchedulableStage[] = [];
	for (const st of BASE_STAGES) {
		if (!sessions.some((s) => s.stage === st)) out.push({ stage: st, attempt: 1, title: stageTitle(st) });
	}
	const evals = sessions.filter((s) => EVAL_STAGES.includes(s.stage));
	const last = evals.at(-1);
	if (last && last.status === 'completed' && last.total != null && last.total < pitch.target) {
		const attempt = last.attempt_number + 1;
		if (!sessions.some((s) => s.stage === 'retake_coaching' && s.attempt_number === attempt))
			out.push({ stage: 'retake_coaching', attempt, title: `Retake coaching #${attempt - 1}` });
		if (!sessions.some((s) => s.stage === 'retake' && s.attempt_number === attempt))
			out.push({ stage: 'retake', attempt, title: stageTitle('retake', attempt) });
	}
	return out;
}

export function scheduleSession(
	e: EnrollmentRow,
	pitch: PitchState,
	input: { stage: string; date: string; managerId: string; salesId: string }
) {
	const options = schedulableStages(pitch.sessions, pitch);
	const opt = options.find((o) => o.stage === input.stage);
	if (!opt) return { error: 'That stage can’t be scheduled right now.' };
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { error: 'Pick a session date.' };
	const manager = input.managerId ? getPerson(input.managerId) : null;
	const sales = input.salesId ? getPerson(input.salesId) : null;
	if (input.managerId && manager?.role !== 'manager') return { error: 'Pick a manager evaluator.' };
	if (input.salesId && sales?.role !== 'sales') return { error: 'Pick a sales evaluator.' };
	if (!manager && !sales) return { error: 'Add at least one evaluator.' };
	const last = pitch.sessions.filter((s) => EVAL_STAGES.includes(s.stage)).at(-1);
	run(
		`INSERT INTO pitch_sessions (id, enrollment_id, stage, attempt_number, session_date, manager_evaluator_id, sales_evaluator_id, status, retake_window_end, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
		id(), e.id, opt.stage, opt.attempt, input.date, manager?.id ?? null, sales?.id ?? null,
		opt.stage.startsWith('retake') ? (last?.retake_window_end ?? null) : null,
		now()
	);
	return { ok: true as const, title: opt.title };
}

export function rescheduleSession(enrollmentId: string, sessionId: string, date: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Pick a session date.' };
	const r = run(
		`UPDATE pitch_sessions SET session_date = ? WHERE id = ? AND enrollment_id = ? AND status = 'scheduled'`,
		date, sessionId, enrollmentId
	);
	return r.changes ? { ok: true as const } : { error: 'Only scheduled sessions can be moved.' };
}

/** The lowest-scoring dimensions, ties broken by rubric order. */
export function lowestDimensions(scores: Record<string, number>, count = program().pitch.retake.coaching_focus_count) {
	const dims = program().pitch.rubric.dimensions;
	return dims
		.map((d, i) => ({ id: d.id, score: scores[d.id] ?? 0, i }))
		.sort((a, b) => a.score - b.score || a.i - b.i)
		.slice(0, count)
		.map((d) => d.id);
}

export function recordSession(enrollmentId: string, sessionId: string, form: FormData) {
	const p = program().pitch;
	const s = loadPitchSessions(enrollmentId).find((x) => x.id === sessionId);
	if (!s) return { error: 'Session not found.' };
	if (s.status !== 'scheduled') return { error: 'This session is already recorded. Attempts are never overwritten.' };
	const feedback = clean(form.get('feedback'));
	const observations = clean(form.get('observations'));
	const scored = SCORED_STAGES.includes(s.stage);

	if (!scored) {
		if (!feedback) return { error: 'Add feedback for the SE before recording this coaching session.' };
		run(
			`UPDATE pitch_sessions SET status = 'completed', feedback = ?, observations = ?, completed_at = ? WHERE id = ?`,
			feedback, observations || null, now(), s.id
		);
		return { ok: true as const, total: null, passed: null };
	}

	const scores: Record<string, number> = {};
	const missing: string[] = [];
	for (const d of p.rubric.dimensions) {
		const n = Number(form.get(`score_${d.id}`));
		if (!Number.isInteger(n) || n < 1 || n > p.rubric.max_per_dimension) missing.push(d.title);
		else scores[d.id] = n;
	}
	if (missing.length) return { error: `Score every dimension (missing: ${missing.join(', ')}).` };
	if (!feedback) return { error: 'Add feedback the SE will see.' };

	const total = Object.values(scores).reduce((a, b) => a + b, 0);
	const isEval = EVAL_STAGES.includes(s.stage);
	const failed = isEval && total < p.rubric.graduation_target;
	const focus = failed ? lowestDimensions(scores) : null;
	const window = failed
		? addDays(s.session_date ?? now().slice(0, 10), p.retake.coaching_days + p.retake.window_days)
		: s.retake_window_end;

	run(
		`UPDATE pitch_sessions SET status = 'completed', scores = ?, total = ?, feedback = ?, observations = ?,
		   focus_dimensions = ?, retake_window_end = ?, completed_at = ? WHERE id = ?`,
		JSON.stringify(scores), total, feedback, observations || null,
		focus ? JSON.stringify(focus) : null, window ?? null, now(), s.id
	);
	return { ok: true as const, total, passed: isEval ? !failed : null };
}

export function pitchEvaluators() {
	return {
		managers: all<{ id: string; name: string }>("SELECT id, name FROM users WHERE role = 'manager' ORDER BY name"),
		sales: all<{ id: string; name: string }>("SELECT id, name FROM users WHERE role = 'sales' ORDER BY name")
	};
}

/** Content the pitch pages need, trimmed to what the client renders. */
export function pitchContent() {
	const p = program().pitch;
	return {
		title: p.title,
		goal: p.goal,
		components: p.components,
		evaluation_flow: p.evaluation_flow,
		stages: p.stages,
		rubric: p.rubric,
		retake: p.retake,
		deck: p.deck,
		research_prompts: p.research_prompts,
		common_objections: p.common_objections
	};
}
