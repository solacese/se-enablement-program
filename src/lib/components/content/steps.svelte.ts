import { getContext, setContext } from 'svelte';
import type { ModuleStep } from '$lib/content/types';

const KEY = Symbol('module-steps');

/** The module page shares its ordered steps so each <Step> in the Markdown can show its number. */
export function provideSteps(steps: () => ModuleStep[]) {
	setContext(KEY, steps);
}

export function useSteps(): (() => ModuleStep[]) | undefined {
	return getContext(KEY);
}
