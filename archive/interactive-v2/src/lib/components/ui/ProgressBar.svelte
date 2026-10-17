<script lang="ts">
	let { value, max, tone = 'green', label }: { value: number; max: number; tone?: 'green' | 'amber' | 'blue'; label: string } = $props();
	const pct = $derived(max > 0 ? Math.round((value / max) * 100) : 0);
	const fill = { green: 'from-green-400 to-green-600', amber: 'from-pitch-300 to-pitch-500', blue: 'from-deep-300 to-deep' };
</script>

<div class="h-2 w-full overflow-hidden rounded-full bg-deep/10" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
	<div class="h-full rounded-full bg-gradient-to-r {fill[tone]} transition-[width] duration-700" style="width:{pct}%"></div>
</div>
