<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	let { icon = 'compass', title, children }: { icon?: string; title: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col items-center rounded-2xl border-2 border-dashed border-fog bg-white/60 px-6 py-10 text-center">
	<div class="mb-3 grid size-12 place-items-center rounded-2xl bg-green-50 text-green-700">
		<Icon name={icon} class="size-6" />
	</div>
	<p class="font-semibold text-night">{title}</p>
	{#if children}<div class="mt-1 max-w-md text-sm text-slate-ink">{@render children()}</div>{/if}
</div>
