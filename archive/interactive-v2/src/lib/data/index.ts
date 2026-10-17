import { LocalRepository } from './local';
import type { LearnerRepository } from './repository';

// Swap in an API-backed repository here when there's a backend.
export const repository: LearnerRepository = new LocalRepository();
