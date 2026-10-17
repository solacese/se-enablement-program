<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate, relativeDays } from '$lib/dates';
	import type { PitchStatus } from '$lib/types';

	let { data } = $props();

	type Filter = 'all' | 'on_track' | 'behind' | 'blocked' | 'coaching' | 'not_started';
	let filter = $state<Filter>('all');

	const counts = $derived({
		all: data.rows.length,
		on_track: data.rows.filter((r) => r.overall === 'on_track').length,
		behind: data.rows.filter((r) => r.overall === 'behind').length,
		blocked: data.rows.filter((r) => r.overall === 'blocked').length,
		coaching: data.rows.filter((r) => r.inCoaching).length,
		not_started: data.rows.filter((r) => r.overall === 'not_started').length
	});

	const shown = $derived(
		data.rows.filter((r) =>
			filter === 'all' ? true : filter === 'coaching' ? r.inCoaching : r.overall === filter
		)
	);

	const tiles = $derived([
		{ key: 'all' as Filter, label: 'Enrolled', value: counts.all, icon: 'users', cls: 'from-deep to-night text-white', sub: 'text-white/70' },
		{ key: 'on_track' as Filter, label: 'On track', value: counts.on_track, icon: 'check', cls: 'from-green-400 to-green-600 text-night', sub: 'text-night/70' },
		{ key: 'behind' as Filter, label: 'Behind', value: counts.behind, icon: 'clock', cls: 'from-pitch-300 to-pitch-500 text-night', sub: 'text-night/70' },
		{ key: 'blocked' as Filter, label: 'Blocked', value: counts.blocked, icon: 'alert', cls: 'from-red-600 to-red-800 text-white', sub: 'text-white/90' },
		{ key: 'coaching' as Filter, label: 'In coaching', value: counts.coaching, icon: 'target', cls: 'from-sky-700 to-deep text-white', sub: 'text-white/90' }
	]);

	const chips: { key: Filter; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'on_track', label: 'On track' },
		{ key: 'behind', label: 'Behind' },
		{ key: 'blocked', label: 'Blocked' },
		{ key: 'coaching', label: 'In coaching' },
		{ key: 'not_started', label: 'Not started' }
	];

	const pitchMap: Record<PitchStatus, { tone: 'grey' | 'amber' | 'red' | 'green' | 'sky'; text: string }> = {
		not_started: { tone: 'grey', text: 'Not started' },
		in_progress: { tone: 'amber', text: 'In progress' },
		coaching: { tone: 'sky', text: 'Coaching' },
		retake: { tone: 'red', text: 'Retake' },
		graduated: { tone: 'green', text: 'Graduated' }
	};
</script>

<svelte:head><title>Team · Solace SE Journey</title></svelte:head>

<PageHeader
	eyebrow="Manager view"
	title="Your team"
	subtitle="Both tracks for every enrolled SE at a glance. Open an SE to assign a scenario, evaluators or a new start date."
