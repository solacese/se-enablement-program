<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { formatRange } from '$lib/dates';

	let { data } = $props();
	const blockGrad = ['from-green-400 to-green-600', 'from-teal-300 to-deep-300', 'from-deep-300 to-deep-400'];
	const weeks = (w: number[]) => (w.length > 1 ? `Weeks ${w[0]}–${w.at(-1)}` : `Week ${w[0]}`);
	const cpBadge = { passed: ['green', 'Passed'], coaching: ['amber', 'Coaching'], retake_scheduled: ['amber', 'Retake scheduled'], scheduled: ['sky', 'Scheduled'], upcoming: ['grey', 'Upcoming'] } as const;
</script>

<svelte:head><title>Modules · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="The Solace Platform in 90 days" title="Modules" subtitle="Ten hands-on modules in three blocks. Each one ends with an exit proof you can show working." />

<div class="mt-8 space-y-12">
	{#each data.blocks as b, bi (b.number)}
		<section aria-labelledby="block-{b.number}">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div class="flex items-center gap-4">
					<span class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-xl font-extrabold text-night shadow-lg {blockGrad[bi % 3]}">{b.number}</span>
					<div>
						<p class="eyebrow text-[10px] text-slate-ink">Block {b.number} · Days {b.days[0]}–{b.days[1]}</p>
						<h2 id="block-{b.number}" class="text-2xl font-extrabold">{b.theme}</h2>
					</div>
				</div>
				<a href="/checkpoints/{b.checkpointId}" class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-fog hover:ring-deep-300">
					<Icon name="flag" class="size-4 text-deep" />Ends with the {b.checkpoint}
					{#if b.checkpointStatus}{@const [tone, text] = cpBadge[b.checkpointStatus]}<Badge {tone}>{text}</Badge>{/if}
				</a>
			</div>
			<ul class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each b.modules as m (m.id)}
					{@const s = m.state}
					<li>
						<a href="/modules/{m.id}" class="card group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl {s?.status === 'complete' ? 'border-green-300' : ''} {s?.status === 'locked' ? 'opacity-75' : ''}">
							<div class="flex items-start justify-between gap-3">
								<span class="grid size-11 place-items-center rounded-xl {s?.status === 'complete' ? 'bg-green-500 text-night' : s?.status === 'locked' ? 'bg-mist text-slate-ink' : 'bg-night text-green-400'}">
									<Icon name={s?.status === 'complete' ? 'check' : s?.status === 'locked' ? 'lock' : m.icon} class="size-5" strokeWidth={s?.status === 'complete' ? 3 : 2} />
								</span>
								<div class="flex flex-wrap justify-end gap-1.5">
									{#if s?.isPrimaryOem}<Badge tone="amber">Primary OEM</Badge>{/if}
									{#if s?.selfPaced}<Badge tone="grey">Self-paced</Badge>{/if}
									{#if s?.behind}<Badge tone="amber">Behind</Badge>{/if}
									{#if s?.status === 'in_progress'}<Badge tone="sky">In progress</Badge>{/if}
									{#if s?.status === 'available'}<Badge tone="blue">Ready</Badge>{/if}
								</div>
							</div>
							<p class="mt-4 text-xs font-semibold text-slate-ink">{weeks(m.weeks)}{s ? ` · ${formatRange(s.startDate, s.endDate)}` : ''}</p>
							<h3 class="mt-1 text-lg font-bold group-hover:text-green-700">{m.title}</h3>
							<p class="mt-1 line-clamp-3 text-sm text-slate-ink">{m.summary}</p>
							<p class="mt-4 flex gap-2 rounded-xl bg-mist px-3 py-2 text-xs"><Icon name="target" class="size-4 shrink-0 text-green-700" /><span><span class="font-semibold">Exit proof:</span> {m.exitProof}</span></p>
							<div class="mt-auto pt-4">
								{#if s}
									<div class="mb-1.5 flex justify-between text-xs font-semibold"><span>{s.stepsDone}/{s.stepsTotal} steps</span><span class="text-slate-ink">{s.evidenceCount} evidence</span></div>
									<ProgressBar value={s.stepsDone} max={s.stepsTotal} label="{m.title} steps" />
								{:else}
									<p class="text-xs font-semibold text-slate-ink">{m.steps} steps · about {m.hours} hours</p>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
			{#if b.number === 3}<p class="mt-4 flex items-start gap-2 text-sm text-slate-ink"><Icon name="info" class="mt-0.5 size-4 shrink-0" />Week 12: {data.oemNote}</p>{/if}
		</section>
	{/each}
</div>
