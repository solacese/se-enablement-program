<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import AttemptHistory from '$lib/components/AttemptHistory.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import EvidenceList from '$lib/components/EvidenceList.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { formatDate } from '$lib/dates';

	let { data, form } = $props();
	const s = $derived(data.state);
	const scheduled = $derived(s.latest?.status === 'scheduled' ? s.latest : null);
	const titles = $derived(Object.fromEntries(data.modules.map((m) => [m.id, m.title])));
	const canRecordNow = $derived(data.canRecord && s.status !== 'passed');

	// Pass / needs-work choices per module, pre-filled with "pass" for modules that passed last time.
	const lastResults = untrack(() => Object.fromEntries((s.latest?.results ?? []).map((r) => [r.module_id, r.result])));
	let results = $state<Record<string, string>>(untrack(() => Object.fromEntries(data.modules.map((m) => [m.id, lastResults[m.id] === 'pass' ? 'pass' : '']))));
	const decided = $derived(Object.values(results).filter(Boolean).length);
	const allPass = $derived(decided === data.modules.length && Object.values(results).every((r) => r === 'pass'));
	let active = $state(untrack(() => data.modules[0]?.id));
	let busy = $state(false);
	const submitting = () => {
		busy = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
		};
	};
</script>

<svelte:head><title>{data.cp.title} · {data.learner.name}</title></svelte:head>

<nav class="mb-4 flex items-center gap-2 text-sm text-slate-ink">
	<a href="/evaluate" class="font-semibold hover:text-night">Evaluations</a><Icon name="chevron-right" class="size-4" />
	<a href="/evaluate/{data.eid}" class="font-semibold hover:text-night">{data.learner.name}</a>
</nav>

