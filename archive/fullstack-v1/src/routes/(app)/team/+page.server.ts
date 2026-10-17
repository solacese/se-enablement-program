import { requireRole } from '$lib/server/guards';
import { roster } from '$lib/server/team';
import { todayISO } from '$lib/dates';

export const load = (event) => {
	requireRole(event, 'manager');
	const { rows, windows } = roster();
	return { rows, windows, today: todayISO() };
};
