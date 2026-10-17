import type { LearnerRepository } from './repository';
import { emptyState, SCHEMA_VERSION, type LearnerState } from './types';

const KEY = 'se-journey:learner';
const DB_NAME = 'se-journey';
const FILES = 'files';

/**
 * Stores learner data in this browser: the state document in localStorage and
 * evidence files (screenshots) in IndexedDB. Clearing site data erases it, so
 * Settings offers export/import for backups.
 */
export class LocalRepository implements LearnerRepository {
	readonly label = 'This browser';

	async load(): Promise<LearnerState> {
		try {
			const raw = localStorage.getItem(KEY);
			if (!raw) return emptyState();
			return migrate(JSON.parse(raw));
		} catch {
			return emptyState();
		}
	}

	async save(state: LearnerState) {
		localStorage.setItem(KEY, JSON.stringify(state));
	}

	async putFile(data: Blob, name: string) {
		const ref = `${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)}`;
		await this.tx('readwrite', (s) => s.put(data, ref));
		return ref;
	}

	async getFile(ref: string) {
		return ((await this.tx('readonly', (s) => s.get(ref))) as Blob | undefined) ?? null;
	}

	async deleteFile(ref: string) {
		await this.tx('readwrite', (s) => s.delete(ref));
	}

	subscribe(onChange: () => void) {
		const handler = (e: StorageEvent) => e.key === KEY && onChange();
		addEventListener('storage', handler);
		return () => removeEventListener('storage', handler);
	}

	private db?: Promise<IDBDatabase>;

	private open() {
		this.db ??= new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => req.result.createObjectStore(FILES);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return this.db;
	}

	private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
		const db = await this.open();
		return new Promise((resolve, reject) => {
			const req = fn(db.transaction(FILES, mode).objectStore(FILES));
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}
}

/** Upgrade older saved documents. Add a step here whenever SCHEMA_VERSION changes. */
export function migrate(doc: Partial<LearnerState>): LearnerState {
	if (typeof doc !== 'object' || doc === null) throw new Error('Not a learner data file.');
	if ((doc.schema_version ?? 0) > SCHEMA_VERSION) throw new Error('This data was saved by a newer version of the app.');
	return { ...emptyState(), ...doc, schema_version: SCHEMA_VERSION };
}
