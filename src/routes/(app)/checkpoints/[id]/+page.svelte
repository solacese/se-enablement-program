<script lang="ts">
	import { base } from '$app/paths';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();
	let open = $state<string | null>(null);
</script>

<svelte:head><title>{data.cp.title} · Solace SE Journey</title></svelte:head>

<nav class="mb-4 text-sm"><a href="{base}/checkpoints/" class="font-semibold text-slate-ink hover:text-night">← Checkpoints</a></nav>

<PageHeader eyebrow="Day {data.cp.day} · {data.cp.format === 'capstone' ? 'Capstone demo' : 'Live quiz'} with a {data.cp.evaluator_role}" title={data.cp.title} subtitle={data.cp.description}>
	<div class="mt-5 flex flex-wrap items-center gap-2">
		<Badge tone="night"><Icon name="book" class="size-3.5" />{data.modules.length} modules</Badge>
		<Badge tone="night"><Icon name="clock" class="size-3.5" />{data.cp.retake_window_days}-day retake window</Badge>
	</div>
</PageHeader>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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

	<aside class="space-y-6">
		<section class="card p-6">
			<h2 class="text-lg font-extrabold">What you'll demonstrate</h2>
			<p class="mt-1 text-sm text-slate-ink">The exit proof from each module covered.</p>
			<ul class="mt-4 space-y-3">
				{#each data.modules as m (m.id)}
					<li>
						<a href="{base}/modules/{m.id}/" class="flex gap-3 rounded-xl border border-fog p-3 transition hover:border-green-300 hover:shadow-md">
							<span class="grid size-8 shrink-0 place-items-center rounded-full bg-green-500 text-night"><Icon name="target" class="size-4" /></span>
							<span class="min-w-0">
								<span class="block text-sm font-semibold">{m.title}</span>
								<span class="block text-xs text-slate-ink">{m.exitProof}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
		<section class="rounded-3xl border border-pitch-300 bg-pitch-50 p-6">
			<h2 class="font-extrabold">If it doesn't go to plan</h2>
			<p class="mt-1 text-sm text-slate-ink">You'll get coaching on the modules that fell short, then a {data.cp.retake_window_days}-day retake window for the checkpoint.</p>
		</section>
	</aside>
</div>
