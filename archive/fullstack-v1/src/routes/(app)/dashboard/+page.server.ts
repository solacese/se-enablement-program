import { fail, redirect } from '@sveltejs/kit';
import { homeFor } from '$lib/server/auth';
import { agenda, nextStep } from '$lib/server/agenda';
import { program } from '$lib/server/content';
import { now, run } from '$lib/server/db';
import { requireOwnEnrollment, requireUser } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

export const load = (event) => {
	const user = requireUser(event);
	if (user.role !== 'learner') redirect(303, homeFor(user.role));
	const { enrollment } = requireOwnEnrollment(event);
	const view = buildView(enrollment);
	const block = program().platform.blocks.find((b) => view.day >= b.days[0] && view.day <= b.days[1]) ?? null;
	return {
		view,
		block: block && { number: block.number, theme: block.theme, tagline: block.tagline },
		next: view.currentModule ? nextStep(enrollment.id, view.currentModule.id) : null,
		agenda: agenda(view),
		taskStates: Object.fromEntries(program().platform.setup_tasks.map((t) => [t.id, t.states]))
	};
};

export const actions = {
	task: async (event) => {
		const { enrollment } = requireOwnEnrollment(event);
		const form = await event.request.formData();
		const taskId = String(form.get('task'));
		const status = String(form.get('status'));
		const def = program().platform.setup_tasks.find((t) => t.id === taskId);
		if (!def || !def.states.includes(status)) return fail(400, { message: 'Unknown task or status.' });
		run(
			`INSERT INTO task_progress (enrollment_id, task_id, status, updated_at) VALUES (?, ?, ?, ?)
			 ON CONFLICT (enrollment_id, task_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
			enrollment.id, taskId, status, now()
		);
		return { ok: true };
	}
};
