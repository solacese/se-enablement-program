<script lang="ts">
	import { base } from '$app/paths';
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import AttemptHistory from '$lib/components/AttemptHistory.svelte';
	import { learner } from '$lib/data/learner.svelte';
	import { formatDate, relativeDays, todayISO } from '$lib/dates';
	import { buildView } from '$lib/progress';

	let { data } = $props();
	const view = $derived(buildView(learner.state)!);
	const s = $derived(view.checkpoints.find((c) => c.id === data.cp.id)!);
	const modules = $derived(data.modules.map((m) => ({ ...m, state: view.modules.find((x) => x.id === m.id)! })));
	const titles = $derived(Object.fromEntries(data.modules.map((m) => [m.id, m.title])));
	const ready = $derived(modules.filter((m) => !m.state.selfPaced).every((m) => m.state.exitProofSubmittedAt));
	const scheduled = $derived(s.latest?.status === 'scheduled' ? s.latest : null);
	const evaluatorDefault = $derived(learner.state.profile?.tech_evaluator ?? '');
	let open = $state<string | null>(null);

	// Schedule form
	let date = $state('');
	let evaluator = $state('');
	let scheduleMsg = $state<{ ok: boolean; text: string } | null>(null);
	$effect.pre(() => {
		const d = scheduled?.scheduled_date ?? (s.date >= view.today ? s.date : view.today);
		const ev = scheduled?.evaluator_name ?? evaluatorDefault;
		untrack(() => {
			date = d;
			evaluator = ev;
		});
	});
	function schedule(e: SubmitEvent) {
		e.preventDefault();
		const err = learner.scheduleCheckpoint(data.cp.id, date, evaluator.trim());
		scheduleMsg = err ? { ok: false, text: err } : { ok: true, text: 'Saved. It’s on your dashboard.' };
	}

	// Log-result form: what the evaluator decided in the live session.
	let logging = $state(false);
	let results = $state<Record<string, { result: 'pass' | 'needs_work' | ''; notes: string }>>({});
	let resultDate = $state(todayISO());
	let resultNotes = $state('');
	let resultError = $state<string | null>(null);
	let resultMsg = $state<string | null>(null);
	function startLogging() {
		const last = Object.fromEntries((s.latest?.results ?? []).map((r) => [r.module_id, r.result]));
		results = Object.fromEntries(data.cp.modules.map((id) => [id, { result: last[id] === 'pass' ? 'pass' : '', notes: '' }]));
		resultDate = scheduled?.scheduled_date && scheduled.scheduled_date <= todayISO() ? scheduled.scheduled_date : todayISO();
		resultNotes = '';
		resultError = null;
		logging = true;
	}
	const decided = $derived(Object.values(results).filter((r) => r.result).length);
	const allPass = $derived(decided === data.cp.modules.length && Object.values(results).every((r) => r.result === 'pass'));
	function record(e: SubmitEvent) {
		e.preventDefault();
		resultError = learner.recordCheckpoint(data.cp.id, { date: resultDate, evaluator: scheduled?.evaluator_name ?? evaluatorDefault, notes: resultNotes, results });
		if (!resultError) {
			logging = false;
			resultMsg = allPass ? 'Logged. Checkpoint passed. 🎉' : `Logged. Coaching is open, with a ${data.cp.retake_window_days}-day retake window.`;
		}
	}
</script>

