<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { formatDate, relativeDays } from '$lib/dates';
	import type { PitchSession } from '$lib/types';

	let { data, form } = $props();
	const p = $derived(data.pitch);
	const s = $derived(data.scenario);
	const rubric = $derived(data.content.rubric);
	const dims = $derived(rubric.dimensions);
	const scaleKeys = $derived(Object.keys(rubric.scale).map(Number).sort((a, b) => a - b));
	const dimTitle = (id: string) => dims.find((d) => d.id === id)?.title ?? id;

	const stageName = (st: { id: string; title: string; sessions: PitchSession[] }) =>
		st.id === 'retake_coaching' && st.sessions[0] ? `Retake coaching #${st.sessions[0].attempt_number - 1}` : st.title;
	const titles = $derived(new Map(p.stages.flatMap((st) => st.sessions.map((x) => [x.id, stageName(st)] as const))));
	const titleFor = (x: PitchSession) => titles.get(x.id) ?? x.stage;
	const SCORED = ['baseline', 'practice', 'graded', 'retake'];
	const isEval = (x: { stage: string }) => x.stage === 'graded' || x.stage === 'retake';

	const scheduled = $derived(p.sessions.filter((x) => x.status === 'scheduled'));
	let pickedId = $state<string | null>(null);
	const active = $derived(scheduled.find((x) => x.id === pickedId) ?? scheduled[0] ?? null);
	const activeScored = $derived(!!active && SCORED.includes(active.stage));

	let scores = $state<Record<string, number>>({});
	let busy = $state(false);
	const total = $derived(dims.reduce((n, d) => n + (scores[d.id] ?? 0), 0));
	const complete = $derived(dims.every((d) => scores[d.id]));
	const lowest = $derived(
		complete
			? dims
					.map((d, i) => ({ id: d.id, n: scores[d.id], i }))
					.sort((a, b) => a.n - b.n || a.i - b.i)
					.slice(0, data.content.retake.coaching_focus_count)
					.map((d) => d.id)
			: []
	);

	function pick(id: string) {
		pickedId = id;
		scores = {};
	}

	// Schedule form defaults
	let stage = $state('');
	const stageOpt = $derived(data.schedulable.find((o) => o.stage === stage) ?? data.schedulable[0] ?? null);
	const plannedDate = $derived.by(() => {
		if (!stageOpt) return data.today;
		const planned = p.stages.find((x) => x.id === stageOpt.stage && !x.sessions.length)?.startDate;
		return planned && planned >= data.today ? planned : data.today;
	});

	// Only the record form is cleared on success; the schedule form keeps its JS-set defaults.
	const submit = (clear = false) => () => {
		busy = true;
		return async ({ update, result }: { update: (o?: { reset?: boolean }) => Promise<void>; result: { type: string } }) => {
			await update({ reset: clear && result.type === 'success' });
			if (result.type === 'success') scores = {};
			busy = false;
		};
	};

	const CLOSED = /^\s*(do|does|is|are|can|will|have|did)\b/i;
	const statusText = { not_started: 'Not started', in_progress: 'In progress', coaching: 'Coaching', retake: 'Retake scheduled', graduated: 'Graduated' };
	const segTone = (n: number) => (n <= 2 ? 'peer-checked:bg-red-600 peer-checked:text-white' : n === 3 ? 'peer-checked:bg-pitch-400 peer-checked:text-night' : 'peer-checked:bg-green-500 peer-checked:text-night');
</script>

<svelte:head><title>Pitch evaluation · {data.learner.name}</title></svelte:head>

<PageHeader
	eyebrow="Pitch evaluation"
	title={data.learner.name}
	subtitle={s ? `${s.vertical} · ${s.company} · ${s.contact_name}` : 'No scenario assigned yet'}
	tone="amber"
