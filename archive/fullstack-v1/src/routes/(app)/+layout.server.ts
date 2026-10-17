import { requireUser } from '$lib/server/guards';
import { getEnrollmentByUser } from '$lib/server/progress';
import { dayNumber } from '$lib/dates';

export const load = (event) => {
	const user = requireUser(event);
	const e = user.role === 'learner' ? getEnrollmentByUser(user.id) : undefined;
	return { user, programDay: e ? dayNumber(e.start_date) : null };
};
