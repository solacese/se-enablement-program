import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { get, id, run } from './db';

export type Role = 'learner' | 'tech_evaluator' | 'sales' | 'manager';

export interface SessionUser {
	id: string;
	name: string;
	email: string;
	role: Role;
	title: string | null;
}

export const ROLE_LABELS: Record<Role, string> = {
	learner: 'Learner',
	tech_evaluator: 'Technical evaluator',
	sales: 'Pitch evaluator (sales)',
	manager: 'Manager'
};

const COOKIE = 'se_session';
const SESSION_DAYS = 14;

export function hashPassword(password: string) {
	const salt = randomBytes(16).toString('hex');
	return `scrypt:${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string) {
	const [, salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	const a = Buffer.from(hash, 'hex');
	const b = scryptSync(password, salt, a.length);
	return timingSafeEqual(a, b);
}

/**
 * Local email + password auth for v1. To add SSO later, swap `login` for the IdP
 * callback and keep `createSession`/`readSession` as-is.
 */
export function login(email: string, password: string): SessionUser | null {
	const row = get<SessionUser & { password_hash: string }>(
		'SELECT id, name, email, role, title, password_hash FROM users WHERE lower(email) = lower(?)',
		email.trim()
	);
	if (!row || !verifyPassword(password, row.password_hash)) return null;
	const { password_hash: _, ...user } = row;
	return user;
}

export function createSession(cookies: Cookies, userId: string, secure: boolean) {
	const sid = id();
	const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
	run('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', sid, userId, expires.toISOString());
	cookies.set(COOKIE, sid, { path: '/', httpOnly: true, sameSite: 'lax', secure, expires });
}

export function readSession(cookies: Cookies): SessionUser | null {
	const sid = cookies.get(COOKIE);
	if (!sid) return null;
	const user = get<SessionUser>(
		`SELECT u.id, u.name, u.email, u.role, u.title FROM sessions s JOIN users u ON u.id = s.user_id
		 WHERE s.id = ? AND s.expires_at > ?`,
		sid,
		new Date().toISOString()
	);
	if (!user) cookies.delete(COOKIE, { path: '/' });
	return user ?? null;
}

export function destroySession(cookies: Cookies) {
	const sid = cookies.get(COOKIE);
	if (sid) run('DELETE FROM sessions WHERE id = ?', sid);
	cookies.delete(COOKIE, { path: '/' });
}

export function homeFor(role: Role) {
	return role === 'learner' ? '/dashboard' : role === 'manager' ? '/team' : '/evaluate';
}