<PageHeader eyebrow="{data.learner.name} · Day {data.cp.day} · {data.cp.format === 'capstone' ? 'Capstone demo' : 'Live quiz'}" title={data.cp.title} subtitle={data.cp.description}>
	<div class="mt-4 flex flex-wrap gap-2">
		<CheckpointStatusBadge status={s.status} />
		<Badge tone="night">Target {formatDate(s.date, true)}</Badge>
		{#if scheduled}<Badge tone="sky"><Icon name="calendar" class="size-3.5" />Scheduled {formatDate(scheduled.scheduled_date, true)}</Badge>{/if}
	</div>
</PageHeader>

<div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
	<div class="min-w-0 space-y-6">
		<!-- Session guide -->
		<section class="rounded-3xl bg-night p-6 text-white">
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="compass" class="size-5 text-green-400" />Session guide</h2>
			<ol class="mt-4 grid gap-3 md:grid-cols-3">
				{#each ['Walk me through your setup', 'Why does this work?', 'What broke, and how did you fix it?'] as step, i (step)}
					<li class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
						<span class="text-2xl font-extrabold text-green-400">{i + 1}</span>
						<p class="mt-1 font-semibold">{step}</p>
					</li>
				{/each}
			</ol>
			<ul class="mt-4 space-y-1.5 text-sm text-white/75">
				{#each data.cp.general_questions as q (q)}<li class="flex gap-2"><Icon name="message" class="mt-0.5 size-4 shrink-0 text-green-400" />{q}</li>{/each}
			</ul>
		</section>

		<!-- Per-module review + result -->
		<form method="POST" action="?/record" use:enhance={submitting} class="space-y-6">
			<div class="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Modules">
				{#each data.modules as m (m.id)}
					<button
						type="button"
						role="tab"
						aria-selected={active === m.id}
						onclick={() => (active = m.id)}
						class="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition {active === m.id ? 'bg-night text-white shadow-lg' : 'bg-white text-night ring-1 ring-fog hover:ring-deep-300'}"
					>
						<span class="size-2 rounded-full {results[m.id] === 'pass' ? 'bg-green-500' : results[m.id] === 'needs_work' ? 'bg-pitch-400' : 'bg-fog'}"></span>
						{m.title}
					</button>
				{/each}
			</div>

			{#each data.modules as m (m.id)}
				<div class="card overflow-hidden" hidden={active !== m.id} role="tabpanel" aria-label={m.title}>
					<div class="border-b border-fog/70 bg-gradient-to-r from-green-50 to-white p-5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<h2 class="text-xl font-extrabold">{m.title}</h2>
							{#if m.state.exitProofSubmittedAt}<Badge tone="green"><Icon name="check" class="size-3.5" />Exit proof submitted {formatDate(m.state.exitProofSubmittedAt)}</Badge>
							{:else if m.state.selfPaced}<Badge tone="grey">Self-paced (optional)</Badge>
							{:else}<Badge tone="amber">Exit proof not submitted</Badge>{/if}
						</div>
						<p class="mt-2 flex gap-2 text-sm"><Icon name="target" class="mt-0.5 size-4 shrink-0 text-green-700" /><span><span class="font-semibold">Exit proof:</span> {m.exitProof}</span></p>
						<p class="mt-1 text-xs text-slate-ink">{m.state.stepsDone}/{m.state.stepsTotal} steps checked off · {m.evidence.length} evidence item{m.evidence.length === 1 ? '' : 's'}</p>
					</div>
					<div class="grid gap-6 p-5 2xl:grid-cols-2">
						<div class="min-w-0">
							<h3 class="eyebrow text-[10px] text-slate-ink">Submitted evidence</h3>
							<div class="mt-3">
								{#if m.evidence.length}<EvidenceList items={m.evidence} />
								{:else}<EmptyState icon="upload" title="No evidence yet">Ask the SE to add evidence before the session.</EmptyState>{/if}
							</div>
						</div>
						<div class="min-w-0 space-y-5">
							<div>
								<h3 class="eyebrow text-[10px] text-slate-ink">Suggested questions</h3>
								<ol class="mt-3 space-y-2 text-sm">
									{#each m.questions as q, i (q)}<li class="flex gap-2.5 rounded-xl bg-mist p-3"><span class="font-bold text-deep">{i + 1}</span>{q}</li>{/each}
								</ol>
							</div>
							{#if canRecordNow}
								<fieldset class="rounded-2xl border border-fog p-4">
									<legend class="px-1 text-sm font-bold">Result for {m.title}</legend>
									<div class="grid grid-cols-2 gap-2">
										<label class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition {results[m.id] === 'pass' ? 'border-green-500 bg-green-500 text-night' : 'border-fog hover:border-green-500'}">
											<input type="radio" class="sr-only" name="result_{m.id}" value="pass" bind:group={results[m.id]} /><Icon name="check" class="size-4" strokeWidth={3} />Pass
										</label>
										<label class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition {results[m.id] === 'needs_work' ? 'border-pitch-500 bg-pitch-400 text-night' : 'border-fog hover:border-pitch-400'}">
											<input type="radio" class="sr-only" name="result_{m.id}" value="needs_work" bind:group={results[m.id]} /><Icon name="alert" class="size-4" />Needs work
										</label>
									</div>
									<label class="label mt-3" for="notes_{m.id}">Notes for the SE</label>
									<textarea id="notes_{m.id}" name="notes_{m.id}" rows="3" class="input" placeholder="What went well, what to revisit."></textarea>
								</fieldset>
							{/if}
						</div>
					</div>
				</div>
			{/each}

			{#if canRecordNow}
				<section class="card p-6">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-lg font-extrabold">Record the result</h2>
						<span class="text-sm font-semibold text-slate-ink">{decided}/{data.modules.length} modules decided</span>
					</div>
					<label class="label mt-4" for="notes">Overall feedback <span class="font-normal text-slate-ink">(visible to the SE)</span></label>
					<textarea id="notes" name="notes" rows="3" class="input" placeholder="Summary of the session."></textarea>
					{#if decided === data.modules.length}
						<p class="mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold {allPass ? 'bg-green-50 text-green-800' : 'bg-pitch-50 text-pitch-800'}">
							<Icon name={allPass ? 'trophy' : 'target'} class="size-5" />
							{allPass ? 'Every module passed. This checkpoint will be marked passed.' : `Needs work on some modules. This opens coaching and a ${data.cp.retake_window_days}-day retake window.`}
						</p>
					{/if}
					{#if form?.recordError}<p class="mt-3 text-sm font-medium text-red-700" role="alert">{form.recordError}</p>{/if}
					<button class="btn-primary mt-4" disabled={busy || decided < data.modules.length}><Icon name="check" class="size-4" strokeWidth={3} />Save result</button>
				</section>
			{/if}
		</form>
		{#if form?.recorded}
			<p class="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">Result saved{form.recorded === 'needs_work' ? '. Coaching and a retake window are now open.' : '. Checkpoint passed.'}</p>
		{/if}
	</div>

	<aside class="space-y-6">
		{#if data.canRecord && s.status !== 'passed'}
			<form method="POST" action="?/schedule" use:enhance={submitting} class="card p-6">
				<h2 class="text-lg font-extrabold">{scheduled ? 'Reschedule' : s.status === 'coaching' ? 'Schedule the retake' : 'Schedule the session'}</h2>
				{#if s.status === 'coaching' && s.retakeWindowEnd}<p class="mt-1 text-sm text-pitch-700">Retake window closes {formatDate(s.retakeWindowEnd, true)}.</p>{/if}
				<label class="label mt-4" for="date">Date</label>
				<input id="date" name="date" type="date" class="input" value={scheduled?.scheduled_date ?? (s.date >= data.today ? s.date : data.today)} required />
				<label class="label mt-3" for="evaluator">Evaluator</label>
				<select id="evaluator" name="evaluator" class="input">
					{#each data.evaluators as ev (ev.id)}<option value={ev.id} selected={ev.id === (scheduled?.evaluator_id ?? data.defaultEvaluator)}>{ev.name}</option>{/each}
				</select>
				{#if form?.scheduleError}<p class="mt-3 text-sm font-medium text-red-700" role="alert">{form.scheduleError}</p>{/if}
				{#if form?.scheduled}<p class="mt-3 text-sm font-semibold text-green-700" role="status">Scheduled. The SE can see it on their dashboard.</p>{/if}
				<button class="btn-dark mt-4 w-full" disabled={busy}><Icon name="calendar" class="size-4" />{scheduled ? 'Update' : 'Schedule'}</button>
			</form>
		{/if}

		{#if s.status === 'coaching' || s.status === 'retake_scheduled'}
			<section class="rounded-3xl border border-pitch-300 bg-pitch-50 p-6">
				<h2 class="font-extrabold">In coaching</h2>
				<p class="mt-1 text-sm text-slate-ink">Coach on the modules that fell short, then retake.</p>
				<ul class="mt-3 flex flex-wrap gap-2">{#each s.coachingModules as id (id)}<li><Badge tone="amber">{titles[id] ?? id}</Badge></li>{/each}</ul>
			</section>
		{/if}

		<section class="card p-6">
			<h2 class="text-lg font-extrabold">Attempts</h2>
			{#if s.attempts.length}<div class="mt-4"><AttemptHistory attempts={s.attempts} {titles} /></div>
			{:else}<p class="mt-2 text-sm text-slate-ink">No attempts yet.</p>{/if}
		</section>
	</aside>
</div>
