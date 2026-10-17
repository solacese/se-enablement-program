import { fail, redirect } from '@sveltejs/kit';
import { createSession, homeFor, login, ROLE_LABELS } from '$lib/server/auth';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '$lib/server/seed';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const load = ({ locals, url }) => {
	if (locals.user) redirect(303, url.searchParams.get('next') ?? homeFor(locals.user.role));
	return {
		// Set SHOW_DEMO_ACCOUNTS=false once real accounts exist.
		demo: env.SHOW_DEMO_ACCOUNTS === 'false' ? [] : DEMO_ACCOUNTS.map((a) => ({ ...a, roleLabel: ROLE_LABELS[a.role] })),
		demoPassword: DEMO_PASSWORD
	};
};

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		if (!email || !password) return fail(400, { email, message: 'Enter your email and password.' });
		const user = login(email, password);
		if (!user) return fail(400, { email, message: 'That email and password don’t match an account.' });
		createSession(cookies, user.id, !dev);
		const next = url.searchParams.get('next');
		redirect(303, next?.startsWith('/') && !next.startsWith('//') ? next : homeFor(user.role));
	}
};