<svelte:head><title>{data.cp.title} · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Day {data.cp.day} · {data.cp.format === 'capstone' ? 'Capstone demo' : 'Live quiz'} with a {data.cp.evaluator_role}" title={data.cp.title} subtitle={data.cp.description}>
	<div class="mt-5 flex flex-wrap items-center gap-2">
		<CheckpointStatusBadge status={s.status} />
		<Badge tone="night"><Icon name="calendar" class="size-3.5" />Target {formatDate(s.date, true)}</Badge>
		{#if view.techEvaluator}<Badge tone="night"><Icon name="users" class="size-3.5" />{view.techEvaluator}</Badge>{/if}
	</div>
</PageHeader>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<div class="space-y-6">
		{#if resultMsg}<p class="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">{resultMsg}</p>{/if}

		{#if s.status === 'coaching' || s.status === 'retake_scheduled'}
			<section class="rounded-3xl border border-pitch-300 bg-gradient-to-br from-pitch-50 to-white p-6">
				<div class="flex items-center gap-3">
					<span class="grid size-10 place-items-center rounded-xl bg-pitch-400 text-night"><Icon name="target" /></span>
					<div>
						<h2 class="text-lg font-extrabold">Coaching and retake</h2>
						<p class="text-sm text-slate-ink">{s.retakeWindowEnd ? `Retake window closes ${formatDate(s.retakeWindowEnd, true)} (${relativeDays(s.retakeWindowEnd, view.today)}).` : 'Agree a retake date with your evaluator.'}</p>
					</div>
				</div>
				<p class="mt-4 text-sm font-semibold">Focus your coaching on:</p>
				<ul class="mt-2 flex flex-wrap gap-2">
					{#each s.coachingModules as id (id)}<li><a href="{base}/modules/{id}/" class="inline-flex items-center gap-1.5 rounded-full bg-pitch-400 px-3 py-1 text-sm font-semibold text-night hover:bg-pitch-300">{titles[id] ?? id}<Icon name="arrow-right" class="size-3.5" /></a></li>{/each}
				</ul>
			</section>
		{/if}

		{#if scheduled}
			<section class="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-sky-600 to-deep-400 p-6 text-white shadow-lg">
				<span class="grid size-12 place-items-center rounded-2xl bg-white/20"><Icon name="calendar" class="size-6" /></span>
				<div class="min-w-0 flex-1">
					<p class="eyebrow text-[10px] text-white/80">{scheduled.attempt_number > 1 ? `Retake ${scheduled.attempt_number - 1}` : 'Scheduled'}</p>
					<p class="text-lg font-extrabold">{formatDate(scheduled.scheduled_date, true)} · {relativeDays(scheduled.scheduled_date ?? view.today, view.today)}</p>
					<p class="text-sm text-white/80">Live with {scheduled.evaluator_name ?? 'your evaluator'}</p>
				</div>
				{#if !logging}<button class="btn bg-white text-night hover:bg-green-50" onclick={startLogging}><Icon name="clipboard" class="size-4" />Log the result</button>{/if}
			</section>
		{/if}

		{#if logging}
			<form onsubmit={record} class="card overflow-hidden">
				<div class="border-b border-fog/70 bg-gradient-to-r from-green-50 to-white p-6">
					<h2 class="text-lg font-extrabold">Log the result</h2>
					<p class="mt-1 text-sm text-slate-ink">Record what {scheduled?.evaluator_name ?? 'your evaluator'} decided for each module, and their feedback.</p>
					<label class="label mt-4" for="r-date">Session date</label>
					<input id="r-date" type="date" class="input max-w-xs" bind:value={resultDate} max={todayISO()} />
				</div>
				<ul class="divide-y divide-fog/70">
					{#each modules as m (m.id)}
						<li class="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
							<div>
								<p class="font-semibold">{m.title}</p>
								<input class="input mt-2" aria-label="Feedback on {m.title}" placeholder="Feedback on this module (optional)" bind:value={results[m.id].notes} />
							</div>
							<div class="grid grid-cols-2 gap-2 self-start" role="radiogroup" aria-label="Result for {m.title}">
								<label class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition {results[m.id].result === 'pass' ? 'border-green-500 bg-green-500 text-night' : 'border-fog hover:border-green-500'}">
									<input type="radio" class="sr-only" name="result_{m.id}" value="pass" bind:group={results[m.id].result} /><Icon name="check" class="size-4" strokeWidth={3} />Pass
								</label>
								<label class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold whitespace-nowrap transition {results[m.id].result === 'needs_work' ? 'border-pitch-500 bg-pitch-400 text-night' : 'border-fog hover:border-pitch-400'}">
									<input type="radio" class="sr-only" name="result_{m.id}" value="needs_work" bind:group={results[m.id].result} /><Icon name="alert" class="size-4" />Needs work
								</label>
							</div>
						</li>
					{/each}
				</ul>
				<div class="border-t border-fog/70 p-6">
					<label class="label" for="r-notes">Overall feedback</label>
					<textarea id="r-notes" rows="3" class="input" bind:value={resultNotes} placeholder="What your evaluator said overall."></textarea>
					{#if decided === data.cp.modules.length}
						<p class="mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold {allPass ? 'bg-green-50 text-green-800' : 'bg-pitch-50 text-pitch-800'}">
							<Icon name={allPass ? 'trophy' : 'target'} class="size-5" />
							{allPass ? 'Every module passed. This checkpoint will be marked passed.' : `Needs work on some modules. This opens coaching and a ${data.cp.retake_window_days}-day retake window.`}
						</p>
					{/if}
					{#if resultError}<p class="mt-3 text-sm font-medium text-red-700" role="alert">{resultError}</p>{/if}
					<div class="mt-4 flex gap-2">
						<button class="btn-primary" disabled={decided < data.cp.modules.length}><Icon name="check" class="size-4" strokeWidth={3} />Save result</button>
						<button type="button" class="btn-ghost" onclick={() => (logging = false)}>Cancel</button>
					</div>
				</div>
			</form>
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
				<p class="mt-2 text-sm text-slate-ink">No attempts yet. Schedule the session, then log the result and feedback here afterwards.</p>
			{/if}
		</section>
	</div>

	<aside class="space-y-6">
		{#if s.status !== 'passed'}
			<form onsubmit={schedule} class="card p-6">
				<h2 class="text-lg font-extrabold">{scheduled ? 'Reschedule' : s.status === 'coaching' ? 'Schedule your retake' : 'Schedule the session'}</h2>
				<p class="mt-1 text-sm text-slate-ink">Agree a date with your senior SE, then add it here.</p>
				<label class="label mt-4" for="date">Date</label>
				<input id="date" type="date" class="input" bind:value={date} required />
				<label class="label mt-3" for="evaluator">Evaluator</label>
				<input id="evaluator" class="input" bind:value={evaluator} placeholder="Senior SE's name" />
				{#if scheduleMsg}<p class="mt-3 text-sm font-semibold {scheduleMsg.ok ? 'text-green-700' : 'text-red-700'}" role={scheduleMsg.ok ? 'status' : 'alert'}>{scheduleMsg.text}</p>{/if}
				<button class="btn-dark mt-4 w-full"><Icon name="calendar" class="size-4" />{scheduled ? 'Update' : 'Schedule'}</button>
				{#if !scheduled && !logging}
					<button type="button" class="btn-ghost mt-2 w-full" onclick={startLogging}><Icon name="clipboard" class="size-4" />Already done? Log the result</button>
				{/if}
			</form>
		{/if}

		<section class="card p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-extrabold">Readiness</h2>
				{#if ready}<Badge tone="green">Ready</Badge>{:else}<Badge tone="amber">{s.missingProofs.length} to go</Badge>{/if}
			</div>
			<p class="mt-1 text-sm text-slate-ink">Have every exit proof in before the session.</p>
			<ul class="mt-4 space-y-3">
				{#each modules as m (m.id)}
					<li>
						<a href="{base}/modules/{m.id}/#exit-proof" class="flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-md {m.state.exitProofSubmittedAt ? 'border-green-200 bg-green-50' : 'border-fog bg-white'}">
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
