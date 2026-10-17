import type { LearnerState } from './types';

/**
 * Where learner data lives. The static site uses `LocalRepository` (this browser).
 * A backend adds an implementation that talks to an API, e.g.
 *
 *   load()  → GET  /api/learners/me
 *   save()  → PUT  /api/learners/me
 *   putFile → POST /api/files   (object storage)
 *
 * and is selected in ./index.ts. Nothing else in the app needs to change.
 */
export interface LearnerRepository {
	/** Human-readable name shown in Settings ("This browser", "Solace SE Journey server"). */
	readonly label: string;
	load(): Promise<LearnerState>;
	save(state: LearnerState): Promise<void>;
	putFile(data: Blob, name: string): Promise<string>;
	getFile(ref: string): Promise<Blob | null>;
	deleteFile(ref: string): Promise<void>;
	/** Called when another tab or device changed the data. Returns an unsubscribe function. */
	subscribe?(onChange: () => void): () => void;
}
