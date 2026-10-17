<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { useSteps } from './steps.svelte';

	let { id, title, minutes, children }: { id: string; title: string; minutes?: string; children?: Snippet } = $props();
	const steps = useSteps();
	const index = $derived(steps ? steps().findIndex((s) => s.id === id) : -1);
	let open = $state(true);
</script>

<section id="step-{id}" class="my-5 scroll-mt-24 overflow-hidden rounded-2xl border border-fog/80 bg-white">
	<button type="button" class="flex w-full items-center gap-4 px-4 py-3.5 text-left sm:px-5" onclick={() => (open = !open)} aria-expanded={open}>
		<span class="grid size-9 shrink-0 place-items-center rounded-full bg-night text-sm font-bold text-green-400">{index >= 0 ? index + 1 : '•'}</span>
		<span class="min-w-0 flex-1">
			<span class="eyebrow block text-[10px] text-slate-ink">Step {index >= 0 ? index + 1 : ''}{minutes ? ` · ~${minutes} min` : ''}</span>
			<span class="block font-semibold text-night">{title}</span>
		</span>
		<Icon name="chevron-down" class="size-5 shrink-0 text-slate-ink transition-transform {open ? 'rotate-180' : ''}" />
		<span class="sr-only">{open ? 'Hide' : 'Show'} instructions</span>
	</button>
	{#if open}
		<div transition:slide={{ duration: 200 }} class="prose prose-sm max-w-none border-t border-fog/60 px-5 py-4 prose-headings:text-night prose-a:text-green-700 sm:pl-[4.5rem]">
			{@render children?.()}
		</div>
	{/if}
</section>
