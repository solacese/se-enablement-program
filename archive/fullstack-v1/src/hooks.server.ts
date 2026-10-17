import type { Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/auth';
import { seedIfEmpty } from '$lib/server/seed';

seedIfEmpty();

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = readSession(event.cookies);
	return resolve(event);
};
