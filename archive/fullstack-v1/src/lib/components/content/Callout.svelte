<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	let { title, tone = 'info', children }: { title?: string; tone?: 'info' | 'warning' | 'tip'; children?: Snippet } = $props();
	const s = {
		info: 'border-deep-100 bg-deep-100/40 text-deep [&_.ic]:text-deep',
		tip: 'border-green-200 bg-green-50 text-green-900 [&_.ic]:text-green-700',
		warning: 'border-pitch-300 bg-pitch-50 text-pitch-800 [&_.ic]:text-pitch-700'
	};
</script>

<aside class="not-prose my-5 flex gap-3 rounded-2xl border px-4 py-3.5 text-sm {s[tone]}">
	<span class="ic"><Icon name={tone === 'warning' ? 'alert' : tone === 'tip' ? 'sparkles' : 'info'} class="mt-0.5 size-5 shrink-0" /></span>
	<div>
		{#if title}<p class="font-bold">{title}</p>{/if}
		<div class="mt-0.5 [&_code]:rounded [&_code]:bg-white/70 [&_code]:px-1 [&_p]:m-0">{@render children?.()}</div>
	</div>
</aside>
