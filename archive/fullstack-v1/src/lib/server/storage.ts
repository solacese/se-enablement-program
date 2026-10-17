import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import { id } from './db';

/**
 * Where evidence files live. Local disk for v1; implement this interface for S3/GCS
 * (and pick it via env) to move to object storage without touching callers.
 */
export interface FileStorage {
	save(data: Uint8Array, filename: string, contentType: string): Promise<string>;
	read(ref: string): Promise<{ data: Uint8Array; contentType: string } | null>;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain', 'application/json', 'application/x-yaml', 'text/yaml', 'application/pdf'];

const TYPES: Record<string, string> = {
	png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
	pdf: 'application/pdf', json: 'application/json', txt: 'text/plain', yaml: 'text/plain', yml: 'text/plain',
	xml: 'text/plain', conf: 'text/plain', properties: 'text/plain', env: 'text/plain'
};

class LocalStorage implements FileStorage {
	constructor(private root: string) {}

	async save(data: Uint8Array, filename: string) {
		await mkdir(this.root, { recursive: true });
		const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
		const ref = `${id()}-${safe}`;
		await writeFile(join(this.root, ref), data);
		return ref;
	}

	async read(ref: string) {
		if (!/^[a-f0-9-]{36}-[a-zA-Z0-9._-]+$/.test(ref)) return null;
		try {
			const data = await readFile(join(this.root, ref));
			const ext = ref.split('.').pop()?.toLowerCase() ?? '';
			return { data, contentType: TYPES[ext] ?? 'application/octet-stream' };
		} catch {
			return null;
		}
	}
}

export const storage: FileStorage = new LocalStorage(resolve(env.UPLOAD_DIR ?? 'data/uploads'));