>
	{#snippet actions()}
		<a href="/evaluate" class="btn rounded-full text-white ring-1 ring-white/25 hover:bg-white/10"><Icon name="chevron-left" class="size-4" />All SEs</a>
		<div class="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
			<span class="text-xs font-semibold text-white/60">{statusText[p.status]}</span>
			<span class="text-2xl font-extrabold">{p.latestScore ?? '–'}<span class="text-sm text-white/50">/{p.max}</span></span>
		</div>
	{/snippet}
</PageHeader>

{#if form?.message}
	<div
		class="mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm font-semibold {form.ok ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}"
		role="status"
	>
		<Icon name={form.ok ? 'check' : 'alert'} class="size-5 shrink-0" />{form.message}
	</div>
{/if}

<!-- Pipeline -->
<section class="card mt-6 p-5" aria-labelledby="pipe-h">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="pipe-h" class="text-lg font-extrabold">Stage pipeline</h2>
		{#if p.retakeWindowEnd}<Badge tone="amber"><Icon name="calendar" class="size-3.5" />Retake window ends {formatDate(p.retakeWindowEnd)}</Badge>{/if}
	</div>
	<ol class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
		{#each p.stages as st, i (st.id + i)}
			{@const last = st.sessions.at(-1)}
			<li class="rounded-2xl p-3 {st.done ? 'bg-night text-white' : st.current ? 'bg-pitch-50 ring-2 ring-pitch-400' : 'bg-mist'}">
				<p class="flex items-center gap-1.5 text-xs font-bold {st.done ? 'text-pitch-300' : 'text-slate-ink'}">
					{#if st.done}<Icon name="check" class="size-3.5" strokeWidth={3} />{/if}{st.scored ? 'Scored' : 'Coaching'}
				</p>
				<p class="mt-0.5 font-bold">{stageName(st)}</p>
				<p class="text-xs {st.done ? 'text-white/60' : 'text-slate-ink'}">
					{last ? `${last.status === 'scheduled' ? 'Scheduled' : 'Held'} ${formatDate(last.session_date)}` : `Planned ${formatDate(st.startDate)}`}
				</p>
				{#if last?.total != null}
					<p class="mt-1 text-lg font-extrabold">{last.total}<span class="text-xs opacity-60">/{p.max}</span>
						{#if isEval(last)}<span class="ml-1 text-xs font-bold {last.total >= p.target ? 'text-green-400' : 'text-pitch-300'}">{last.total >= p.target ? 'Pass' : 'Below'}</span>{/if}
					</p>
				{/if}
			</li>
		{/each}
	</ol>
</section>

<div class="mt-6 grid gap-6 xl:grid-cols-[1fr_28rem]">
	<!-- Prep (read-only) -->
	<div class="space-y-6">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-extrabold">Before the session: {data.learner.name.split(' ')[0]}'s prep</h2>
			<div class="flex flex-wrap gap-1.5">
				<Badge tone={data.prep.research ? 'green' : 'grey'}>Research</Badge>
				<Badge tone={data.prep.discovery ? 'green' : 'grey'}>Discovery</Badge>
				<Badge tone={data.prep.plan ? 'green' : 'grey'}>Plan</Badge>
			</div>
		</div>

		{#if !s}
			<EmptyState icon="compass" title="No scenario assigned yet">Assign a vertical and contact so the SE can start researching.</EmptyState>
		{:else}
			<section class="rounded-3xl bg-gradient-to-br from-pitch-50 via-white to-pitch-100 p-6 ring-1 ring-pitch-300/60" aria-label="Scenario">
				<div class="flex flex-wrap items-center gap-2"><p class="eyebrow text-[10px] text-pitch-800">Scenario</p><Badge tone="amber">{s.vertical}</Badge></div>
				<h3 class="mt-2 text-xl font-extrabold">{s.company}</h3>
				{#if s.company_profile}<p class="mt-1 text-sm text-slate-ink">{s.company_profile}</p>{/if}
				<div class="mt-4 rounded-2xl bg-white/80 p-4 ring-1 ring-pitch-300/40">
					<p class="font-bold">{s.contact_name}{#if s.contact_title}<span class="font-semibold text-pitch-800"> · {s.contact_title}</span>{/if}</p>
					{#if s.contact_profile}<p class="mt-1 text-sm">{s.contact_profile}</p>{/if}
					{#if s.met_at}<p class="mt-2 text-xs text-slate-ink">Met at {s.met_at}</p>{/if}
				</div>
			</section>

			<section class="rounded-2xl bg-night p-5 text-white" aria-labelledby="restate-h">
				<p id="restate-h" class="eyebrow text-[10px] text-pitch-300">Priority restatement</p>
				{#if s.priority_restatement}
					<blockquote class="mt-2 text-lg leading-relaxed font-semibold">“{s.priority_restatement}”</blockquote>
				{:else}
					<p class="mt-2 text-sm text-white/60">Not written yet.</p>
				{/if}
			</section>

			<section class="card p-5" aria-labelledby="research-h">
				<h3 id="research-h" class="text-lg font-extrabold">Research</h3>
				<dl class="mt-3 divide-y divide-fog/70">
					{#each data.content.research_prompts as rp (rp.id)}
						<div class="py-3">
							<dt class="text-xs font-bold text-pitch-800 uppercase">{rp.title}</dt>
							<dd class="mt-1 text-sm whitespace-pre-line">{s.research[rp.id]?.trim() || '—'}</dd>
						</div>
					{/each}
				</dl>
			</section>

			<section class="card p-5" aria-labelledby="disc-h">
				<div class="flex items-center justify-between gap-2">
					<h3 id="disc-h" class="text-lg font-extrabold">Discovery plan</h3>
					<Badge tone="grey">{s.discovery.length} question{s.discovery.length === 1 ? '' : 's'}</Badge>
				</div>
				{#if s.discovery.length}
					<ol class="mt-3 space-y-2">
						{#each s.discovery as q, i (i)}
							<li class="flex gap-3 rounded-xl bg-mist p-3 text-sm">
								<span class="font-bold text-slate-ink">{i + 1}.</span>
								<div class="min-w-0 flex-1">
									<p class="font-medium">{q.question}</p>
									<p class="mt-1 flex flex-wrap gap-1.5">
										{#if q.priority}<Badge tone="amber"><Icon name="target" class="size-3" />{q.priority}</Badge>{:else}<Badge tone="grey">No priority</Badge>{/if}
										{#if CLOSED.test(q.question)}<Badge tone="red">Looks closed</Badge>{/if}
									</p>
								</div>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="mt-2 text-sm text-slate-ink">No discovery questions yet.</p>
				{/if}
			</section>

			<section class="card p-5" aria-labelledby="plan-h">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 id="plan-h" class="text-lg font-extrabold">Pitch plan</h3>
					<a href={data.content.deck.url} target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-pitch-800 hover:underline">
						Open deck on Solace Hub<Icon name="external" class="ml-1 inline size-3.5" /><span class="sr-only">(opens in a new tab)</span>
					</a>
				</div>
				<h4 class="mt-4 text-xs font-bold text-slate-ink uppercase">Deck sections</h4>
				{#if s.pitch_plan.sections.length}
					<ul class="mt-2 space-y-2">
						{#each s.pitch_plan.sections as sec (sec.name)}
							<li class="rounded-xl border border-pitch-300/60 bg-pitch-50 p-3 text-sm">
								<p class="font-bold">{sec.name}</p>
								<p class="mt-0.5 text-night/80">{sec.reason || 'No reason given.'}</p>
							</li>
						{/each}
					</ul>
				{:else}<p class="mt-1 text-sm text-slate-ink">None chosen yet.</p>{/if}

				<h4 class="mt-5 text-xs font-bold text-slate-ink uppercase">Prepared objection responses</h4>
				{#if s.pitch_plan.objections.length}
					<ul class="mt-2 space-y-2">
						{#each s.pitch_plan.objections as o, i (i)}
							<li class="rounded-xl bg-mist p-3 text-sm">
								<p class="font-semibold">“{o.objection}”</p>
								<p class="mt-1 text-night/80">{o.response || 'No response yet.'}</p>
							</li>
						{/each}
					</ul>
				{:else}<p class="mt-1 text-sm text-slate-ink">None prepared yet.</p>{/if}

				<h4 class="mt-5 text-xs font-bold text-slate-ink uppercase">Intended next step</h4>
				<p class="mt-1 text-sm">{s.pitch_plan.next_step || '—'}</p>
			</section>
		{/if}
	</div>

	<!-- Evaluator actions -->
	<div class="space-y-6">
		<!-- Record -->
		<section class="card overflow-hidden" aria-labelledby="record-h">
			<div class="bg-gradient-to-r from-pitch-300 to-pitch-400 px-5 py-4 text-night">
				<h2 id="record-h" class="text-lg font-extrabold">Record a session</h2>
				<p class="text-sm text-night/75">Feedback is visible to the SE. Observations are shown on their scorecard too.</p>
			</div>
			{#if !active}
				<div class="p-5"><EmptyState icon="calendar" title="No scheduled sessions">Schedule a session below, then record it here.</EmptyState></div>
			{:else}
				<form method="POST" action="?/record" use:enhance={submit(true)} class="space-y-5 p-5">
					{#if scheduled.length > 1}
						<fieldset>
							<legend class="label">Session</legend>
							<div class="flex flex-wrap gap-2">
								{#each scheduled as x (x.id)}
									<button type="button" onclick={() => pick(x.id)} aria-pressed={active.id === x.id} class="btn-sm btn {active.id === x.id ? 'bg-night text-white' : 'bg-mist text-night hover:bg-fog/60'}">
										{titleFor(x)} · {formatDate(x.session_date)}
									</button>
								{/each}
							</div>
						</fieldset>
					{/if}
					<input type="hidden" name="session" value={active.id} />
					<div class="flex items-center gap-3 rounded-xl bg-mist p-3">
						<span class="grid size-10 place-items-center rounded-lg bg-night text-pitch-300"><Icon name={activeScored ? 'clipboard' : 'message'} class="size-5" /></span>
						<div class="min-w-0 flex-1">
							<p class="font-bold">{titleFor(active)}{isEval(active) ? ` · attempt ${active.attempt_number}` : ''}</p>
							<p class="text-xs text-slate-ink">{formatDate(active.session_date, true)} · {relativeDays(active.session_date ?? data.today, data.today)} · {[active.manager_name, active.sales_name].filter(Boolean).join(' & ')}</p>
						</div>
					</div>

					{#if (active.stage === 'retake' || active.stage === 'retake_coaching') && p.focusDimensions.length}
						<p class="flex flex-wrap items-center gap-1.5 text-xs font-semibold">Coaching focus: {#each p.focusDimensions as f (f)}<Badge tone="amber">{dimTitle(f)}</Badge>{/each}</p>
					{/if}

					{#if activeScored}
						{#key active.id}
							{#each dims as d (d.id)}
								<fieldset>
									<legend class="font-bold">
										{d.title}
										{#if p.focusDimensions.includes(d.id) && active.stage === 'retake'}<span class="ml-1"><Badge tone="amber">Focus</Badge></span>{/if}
									</legend>
									<p class="hint -mt-0.5 mb-2">Proficient: {d.proficient}</p>
									<div class="grid grid-cols-5 gap-1 rounded-xl bg-mist p-1">
										{#each scaleKeys as n (n)}
											<label class="relative cursor-pointer" title={rubric.scale[n]}>
												<input type="radio" name="score_{d.id}" value={n} class="peer sr-only" bind:group={scores[d.id]} required />
												<span class="flex flex-col items-center rounded-lg px-1 py-1.5 text-center transition peer-focus-visible:ring-2 peer-focus-visible:ring-pitch-500 hover:bg-white {segTone(n)}">
													<span class="text-base font-extrabold">{n}</span>
													<span class="text-[10px] leading-tight font-semibold">{rubric.scale[n]}</span>
												</span>
											</label>
										{/each}
									</div>
								</fieldset>
							{/each}
						{/key}

						<div class="flex items-center justify-between gap-3 rounded-2xl p-4 {!complete ? 'bg-mist' : !isEval(active) ? 'bg-deep-100/60' : total >= p.target ? 'bg-green-50 ring-1 ring-green-200' : 'bg-red-50 ring-1 ring-red-200'}" aria-live="polite">
							<div>
								<p class="text-xs font-semibold text-slate-ink">Total</p>
								<p class="text-3xl font-extrabold">{total}<span class="text-base text-slate-ink">/{p.max}</span></p>
							</div>
							<div class="text-right text-sm">
								{#if !complete}
									<span class="text-slate-ink">Score all {dims.length} dimensions</span>
								{:else if isEval(active)}
									{#if total >= p.target}
										<Badge tone="green"><Icon name="trophy" class="size-3.5" />Pass · graduates</Badge>
									{:else}
										<Badge tone="red">Below {p.target}</Badge>
										<p class="mt-1 text-xs text-red-800">Opens coaching on {lowest.map(dimTitle).join(' and ')}, retake within {data.content.retake.coaching_days + data.content.retake.window_days} days.</p>
									{/if}
								{:else}
									<span class="text-slate-ink">Target {p.target} applies to graded evals</span>
								{/if}
							</div>
						</div>
					{/if}

					<div>
						<label for="feedback" class="label">Feedback for the SE</label>
						<textarea id="feedback" name="feedback" rows="3" class="input" required placeholder="What went well, and the one thing to change next time."></textarea>
					</div>
					<div>
						<label for="observations" class="label">Observations <span class="font-normal text-slate-ink">(optional)</span></label>
						<textarea id="observations" name="observations" rows="3" class="input" placeholder="What you saw during discovery, the pitch and objection handling."></textarea>
					</div>
					<button class="btn-pitch w-full" disabled={busy || (activeScored && !complete)}>
						<Icon name="check" class="size-4" />{activeScored ? 'Record scores' : 'Record coaching session'}
					</button>
				</form>

				<form method="POST" action="?/reschedule" use:enhance={submit()} class="flex flex-wrap items-end gap-2 border-t border-fog/70 bg-mist/50 p-5">
					<input type="hidden" name="session" value={active.id} />
					<div class="flex-1">
						<label for="move_date" class="label text-xs">Move this session</label>
						<input id="move_date" name="date" type="date" class="input" value={active.session_date ?? ''} required />
					</div>
					<button class="btn-ghost" disabled={busy}>Move</button>
				</form>
			{/if}
		</section>

		<!-- Schedule -->
		<section class="card p-5" aria-labelledby="sched-h">
			<h2 id="sched-h" class="text-lg font-extrabold">Schedule a session</h2>
			{#if p.passed}
				<p class="mt-2 text-sm text-slate-ink">{data.learner.name.split(' ')[0]} has graduated the bootcamp. No more sessions needed.</p>
			{:else if !data.schedulable.length}
				<p class="mt-2 text-sm text-slate-ink">Every stage is scheduled. Record the next session to open the following one.</p>
			{:else}
				<form method="POST" action="?/schedule" use:enhance={submit()} class="mt-4 space-y-4">
					<div>
						<label for="stage" class="label">Stage</label>
						<select id="stage" name="stage" class="input" value={stageOpt?.stage} onchange={(e) => (stage = e.currentTarget.value)}>
							{#each data.schedulable as o (o.stage + o.attempt)}<option value={o.stage}>{o.title}</option>{/each}
						</select>
						{#if stageOpt?.stage === 'retake_coaching' || stageOpt?.stage === 'retake'}
							<p class="hint">Retake round {stageOpt.attempt - 1}{p.retakeWindowEnd ? `. Window ends ${formatDate(p.retakeWindowEnd, true)}.` : '.'}</p>
						{/if}
					</div>
					<div>
						<label for="date" class="label">Date</label>
						{#key plannedDate}<input id="date" name="date" type="date" class="input" value={plannedDate} max={stageOpt?.stage === 'retake' ? (p.retakeWindowEnd ?? undefined) : undefined} required />{/key}
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						<div>
							<label for="manager" class="label">Manager</label>
							<select id="manager" name="manager" class="input" value={data.enrollment.pitch_manager_id ?? ''}>
								<option value="">None</option>
								{#each data.evaluators.managers as m (m.id)}<option value={m.id}>{m.name}</option>{/each}
							</select>
						</div>
						<div>
							<label for="sales" class="label">Sales</label>
							<select id="sales" name="sales" class="input" value={data.enrollment.pitch_sales_id ?? ''}>
								<option value="">None</option>
								{#each data.evaluators.sales as m (m.id)}<option value={m.id}>{m.name}</option>{/each}
							</select>
						</div>
					</div>
					<button class="btn-dark w-full" disabled={busy}><Icon name="calendar" class="size-4" />Schedule</button>
				</form>
			{/if}
		</section>

		<!-- History -->
		<section class="card p-5" aria-labelledby="hist-h">
			<h2 id="hist-h" class="text-lg font-extrabold">All attempts</h2>
			<ul class="mt-3 divide-y divide-fog/70">
				{#each p.sessions as x (x.id)}
					<li class="py-3 text-sm">
						<div class="flex items-center gap-3">
							<span class="min-w-0 flex-1">
								<span class="block font-semibold">{titleFor(x)}</span>
								<span class="block text-xs text-slate-ink">{formatDate(x.session_date, true)} · {[x.manager_name, x.sales_name].filter(Boolean).join(' & ')}</span>
							</span>
							{#if x.status === 'scheduled'}<Badge tone="sky">Scheduled</Badge>
							{:else if x.total != null}
								<span class="font-extrabold">{x.total}/{p.max}</span>
								{#if isEval(x)}{#if x.total >= p.target}<Badge tone="green">Pass</Badge>{:else}<Badge tone="red">Below</Badge>{/if}{/if}
							{:else}<Badge tone="night">Done</Badge>{/if}
						</div>
						{#if x.scores}
							<p class="mt-1.5 flex flex-wrap gap-1.5">
								{#each dims as d (d.id)}<span class="rounded-md bg-mist px-1.5 py-0.5 text-[11px] font-semibold">{d.title}: {x.scores[d.id] ?? '–'}</span>{/each}
							</p>
						{/if}
						{#if x.feedback}<p class="mt-1.5 text-xs text-slate-ink">{x.feedback}</p>{/if}
					</li>
				{:else}
					<li class="py-3 text-sm text-slate-ink">No sessions yet.</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
