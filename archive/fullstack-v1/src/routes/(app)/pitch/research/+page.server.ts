import { fail } from '@sveltejs/kit';
import { requireOwnEnrollment } from '$lib/server/guards';
import { loadScenario, saveResearch } from '$lib/server/pitch';

export const actions = {
	save: async (event) => {
		const { enrollment } = requireOwnEnrollment(event);
		if (!loadScenario(enrollment.id)) return fail(400, { message: 'Your scenario hasn’t been assigned yet.' });
		saveResearch(enrollment.id, await event.request.formData());
		return { ok: true };
	}
};
