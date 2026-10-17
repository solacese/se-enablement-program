import { getContext, setContext } from 'svelte';
import type { ModuleStep } from '$lib/content/types';

const KEY = Symbol('step-tracker');

/**
 * Shared state between a module page and the <Step> components rendered inside its
 * Markdown body. Toggles are optimistic and saved immediately.
 */
export class StepTracker {
	done = $state<Record<string, boolean>>({});
	saving = $state<Record<string, boolean>>({});
	error = $state<string | null>(null);

	steps = $state<ModuleStep[]>([]);
	editable = $state(false);

	constructor(
		steps: ModuleStep[],
		done: string[],
		editable: boolean,
		private save: (stepId: string, done: boolean) => Promise<boolean>
	) {
		this.sync(steps, done, editable);
	}

	/** Re-read server state (after navigation or a save), keeping in-flight toggles. */
	sync(steps: ModuleStep[], done: string[], editable: boolean) {
		this.steps = steps;
		this.editable = editable;
		const next: Record<string, boolean> = {};
		for (const id of done) next[id] = true;
		for (const id of Object.keys(this.saving)) if (this.saving[id]) next[id] = this.done[id];
		this.done = next;
	}

	index(id: string) {
		return this.steps.findIndex((s) => s.id === id);
	}

	get count() {
		return this.steps.filter((s) => this.done[s.id]).length;
	}

	async toggle(id: string) {
		if (!this.editable || this.saving[id]) return;
		const next = !this.done[id];
		this.done[id] = next;
		this.saving[id] = true;
		this.error = null;
		const ok = await this.save(id, next);
		this.saving[id] = false;
		if (!ok) {
			this.done[id] = !next;
			this.error = 'Couldn’t save that step. Check your connection and try again.';
		}
	}
}

export function provideSteps(t: StepTracker) {
	setContext(KEY, t);
}

export function useSteps(): StepTracker | undefined {
	return getContext(KEY);
}
