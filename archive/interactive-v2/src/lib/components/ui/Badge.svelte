<script lang="ts">
	import type { Snippet } from 'svelte';
	type Tone = 'green' | 'blue' | 'amber' | 'red' | 'grey' | 'night' | 'sky';
	let { tone = 'grey', children, class: cls = '' }: { tone?: Tone; children: Snippet; class?: string } = $props();
	const tones: Record<Tone, string> = {
		green: 'bg-green-100 text-green-800 ring-green-600/20',
		blue: 'bg-deep-100 text-deep ring-deep/15',
		amber: 'bg-pitch-100 text-pitch-800 ring-pitch-500/25',
		red: 'bg-red-100 text-red-800 ring-red-600/20',
		grey: 'bg-mist text-slate-ink ring-fog',
		night: 'bg-night text-green-300 ring-night',
		sky: 'bg-sky-100 text-sky-900 ring-sky-600/20'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset {tones[tone]} {cls}">
	{@render children()}
</span>
