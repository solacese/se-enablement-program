<script lang="ts">
	import { base } from '$app/paths';
	import { provideSteps } from '$lib/components/content/steps.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let { data } = $props();
	const m = $derived(data.module);
	// <Step> components in the Markdown read the ordered steps to number themselves.
	provideSteps(() => data.module.steps);

	const weeks = $derived(m.weeks.length > 1 ? `Weeks ${m.weeks[0]}–${m.weeks.at(-1)}` : `Week ${m.weeks[0]}`);
	const totalMinutes = $derived(m.steps.reduce((n, s) => n + (s.minutes ?? 0), 0));
</script>

<svelte:head><title>{m.title} · Solace SE Journey</title></svelte:head>

<nav class="mb-4 flex items-center gap-2 text-sm text-slate-ink" aria-label="Breadcrumb">
	<a href="{base}/modules/" class="font-semibold hover:text-night">Modules</a>
	<Icon name="chevron-right" class="size-4" />
	<span>Block {data.block.number}: {data.block.theme}</span>
</nav>

<header class="relative overflow-hidden rounded-3xl bg-night px-6 py-8 text-white shadow-xl shadow-night/20 sm:px-10 sm:py-10">
	<div class="grid-bg absolute inset-0 opacity-60"></div>
	<div class="absolute -top-24 -right-10 size-80 animate-float rounded-full bg-green-500/30 blur-3xl"></div>
	<div class="relative flex max-w-3xl gap-5">
		<span class="hidden size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-night shadow-lg shadow-green-500/30 sm:grid">
			<Icon name={m.icon} class="size-8" />
		</span>
		<div>
			<p class="eyebrow text-green-400">Module {data.index} of {data.total} · {weeks}</p>
			<h1 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{m.title}</h1>
			<p class="mt-3 text-lg text-white/75">{m.summary}</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<Badge tone="night"><Icon name="clipboard" class="size-3.5" />{m.steps.length} steps</Badge>
				{#if m.estimated_hours}<Badge tone="night"><Icon name="clock" class="size-3.5" />About {m.estimated_hours} hours</Badge>{/if}
				{#if m.oem}<Badge tone="amber">Partner channel</Badge>{/if}
			</div>
		</div>
	</div>
</header>

<div class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
	<div class="min-w-0 space-y-10">
		<!-- 1. Overview -->
		<section aria-labelledby="overview">
			<h2 id="overview" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">1</span>Overview</h2>
			<div class="mt-5 grid gap-4 md:grid-cols-2">
				<div class="card p-5">
					<p class="eyebrow text-[10px] text-green-700">What you'll build</p>
					<p class="mt-2 text-night/85">{m.summary}</p>
				</div>
				<div class="card border-pitch-300/50 bg-gradient-to-br from-pitch-50 to-white p-5">
					<p class="eyebrow text-[10px] text-pitch-700">Why it matters with customers</p>
					<p class="mt-2 text-night/85">{m.why_it_matters}</p>
				</div>
				<div class="card flex items-center gap-4 p-5">
					<span class="grid size-11 place-items-center rounded-xl bg-deep-100 text-deep"><Icon name="clock" /></span>
					<div>
						<p class="eyebrow text-[10px] text-slate-ink">Estimated time</p>
						<p class="font-bold">{m.estimated_hours ? `About ${m.estimated_hours} hours` : '—'} <span class="font-medium text-slate-ink">· {weeks}</span></p>
						{#if totalMinutes}<p class="text-xs text-slate-ink">Steps add up to about {Math.round(totalMinutes / 60)} hours hands-on</p>{/if}
					</div>
				</div>
				<div class="card p-5">
					<p class="eyebrow text-[10px] text-slate-ink">Before you start</p>
					{#if data.prerequisites.length}
						<ul class="mt-2 space-y-1.5">
							{#each data.prerequisites as p (p.id)}
								<li class="flex items-center gap-2 text-sm">
									<Icon name="check" class="size-4 text-green-700" />
									{#if p.isModule}<a href="{base}/modules/{p.id}/" class="font-semibold hover:underline">{p.title}</a>{:else}<span class="font-semibold">{p.title}</span>{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2 text-sm font-semibold">Nothing. Start here.</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- 2. Steps (Markdown body) -->
		<section aria-labelledby="steps">
			<h2 id="steps" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">2</span>Steps</h2>
			<article class="prose mt-4 max-w-none prose-headings:text-night prose-a:text-green-700 prose-strong:text-night">
				<data.Body />
			</article>
		</section>

		<!-- 3. Exit proof -->
		<section id="exit-proof" class="scroll-mt-24" aria-labelledby="exit-proof-h">
			<h2 id="exit-proof-h" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">3</span>Exit proof</h2>
			<div class="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-night shadow-xl shadow-green-500/20">
				<div class="absolute -right-10 -bottom-16 size-48 rounded-full bg-white/20 blur-2xl"></div>
				<p class="eyebrow relative text-[11px] text-night/70">What you'll demonstrate</p>
				<p class="relative mt-2 text-xl font-extrabold">{m.exit_proof}</p>
				{#if data.checkpoint}<p class="relative mt-2 text-sm text-night/75">You'll show this working at the {data.checkpoint.title}.</p>{/if}
			</div>
		</section>

		<!-- 4. Checkpoint prep -->
		<section aria-labelledby="prep">
			<h2 id="prep" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">4</span>Checkpoint prep</h2>
			<div class="card mt-5 p-6">
				{#if data.checkpoint}
					<p class="text-sm text-slate-ink">
						This module is covered in the <a href="{base}/checkpoints/{data.checkpoint.id}/" class="font-semibold text-green-700 hover:underline">{data.checkpoint.title}</a> (day {data.checkpoint.day}). A senior SE may ask:
					</p>
				{/if}
				<ol class="mt-4 space-y-3">
					{#each [...m.prep_questions, ...(data.checkpoint?.general ?? [])] as q, i (q)}
						<li class="flex gap-3">
							<span class="grid size-7 shrink-0 place-items-center rounded-full bg-deep-100 text-xs font-bold text-deep">{i + 1}</span>
							<span class="pt-0.5">“{q}”</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<nav class="grid gap-3 sm:grid-cols-2" aria-label="Module navigation">
			{#if data.prev}
				<a href="{base}/modules/{data.prev.id}/" class="card flex items-center gap-3 p-4 hover:border-deep-300">
					<Icon name="chevron-left" class="size-5 text-slate-ink" />
					<span><span class="block text-xs text-slate-ink">Previous</span><span class="font-semibold">{data.prev.title}</span></span>
				</a>
			{:else}<span></span>{/if}
			{#if data.next}
				<a href="{base}/modules/{data.next.id}/" class="card flex items-center justify-end gap-3 p-4 text-right hover:border-deep-300">
					<span><span class="block text-xs text-slate-ink">Next</span><span class="font-semibold">{data.next.title}</span></span>
					<Icon name="chevron-right" class="size-5 text-slate-ink" />
				</a>
			{/if}
		</nav>
	</div>

	<aside class="hidden xl:block">
		<div class="sticky top-8 card p-5">
			<p class="eyebrow text-[10px] text-slate-ink">On this page</p>
			<ol class="mt-3 space-y-1">
				{#each m.steps as s, i (s.id)}
					<li>
						<a href="#step-{s.id}" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-mist">
							<span class="grid size-5 shrink-0 place-items-center rounded-full bg-deep-100 text-[10px] font-bold text-deep">{i + 1}</span>
							<span class="truncate font-medium">{s.title}</span>
						</a>
					</li>
				{/each}
				<li class="border-t border-fog/70 pt-1">
					<a href="#exit-proof" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50"><Icon name="target" class="size-5" />Exit proof</a>
				</li>
				<li>
					<a href="#prep" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-deep hover:bg-mist"><Icon name="flag" class="size-5" />Checkpoint prep</a>
				</li>
			</ol>
		</div>
	</aside>
</div>
