<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatDate, formatRange, relativeDays } from '$lib/dates';

	let { data } = $props();
	const p = $derived(data.pitch);
	const s = $derived(data.scenario);
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
		{ href: '/pitch/research', title: 'Research & priority restatement', done: data.prep.research, icon: 'search' },
		{ href: '/pitch/discovery', title: 'Discovery questions', done: data.prep.discovery, icon: 'message', count: s ? `${s.discovery.length} question${s.discovery.length === 1 ? '' : 's'}` : null },
		{ href: '/pitch/plan', title: 'Pitch plan & objections', done: data.prep.plan, icon: 'notes', count: s ? `${s.pitch_plan.sections.length} section${s.pitch_plan.sections.length === 1 ? '' : 's'}` : null }
	]);
	const evaluators = $derived([
		{ who: data.pitchManager, role: 'Manager' },
		{ who: data.pitchSales, role: 'Sales' }
	]);
</script>

<svelte:head><title>Pitch bootcamp · Solace SE Journey</title></svelte:head>

<div class="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
	<div class="space-y-6">
		{#if s}
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
					<p class="mt-4 text-xs text-slate-ink">Assigned {formatDate(s.assigned_at, true)}</p>
				</div>
			</section>
		{:else}
			<section class="card p-6">
				<EmptyState icon="compass" title="No scenario assigned yet">
					Your manager assigns your vertical and contact before day {p.startDay}. You'll see the company and contact profile here, and can start your research straight away.
				</EmptyState>
			</section>
		{/if}

		<!-- Program components -->
		<section aria-labelledby="components-h">
			<h2 id="components-h" class="text-lg font-extrabold">What the bootcamp covers</h2>
			<div class="mt-3 grid gap-4 md:grid-cols-3">
				{#each data.content.components as c (c.id)}
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
				{#each data.content.evaluation_flow as f, i (f.title)}
					<li class="relative">
						<div class="flex items-center gap-3">
							<span class="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pitch-300 to-pitch-500 text-sm font-extrabold text-night shadow-md shadow-pitch-500/30">{i + 1}</span>
							{#if i < data.content.evaluation_flow.length - 1}<span class="hidden h-0.5 flex-1 bg-gradient-to-r from-pitch-300 to-transparent lg:block" aria-hidden="true"></span>{/if}
						</div>
						<p class="mt-3 font-bold">{f.title}</p>
						<p class="mt-1 text-sm text-slate-ink">{f.description}</p>
					</li>
				{/each}
			</ol>
			<p class="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-mist px-4 py-3 text-sm">
				<Icon name="route" class="size-4 text-pitch-700" />
				<span class="font-semibold">Cadence:</span>
				{#each data.content.stages as st, i (st.id)}
					<span>{st.title}</span>{#if i < data.content.stages.length - 1}<Icon name="arrow-right" class="size-3.5 text-slate-ink" />{/if}
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
							Session {formatDate(nextSession.session_date, true)} <span class="text-white/60">· {relativeDays(nextSession.session_date ?? data.today, data.today)}</span>
						</p>
					{/if}
				</div>
			{/if}
			{#if p.focusDimensions.length}
				<p class="mt-4 text-sm font-semibold">Coaching focus</p>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each p.focusDimensions as f (f)}
						<Badge tone="amber"><Icon name="target" class="size-3.5" />{data.content.rubric.dimensions.find((d) => d.id === f)?.title ?? f}</Badge>
					{/each}
				</div>
			{/if}
			<a href="/pitch/sessions" class="btn-pitch mt-5 w-full">See sessions & scorecard<Icon name="arrow-right" class="size-4" /></a>
		</section>

		<!-- Prep -->
		{#if s}
			<section class="card p-6" aria-labelledby="prep-h">
				<h2 id="prep-h" class="text-lg font-extrabold">Your prep</h2>
				<p class="mt-1 text-sm text-slate-ink">Your evaluators read this before each session.</p>
				<ul class="mt-4 space-y-2">
					{#each prepItems as it (it.href)}
						<li>
							<a href={it.href} class="group flex items-center gap-3 rounded-xl border border-fog/70 p-3 transition hover:border-pitch-300 hover:bg-pitch-50">
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
							{ev.who ? ev.who.name.split(' ').map((w) => w[0]).join('').slice(0, 2) : '?'}
						</span>
						<span class="min-w-0">
							<span class="block font-semibold">{ev.who?.name ?? 'Not assigned yet'}</span>
							<span class="block text-xs text-slate-ink">{ev.role}{ev.who?.title ? ` · ${ev.who.title}` : ''}</span>
						</span>
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>
