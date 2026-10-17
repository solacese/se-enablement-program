import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { learner } from '$lib/data/learner.svelte';

export interface Identity {
	name: string;
	email: string;
	provider: 'local' | 'github';
}

/**
 * Who is using the app. The static site has no accounts: the "identity" is the
 * profile the SE sets up in this browser. With a backend, add a provider that
 * redirects to the server's GitHub OAuth flow (the client secret must stay on the
 * server) and reads the session from an API, then select it below.
 */
export interface AuthProvider {
	readonly kind: Identity['provider'];
	current(): Identity | null;
	signIn(): Promise<void>;
	signOut(): Promise<void>;
}

class LocalAuth implements AuthProvider {
	readonly kind = 'local' as const;

	current(): Identity | null {
		const p = learner.state.profile;
		return p ? { name: p.name, email: p.email, provider: 'local' } : null;
	}

	async signIn() {
		await goto(`${base}/start/`);
	}

	/** Nothing to sign out of locally; data stays until the SE resets it in Settings. */
	async signOut() {
		await goto(`${base}/`);
	}
}

export const auth: AuthProvider = new LocalAuth();
