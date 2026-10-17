import { requireAssignedEnrollment } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

export const load = (event) => {
	const { user, enrollment } = requireAssignedEnrollment(event, event.params.eid);
	return { view: buildView(enrollment), role: user.role };
};
