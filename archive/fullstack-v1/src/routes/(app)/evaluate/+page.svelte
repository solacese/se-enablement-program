<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatusPill from '$lib/components/ui/StatusPill.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import { formatDate, relativeDays } from '$lib/dates';

	let { data } = $props();
	const pitchText = { not_started: 'Not started', in_progress: 'In progress', coaching: 'Coaching', retake: 'Retake scheduled', graduated: 'Graduated' };
	const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2);
</script>

<svelte:head><title>Evaluations · Solace SE Journey</title></svelte:head>

<PageHeader
	eyebrow={data.role === 'manager' ? 'All SEs' : 'Assigned to you'}
	title={data.role === 'manager' ? 'Evaluations' : 'My SEs'}
	subtitle="Review evidence before each session, run it with the guide, and record the result. Your feedback is visible to the SE."
/>

<div class="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
	<section aria-labelledby="ses">
		<h2 id="ses" class="sr-only">SEs</h2>
		{#if data.ses.length === 0}
			<EmptyState icon="users" title="No SEs assigned yet">A manager assigns evaluators when they enroll an SE.</EmptyState>
		{:else}
			<ul class="grid gap-4 md:grid-cols-2">
				{#each data.ses as s (s.eid)}
					<li>
						<a href="/evaluate/{s.eid}" class="card group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl">
							<div class="flex items-center gap-3">
								<span class="grid size-12 place-items-center rounded-full bg-gradient-to-br from-green-400 to-deep-400 font-bold text-night">{initials(s.name)}</span>
								<div class="min-w-0 flex-1">
									<p class="truncate font-bold group-hover:text-green-700">{s.name}</p>
									<p class="text-xs text-slate-ink">{s.day < 1 ? `Starts in ${1 - s.day} days` : `Day ${Math.min(s.day, 90)} of 90`}</p>
								</div>
								<StatusPill status={s.overall} />
							</div>
							{#if s.roles.length}<div class="mt-3 flex flex-wrap gap-1.5">{#each s.roles as r (r)}<Badge tone="blue">{r}</Badge>{/each}{#if s.inCoaching}<Badge tone="amber">In coaching</Badge>{/if}</div>{/if}
							<dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
								<div class="rounded-xl bg-mist p-3">
									<dt class="text-xs text-slate-ink">Next checkpoint</dt>
									<dd class="mt-0.5 font-semibold">{s.nextCp ? s.nextCp.title : 'All passed'}</dd>
									{#if s.nextCp}<dd class="text-xs text-slate-ink">{formatDate(s.nextCp.date)} · {s.nextCp.missing ? `${s.nextCp.missing} proofs missing` : 'evidence ready'}</dd>{/if}
								</div>
								<div class="rounded-xl bg-pitch-50 p-3">
									<dt class="text-xs text-pitch-800">Pitch bootcamp</dt>
									<dd class="mt-0.5 font-semibold">{pitchText[s.pitch.status]}</dd>
									<dd class="text-xs text-pitch-800">Latest {s.pitch.score ?? '–'}/{s.pitch.max}</dd>
								</div>
							</dl>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<aside class="card h-fit p-6">
		<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="calendar" class="size-5 text-green-700" />Upcoming sessions</h2>
		{#if data.sessions.length}
			<ol class="mt-4 space-y-2">
				{#each data.sessions as s (s.href + s.date + s.title)}
					<li>
						<a href={s.href} class="flex items-center gap-3 rounded-xl border border-fog/70 p-3 transition hover:border-deep-300 hover:shadow-md">
							<span class="grid size-10 shrink-0 place-items-center rounded-lg {s.kind === 'pitch' ? 'bg-pitch-100 text-pitch-800' : 'bg-deep-100 text-deep'}"><Icon name={s.kind === 'pitch' ? 'mic' : 'flag'} class="size-5" /></span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{s.learner}</span>
								<span class="block truncate text-xs text-slate-ink">{s.title}</span>
							</span>
							<span class="text-right text-xs font-semibold"><span class="block">{formatDate(s.date)}</span><span class="text-slate-ink">{data.today ? relativeDays(s.date, data.today) : ''}</span></span>
						</a>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="mt-3 text-sm text-slate-ink">Nothing scheduled. Open an SE to schedule a session.</p>
		{/if}
	</aside>
</div>
