import { fail } from '@sveltejs/kit';
import { requireOwnEnrollment } from '$lib/server/guards';
import { loadScenario, saveDiscovery, statedPriorities } from '$lib/server/pitch';

export const load = (event) => {
	const { enrollment } = requireOwnEnrollment(event);
	return { priorities: statedPriorities(loadScenario(enrollment.id)) };
};

export const actions = {
	save: async (event) => {
		const { enrollment } = requireOwnEnrollment(event);
		if (!loadScenario(enrollment.id)) return fail(400, { message: 'Your scenario hasn’t been assigned yet.' });
		const r = saveDiscovery(enrollment.id, await event.request.formData());
		if (r.error) return fail(400, { message: r.error });
		return { ok: true };
	}
};
