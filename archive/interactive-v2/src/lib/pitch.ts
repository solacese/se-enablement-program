// Pitch Bootcamp: scenario workspace (research, discovery, plan) and the sessions the SE
// logs after each live evaluation. Pure helpers over LearnerState; mutators validate first
// and only change state when they return null.
import { program } from '$lib/content/program';
import type { DiscoveryQuestion, LearnerState, PitchPlan, Scenario } from '$lib/data/types';
import { addDays, todayISO } from '$lib/dates';
import { stageTitle } from '$lib/progress';
import type { PitchSession, PitchStageId, PitchState } from '$lib/types';

const now = () => new Date().toISOString();
const clean = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max);
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

const BASE_STAGES: PitchStageId[] = ['baseline', 'coaching', 'practice', 'graded'];
export const SCORED_STAGES: PitchStageId[] = ['baseline', 'practice', 'graded', 'retake'];
export const EVAL_STAGES: PitchStageId[] = ['graded', 'retake'];
export const isEval = (s: { stage: string }) => EVAL_STAGES.includes(s.stage as PitchStageId);
export const isScored = (s: { stage: string }) => SCORED_STAGES.includes(s.stage as PitchStageId);

// ---------- Scenario workspace ----------

/** Split the "stated priorities" research answer into individual priorities for the discovery datalist. */
export function statedPriorities(s: Scenario | null): string[] {
	const text = s?.research.stated_priorities ?? '';
	const parts = text
		.split(/\n|;|(?:^|\s)\d+[).]\s+/)
		.map((x) => x.replace(/^[\s\-*•]+/, '').replace(/[\s.]+$/, '').trim())
		.filter((x) => x.length > 2);
	return [...new Set(parts.map((p) => p[0].toUpperCase() + p.slice(1)))];
}

/** How much of the prep workspace is filled in (for tab badges and the overview). */
export function prepProgress(s: Scenario | null) {
	if (!s) return { research: false, discovery: false, plan: false };
	const prompts = program().pitch.research_prompts;
	return {
		research: prompts.every((p) => s.research[p.id]?.trim()) && !!s.priority_restatement?.trim(),
		discovery: s.discovery.length > 0,
		plan: s.pitch_plan.sections.length > 0 && !!s.pitch_plan.next_step.trim()
	};
}

const SCENARIO_FIELDS = ['vertical', 'company', 'company_profile', 'contact_name', 'contact_title', 'met_at', 'contact_profile'] as const;
type ScenarioField = (typeof SCENARIO_FIELDS)[number];

/** Create or update the scenario the SE's manager assigned. Edits keep research, discovery and plan. */
export function saveScenarioDetails(s: LearnerState, fields: Record<string, string | null | undefined>): string | null {
	const tpl = program().scenarioTemplate;
	const v = Object.fromEntries(SCENARIO_FIELDS.map((k) => [k, clean(fields[k], k.endsWith('profile') ? 4000 : 300)])) as Record<ScenarioField, string>;
	const label = (k: string) => tpl.fields.find((f) => f.id === k)?.label ?? k;
	const required = new Set<string>(['vertical', 'company', 'contact_name', ...tpl.fields.filter((f) => f.required).map((f) => f.id)]);
	const missing = [...required].filter((k) => !v[k as ScenarioField]);
	if (missing.length) return `Fill in ${missing.map(label).join(', ')}.`;
	if (!tpl.verticals.includes(v.vertical)) return 'Pick a vertical from the list.';

	const t = now();
	const identity = {
		vertical: v.vertical,
		company: v.company,
		company_profile: v.company_profile || null,
		contact_name: v.contact_name,
		contact_title: v.contact_title || null,
		contact_profile: v.contact_profile || null,
		met_at: v.met_at || null
	};
	if (s.scenario) Object.assign(s.scenario, identity, { updated_at: t });
	else
		s.scenario = {
			...identity,
			research: {},
			priority_restatement: null,
			discovery: [],
			pitch_plan: { sections: [], objections: [], next_step: '' },
			assigned_at: t,
			updated_at: t
		};
	return null;
}

export function saveResearch(s: LearnerState, input: { research: Record<string, string>; priority_restatement: string }): string | null {
	if (!s.scenario) return 'Add your scenario first.';
	const research: Record<string, string> = {};
	for (const p of program().pitch.research_prompts) research[p.id] = clean(input.research[p.id]);
	s.scenario.research = research;
	s.scenario.priority_restatement = clean(input.priority_restatement) || null;
	s.scenario.updated_at = now();
	return null;
}

export function saveDiscovery(s: LearnerState, rows: DiscoveryQuestion[]): string | null {
	if (!s.scenario) return 'Add your scenario first.';
	const out = rows.map((r) => ({ question: clean(r.question, 1000), priority: clean(r.priority, 300) })).filter((r) => r.question);
	if (out.length > 50) return 'Keep it to 50 questions or fewer.';
	s.scenario.discovery = out;
	s.scenario.updated_at = now();
	return null;
}

