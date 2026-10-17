<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import DualTimeline from '$lib/components/DualTimeline.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FlagList from '$lib/components/ui/FlagList.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { dateForDay, formatDate, formatRange, relativeDays } from '$lib/dates';
	import type { CheckpointStatus, ModuleStatus, PitchStatus } from '$lib/types';

	let { data, form } = $props();
	const v = $derived(data.view);

	type Res = { form?: string; ok?: string; message?: string; errors?: Record<string, string>; values?: Record<string, string | null> };
	const res = $derived((form ?? {}) as Res);
	const okFor = (f: string) => (res.form === f ? res.ok : undefined);
	const errFor = (f: string) => (res.form === f ? res.message : undefined);
	const scenarioErr = $derived(res.form === 'scenario' ? (res.errors ?? {}) : {});
	const scenarioVals = $derived(
		res.form === 'scenario' && res.values ? res.values : ((data.scenario ?? {}) as Record<string, string | null>)
	);

	let pending = $state<string | null>(null);
	const submit =
		(name: string): SubmitFunction =>
		() => {
			pending = name;
			return async ({ update }) => {
				await update({ reset: false });
				pending = null;
			};
		};

	let startInput = $state<string | null>(null);
	const start = $derived(startInput ?? v.enrollment.start_date);
	const startChanged = $derived(start !== v.enrollment.start_date && /^\d{4}-\d{2}-\d{2}$/.test(start));

	const moduleStyle: Record<ModuleStatus, { tone: 'grey' | 'blue' | 'amber' | 'green'; text: string; icon: string }> = {
		locked: { tone: 'grey', text: 'Locked', icon: 'lock' },
		available: { tone: 'blue', text: 'Available', icon: 'play' },
		in_progress: { tone: 'amber', text: 'In progress', icon: 'clock' },
		complete: { tone: 'green', text: 'Complete', icon: 'check' }
	};
	const cpStyle: Record<CheckpointStatus, { tone: 'grey' | 'blue' | 'green' | 'sky' | 'red'; text: string }> = {
		upcoming: { tone: 'grey', text: 'Upcoming' },
		scheduled: { tone: 'blue', text: 'Scheduled' },
		passed: { tone: 'green', text: 'Passed' },
		coaching: { tone: 'sky', text: 'Coaching' },
		retake_scheduled: { tone: 'red', text: 'Retake scheduled' }
	};
	const pitchStyle: Record<PitchStatus, { tone: 'grey' | 'amber' | 'sky' | 'red' | 'green'; text: string }> = {
		not_started: { tone: 'grey', text: 'Not started' },
		in_progress: { tone: 'amber', text: 'In progress' },
		coaching: { tone: 'sky', text: 'Coaching' },
		retake: { tone: 'red', text: 'Retake' },
		graduated: { tone: 'green', text: 'Graduated' }
	};
	const dimTitle = (id: string) => data.rubric.find((d) => d.id === id)?.title ?? id;
	const moduleTitle = (id: string) => v.modules.find((m) => m.id === id)?.title ?? id;
</script>

<svelte:head><title>{v.learner.name} · Team · Solace SE Journey</title></svelte:head>

<a href="/team" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-deep hover:underline">
	<Icon name="chevron-right" class="size-4 rotate-180" />Team
</a>

<PageHeader
	eyebrow={v.day < 1 ? `Starts ${formatDate(v.enrollment.start_date, true)}` : v.day > 90 ? 'Past day 90' : `Day ${v.day} of 90`}
	title={v.learner.name}
	subtitle="{v.learner.title ?? 'Sales Engineer'} · {v.learner.email}"
