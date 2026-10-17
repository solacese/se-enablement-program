import { addDays, diffDays } from '$lib/dates';
import type { EnrollmentView } from '$lib/types';
import { getModule, program } from './content';
import { all } from './db';
import { stageTitle } from './progress';

export interface AgendaItem {
	date: string;
	kind: 'module' | 'checkpoint' | 'pitch' | 'task';
	title: string;
	detail: string;
	href: string;
	live?: boolean;
}

/** Deadlines and live sessions in the next `days` days (plus anything overdue). */
export function agenda(v: EnrollmentView, days = 14): AgendaItem[] {
	const until = addDays(v.today, days);
	const items: AgendaItem[] = [];
	const within = (d: string | null | undefined) => !!d && d <= until;

	for (const t of v.tasks) {
		const def = program().platform.setup_tasks.find((x) => x.id === t.id)!;
		if (t.status !== def.states.at(-1) && within(t.status === def.states[0] ? t.dueDate : t.neededByDate))
			items.push({ date: t.status === def.states[0] ? t.dueDate : t.neededByDate!, kind: 'task', title: t.title, detail: 'Setup task', href: '/dashboard#setup' });
	}
	for (const m of v.modules) {
		if (m.status === 'complete' || m.status === 'locked' || m.selfPaced) continue;
		if (within(m.endDate)) items.push({ date: m.endDate, kind: 'module', title: `Finish ${m.title}`, detail: 'Exit proof due', href: `/modules/${m.id}` });
	}
	for (const c of v.checkpoints) {
		if (c.status === 'passed') continue;
		const sched = c.latest?.status === 'scheduled' ? c.latest : null;
		if (sched?.scheduled_date && within(sched.scheduled_date))
			items.push({ date: sched.scheduled_date, kind: 'checkpoint', title: c.title + (sched.attempt_number > 1 ? ` (retake ${sched.attempt_number - 1})` : ''), detail: `Live with ${sched.evaluator_name ?? 'your evaluator'}`, href: `/checkpoints/${c.id}`, live: true });
		else if (c.status === 'coaching' && within(c.retakeWindowEnd))
			items.push({ date: c.retakeWindowEnd!, kind: 'checkpoint', title: `${c.title} retake window closes`, detail: 'Coaching in progress', href: `/checkpoints/${c.id}` });
		else if (c.status === 'upcoming' && within(c.date))
			items.push({ date: c.date, kind: 'checkpoint', title: c.title, detail: 'Target date, not yet scheduled', href: `/checkpoints/${c.id}` });
	}
	for (const s of v.pitch.sessions) {
		if (s.status === 'scheduled' && within(s.session_date))
			items.push({ date: s.session_date!, kind: 'pitch', title: `Pitch: ${stageTitle(s.stage, s.attempt_number)}`, detail: [s.manager_name, s.sales_name].filter(Boolean).join(' & ') || 'Evaluators TBC', href: '/pitch/sessions', live: true });
	}
	if (!v.pitch.passed && v.pitch.status !== 'not_started' && within(v.pitch.retakeWindowEnd))
		items.push({ date: v.pitch.retakeWindowEnd!, kind: 'pitch', title: 'Pitch retake window closes', detail: 'Retake the graded eval', href: '/pitch/sessions' });
	if (v.pitch.status === 'not_started' && within(v.pitch.startDate))
		items.push({ date: v.pitch.startDate, kind: 'pitch', title: `${program().pitch.title} starts`, detail: `Day ${v.pitch.startDay}`, href: '/pitch' });

	return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** The first unchecked step of a module. */
export function nextStep(enrollmentId: string, moduleId: string) {
	const m = getModule(moduleId);
	if (!m) return null;
	const done = new Set(
		all<{ step_id: string }>('SELECT step_id FROM step_progress WHERE enrollment_id = ? AND module_id = ?', enrollmentId, moduleId).map((r) => r.step_id)
	);
	const i = m.steps.findIndex((s) => !done.has(s.id));
	return i === -1 ? null : { ...m.steps[i], index: i + 1, total: m.steps.length };
}

export const daysUntil = (d: string, today: string) => diffDays(d, today);
