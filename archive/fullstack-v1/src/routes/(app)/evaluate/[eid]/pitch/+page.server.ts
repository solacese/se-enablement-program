import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { requireAssignedEnrollment } from '$lib/server/guards';
import {
	loadScenario,
	pitchContent,
	pitchEvaluators,
	prepProgress,
	recordSession,
	rescheduleSession,
	schedulableStages,
	scheduleSession,
	statedPriorities
} from '$lib/server/pitch';
import { buildView } from '$lib/server/progress';

/** Pitch sessions are run by managers and sales, not technical evaluators. */
function guard(event: RequestEvent, eid: string) {
	const ctx = requireAssignedEnrollment(event, eid);
	if (ctx.user.role !== 'manager' && ctx.user.role !== 'sales') error(403, 'Pitch sessions are evaluated by managers and sales.');
	return ctx;
}

export const load = (event) => {
	const { user, enrollment } = guard(event, event.params.eid);
	const view = buildView(enrollment);
	const scenario = loadScenario(enrollment.id);
	return {
		user,
		enrollment,
		learner: view.learner,
		day: view.day,
		today: view.today,
		pitch: view.pitch,
		pitchManager: view.pitchManager,
		pitchSales: view.pitchSales,
		scenario,
		priorities: statedPriorities(scenario),
		prep: prepProgress(scenario),
		schedulable: schedulableStages(view.pitch.sessions, view.pitch),
		evaluators: pitchEvaluators(),
		content: pitchContent()
	};
};

export const actions = {
	schedule: async (event) => {
		const { enrollment } = guard(event, event.params.eid);
		const form = await event.request.formData();
		const view = buildView(enrollment);
		const r = scheduleSession(enrollment, view.pitch, {
			stage: String(form.get('stage') ?? ''),
			date: String(form.get('date') ?? ''),
			managerId: String(form.get('manager') ?? ''),
			salesId: String(form.get('sales') ?? '')
		});
		if ('error' in r) return fail(400, { action: 'schedule', message: r.error });
		return { action: 'schedule', ok: true, message: `${r.title} scheduled.` };
	},
	reschedule: async (event) => {
		const { enrollment } = guard(event, event.params.eid);
		const form = await event.request.formData();
		const r = rescheduleSession(enrollment.id, String(form.get('session')), String(form.get('date') ?? ''));
		if ('error' in r) return fail(400, { action: 'reschedule', message: r.error });
		return { action: 'reschedule', ok: true, message: 'Session moved.' };
	},
	record: async (event) => {
		const { enrollment } = guard(event, event.params.eid);
		const form = await event.request.formData();
		const r = recordSession(enrollment.id, String(form.get('session')), form);
		if ('error' in r) return fail(400, { action: 'record', message: r.error });
		const message =
			r.total == null
				? 'Coaching session recorded.'
				: r.passed === false
					? `Recorded ${r.total}. Below target, so coaching and a retake window are now open.`
					: r.passed
						? `Recorded ${r.total}. Target met: the SE graduates the bootcamp.`
						: `Recorded ${r.total}.`;
		return { action: 'record', ok: true, message };
	}
};
