<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { useSteps } from './steps.svelte';

	let { id, title, minutes, children }: { id: string; title: string; minutes?: string; children?: Snippet } = $props();
	const tracker = useSteps();
	const index = $derived(tracker ? tracker.index(id) : -1);
	const done = $derived(!!tracker?.done[id]);
	const saving = $derived(!!tracker?.saving[id]);
	let open = $state<boolean | null>(null);
	// Completed steps fold away by default; the learner can reopen them.
	const expanded = $derived(open ?? !done);
</script>

<section
	id="step-{id}"
	class="not-prose my-5 scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-colors {done
		? 'border-green-300 shadow-[0_0_0_4px_rgba(0,200,149,0.08)]'
		: 'border-fog/80'}"
>
	<div class="flex items-center gap-4 px-4 py-3.5 sm:px-5">
		{#if tracker?.editable}
			<button
				type="button"
				role="checkbox"
				aria-checked={done}
				aria-label="Mark “{title}” as {done ? 'not done' : 'done'}"
				disabled={saving}
				onclick={() => tracker.toggle(id)}
				class="grid size-9 shrink-0 place-items-center rounded-full border-2 transition {done
					? 'border-green-500 bg-green-500 text-night'
					: 'border-deep-300 text-transparent hover:border-green-500 hover:text-green-500/50'}"
			>
				<Icon name="check" class="size-5" strokeWidth={3} />
			</button>
		{:else}
			<span
				class="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold {done
					? 'bg-green-500 text-night'
					: 'bg-deep-100 text-deep'}"
			>
				{#if done}<Icon name="check" class="size-5" strokeWidth={3} />{:else}{index + 1 || '•'}{/if}
			</span>
		{/if}
		<button type="button" class="min-w-0 flex-1 text-left" onclick={() => (open = !expanded)} aria-expanded={expanded}>
			<span class="eyebrow block text-[10px] text-slate-ink">Step {index >= 0 ? index + 1 : ''}{minutes ? ` · ~${minutes} min` : ''}</span>
			<span class="block font-semibold text-night {done ? 'text-night/70 line-through decoration-green-500/60' : ''}">{title}</span>
		</button>
		<button type="button" onclick={() => (open = !expanded)} class="rounded-lg p-1 text-slate-ink hover:bg-mist" aria-label={expanded ? 'Hide instructions' : 'Show instructions'}>
			<Icon name="chevron-down" class="size-5 transition-transform {expanded ? 'rotate-180' : ''}" />
		</button>
	</div>
	{#if expanded}
		<div transition:slide={{ duration: 200 }} class="prose prose-sm max-w-none border-t border-fog/60 px-5 py-4 prose-headings:text-night prose-a:text-green-700 sm:pl-[4.5rem]">
			{@render children?.()}
		</div>
	{/if}
</section>
