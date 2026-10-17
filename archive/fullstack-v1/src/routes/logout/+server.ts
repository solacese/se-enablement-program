import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';

export const POST = ({ cookies }) => {
	destroySession(cookies);
	redirect(303, '/');
};
