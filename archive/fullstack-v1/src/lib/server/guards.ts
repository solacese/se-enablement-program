import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Role, SessionUser } from './auth';
import { getEnrollment, getEnrollmentByUser } from './progress';

export function requireUser(event: Pick<RequestEvent, 'locals' | 'url'>): SessionUser {
	const user = event.locals.user;
	if (!user) redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	return user;
}

export function requireRole(event: Pick<RequestEvent, 'locals' | 'url'>, ...roles: Role[]) {
	const user = requireUser(event);
	if (!roles.includes(user.role)) error(403, 'You don’t have access to this page.');
	return user;
}

/** The signed-in learner's own enrollment. */
export function requireOwnEnrollment(event: Pick<RequestEvent, 'locals' | 'url'>) {
	const user = requireRole(event, 'learner');
	const e = getEnrollmentByUser(user.id);
	if (!e) error(404, 'You’re not enrolled yet. Ask your manager to enroll you.');
	return { user, enrollment: e };
}

/** An enrollment an evaluator or manager is allowed to see. */
export function requireAssignedEnrollment(event: Pick<RequestEvent, 'locals' | 'url'>, enrollmentId: string) {
	const user = requireRole(event, 'tech_evaluator', 'sales', 'manager');
	const e = getEnrollment(enrollmentId);
	if (!e) error(404, 'Enrollment not found.');
	const assigned = [e.tech_evaluator_id, e.pitch_manager_id, e.pitch_sales_id].includes(user.id);
	if (user.role !== 'manager' && !assigned) error(403, 'You’re not assigned to this SE.');
	return { user, enrollment: e };
}
