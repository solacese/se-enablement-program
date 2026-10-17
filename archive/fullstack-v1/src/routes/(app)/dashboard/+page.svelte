<script lang="ts">
	import { enhance } from '$app/forms';
	import DualTimeline from '$lib/components/DualTimeline.svelte';
	import FlagList from '$lib/components/ui/FlagList.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ProgressRing from '$lib/components/ui/ProgressRing.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate, relativeDays } from '$lib/dates';

	let { data } = $props();
	const v = $derived(data.view);
	const first = $derived(v.learner.name.split(' ')[0]);
	const greeting = (() => {
		const h = new Date().getHours();
		return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
	})();
	const kindStyle = {
		module: { icon: 'book', cls: 'bg-green-100 text-green-800' },
		checkpoint: { icon: 'flag', cls: 'bg-deep-100 text-deep' },
		pitch: { icon: 'mic', cls: 'bg-pitch-100 text-pitch-800' },
		task: { icon: 'alert', cls: 'bg-red-100 text-red-800' }
	};
	const pitchLabel = { not_started: 'Starts soon', in_progress: 'In progress', coaching: 'Coaching', retake: 'Retake scheduled', graduated: 'Graduated' };
</script>

<svelte:head><title>Dashboard · Solace SE Journey</title></svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden rounded-3xl bg-night p-6 text-white shadow-2xl shadow-night/20 sm:p-10">
	<div class="grid-bg absolute inset-0 opacity-70"></div>
	<div class="absolute -top-24 right-10 size-80 animate-float rounded-full bg-green-500/30 blur-3xl"></div>
	<div class="absolute -bottom-32 left-1/4 size-80 rounded-full bg-pitch-400/15 blur-3xl"></div>
	<div class="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
		<div>
			<p class="eyebrow text-green-400">
				{#if v.day < 1}Starts {formatDate(v.enrollment.start_date, true)}{:else if v.day > 90}Program complete window{:else}Day {v.day} of 90{data.block ? ` · Block ${data.block.number}: ${data.block.theme}` : ''}{/if}
			</p>
			<h1 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{greeting}, {first}.</h1>
			{#if v.currentModule}
				<p class="mt-3 max-w-xl text-lg text-white/70">
					You're on <span class="font-semibold text-white">{v.currentModule.title}</span>{#if data.next}, step {data.next.index} of {data.next.total}: <span class="text-green-300">{data.next.title}</span>{/if}.
				</p>
				<div class="mt-6 flex flex-wrap gap-3">
					<a href="/modules/{v.currentModule.id}{data.next ? `#step-${data.next.id}` : '#exit-proof'}" class="btn-primary rounded-full px-6 py-3">
						<Icon name="play" class="size-4" />
						{data.next ? 'Continue module' : 'Submit exit proof'}
					</a>
					<a href="/pitch" class="btn rounded-full px-6 py-3 text-white ring-1 ring-white/25 hover:bg-white/10">
						<Icon name="mic" class="size-4 text-pitch-300" />Pitch bootcamp
					</a>
				</div>
			{:else}
				<p class="mt-3 max-w-xl text-lg text-white/70">Everything on the technical path is done or waiting on a checkpoint. 🎉</p>
			{/if}
		</div>
		<div class="flex gap-4 sm:gap-6">
			<div class="flex flex-col items-center rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
				<ProgressRing value={v.progress.modulesComplete} max={v.progress.modulesTotal} size={108} label="Modules complete" track="rgba(255,255,255,.1)">
					<span><span class="block text-2xl font-extrabold">{v.progress.modulesComplete}<span class="text-sm text-white/50">/{v.progress.modulesTotal}</span></span><span class="text-[10px] font-semibold text-white/60 uppercase">modules</span></span>
				</ProgressRing>
				<span class="mt-2 text-xs font-semibold text-green-300">Technical path</span>
			</div>
			<div class="flex flex-col items-center rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
				<ProgressRing value={v.progress.pitchScore ?? 0} max={v.pitch.max} size={108} color="#FFB547" label="Latest pitch score" track="rgba(255,255,255,.1)">
					<span><span class="block text-2xl font-extrabold">{v.progress.pitchScore ?? '–'}<span class="text-sm text-white/50">/{v.pitch.max}</span></span><span class="text-[10px] font-semibold text-white/60 uppercase">pitch</span></span>
				</ProgressRing>
				<span class="mt-2 text-xs font-semibold text-pitch-300">{pitchLabel[v.pitch.status]}</span>
			</div>
		</div>
	</div>
</section>

{#if v.flags.length}
	<section class="mt-6" aria-label="Flags">
		<FlagList flags={v.flags} />
	</section>
{/if}

<div class="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
	<!-- Today / this week -->
	<section class="card p-6">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-extrabold">Today & the next two weeks</h2>
			<Badge tone="blue"><Icon name="calendar" class="size-3.5" />{formatDate(v.today, true)}</Badge>
		</div>
		{#if data.next && v.currentModule}
			<a href="/modules/{v.currentModule.id}#step-{data.next.id}" class="group mt-5 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-400 p-4 text-night shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5">
				<span class="grid size-12 shrink-0 place-items-center rounded-xl bg-night text-green-400"><Icon name={v.currentModule.icon} class="size-6" /></span>
				<span class="min-w-0 flex-1">
					<span class="eyebrow block text-[10px] text-night/70">Up next · {v.currentModule.title}</span>
					<span class="block truncate font-bold">Step {data.next.index}: {data.next.title}</span>
					{#if data.next.minutes}<span class="text-xs font-semibold text-night/70">About {data.next.minutes} min</span>{/if}
				</span>
				<Icon name="arrow-right" class="size-5 transition group-hover:translate-x-1" />
			</a>
		{/if}
		{#if data.agenda.length}
			<ol class="mt-5 divide-y divide-fog/70">
				{#each data.agenda as a (a.title + a.date)}
					{@const k = kindStyle[a.kind]}
					<li>
						<a href={a.href} class="flex items-center gap-4 py-3 hover:bg-mist/60">
							<span class="w-14 shrink-0 text-center">
								<span class="block text-[10px] font-bold text-slate-ink uppercase">{formatDate(a.date).split(' ')[0]}</span>
								<span class="block text-xl leading-none font-extrabold">{formatDate(a.date).split(' ')[1]}</span>
							</span>
							<span class="grid size-9 shrink-0 place-items-center rounded-lg {k.cls}"><Icon name={k.icon} class="size-[18px]" /></span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-semibold">{a.title}</span>
								<span class="block truncate text-xs text-slate-ink">{a.detail}</span>
							</span>
							{#if a.live}<Badge tone="sky">Live session</Badge>{/if}
							<span class="w-20 shrink-0 text-right text-xs font-semibold {a.date < v.today ? 'text-red-700' : 'text-slate-ink'}">{relativeDays(a.date, v.today)}</span>
						</a>
					</li>
				{/each}
			</ol>
		{:else}
			<div class="mt-5"><EmptyState icon="calendar" title="Nothing due in the next two weeks">Keep working through your current module.</EmptyState></div>
		{/if}
	</section>

	<div class="space-y-6">
		<!-- Track progress -->
		<section class="card p-6">
			<h2 class="text-lg font-extrabold">Progress</h2>
			<dl class="mt-4 space-y-4">
				<div>
					<div class="flex justify-between text-sm"><dt class="font-semibold">Steps checked off</dt><dd class="font-bold">{v.progress.stepsDone}/{v.progress.stepsTotal}</dd></div>
					<div class="mt-1.5"><ProgressBar value={v.progress.stepsDone} max={v.progress.stepsTotal} label="Steps checked off" /></div>
				</div>
				<div>
					<div class="flex justify-between text-sm"><dt class="font-semibold">Exit proofs submitted</dt><dd class="font-bold">{v.progress.proofsSubmitted}/{v.modules.length}</dd></div>
					<div class="mt-1.5"><ProgressBar value={v.progress.proofsSubmitted} max={v.modules.length} label="Exit proofs submitted" /></div>
				</div>
				<div>
					<div class="flex justify-between text-sm"><dt class="font-semibold">Checkpoints passed</dt><dd class="font-bold">{v.progress.checkpointsPassed}/{v.progress.checkpointsTotal}</dd></div>
					<div class="mt-1.5"><ProgressBar value={v.progress.checkpointsPassed} max={v.progress.checkpointsTotal} tone="blue" label="Checkpoints passed" /></div>
				</div>
				<div>
					<div class="flex justify-between text-sm"><dt class="font-semibold">Latest pitch score</dt><dd class="font-bold">{v.progress.pitchScore ?? '–'}/{v.pitch.max} <span class="font-medium text-slate-ink">· target {v.pitch.target}</span></dd></div>
					<div class="mt-1.5"><ProgressBar value={v.progress.pitchScore ?? 0} max={v.pitch.max} tone="amber" label="Latest pitch score" /></div>
				</div>
			</dl>
		</section>

		<!-- Setup tasks -->
		<section id="setup" class="card scroll-mt-24 p-6">
			<h2 class="text-lg font-extrabold">Setup tasks</h2>
			{#each v.tasks as t (t.id)}
				{@const states = data.taskStates[t.id]}
				{@const idx = states.indexOf(t.status)}
				{@const done = idx === states.length - 1}
				<div class="mt-4 rounded-2xl border p-4 {done ? 'border-green-200 bg-green-50' : idx === 0 ? 'border-red-200 bg-red-50' : 'border-pitch-300/60 bg-pitch-50'}">
					<div class="flex items-start gap-3">
						<span class="grid size-8 shrink-0 place-items-center rounded-full {done ? 'bg-green-500 text-night' : idx === 0 ? 'bg-red-600 text-white' : 'bg-pitch-400 text-night'}">
							<Icon name={done ? 'check' : idx === 0 ? 'alert' : 'clock'} class="size-4" strokeWidth={2.5} />
						</span>
						<div class="min-w-0 flex-1">
							<p class="font-semibold">{t.title}</p>
							<p class="mt-0.5 text-sm text-slate-ink">{t.description}</p>
							<ol class="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold" aria-label="Status">
								{#each states as s, i (s)}
									<li class="rounded-full px-2 py-0.5 capitalize {i <= idx ? 'bg-night text-white' : 'bg-white text-slate-ink ring-1 ring-fog'}">{s.replace('_', ' ')}</li>
									{#if i < states.length - 1}<Icon name="chevron-right" class="size-3 text-slate-ink" />{/if}
								{/each}
							</ol>
							{#if !done}
								<form method="POST" action="?/task" use:enhance class="mt-3">
									<input type="hidden" name="task" value={t.id} />
									<input type="hidden" name="status" value={states[idx + 1]} />
									<button class="btn-dark btn-sm">Mark as {states[idx + 1].replace('_', ' ')}</button>
								</form>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</section>
	</div>
</div>

<!-- Timeline -->
<section class="card mt-6 p-6">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h2 class="text-lg font-extrabold">Both tracks, one timeline</h2>
			<p class="text-sm text-slate-ink">
				Started {formatDate(v.enrollment.start_date, true)} · Pitch bootcamp {formatDate(v.pitch.startDate)}–{formatDate(v.pitch.endDate)} · Capstone {formatDate(v.checkpoints.at(-1)?.date)}
			</p>
		</div>
		<a href="/tracks/platform" class="text-sm font-semibold text-green-700 hover:underline">See the full path →</a>
	</div>
	<DualTimeline day={v.day} modules={v.modules} checkpoints={v.checkpoints} pitch={v.pitch} />
</section>
