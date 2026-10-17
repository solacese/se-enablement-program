<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		eyebrow,
		title,
		subtitle,
		tone = 'green',
		actions,
		children
	}: { eyebrow?: string; title: string; subtitle?: string; tone?: 'green' | 'amber'; actions?: Snippet; children?: Snippet } = $props();
</script>

<header class="relative overflow-hidden rounded-3xl bg-night px-6 py-8 text-white shadow-xl shadow-night/20 sm:px-10 sm:py-10">
	<div class="grid-bg absolute inset-0 opacity-60"></div>
	<div
		class="absolute -top-24 -right-16 size-80 animate-float rounded-full blur-3xl {tone === 'amber' ? 'bg-pitch-400/30' : 'bg-green-500/30'}"
	></div>
	<div class="absolute -bottom-28 left-1/3 size-72 rounded-full bg-deep-400/40 blur-3xl"></div>
	<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div class="max-w-3xl">
			{#if eyebrow}<p class="eyebrow {tone === 'amber' ? 'text-pitch-300' : 'text-green-400'}">{eyebrow}</p>{/if}
			<h1 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
			{#if subtitle}<p class="mt-3 text-base text-white/75 sm:text-lg">{subtitle}</p>{/if}
			{@render children?.()}
		</div>
		{#if actions}<div class="flex shrink-0 flex-wrap gap-2">{@render actions()}</div>{/if}
	</div>
</header>
