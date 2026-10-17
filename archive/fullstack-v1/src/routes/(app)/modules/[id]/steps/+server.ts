import { error, json } from '@sveltejs/kit';
import { getModule } from '$lib/server/content';
import { setStep } from '$lib/server/evidence';
import { requireOwnEnrollment } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

// Auto-save for step checkboxes.
export const POST = async (event) => {
	const { enrollment } = requireOwnEnrollment(event);
	const m = getModule(event.params.id);
	if (!m) error(404, 'Module not found.');
	const body = (await event.request.json().catch(() => null)) as { step?: string; done?: boolean } | null;
	if (!body?.step || !m.steps.some((s) => s.id === body.step)) error(400, 'Unknown step.');
	const state = buildView(enrollment).modules.find((x) => x.id === m.id);
	if (state?.status === 'locked') error(409, 'This module is locked until its prerequisites are done.');
	setStep(enrollment.id, m.id, body.step, !!body.done);
	return json({ ok: true });
};
