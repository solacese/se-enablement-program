<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let { data } = $props();
	const t = $derived(data.track);
	const max = $derived(t.rubric.max_per_dimension * t.rubric.dimensions.length);
	const stageIcon: Record<string, string> = { baseline: 'flag', coaching: 'message', practice: 'mic', graded: 'trophy' };
</script>

<svelte:head><title>{t.title} · Solace SE Journey</title></svelte:head>

<PageHeader tone="amber" eyebrow="Track A · {t.duration_weeks} weeks from day {t.start_day} · evaluated by {t.evaluators.toLowerCase()}" title={t.title} subtitle={t.goal} />

<section class="mt-8">
	<h2 class="text-xl font-extrabold">What you'll do</h2>
	<ol class="mt-4 grid gap-4 md:grid-cols-3">
		{#each t.components as c (c.id)}
			<li class="card relative overflow-hidden p-6">
				<span class="absolute -top-4 -right-2 text-8xl font-extrabold text-pitch-100">{c.number}</span>
				<p class="eyebrow relative text-[10px] text-pitch-700">{c.focus}</p>
				<h3 class="relative mt-1 text-lg font-bold">{c.title}</h3>
				<p class="relative mt-2 text-sm text-slate-ink">{c.description}</p>
			</li>
		{/each}
	</ol>
</section>

<section class="mt-8 rounded-3xl bg-gradient-to-br from-pitch-300 to-pitch-400 p-6 text-night sm:p-8">
	<h2 class="text-xl font-extrabold">Cadence</h2>
	<p class="mt-1 text-sm text-night/75">Runs alongside Block 2: {data.platformBlock2.theme.toLowerCase()}.</p>
	<ol class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each t.stages as s, i (s.id)}
			<li class="relative rounded-2xl bg-white/60 p-5 ring-1 ring-night/5 backdrop-blur">
				<div class="flex items-center gap-3">
					<span class="grid size-10 place-items-center rounded-xl bg-night text-pitch-300"><Icon name={stageIcon[s.id] ?? 'flag'} class="size-5" /></span>
					<span><span class="block text-xs font-bold uppercase opacity-60">Week {s.week}</span><span class="block font-extrabold">{s.title}</span></span>
				</div>
				<p class="mt-3 text-sm text-night/80">{s.description}</p>
				{#if i < t.stages.length - 1}<Icon name="arrow-right" class="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-night p-0.5 text-pitch-300 lg:block" />{/if}
			</li>
		{/each}
	</ol>
</section>

<div class="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
	<section class="card p-6">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-extrabold">Scoring rubric</h2>
			<span class="rounded-full bg-night px-3 py-1 text-sm font-bold text-pitch-300">Graduate at ≥ {t.rubric.graduation_target}/{max}</span>
		</div>
		<div class="mt-4 overflow-x-auto">
			<table class="w-full min-w-[480px] text-left text-sm">
				<thead><tr class="border-b border-fog text-xs text-slate-ink uppercase"><th class="py-2 pr-4">Dimension</th><th class="py-2 pr-4">Proficient behaviour</th><th class="py-2">Score</th></tr></thead>
				<tbody>
					{#each t.rubric.dimensions as d (d.id)}
						<tr class="border-b border-fog/60"><td class="py-3 pr-4 font-semibold">{d.title}</td><td class="py-3 pr-4 text-slate-ink">{d.proficient}</td><td class="py-3 font-semibold">1–{t.rubric.max_per_dimension}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="mt-4 flex flex-wrap gap-2">
			{#each Object.entries(t.rubric.scale) as [n, label] (n)}<span class="rounded-full bg-pitch-50 px-3 py-1 text-xs font-semibold text-pitch-800 ring-1 ring-pitch-300/50"><span class="font-extrabold">{n}</span> {label}</span>{/each}
		</div>
	</section>
	<section class="space-y-6">
		<div class="card p-6">
			<h2 class="text-xl font-extrabold">Each live session</h2>
			<ol class="mt-4 space-y-3">
				{#each t.evaluation_flow as f, i (f.title)}
					<li class="flex gap-3"><span class="grid size-7 shrink-0 place-items-center rounded-full bg-pitch-400 text-xs font-bold text-night">{i + 1}</span><span class="text-sm"><span class="font-semibold">{f.title}:</span> {f.description}</span></li>
				{/each}
			</ol>
		</div>
		<div class="card border-pitch-300/60 bg-pitch-50 p-6">
			<h2 class="font-extrabold">Below {t.rubric.graduation_target}?</h2>
			<p class="mt-1 text-sm text-slate-ink">You get targeted coaching on your {t.retake.coaching_focus_count} lowest dimensions, then a retake window ({t.retake.coaching_days} days of coaching plus {t.retake.window_days} days) for another graded eval. Every attempt stays on your record so the trend is visible.</p>
		</div>
	</section>
</div>
