import { error } from '@sveltejs/kit';
import { evidenceOwner } from '$lib/server/evidence';
import { getEnrollment } from '$lib/server/progress';
import { storage } from '$lib/server/storage';

// Evidence files are only visible to the learner, their assigned evaluators and managers.
export const GET = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) error(401, 'Sign in to view this file.');
	const owner = evidenceOwner(params.ref);
	const e = owner && getEnrollment(owner.enrollment_id);
	if (!e) error(404, 'File not found.');
	const allowed =
		user.role === 'manager' ||
		e.user_id === user.id ||
		[e.tech_evaluator_id, e.pitch_manager_id, e.pitch_sales_id].includes(user.id);
	if (!allowed) error(403, 'You don’t have access to this file.');
	const file = await storage.read(params.ref);
	if (!file) error(404, 'File not found.');
	return new Response(file.data as BodyInit, {
		headers: {
			'content-type': file.contentType,
			'cache-control': 'private, max-age=3600',
			'x-content-type-options': 'nosniff',
			'content-disposition': file.contentType.startsWith('image/') ? 'inline' : 'attachment'
		}
	});
};