>
	<div class="mt-5 flex flex-wrap items-center gap-2">
		<span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Technical <StatusPill status={v.overall} /></span>
		<span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Pitch <Badge tone={pitchStyle[v.pitch.status].tone}>{pitchStyle[v.pitch.status].text}</Badge></span>
		{#if v.inCoaching}<Badge tone="sky"><Icon name="target" class="size-3" />In coaching</Badge>{/if}
		{#if v.enrollment.gating_override}<Badge tone="amber"><Icon name="lock" class="size-3" />Gating override on</Badge>{/if}
	</div>
	{#snippet actions()}
		<a href="/evaluate/{v.enrollment.id}/pitch" class="btn-pitch rounded-full"><Icon name="mic" class="size-4" />Pitch sessions</a>
	{/snippet}
</PageHeader>

<!-- Quick stats -->
<section class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Progress">
	{#each [
		{ label: 'Modules complete', value: `${v.progress.modulesComplete}/${v.progress.modulesTotal}`, icon: 'book', cls: 'text-green-700 bg-green-50' },
		{ label: 'Exit proofs', value: `${v.progress.proofsSubmitted}/${v.modules.length}`, icon: 'upload', cls: 'text-green-700 bg-green-50' },
		{ label: 'Checkpoints passed', value: `${v.progress.checkpointsPassed}/${v.progress.checkpointsTotal}`, icon: 'flag', cls: 'text-deep bg-deep-100/60' },
		{ label: 'Latest pitch score', value: `${v.progress.pitchScore ?? '–'}/${v.pitch.max}`, icon: 'mic', cls: 'text-pitch-700 bg-pitch-50' }
	] as s (s.label)}
		<div class="card flex items-center gap-3 p-4">
			<span class="grid size-10 shrink-0 place-items-center rounded-xl {s.cls}"><Icon name={s.icon} class="size-5" /></span>
			<span class="min-w-0">
				<span class="block text-xl leading-tight font-extrabold">{s.value}</span>
				<span class="block text-xs leading-tight text-slate-ink">{s.label}</span>
			</span>
		</div>
	{/each}
</section>

{#if v.flags.length}
	<section class="mt-6" aria-label="Flags">
		<h2 class="mb-2 text-sm font-bold text-slate-ink">Flags ({v.flags.length})</h2>
		<FlagList flags={v.flags} />
	</section>
{/if}

<section class="card mt-6 p-4 sm:p-6" aria-label="Timeline">
	<DualTimeline day={v.day} modules={v.modules} checkpoints={v.checkpoints} pitch={v.pitch} linkModules={false} />
</section>

<div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
	<div class="min-w-0 space-y-6">
		<!-- Modules -->
		<section class="card p-6" aria-labelledby="mods-h">
			<div class="flex items-center justify-between gap-2">
				<h2 id="mods-h" class="text-lg font-extrabold">Modules</h2>
				{#if v.currentModule}<span class="truncate text-xs text-slate-ink">Current: <span class="font-semibold text-night">{v.currentModule.title}</span></span>{/if}
			</div>
			<ul class="mt-4 divide-y divide-fog/70">
				{#each v.modules as m (m.id)}
					{@const st = moduleStyle[m.status]}
					<li class="flex items-center gap-3 py-3">
						<span class="grid size-9 shrink-0 place-items-center rounded-lg {m.status === 'complete' ? 'bg-green-500 text-night' : m.status === 'locked' ? 'bg-mist text-slate-ink' : 'bg-deep-100 text-deep'}">
							<Icon name={m.icon} class="size-[18px]" />
						</span>
						<span class="min-w-0 flex-1">
							<span class="flex flex-wrap items-center gap-x-2">
								<span class="truncate font-semibold">{m.title}</span>
								{#if m.oem}<span class="text-[10px] font-bold tracking-wider text-slate-ink uppercase">{m.isPrimaryOem ? 'Primary OEM' : 'OEM · self-paced'}</span>{/if}
							</span>
							<span class="block text-xs text-slate-ink">
								Block {m.block} · {formatRange(m.startDate, m.endDate)} · {m.stepsDone}/{m.stepsTotal} steps · {m.evidenceCount} evidence
								{#if m.exitProofSubmittedAt}· proof {formatDate(m.exitProofSubmittedAt)}{/if}
							</span>
						</span>
						{#if m.behind}<Badge tone="amber">Behind</Badge>{/if}
						<Badge tone={st.tone}><Icon name={st.icon} class="size-3" />{st.text}</Badge>
					</li>
				{/each}
			</ul>
		</section>

		<!-- Checkpoints -->
		<section class="card p-6" aria-labelledby="cps-h">
			<h2 id="cps-h" class="text-lg font-extrabold">Technical checkpoints</h2>
			<ul class="mt-4 space-y-3">
				{#each v.checkpoints as c (c.id)}
					{@const st = cpStyle[c.status]}
					<li class="rounded-xl border border-fog/70 p-4">
						<div class="flex flex-wrap items-center gap-2">
							<span class="grid size-9 shrink-0 place-items-center rounded-lg bg-deep text-xs font-extrabold text-white">D{c.day}</span>
							<span class="min-w-0 flex-1">
								<span class="block font-semibold">{c.title}</span>
								<span class="block text-xs text-slate-ink">{formatDate(c.date, true)} · {c.attempts.length} attempt{c.attempts.length === 1 ? '' : 's'}{c.latest?.evaluator_name ? ` · ${c.latest.evaluator_name}` : ''}</span>
							</span>
							{#if c.overdue}<Badge tone="red">Overdue</Badge>{/if}
							<Badge tone={st.tone}>{st.text}</Badge>
							<a href="/evaluate/{v.enrollment.id}/checkpoint/{c.id}" class="btn-ghost btn-sm">Open<Icon name="chevron-right" class="size-3.5" /></a>
						</div>
						{#if c.missingProofs.length}
							<p class="mt-2 text-xs text-pitch-800"><Icon name="alert" class="inline size-3.5" /> Missing exit proofs: {c.missingProofs.map(moduleTitle).join(', ')}</p>
						{/if}
						{#if c.coachingModules.length}
							<p class="mt-1 text-xs text-sky-900">Coaching on {c.coachingModules.map(moduleTitle).join(', ')}{c.retakeWindowEnd ? ` · retake window ends ${formatDate(c.retakeWindowEnd)}` : ''}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<!-- Pitch -->
		<section class="card overflow-hidden" aria-labelledby="pitch-h">
			<div class="bg-gradient-to-r from-pitch-100 to-pitch-50 p-6">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h2 id="pitch-h" class="flex items-center gap-2 text-lg font-extrabold"><Icon name="mic" class="size-5 text-pitch-700" />Pitch bootcamp</h2>
					<Badge tone={pitchStyle[v.pitch.status].tone}>{pitchStyle[v.pitch.status].text}</Badge>
				</div>
				<p class="mt-1 text-sm text-slate-ink">{formatRange(v.pitch.startDate, v.pitch.endDate)} · target {v.pitch.target}/{v.pitch.max}</p>
			</div>
			<div class="p-6">
				<div class="flex items-center gap-4">
					<span class="text-4xl font-extrabold">{v.pitch.latestScore ?? '–'}<span class="text-base font-semibold text-slate-ink">/{v.pitch.max}</span></span>
					<div class="flex-1"><ProgressBar value={v.pitch.latestScore ?? 0} max={v.pitch.max} tone="amber" label="Latest pitch score" /></div>
				</div>
				{#if v.pitch.scored.length}
					<ol class="mt-4 flex flex-wrap gap-2" aria-label="Score trend">
						{#each v.pitch.scored as s (s.id)}
							<li class="rounded-lg bg-mist px-2.5 py-1 text-xs"><span class="font-semibold capitalize">{s.stage === 'retake' ? `Retake ${s.attempt_number}` : s.stage}</span> · {s.total ?? '–'}</li>
						{/each}
					</ol>
				{/if}
				{#if v.pitch.focusDimensions.length}
					<p class="mt-3 text-sm"><span class="font-semibold">Coaching focus:</span> {v.pitch.focusDimensions.map(dimTitle).join(', ')}{v.pitch.retakeWindowEnd ? ` · retake window ends ${formatDate(v.pitch.retakeWindowEnd)}` : ''}</p>
				{/if}
				<div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
					{#if data.scenario}
						<Badge tone="green"><Icon name="check" class="size-3" />Scenario: {data.scenario.company}</Badge>
					{:else}
						<Badge tone="amber"><Icon name="alert" class="size-3" />No scenario yet</Badge>
					{/if}
					<a href="/evaluate/{v.enrollment.id}/pitch" class="font-semibold text-pitch-800 hover:underline">Open pitch sessions →</a>
				</div>
			</div>
		</section>
	</div>

	<!-- Management -->
	<div class="min-w-0 space-y-6">
		<!-- Evaluators -->
		<form method="POST" action="?/evaluators" use:enhance={submit('evaluators')} class="card p-6">
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="clipboard" class="size-5 text-green-700" />Evaluators</h2>
			<div class="mt-4 space-y-4">
				{@render picker('tech', 'Technical evaluator', data.evaluators.tech, v.enrollment.tech_evaluator_id)}
				{@render picker('manager', 'Pitch evaluator (manager)', data.evaluators.managers, v.enrollment.pitch_manager_id)}
				{@render picker('sales', 'Pitch evaluator (sales)', data.evaluators.sales, v.enrollment.pitch_sales_id)}
			</div>
			{@render footer('evaluators', 'Save evaluators')}
		</form>

		<!-- Scenario -->
		<form method="POST" action="?/scenario" use:enhance={submit('scenario')} class="card overflow-hidden" novalidate>
			<div class="border-b border-pitch-300/50 bg-gradient-to-r from-pitch-50 to-white p-6 pb-4">
				<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="target" class="size-5 text-pitch-700" />Pitch scenario</h2>
				<p class="hint">
					{#if data.scenario}Assigned {formatDate(data.scenario.assigned_at)}. Editing these fields keeps the SE’s research, discovery and pitch plan.{:else}The SE sees this on their scenario card. Enter contact details here, never in the repo.{/if}
				</p>
			</div>
			<div class="space-y-4 p-6">
				{#each data.template.fields as f (f.id)}
					{@const val = scenarioVals[f.id] ?? ''}
					<div>
						<label class="label" for="sc-{f.id}">{f.label}{#if f.required}<span class="text-red-700" aria-hidden="true"> *</span>{/if}</label>
						{#if f.type === 'select' || f.id === 'vertical'}
							<select class="input" id="sc-{f.id}" name={f.id} required={f.required} aria-invalid={!!scenarioErr[f.id]}>
								<option value="" selected={!val}>Choose…</option>
								{#each data.template.verticals as opt (opt)}
									<option value={opt} selected={val === opt}>{opt}</option>
								{/each}
							</select>
						{:else if f.type === 'textarea'}
							<textarea class="input min-h-24" id="sc-{f.id}" name={f.id} required={f.required} aria-invalid={!!scenarioErr[f.id]}>{val}</textarea>
						{:else}
							<input class="input" id="sc-{f.id}" name={f.id} value={val} required={f.required} aria-invalid={!!scenarioErr[f.id]} />
						{/if}
						{#if f.hint}<p class="hint">{f.hint}</p>{/if}
						{#if scenarioErr[f.id]}<p class="mt-1 text-xs font-semibold text-red-700">{scenarioErr[f.id]}</p>{/if}
					</div>
				{/each}
				{@render footer('scenario', data.scenario ? 'Update scenario' : 'Assign scenario', 'pitch')}
			</div>
		</form>

		<!-- Primary OEM -->
		<form method="POST" action="?/oem" use:enhance={submit('oem')} class="card p-6">
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="puzzle" class="size-5 text-green-700" />Primary OEM module</h2>
			<p class="hint">The SE’s primary OEM is part of the path. The other stays self-paced.</p>
			<div class="mt-4 space-y-2" role="radiogroup" aria-label="Primary OEM module">
				{#each data.oems as o (o.id)}
					<label class="flex cursor-pointer items-center gap-3 rounded-xl border border-fog p-3 text-sm font-semibold transition has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
						<input type="radio" name="primary_oem" value={o.id} checked={(v.enrollment.primary_oem ?? data.oems[0]?.id) === o.id} class="accent-green-600" />
						{o.title}
					</label>
				{/each}
			</div>
			{@render footer('oem', 'Save OEM choice')}
		</form>

		<!-- Start date -->
		<form method="POST" action="?/start" use:enhance={submit('start')} class="card p-6">
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="calendar" class="size-5 text-green-700" />Start date</h2>
			<p class="hint">Every date on both tracks derives from this. Recorded sessions and results stay as they are.</p>
			<div class="mt-4">
				<label class="label" for="start_date">Day 1</label>
				<input class="input" id="start_date" name="start_date" type="date" value={start} oninput={(e) => (startInput = e.currentTarget.value)} />
			</div>
			<ul class="mt-4 space-y-1.5 text-sm">
				{#each data.milestones as m (m.label)}
					{@const next = startChanged ? dateForDay(start, m.day) : m.date}
					<li class="flex items-center justify-between gap-3">
						<span class="text-slate-ink">{m.label}</span>
						<span class="font-semibold">
							{#if startChanged}<s class="mr-1 font-normal text-slate-ink">{formatDate(m.date)}</s>{/if}{formatDate(next)}
						</span>
					</li>
				{/each}
			</ul>
			{@render footer('start', 'Save start date')}
		</form>

		<!-- Gating override -->
		<form method="POST" action="?/gating" use:enhance={submit('gating')} class="card p-6">
			<div class="flex items-start gap-3">
				<span class="grid size-10 shrink-0 place-items-center rounded-xl {v.enrollment.gating_override ? 'bg-pitch-100 text-pitch-700' : 'bg-mist text-slate-ink'}"><Icon name="lock" class="size-5" /></span>
				<div class="min-w-0 flex-1">
					<h2 class="text-lg font-extrabold">Module gating override</h2>
					<p class="mt-1 text-sm text-slate-ink">
						Modules unlock in order within a block: each exit proof must be submitted before the next module starts.
						Turn this on to let {v.learner.name.split(' ')[0]} start any module now, for example when they already know a topic or are waiting on hardware.
					</p>
				</div>
			</div>
			<input type="hidden" name="override" value={v.enrollment.gating_override ? '0' : '1'} />
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<span class="text-sm font-semibold">Currently {v.enrollment.gating_override ? 'on' : 'off'}</span>
				<button class={v.enrollment.gating_override ? 'btn-ghost' : 'btn-dark'} disabled={pending === 'gating'} aria-pressed={!!v.enrollment.gating_override}>
					{v.enrollment.gating_override ? 'Turn override off' : 'Turn override on'}
				</button>
				{@render status('gating')}
			</div>
		</form>

		{#if data.windows.length}
			<section class="card p-6" aria-labelledby="win-h">
				<h2 id="win-h" class="text-lg font-extrabold">Open windows</h2>
				<ul class="mt-3 space-y-2 text-sm">
					{#each data.windows as w (w.title)}
						<li><a href={w.href} class="flex justify-between gap-2 hover:underline"><span>{w.title} · {w.status === 'coaching' ? 'coaching' : 'retake'}</span><span class="text-slate-ink">{w.windowEnd ? `ends ${formatDate(w.windowEnd)} (${relativeDays(w.windowEnd, v.today)})` : ''}</span></a></li>
					{/each}
				</ul>
			</section>
		{:else if v.checkpoints.length === 0}
			<EmptyState title="No checkpoints configured" />
		{/if}
	</div>
</div>

{#snippet picker(name: string, label: string, people: { id: string; name: string }[], current: string | null)}
	<div>
		<label class="label" for="ev-{name}">{label}</label>
		<select class="input" id="ev-{name}" {name}>
			<option value="" selected={!current}>Unassigned</option>
			{#each people as p (p.id)}
				<option value={p.id} selected={current === p.id}>{p.name}</option>
			{/each}
		</select>
	</div>
{/snippet}

{#snippet status(name: string)}
	{#if okFor(name)}
		<p class="flex items-center gap-1.5 text-sm font-semibold text-green-700" role="status"><Icon name="check" class="size-4" />{okFor(name)}</p>
	{:else if errFor(name)}
		<p class="flex items-center gap-1.5 text-sm font-semibold text-red-700" role="alert"><Icon name="alert" class="size-4" />{errFor(name)}</p>
	{:else if name === 'scenario' && Object.keys(scenarioErr).length}
		<p class="flex items-center gap-1.5 text-sm font-semibold text-red-700" role="alert"><Icon name="alert" class="size-4" />Fill in the required fields.</p>
	{/if}
{/snippet}

{#snippet footer(name: string, label: string, tone: 'dark' | 'pitch' = 'dark')}
	<div class="mt-5 flex flex-wrap items-center gap-3">
		<button class={tone === 'pitch' ? 'btn-pitch' : 'btn-dark'} disabled={pending === name}>{pending === name ? 'Saving…' : label}</button>
		{@render status(name)}
	</div>
{/snippet}
