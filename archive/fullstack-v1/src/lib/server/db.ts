import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';

const migrations = import.meta.glob('/migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const DB_PATH = resolve(env.DATABASE_PATH ?? 'data/app.db');

function open() {
	mkdirSync(dirname(DB_PATH), { recursive: true });
	const db = new DatabaseSync(DB_PATH);
	db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
	migrate(db);
	return db;
}

function migrate(db: DatabaseSync) {
	db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
	const applied = new Set(
		(db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[]).map((r) => r.name)
	);
	for (const [path, sql] of Object.entries(migrations).sort(([a], [b]) => a.localeCompare(b))) {
		const name = path.split('/').pop()!;
		if (applied.has(name)) continue;
		db.exec('BEGIN');
		try {
			db.exec(sql);
			db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(name, now());
			db.exec('COMMIT');
		} catch (e) {
			db.exec('ROLLBACK');
			throw e;
		}
	}
}

// Keep one connection across dev-server module reloads.
const g = globalThis as unknown as { __db?: DatabaseSync };
export const db = (g.__db ??= open());

export function id() {
	return randomUUID();
}

export function now() {
	return new Date().toISOString();
}

type Params = SQLInputValue[];

export function all<T>(sql: string, ...params: Params): T[] {
	return db.prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: Params): T | undefined {
	return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: Params) {
	return db.prepare(sql).run(...params);
}

export function tx<T>(fn: () => T): T {
	db.exec('BEGIN');
	try {
		const r = fn();
		db.exec('COMMIT');
		return r;
	} catch (e) {
		db.exec('ROLLBACK');
		throw e;
	}
}