>
	{#snippet actions()}
		<a href="/team/enroll" class="btn-primary rounded-full px-5 py-3"><Icon name="plus" class="size-4" />Enroll a new SE</a>
	{/snippet}
</PageHeader>

<!-- Summary tiles -->
<section class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Team summary">
	{#each tiles as t, i (t.key)}
		<button
			type="button"
			onclick={() => (filter = filter === t.key ? 'all' : t.key)}
			aria-pressed={filter === t.key}
			class="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left shadow-lg shadow-night/10 transition hover:-translate-y-0.5 {t.cls} {filter === t.key && t.key !== 'all' ? 'ring-4 ring-night/20' : ''} {i === 0 ? 'col-span-2 sm:col-span-1' : ''}"
		>
			<Icon name={t.icon} class="absolute -right-2 -bottom-2 size-16 opacity-15" />
			<span class="eyebrow block text-[10px] {t.sub}">{t.label}</span>
			<span class="mt-1 block text-3xl font-extrabold">{t.value}</span>
		</button>
	{/each}
</section>

<!-- Open retake windows and coaching -->
<section class="card mt-6 p-6" aria-labelledby="windows-h">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="windows-h" class="text-lg font-extrabold">Open retake windows and coaching</h2>
		<Badge tone={data.windows.length ? 'sky' : 'grey'}>{data.windows.length} open</Badge>
	</div>
	{#if data.windows.length}
		<ul class="mt-4 grid gap-3 md:grid-cols-2">
			{#each data.windows as w (w.enrollmentId + w.title)}
				<li class="min-w-0">
					<a
						href={w.href}
						class="group flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:flex-nowrap transition hover:shadow-md {w.track === 'pitch' ? 'border-pitch-300/60 bg-pitch-50' : 'border-deep-100 bg-deep-100/30'}"
					>
						<span class="grid size-10 shrink-0 place-items-center rounded-full bg-night text-sm font-bold text-white">{w.initials}</span>
						<span class="min-w-0 flex-1 basis-48">
							<span class="flex flex-wrap items-center gap-2">
								<span class="font-semibold">{w.name}</span>
								<Badge tone={w.track === 'pitch' ? 'amber' : 'blue'}>
									<Icon name={w.track === 'pitch' ? 'mic' : 'flag'} class="size-3" />{w.title}
								</Badge>
								<Badge tone={w.status === 'coaching' ? 'sky' : 'red'}>{w.status === 'coaching' ? 'Coaching' : 'Retake window'}</Badge>
							</span>
							<span class="mt-0.5 block text-xs text-slate-ink">{w.detail}</span>
						</span>
						<span class="ml-auto shrink-0 text-right text-xs">
							{#if w.windowEnd}
								<span class="block font-bold">Ends {formatDate(w.windowEnd)}</span>
								<span class="block {w.windowEnd < data.today ? 'font-semibold text-red-700' : 'text-slate-ink'}">{relativeDays(w.windowEnd, data.today)}</span>
							{:else}
								<span class="text-slate-ink">No end date</span>
							{/if}
						</span>
						<Icon name="chevron-right" class="size-4 shrink-0 text-slate-ink transition group-hover:translate-x-0.5" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-slate-ink">No one is in coaching or waiting on a retake right now.</p>
	{/if}
</section>

<!-- Roster -->
<section class="mt-8" aria-labelledby="roster-h">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 id="roster-h" class="text-xl font-extrabold">Roster</h2>
		<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
			{#each chips as c (c.key)}
				<button
					type="button"
					onclick={() => (filter = c.key)}
					aria-pressed={filter === c.key}
					class="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition {filter === c.key ? 'bg-night text-white ring-night' : 'bg-white text-night ring-fog hover:ring-deep-300'}"
				>
					{c.label} <span class="ml-1 {filter === c.key ? 'text-green-300' : 'text-slate-ink'}">{counts[c.key]}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if data.rows.length === 0}
		<div class="mt-4">
			<EmptyState icon="users" title="No one is enrolled yet">
				<a href="/team/enroll" class="font-semibold text-deep underline">Enroll your first SE</a> to start their 90 days.
			</EmptyState>
		</div>
	{:else if shown.length === 0}
		<div class="mt-4"><EmptyState icon="search" title="No SEs match this filter" /></div>
	{:else}
		<ul class="mt-4 grid gap-4 lg:grid-cols-2">
			{#each shown as r (r.id)}
				{@const ps = pitchMap[r.pitchStatus]}
				<li class="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
					<div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r {r.overall === 'blocked' ? 'from-red-500 to-red-700' : r.overall === 'behind' ? 'from-pitch-300 to-pitch-500' : 'from-green-400 to-deep-300'}"></div>
					<div class="flex items-start gap-4">
						<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-deep to-night text-base font-extrabold text-green-300 shadow-md">{r.initials}</span>
						<div class="min-w-0 flex-1">
							<a href="/team/{r.id}" class="block text-lg leading-tight font-extrabold after:absolute after:inset-0 hover:underline focus-visible:outline-none">
								{r.name}
							</a>
							<p class="truncate text-sm text-slate-ink">{r.title ?? 'Sales Engineer'} · {r.email}</p>
						</div>
						<div class="shrink-0 text-right">
							{#if r.day < 1}
								<span class="block text-xs font-semibold text-slate-ink">Starts</span>
								<span class="block font-extrabold">{formatDate(r.startDate)}</span>
							{:else}
								<span class="block text-2xl leading-none font-extrabold">{Math.min(r.day, 90)}<span class="text-xs font-semibold text-slate-ink">/90</span></span>
								<span class="text-[10px] font-bold tracking-wider text-slate-ink uppercase">day</span>
							{/if}
						</div>
					</div>

					<p class="mt-3 flex items-center gap-2 text-sm">
						<Icon name="book" class="size-4 shrink-0 text-green-700" />
						<span class="truncate">{r.currentModule ? `On ${r.currentModule}` : 'No module in progress'}</span>
					</p>

					<div class="mt-4 grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl bg-mist/70 p-3">
							<div class="flex items-center justify-between gap-2">
								<span class="eyebrow text-[10px] text-green-800">Technical</span>
								<StatusPill status={r.overall} />
							</div>
							<div class="mt-2"><ProgressBar value={r.modulesComplete} max={r.modulesTotal} label="Modules complete for {r.name}" /></div>
							<p class="mt-1.5 text-xs text-slate-ink">
								{r.modulesComplete}/{r.modulesTotal} modules · {r.checkpointsPassed}/{r.checkpointsTotal} checkpoints
							</p>
						</div>
						<div class="rounded-xl bg-pitch-50 p-3">
							<div class="flex items-center justify-between gap-2">
								<span class="eyebrow text-[10px] text-pitch-800">Pitch</span>
								<Badge tone={ps.tone}>{ps.text}</Badge>
							</div>
							<div class="mt-2"><ProgressBar value={r.pitchScore ?? 0} max={r.pitchMax} tone="amber" label="Latest pitch score for {r.name}" /></div>
							<p class="mt-1.5 text-xs text-slate-ink">
								{r.pitchScore != null ? `Latest ${r.pitchScore}/${r.pitchMax}` : 'Not scored yet'} · target {r.pitchTarget}
								{#if !r.scenario}<span class="font-semibold text-pitch-800"> · no scenario</span>{/if}
							</p>
						</div>
					</div>

					<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-fog/70 pt-3 text-xs text-slate-ink">
						<span class="inline-flex items-center gap-1 {r.blockers ? 'font-semibold text-red-700' : r.flags ? 'font-semibold text-pitch-800' : ''}">
							<Icon name="alert" class="size-3.5" />{r.flags} flag{r.flags === 1 ? '' : 's'}
						</span>
						{#if r.inCoaching}<span class="inline-flex items-center gap-1 font-semibold text-sky-900"><Icon name="target" class="size-3.5" />In coaching</span>{/if}
						<span class="inline-flex min-w-0 items-center gap-1"><Icon name="clipboard" class="size-3.5 shrink-0" /><span class="truncate">Tech: {r.techEvaluator ?? 'unassigned'}</span></span>
						<span class="inline-flex min-w-0 items-center gap-1"><Icon name="mic" class="size-3.5 shrink-0" /><span class="truncate">Pitch: {[r.pitchManager, r.pitchSales].filter(Boolean).join(' & ') || 'unassigned'}</span></span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
