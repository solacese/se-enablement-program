<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { base } from '$app/paths';
	import { orderedModules, program } from '$lib/content/program';

	const p = program();
	const t = p.platform;
	const all = orderedModules();
	const data = {
		blocks: t.blocks.map((b) => ({
			...b,
			checkpoint: p.checkpoints.find((c) => c.id === b.checkpoint)!,
			modules: b.modules.map((id) => {
				const m = all.find((x) => x.id === id)!;
				return { id, title: m.title, icon: m.icon, weeks: m.weeks, exitProof: m.exit_proof, oem: m.oem };
			})
		}))
	};
	const grad = ['from-green-400 to-green-600', 'from-teal-300 to-deep-300', 'from-deep-300 to-deep-400'];
	const weeks = (w: number[]) => (w.length > 1 ? `Weeks ${w[0]}–${w.at(-1)}` : `Week ${w[0]}`);
</script>

<svelte:head><title>{t.title} · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Track B · {t.duration_days} days · {data.blocks.length} blocks" title={t.title} subtitle={t.goal} />

<div class="mt-8 grid gap-6 lg:grid-cols-3">
	{#each data.blocks as b, i (b.id)}
		<section class="card flex flex-col overflow-hidden">
			<div class="relative bg-gradient-to-br p-6 text-night {grad[i % 3]}">
				<p class="text-xs font-bold tracking-widest uppercase opacity-70">Block {b.number} · Days {b.days[0]}–{b.days[1]}</p>
				<h2 class="mt-1 text-2xl font-extrabold">{b.theme}</h2>
				{#if b.tagline}<p class="mt-1 text-sm font-medium opacity-80">{b.tagline}</p>{/if}
			</div>
			<ol class="flex-1 space-y-1 p-3">
				{#each b.modules as m (m.id)}
					<li>
						<a href="{base}/modules/{m.id}/" class="flex gap-3 rounded-xl p-3 transition hover:bg-mist">
							<span class="grid size-9 shrink-0 place-items-center rounded-lg bg-night text-green-400"><Icon name={m.icon} class="size-[18px]" /></span>
							<span class="min-w-0">
								<span class="block text-xs font-semibold text-slate-ink">{weeks(m.weeks)}{m.oem ? ' · partner channel' : ''}</span>
								<span class="block font-bold">{m.title}</span>
								<span class="mt-0.5 block text-xs text-slate-ink"><span class="font-semibold text-green-700">Exit proof:</span> {m.exitProof}</span>
							</span>
						</a>
					</li>
				{/each}
			</ol>
			<a href="{base}/checkpoints/{b.checkpoint.id}/" class="m-3 mt-0 flex items-center gap-3 rounded-2xl bg-night p-4 text-white transition hover:bg-deep">
				<span class="grid size-10 place-items-center rounded-xl bg-green-500 text-night"><Icon name={b.checkpoint.format === 'capstone' ? 'trophy' : 'flag'} /></span>
				<span class="min-w-0 flex-1"><span class="block font-bold">{b.checkpoint.title}</span><span class="block text-xs text-white/60">Day {b.checkpoint.day} · {b.checkpoint.format === 'capstone' ? 'Full-platform demo' : 'Live quiz with a senior SE'}</span></span>
			</a>
		</section>
	{/each}
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<section class="card p-6">
		<h2 class="text-lg font-extrabold">By the end of the path, you can</h2>
		<ul class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each t.outcomes as o (o)}
				<li class="flex gap-3 text-sm"><span class="grid size-6 shrink-0 place-items-center rounded-full bg-green-500 text-night"><Icon name="check" class="size-3.5" strokeWidth={3} /></span>{o}</li>
			{/each}
		</ul>
	</section>
	<section class="card p-6">
		<h2 class="text-lg font-extrabold">Planning notes</h2>
		<ul class="mt-4 space-y-4 text-sm">
			{#each t.setup_tasks as task (task.id)}
				<li class="flex gap-3"><Icon name="alert" class="mt-0.5 size-5 shrink-0 text-pitch-700" /><span><span class="font-semibold">Day {task.due_day}: {task.title}.</span> {task.description}</span></li>
			{/each}
			<li class="flex gap-3"><Icon name="handshake" class="mt-0.5 size-5 shrink-0 text-deep" /><span><span class="font-semibold">Week {t.oem.week}: partner channels.</span> {t.oem.note}</span></li>
		</ul>
	</section>
</div>
