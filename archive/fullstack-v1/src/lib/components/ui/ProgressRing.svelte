<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		value,
		max = 100,
		size = 96,
		stroke = 10,
		color = '#00C895',
		track = 'rgba(9,59,95,0.12)',
		label,
		children
	}: { value: number; max?: number; size?: number; stroke?: number; color?: string; track?: string; label: string; children?: Snippet } = $props();
	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
	const pct = $derived(max > 0 ? Math.min(1, Math.max(0, value / max)) : 0);
</script>

<div class="relative inline-grid place-items-center" style="width:{size}px;height:{size}px" role="img" aria-label={label}>
	<svg width={size} height={size} class="-rotate-90">
		<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={track} stroke-width={stroke} />
		<circle
			cx={size / 2}
			cy={size / 2}
			{r}
			fill="none"
			stroke={color}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={c}
			stroke-dashoffset={c * (1 - pct)}
			class="transition-[stroke-dashoffset] duration-700 ease-out"
		/>
	</svg>
	<div class="absolute inset-0 grid place-items-center text-center">
		{@render children?.()}
	</div>
</div>
