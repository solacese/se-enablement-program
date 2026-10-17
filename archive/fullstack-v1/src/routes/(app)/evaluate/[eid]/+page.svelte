<script lang="ts">
	import DualTimeline from '$lib/components/DualTimeline.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import FlagList from '$lib/components/ui/FlagList.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import { formatDate } from '$lib/dates';

	let { data } = $props();
	const v = $derived(data.view);
	const pitchText = { not_started: 'Not started', in_progress: 'In progress', coaching: 'Coaching', retake: 'Retake scheduled', graduated: 'Graduated' };
</script>

<svelte:head><title>{v.learner.name} · Evaluations</title></svelte:head>

<nav class="mb-4 text-sm"><a href="/evaluate" class="font-semibold text-slate-ink hover:text-night">← Evaluations</a></nav>

<PageHeader eyebrow={v.day < 1 ? `Starts ${formatDate(v.enrollment.start_date, true)}` : `Day ${Math.min(v.day, 90)} of 90`} title={v.learner.name} subtitle="{v.learner.title ?? 'Sales Engineer'} · started {formatDate(v.enrollment.start_date, true)}">
	<div class="mt-4"><StatusPill status={v.overall} /></div>
</PageHeader>

{#if v.flags.length}<div class="mt-6"><FlagList flags={v.flags} compact /></div>{/if}

<div class="mt-6 grid gap-6 lg:grid-cols-2">
	<section class="card p-6">
		<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="flag" class="size-5 text-deep" />Technical checkpoints</h2>
		<p class="mt-1 text-sm text-slate-ink">Evaluator: {v.techEvaluator?.name ?? 'not assigned'}</p>
		<ul class="mt-4 space-y-3">
			{#each v.checkpoints as c (c.id)}
				<li>
					<a href="/evaluate/{v.enrollment.id}/checkpoint/{c.id}" class="flex items-center gap-4 rounded-2xl border border-fog/80 p-4 transition hover:border-deep-300 hover:shadow-md">
						<span class="grid size-11 place-items-center rounded-xl {c.status === 'passed' ? 'bg-green-500 text-night' : 'bg-night text-green-400'}"><Icon name={c.status === 'passed' ? 'check' : c.format === 'capstone' ? 'trophy' : 'flag'} /></span>
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{c.title}</span>
							<span class="block text-xs text-slate-ink">{formatDate(c.date, true)} · {c.requiredModules.length - c.missingProofs.length}/{c.requiredModules.length} exit proofs in · {c.attempts.length} attempt{c.attempts.length === 1 ? '' : 's'}</span>
						</span>
						<CheckpointStatusBadge status={c.status} />
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card p-6">
		<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="mic" class="size-5 text-pitch-700" />Pitch bootcamp</h2>
		<p class="mt-1 text-sm text-slate-ink">Evaluators: {[v.pitchManager?.name, v.pitchSales?.name].filter(Boolean).join(' & ') || 'not assigned'}</p>
		<svelte:element this={data.role === 'tech_evaluator' ? 'div' : 'a'} href={data.role === 'tech_evaluator' ? undefined : `/evaluate/${v.enrollment.id}/pitch`} class="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-pitch-400 to-pitch-300 p-5 text-night shadow-lg shadow-pitch-400/20 transition hover:-translate-y-0.5">
			<span class="text-4xl font-extrabold">{v.pitch.latestScore ?? '–'}<span class="text-lg text-night/60">/{v.pitch.max}</span></span>
			<span class="flex-1">
				<span class="block font-bold">{pitchText[v.pitch.status]}</span>
				<span class="block text-sm text-night/75">{v.pitch.scenarioAssigned ? 'Scenario assigned' : 'No scenario yet'} · target {v.pitch.target}</span>
			</span>
			{#if data.role !== 'tech_evaluator'}<Icon name="arrow-right" class="size-5" />{/if}
		</svelte:element>
		<ol class="mt-4 flex flex-wrap gap-2">
			{#each v.pitch.stages as s (s.id + s.startDate)}
				<li class="rounded-full px-3 py-1 text-xs font-semibold {s.done ? 'bg-pitch-400 text-night' : s.current ? 'bg-pitch-100 text-pitch-800 ring-2 ring-pitch-400' : 'bg-mist text-slate-ink'}">{s.title}</li>
			{/each}
		</ol>
	</section>
</div>

<section class="card mt-6 p-6">
	<h2 class="mb-5 text-lg font-extrabold">Timeline</h2>
	<DualTimeline day={v.day} modules={v.modules} checkpoints={v.checkpoints} pitch={v.pitch} linkModules={false} />
</section>
