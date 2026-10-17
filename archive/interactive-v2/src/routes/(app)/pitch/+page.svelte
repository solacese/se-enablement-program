<script lang="ts">
	import { base } from '$app/paths';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { program } from '$lib/content/program';
	import { learner } from '$lib/data/learner.svelte';
	import { formatDate, formatRange, relativeDays } from '$lib/dates';
	import { prepProgress, saveScenarioDetails } from '$lib/pitch';
	import { buildView } from '$lib/progress';

	const content = program().pitch;
	const template = program().scenarioTemplate;
	const view = $derived(buildView(learner.state)!);
	const p = $derived(view.pitch);
	const s = $derived(learner.state.scenario);
	const prep = $derived(prepProgress(s));
	const currentStage = $derived(p.stages.find((x) => x.current) ?? null);
	const nextSession = $derived(p.sessions.find((x) => x.status === 'scheduled') ?? null);

	const statusInfo = $derived(
		{
			not_started: { tone: 'grey', text: 'Starts soon', detail: `The bootcamp starts on ${formatDate(p.startDate, true)} (day ${p.startDay}).` },
			in_progress: { tone: 'amber', text: 'In progress', detail: 'Keep your research, discovery plan and pitch plan up to date before each session.' },
			coaching: { tone: 'amber', text: 'Coaching', detail: p.retakeWindowEnd ? `Coaching on your weakest dimensions, then a retake by ${formatDate(p.retakeWindowEnd, true)}.` : 'Coaching on your weakest dimensions, then a retake.' },
			retake: { tone: 'amber', text: 'Retake scheduled', detail: p.retakeWindowEnd ? `Your retake window closes ${formatDate(p.retakeWindowEnd, true)}.` : 'Your retake is scheduled.' },
			graduated: { tone: 'green', text: 'Graduated', detail: `You scored ${p.target}/${p.max} or more on a graded eval. Nice work.` }
		}[p.status] as { tone: 'grey' | 'amber' | 'green'; text: string; detail: string }
	);

	const prepItems = $derived([
		{ href: '/pitch/research/', title: 'Research & priority restatement', done: prep.research, icon: 'search', count: null },
		{ href: '/pitch/discovery/', title: 'Discovery questions', done: prep.discovery, icon: 'message', count: s ? `${s.discovery.length} question${s.discovery.length === 1 ? '' : 's'}` : null },
		{ href: '/pitch/plan/', title: 'Pitch plan & objections', done: prep.plan, icon: 'notes', count: s ? `${s.pitch_plan.sections.length} section${s.pitch_plan.sections.length === 1 ? '' : 's'}` : null }
	]);
	const evaluators = $derived([
		{ name: view.pitchManager, role: 'Manager' },
		{ name: view.pitchSales, role: 'Sales' }
	]);
	const initialsOf = (name: string) => name.split(' ').map((w) => w[0]).filter((c) => c && /[A-Z]/i.test(c)).join('').slice(0, 2).toUpperCase();

	// Scenario form
	let editing = $state(false);
	let error = $state<string | null>(null);
	let saved = $state(false);
	const showForm = $derived(!s || editing);

	function submitScenario(e: SubmitEvent) {
		e.preventDefault();
		const f = new FormData(e.currentTarget as HTMLFormElement);
		const fields = Object.fromEntries(template.fields.map((x) => [x.id, String(f.get(x.id) ?? '')]));
		let err: string | null = null;
		learner.update((st) => {
			err = saveScenarioDetails(st, fields);
		});
		error = err;
		if (!err) {
			editing = false;
			saved = true;
		}
	}
</script>

<svelte:head><title>Pitch bootcamp · Solace SE Journey</title></svelte:head>

