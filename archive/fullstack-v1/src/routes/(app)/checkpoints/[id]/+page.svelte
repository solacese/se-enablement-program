<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import AttemptHistory from '$lib/components/AttemptHistory.svelte';
	import { formatDate, relativeDays } from '$lib/dates';

	let { data } = $props();
	const s = $derived(data.state);
	const titles = $derived(Object.fromEntries(data.modules.map((m) => [m.id, m.title])));
	const ready = $derived(data.modules.filter((m) => !m.state.selfPaced).every((m) => m.state.exitProofSubmittedAt));
	const scheduled = $derived(s.latest?.status === 'scheduled' ? s.latest : null);
	let open = $state<string | null>(null);
</script>

<svelte:head><title>{data.cp.title} · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Day {data.cp.day} · {data.cp.format === 'capstone' ? 'Capstone demo' : 'Live quiz'} with a {data.cp.evaluator_role}" title={data.cp.title} subtitle={data.cp.description}>
	<div class="mt-5 flex flex-wrap items-center gap-2">
		<CheckpointStatusBadge status={s.status} />
		<Badge tone="night"><Icon name="calendar" class="size-3.5" />Target {formatDate(s.date, true)}</Badge>
		{#if data.evaluator}<Badge tone="night"><Icon name="users" class="size-3.5" />{data.evaluator.name}</Badge>{/if}
	</div>
</PageHeader>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<div class="space-y-6">
		{#if s.status === 'coaching' || s.status === 'retake_scheduled'}
			<section class="rounded-3xl border border-pitch-300 bg-gradient-to-br from-pitch-50 to-white p-6">
				<div class="flex items-center gap-3">
					<span class="grid size-10 place-items-center rounded-xl bg-pitch-400 text-night"><Icon name="target" /></span>
					<div>
						<h2 class="text-lg font-extrabold">Coaching and retake</h2>
						<p class="text-sm text-slate-ink">{s.retakeWindowEnd ? `Retake window closes ${formatDate(s.retakeWindowEnd, true)} (${relativeDays(s.retakeWindowEnd, data.today)}).` : 'Your evaluator will set a retake date.'}</p>
					</div>
				</div>
				<p class="mt-4 text-sm font-semibold">Focus your coaching on:</p>
				<ul class="mt-2 flex flex-wrap gap-2">
					{#each s.coachingModules as id (id)}<li><a href="/modules/{id}" class="inline-flex items-center gap-1.5 rounded-full bg-pitch-400 px-3 py-1 text-sm font-semibold text-night hover:bg-pitch-300">{titles[id] ?? id}<Icon name="arrow-right" class="size-3.5" /></a></li>{/each}
				</ul>
			</section>
		{/if}

		{#if scheduled}
			<section class="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-sky-500 to-deep-400 p-6 text-white shadow-lg">
				<span class="grid size-12 place-items-center rounded-2xl bg-white/20"><Icon name="calendar" class="size-6" /></span>
				<div>
					<p class="eyebrow text-[10px] text-white/80">{scheduled.attempt_number > 1 ? `Retake ${scheduled.attempt_number - 1}` : 'Scheduled'}</p>
					<p class="text-lg font-extrabold">{formatDate(scheduled.scheduled_date, true)} · {relativeDays(scheduled.scheduled_date ?? data.today, data.today)}</p>
					<p class="text-sm text-white/80">Live with {scheduled.evaluator_name ?? 'your evaluator'}</p>
				</div>
			</section>
		{/if}

		<section class="card p-6">
			<h2 class="text-lg font-extrabold">Question bank</h2>
			<p class="mt-1 text-sm text-slate-ink">Expect questions like these. Rehearse them against what you actually built.</p>
			<ul class="mt-4 space-y-2">
				{#each data.cp.general_questions as q (q)}
					<li class="flex gap-3 rounded-xl bg-night px-4 py-3 text-sm text-white"><Icon name="message" class="mt-0.5 size-4 shrink-0 text-green-400" />{q}</li>
				{/each}
			</ul>
			<div class="mt-4 divide-y divide-fog/70 rounded-2xl border border-fog/70">
				{#each data.modules as m (m.id)}
					<div>
						<button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold hover:bg-mist/60" aria-expanded={open === m.id} onclick={() => (open = open === m.id ? null : m.id)}>
							<span>{m.title} <span class="text-sm font-medium text-slate-ink">· {m.questions.length} questions</span></span>
							<Icon name="chevron-down" class="size-5 text-slate-ink transition {open === m.id ? 'rotate-180' : ''}" />
						</button>
						{#if open === m.id}
							<ol class="space-y-2 px-4 pb-4 text-sm">
								{#each m.questions as q, i (q)}<li class="flex gap-3"><span class="font-bold text-deep">{i + 1}.</span>{q}</li>{/each}
							</ol>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<section class="card p-6">
			<h2 class="text-lg font-extrabold">Attempts</h2>
			{#if s.attempts.length}
				<div class="mt-4"><AttemptHistory attempts={s.attempts} {titles} /></div>
			{:else}
				<p class="mt-2 text-sm text-slate-ink">No attempts yet. Your evaluator schedules the session; results and feedback appear here.</p>
			{/if}
		</section>
	</div>

	<aside class="space-y-6">
		<section class="card p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-extrabold">Readiness</h2>
				{#if ready}<Badge tone="green">Ready</Badge>{:else}<Badge tone="amber">{s.missingProofs.length} to go</Badge>{/if}
			</div>
			<p class="mt-1 text-sm text-slate-ink">Your evaluator reviews your exit proofs before the session.</p>
			<ul class="mt-4 space-y-3">
				{#each data.modules as m (m.id)}
					<li>
						<a href="/modules/{m.id}#exit-proof" class="flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-md {m.state.exitProofSubmittedAt ? 'border-green-200 bg-green-50' : 'border-fog bg-white'}">
							<span class="grid size-8 shrink-0 place-items-center rounded-full {m.state.exitProofSubmittedAt ? 'bg-green-500 text-night' : 'bg-mist text-slate-ink'}">
								<Icon name={m.state.exitProofSubmittedAt ? 'check' : m.state.status === 'locked' ? 'lock' : 'clock'} class="size-4" strokeWidth={2.5} />
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{m.title}</span>
								<span class="block text-xs text-slate-ink">{m.state.selfPaced ? 'Self-paced · optional' : m.state.exitProofSubmittedAt ? `Submitted ${formatDate(m.state.exitProofSubmittedAt)}` : `${m.state.evidenceCount} evidence · not submitted`}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>
