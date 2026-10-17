<script lang="ts">
	import type { Flag } from '$lib/types';
	import { base } from '$app/paths';
	import Icon from './Icon.svelte';
	let { flags, compact = false }: { flags: Flag[]; compact?: boolean } = $props();
	const style = {
		blocker: { box: 'border-red-200 bg-red-50', icon: 'alert', ic: 'text-red-700', label: 'Blocker' },
		warning: { box: 'border-pitch-300/60 bg-pitch-50', icon: 'alert', ic: 'text-pitch-700', label: 'Heads up' },
		info: { box: 'border-deep-100 bg-deep-100/30', icon: 'info', ic: 'text-deep', label: 'Note' }
	};
</script>

<ul class="space-y-2">
	{#each flags as f (f.title)}
		{@const s = style[f.level]}
		<li class="flex gap-3 rounded-xl border p-3 {s.box}">
			<Icon name={s.icon} class="mt-0.5 size-5 shrink-0 {s.ic}" />
			<div class="min-w-0 flex-1 text-sm">
				<p class="font-semibold text-night"><span class="sr-only">{s.label}: </span>{f.title}</p>
				{#if !compact}<p class="mt-0.5 text-slate-ink">{f.detail}</p>{/if}
			</div>
			{#if f.href}
				<a href="{base}{f.href}" class="self-center text-sm font-semibold text-deep hover:underline">View</a>
			{/if}
		</li>
	{/each}
</ul>