export function savePlan(s: LearnerState, plan: PitchPlan): string | null {
	if (!s.scenario) return 'Add your scenario first.';
	const p = program().pitch;
	const reasons = new Map(plan.sections.map((x) => [x.name, x.reason]));
	// Keep deck order and only known sections.
	const sections = p.deck.sections.filter((name) => reasons.has(name)).map((name) => ({ name, reason: clean(reasons.get(name), 1000) }));
	const common = new Set(p.common_objections);
	const objections = plan.objections
		.map((o) => ({ objection: clean(o.objection, 500), response: clean(o.response, 2000) }))
		// Seeded common objections only count once answered; custom ones are kept as written.
		.filter((o) => o.objection && (o.response || !common.has(o.objection)));
	s.scenario.pitch_plan = { sections, objections, next_step: clean(plan.next_step, 2000) };
	s.scenario.updated_at = now();
	return null;
}

// ---------- Sessions ----------

export interface SchedulableStage {
	stage: PitchStageId;
	attempt: number;
	title: string;
}

/** Stages the SE may schedule next. Retake rounds open only after a graded/retake eval below target. */
export function schedulableStages(pitch: PitchState): SchedulableStage[] {
	if (pitch.passed) return [];
	const sessions = pitch.sessions;
	const out: SchedulableStage[] = [];
	for (const st of BASE_STAGES) {
		if (!sessions.some((s) => s.stage === st)) out.push({ stage: st, attempt: 1, title: stageTitle(st) });
	}
	const last = sessions.filter(isEval).at(-1);
	if (last && last.status === 'completed' && last.total != null && last.total < pitch.target) {
		const attempt = last.attempt_number + 1;
		if (!sessions.some((s) => s.stage === 'retake_coaching' && s.attempt_number === attempt))
			out.push({ stage: 'retake_coaching', attempt, title: stageTitle('retake_coaching', attempt) });
		if (!sessions.some((s) => s.stage === 'retake' && s.attempt_number === attempt))
			out.push({ stage: 'retake', attempt, title: stageTitle('retake', attempt) });
	}
	return out;
}

export function schedulePitchSession(
	s: LearnerState,
	pitch: PitchState,
	input: { stage: string; date: string; manager: string; sales: string }
): string | null {
	const opt = schedulableStages(pitch).find((o) => o.stage === input.stage);
	if (!opt) return 'That stage can’t be scheduled right now.';
	if (!isDate(input.date)) return 'Pick a session date.';
	const manager = clean(input.manager, 200);
	const sales = clean(input.sales, 200);
	if (!manager && !sales) return 'Add at least one evaluator.';
	const last = pitch.sessions.filter(isEval).at(-1);
	s.pitch_sessions.push({
		id: crypto.randomUUID(),
		stage: opt.stage,
		attempt_number: opt.attempt,
		session_date: input.date,
		manager_evaluator_id: null,
		sales_evaluator_id: null,
		manager_name: manager || null,
		sales_name: sales || null,
		status: 'scheduled',
		scores: null,
		total: null,
		feedback: null,
		observations: null,
		focus_dimensions: null,
		retake_window_end: opt.stage.startsWith('retake') ? (last?.retake_window_end ?? null) : null,
		completed_at: null,
		created_at: now()
	});
	return null;
}

export function reschedulePitchSession(s: LearnerState, sessionId: string, date: string): string | null {
	if (!isDate(date)) return 'Pick a session date.';
	const x = s.pitch_sessions.find((p) => p.id === sessionId);
	if (!x || x.status !== 'scheduled') return 'Only scheduled sessions can be moved.';
	x.session_date = date;
	return null;
}

/** The lowest-scoring dimensions, ties broken by rubric order. */
export function lowestDimensions(scores: Record<string, number>, count = program().pitch.retake.coaching_focus_count) {
	return program()
		.pitch.rubric.dimensions.map((d, i) => ({ id: d.id, score: scores[d.id] ?? 0, i }))
		.sort((a, b) => a.score - b.score || a.i - b.i)
		.slice(0, count)
		.map((d) => d.id);
}

export function recordPitchSession(
	s: LearnerState,
	sessionId: string,
	input: { scores: Record<string, number | undefined>; feedback: string; observations: string }
): string | null {
	const p = program().pitch;
	const x: PitchSession | undefined = s.pitch_sessions.find((v) => v.id === sessionId);
	if (!x) return 'Session not found.';
	if (x.status !== 'scheduled') return 'This session is already logged. Attempts are never overwritten.';
	const feedback = clean(input.feedback);
	const observations = clean(input.observations);

	if (!isScored(x)) {
		if (!feedback) return 'Add the feedback your evaluators gave you in this coaching session.';
		Object.assign(x, { status: 'completed', feedback, observations: observations || null, completed_at: now() });
		return null;
	}

	const scores: Record<string, number> = {};
	const missing: string[] = [];
	for (const d of p.rubric.dimensions) {
		const n = Number(input.scores[d.id]);
		if (!Number.isInteger(n) || n < 1 || n > p.rubric.max_per_dimension) missing.push(d.title);
		else scores[d.id] = n;
	}
	if (missing.length) return `Score every dimension (missing: ${missing.join(', ')}).`;
	if (!feedback) return 'Add the feedback your evaluators gave you.';

	const total = Object.values(scores).reduce((a, b) => a + b, 0);
	const failed = isEval(x) && total < p.rubric.graduation_target;
	Object.assign(x, {
		status: 'completed',
		scores,
		total,
		feedback,
		observations: observations || null,
		focus_dimensions: failed ? lowestDimensions(scores) : null,
		retake_window_end: failed ? addDays(x.session_date ?? todayISO(), p.retake.coaching_days + p.retake.window_days) : x.retake_window_end,
		completed_at: now()
	});
	return null;
}
