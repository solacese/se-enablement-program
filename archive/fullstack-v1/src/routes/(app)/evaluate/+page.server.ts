import { requireRole } from '$lib/server/guards';
import { buildView, listEnrollments, stageTitle } from '$lib/server/progress';

export const load = (event) => {
	const user = requireRole(event, 'tech_evaluator', 'sales', 'manager');
	const mine = (e: { tech_evaluator_id: string | null; pitch_manager_id: string | null; pitch_sales_id: string | null }) =>
		[e.tech_evaluator_id, e.pitch_manager_id, e.pitch_sales_id].includes(user.id);
	const enrollments = listEnrollments().filter((e) => user.role === 'manager' || mine(e));
	// Who needs attention first: blocked, behind, in coaching, then everyone else.
	const rank = (v: ReturnType<typeof buildView>) =>
		v.overall === 'blocked' ? 0 : v.overall === 'behind' ? 1 : v.inCoaching ? 2 : v.overall === 'on_track' ? 3 : 4;
	const views = enrollments.map((e) => buildView(e)).sort((a, b) => rank(a) - rank(b) || b.day - a.day);

	type Session = { date: string; kind: 'checkpoint' | 'pitch'; title: string; learner: string; eid: string; href: string };
	const sessions: Session[] = [];
	for (const v of views) {
		const eid = v.enrollment.id;
		if (user.role !== 'sales')
			for (const c of v.checkpoints)
				if (c.latest?.status === 'scheduled' && c.latest.scheduled_date && (user.role === 'manager' || c.latest.evaluator_id === user.id || v.enrollment.tech_evaluator_id === user.id))
					sessions.push({ date: c.latest.scheduled_date, kind: 'checkpoint', title: c.title + (c.latest.attempt_number > 1 ? ` · retake ${c.latest.attempt_number - 1}` : ''), learner: v.learner.name, eid, href: `/evaluate/${eid}/checkpoint/${c.id}` });
		if (user.role !== 'tech_evaluator')
			for (const s of v.pitch.sessions)
				if (s.status === 'scheduled' && s.session_date)
					sessions.push({ date: s.session_date, kind: 'pitch', title: `Pitch · ${stageTitle(s.stage, s.attempt_number)}`, learner: v.learner.name, eid, href: `/evaluate/${eid}/pitch` });
	}
	sessions.sort((a, b) => a.date.localeCompare(b.date));

	return {
		role: user.role,
		today: views[0]?.today,
		sessions,
		ses: views.map((v) => {
			const nextCp = v.checkpoints.find((c) => c.status !== 'passed') ?? null;
			return {
				eid: v.enrollment.id,
				name: v.learner.name,
				title: v.learner.title,
				day: v.day,
				overall: v.overall,
				inCoaching: v.inCoaching,
				roles: [
					v.enrollment.tech_evaluator_id === user.id && 'Technical',
					v.enrollment.pitch_manager_id === user.id && 'Pitch (manager)',
					v.enrollment.pitch_sales_id === user.id && 'Pitch (sales)'
				].filter(Boolean) as string[],
				current: v.currentModule?.title ?? null,
				nextCp: nextCp && { id: nextCp.id, title: nextCp.title, date: nextCp.date, status: nextCp.status, missing: nextCp.missingProofs.length },
				pitch: { status: v.pitch.status, score: v.pitch.latestScore, max: v.pitch.max },
				proofs: v.progress.proofsSubmitted
			};
		})
	};
};