<div class="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
	<div class="space-y-6">
		{#if showForm}
			{@render scenarioForm()}
		{:else if s}
			<!-- Scenario card -->
			<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-50 via-white to-pitch-100 p-6 ring-1 ring-pitch-300/60 shadow-lg shadow-pitch-500/10 sm:p-8" aria-labelledby="scenario-h">
				<div class="absolute -top-16 -right-16 size-56 rounded-full bg-pitch-300/30 blur-3xl"></div>
				<div class="relative">
					<div class="flex flex-wrap items-center gap-2">
						<p class="eyebrow text-pitch-800">Your scenario</p>
						<Badge tone="amber"><Icon name="compass" class="size-3.5" />{s.vertical}</Badge>
					</div>
					<h2 id="scenario-h" class="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{s.company}</h2>
					{#if s.company_profile}<p class="mt-2 max-w-2xl text-slate-ink">{s.company_profile}</p>{/if}

					<div class="mt-6 rounded-2xl bg-white/80 p-5 ring-1 ring-pitch-300/40 backdrop-blur">
						<div class="flex items-start gap-4">
							<span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-night text-lg font-extrabold text-pitch-300" aria-hidden="true">
								{s.contact_name.split(' ').map((w) => w[0]).filter((c) => /[A-Z]/.test(c)).join('').slice(0, 2)}
							</span>
							<div class="min-w-0">
								<p class="text-lg font-bold">{s.contact_name}</p>
								{#if s.contact_title}<p class="text-sm font-semibold text-pitch-800">{s.contact_title}</p>{/if}
								{#if s.contact_profile}<p class="mt-2 text-sm text-night/80">{s.contact_profile}</p>{/if}
							</div>
						</div>
						{#if s.met_at}
							<p class="mt-4 flex items-center gap-2 border-t border-pitch-100 pt-3 text-sm text-slate-ink">
								<Icon name="users" class="size-4 text-pitch-700" />Where you met: <span class="font-semibold text-night">{s.met_at}</span>
							</p>
						{/if}
					</div>
					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<p class="text-xs text-slate-ink">
							Added {formatDate(s.assigned_at, true)}{#if s.updated_at.slice(0, 10) !== s.assigned_at.slice(0, 10)} · updated {formatDate(s.updated_at, true)}{/if}
							{#if saved}<span class="ml-2 inline-flex items-center gap-1 font-semibold text-green-700" role="status"><Icon name="check" class="size-3.5" />Saved</span>{/if}
						</p>
						<button type="button" class="btn-ghost btn-sm" onclick={() => { editing = true; saved = false; error = null; }}>
							<Icon name="edit" class="size-4" />Edit scenario
						</button>
					</div>
				</div>
			</section>
		{/if}

		<!-- Program components -->
		<section aria-labelledby="components-h">
			<h2 id="components-h" class="text-lg font-extrabold">What the bootcamp covers</h2>
			<div class="mt-3 grid gap-4 md:grid-cols-3">
				{#each content.components as c (c.id)}
					<article class="card relative overflow-hidden p-5">
						<span class="absolute -right-2 -bottom-6 text-8xl font-black text-pitch-100 select-none" aria-hidden="true">{c.number}</span>
						<div class="relative">
							<p class="eyebrow text-[10px] text-pitch-800">{c.focus}</p>
							<h3 class="mt-1 font-bold">{c.title}</h3>
							<p class="mt-2 text-sm text-slate-ink">{c.description}</p>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<!-- Evaluation flow -->
		<section class="card p-6" aria-labelledby="flow-h">
			<h2 id="flow-h" class="text-lg font-extrabold">How each session is evaluated</h2>
			<ol class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each content.evaluation_flow as f, i (f.title)}
					<li class="relative">
						<div class="flex items-center gap-3">
							<span class="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pitch-300 to-pitch-500 text-sm font-extrabold text-night shadow-md shadow-pitch-500/30">{i + 1}</span>
							{#if i < content.evaluation_flow.length - 1}<span class="hidden h-0.5 flex-1 bg-gradient-to-r from-pitch-300 to-transparent lg:block" aria-hidden="true"></span>{/if}
						</div>
						<p class="mt-3 font-bold">{f.title}</p>
						<p class="mt-1 text-sm text-slate-ink">{f.description}</p>
					</li>
				{/each}
			</ol>
			<p class="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-mist px-4 py-3 text-sm">
				<Icon name="route" class="size-4 text-pitch-700" />
				<span class="font-semibold">Cadence:</span>
				{#each content.stages as st, i (st.id)}
					<span>{st.title}</span>{#if i < content.stages.length - 1}<Icon name="arrow-right" class="size-3.5 text-slate-ink" />{/if}
				{/each}
			</p>
		</section>
	</div>

	<aside class="space-y-6">
		<!-- Status -->
		<section class="card p-6" aria-labelledby="status-h">
			<div class="flex items-center justify-between gap-3">
				<h2 id="status-h" class="text-lg font-extrabold">Where you are</h2>
				<Badge tone={statusInfo.tone}>{statusInfo.text}</Badge>
			</div>
			<p class="mt-2 text-sm text-slate-ink">{statusInfo.detail}</p>
			{#if currentStage}
				<div class="mt-4 rounded-2xl bg-night p-4 text-white">
					<p class="eyebrow text-[10px] text-pitch-300">Current stage</p>
					<p class="mt-1 text-xl font-extrabold">{currentStage.title}</p>
					<p class="text-sm text-white/70">{formatRange(currentStage.startDate, currentStage.endDate)}</p>
					{#if nextSession}
						<p class="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm">
							<Icon name="calendar" class="size-4 text-pitch-300" />
							Session {formatDate(nextSession.session_date, true)} <span class="text-white/60">· {relativeDays(nextSession.session_date ?? view.today, view.today)}</span>
						</p>
					{/if}
				</div>
			{/if}
			{#if p.focusDimensions.length}
				<p class="mt-4 text-sm font-semibold">Coaching focus</p>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each p.focusDimensions as f (f)}
						<Badge tone="amber"><Icon name="target" class="size-3.5" />{content.rubric.dimensions.find((d) => d.id === f)?.title ?? f}</Badge>
					{/each}
				</div>
			{/if}
			<a href="{base}/pitch/sessions/" class="btn-pitch mt-5 w-full">See sessions & scorecard<Icon name="arrow-right" class="size-4" /></a>
		</section>

		<!-- Prep -->
		{#if s}
			<section class="card p-6" aria-labelledby="prep-h">
				<h2 id="prep-h" class="text-lg font-extrabold">Your prep</h2>
				<p class="mt-1 text-sm text-slate-ink">Have it ready before each session. Your evaluators may ask to walk through it.</p>
				<ul class="mt-4 space-y-2">
					{#each prepItems as it (it.href)}
						<li>
							<a href="{base}{it.href}" class="group flex items-center gap-3 rounded-xl border border-fog/70 p-3 transition hover:border-pitch-300 hover:bg-pitch-50">
								<span class="grid size-9 shrink-0 place-items-center rounded-lg {it.done ? 'bg-green-100 text-green-800' : 'bg-pitch-100 text-pitch-800'}">
									<Icon name={it.done ? 'check' : it.icon} class="size-[18px]" />
								</span>
								<span class="min-w-0 flex-1">
									<span class="block font-semibold">{it.title}</span>
									<span class="block text-xs text-slate-ink">{it.done ? 'Ready' : 'Needs work'}{it.count ? ` · ${it.count}` : ''}</span>
								</span>
								<Icon name="chevron-right" class="size-4 text-slate-ink transition group-hover:translate-x-0.5" />
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Evaluators -->
		<section class="card p-6" aria-labelledby="eval-h">
			<h2 id="eval-h" class="text-lg font-extrabold">Your evaluators</h2>
			<ul class="mt-4 space-y-3">
				{#each evaluators as ev (ev.role)}
					<li class="flex items-center gap-3">
						<span class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-pitch-300 to-pitch-500 text-sm font-bold text-night" aria-hidden="true">
							{ev.name ? initialsOf(ev.name) : '?'}
						</span>
						<span class="min-w-0">
							<span class="block font-semibold">{ev.name ?? 'Not added yet'}</span>
							<span class="block text-xs text-slate-ink">{ev.role} evaluator</span>
						</span>
					</li>
				{/each}
			</ul>
			{#if !view.pitchManager || !view.pitchSales}
				<p class="mt-4 text-sm text-slate-ink">
					Ask your manager who will evaluate your pitch, then <a href="{base}/settings/" class="font-semibold text-pitch-800 underline">add their names in settings</a>.
				</p>
			{:else}
				<a href="{base}/settings/" class="mt-4 inline-block text-xs font-semibold text-slate-ink hover:text-night hover:underline">Change in settings</a>
			{/if}
		</section>
	</aside>
</div>

{#snippet scenarioForm()}
	<section class="card overflow-hidden" aria-labelledby="scenario-form-h">
		<div class="border-b border-pitch-300/50 bg-gradient-to-r from-pitch-50 to-white p-6 pb-5">
			{#if !s}
				<div class="flex items-start gap-4">
					<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-pitch-100 text-pitch-800"><Icon name="compass" class="size-6" /></span>
					<div>
						<h2 id="scenario-form-h" class="text-lg font-extrabold">Add the scenario your manager assigned</h2>
						<p class="mt-1 text-sm text-slate-ink">
							Before day {p.startDay}, your manager gives you a vertical and a real contact you met at an event. Enter it here to unlock research, discovery and your pitch plan.
						</p>
					</div>
				</div>
			{:else}
				<h2 id="scenario-form-h" class="flex items-center gap-2 text-lg font-extrabold"><Icon name="edit" class="size-5 text-pitch-700" />Edit your scenario</h2>
				<p class="hint">Your research, discovery questions and pitch plan stay as they are.</p>
			{/if}
		</div>
		<form class="space-y-4 p-6" onsubmit={submitScenario} oninput={() => (error = null)}>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each template.fields as f (f.id)}
					{@const val = ((s as Record<string, unknown> | null)?.[f.id] as string | null | undefined) ?? ''}
					<div class={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
						<label class="label" for="sc-{f.id}">{f.label}{#if f.required}<span class="text-red-700" aria-hidden="true"> *</span>{/if}</label>
						{#if f.type === 'select' || f.id === 'vertical'}
							<select class="input" id="sc-{f.id}" name={f.id} required={f.required} value={val}>
								<option value="">Choose…</option>
								{#each template.verticals as opt (opt)}<option value={opt}>{opt}</option>{/each}
							</select>
						{:else if f.type === 'textarea'}
							<textarea class="input min-h-24" id="sc-{f.id}" name={f.id} required={f.required} aria-describedby={f.hint ? `sc-h-${f.id}` : undefined}>{val}</textarea>
						{:else}
							<input class="input" id="sc-{f.id}" name={f.id} value={val} required={f.required} aria-describedby={f.hint ? `sc-h-${f.id}` : undefined} />
						{/if}
						{#if f.hint}<p id="sc-h-{f.id}" class="hint">{f.hint}</p>{/if}
					</div>
				{/each}
			</div>
			<p class="flex items-start gap-2 rounded-xl bg-mist px-3 py-2.5 text-xs text-slate-ink">
				<Icon name="lock" class="mt-px size-3.5 shrink-0" />Saved only in this browser. Nothing is sent anywhere.
			</p>
			<div class="flex flex-wrap items-center gap-3">
				<button class="btn-pitch"><Icon name="check" class="size-4" />{s ? 'Save scenario' : 'Add scenario'}</button>
				{#if s}<button type="button" class="btn-ghost" onclick={() => { editing = false; error = null; }}>Cancel</button>{/if}
				<span aria-live="polite" class="text-sm">{#if error}<span class="font-semibold text-red-700">{error}</span>{/if}</span>
			</div>
		</form>
	</section>
{/snippet}
