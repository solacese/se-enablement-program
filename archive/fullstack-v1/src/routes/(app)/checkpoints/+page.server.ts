import { program } from '$lib/server/content';
import { requireOwnEnrollment } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

export const load = (event) => {
	const { enrollment } = requireOwnEnrollment(event);
	const view = buildView(enrollment);
	const titles = Object.fromEntries(program().modules.map((m) => [m.id, m.title]));
	return { checkpoints: view.checkpoints, today: view.today, titles };
};
