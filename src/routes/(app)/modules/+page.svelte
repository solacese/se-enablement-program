<script lang="ts">
	import { base } from '$app/paths';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { orderedModules, program } from '$lib/content/program';

	const p = program();
	const all = orderedModules();
	const blocks = p.platform.blocks.map((b) => ({
		...b,
		checkpoint: p.checkpoints.find((c) => c.id === b.checkpoint)!,
		modules: b.modules.map((id) => all.find((m) => m.id === id)!)
	}));
	const blockGrad = ['from-green-400 to-green-600', 'from-teal-300 to-deep-300', 'from-deep-300 to-deep-400'];
	const weeks = (w: number[]) => (w.length > 1 ? `Weeks ${w[0]}–${w.at(-1)}` : `Week ${w[0]}`);
</script>

<svelte:head><title>Modules · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="The Solace Platform in 90 days" title="Modules" subtitle="Ten hands-on modules in three blocks. Each one ends with an exit proof you can show working." />

<div class="mt-8 space-y-12">
	{#each blocks as b, bi (b.id)}
		<section aria-labelledby="block-{b.number}">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div class="flex items-center gap-4">
					<span class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-xl font-extrabold text-night shadow-lg {blockGrad[bi % 3]}">{b.number}</span>
					<div>
						<p class="eyebrow text-[10px] text-slate-ink">Block {b.number} · Days {b.days[0]}–{b.days[1]}</p>
						<h2 id="block-{b.number}" class="text-2xl font-extrabold">{b.theme}</h2>
					</div>
				</div>
				<a href="{base}/checkpoints/{b.checkpoint.id}/" class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-fog hover:ring-deep-300">
					<Icon name={b.checkpoint.format === 'capstone' ? 'trophy' : 'flag'} class="size-4 text-deep" />Ends with the {b.checkpoint.title}
				</a>
			</div>
			<ul class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each b.modules as m (m.id)}
					<li>
						<a href="{base}/modules/{m.id}/" class="card group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl">
							<div class="flex items-start justify-between gap-3">
								<span class="grid size-11 place-items-center rounded-xl bg-night text-green-400"><Icon name={m.icon} class="size-5" /></span>
								{#if m.oem}<Badge tone="amber">Partner channel</Badge>{/if}
							</div>
							<p class="mt-4 text-xs font-semibold text-slate-ink">{weeks(m.weeks)} · {m.steps.length} steps{m.estimated_hours ? ` · about ${m.estimated_hours} hours` : ''}</p>
							<h3 class="mt-1 text-lg font-bold group-hover:text-green-700">{m.title}</h3>
							<p class="mt-1 line-clamp-3 text-sm text-slate-ink">{m.summary}</p>
							<div class="mt-auto pt-4">
								<p class="flex gap-2 rounded-xl bg-mist px-3 py-2 text-xs"><Icon name="target" class="size-4 shrink-0 text-green-700" /><span><span class="font-semibold">Exit proof:</span> {m.exit_proof}</span></p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
			{#if b.modules.some((m) => m.oem)}<p class="mt-4 flex items-start gap-2 text-sm text-slate-ink"><Icon name="info" class="mt-0.5 size-4 shrink-0" />Week {p.platform.oem.week}: {p.platform.oem.note}</p>{/if}
		</section>
	{/each}
</div>
