<script lang="ts">
	import { base } from '$app/paths';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { program } from '$lib/content/program';

	const p = program();
	const checkpoints = p.checkpoints.map((c) => ({
		...c,
		block: p.platform.blocks.find((b) => b.checkpoint === c.id),
		questions: c.general_questions.length + Object.values(c.question_bank).reduce((n, q) => n + q.length, 0)
	}));
</script>

<svelte:head><title>Checkpoints · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Validation" title="Checkpoints" subtitle="A senior SE runs each checkpoint as a one-on-one live session. They'll ask about your setup, how it works, and what you did to get it working." />

<ol class="mt-8 grid gap-5 lg:grid-cols-3">
	{#each checkpoints as c (c.id)}
		<li>
			<a href="{base}/checkpoints/{c.id}/" class="card group relative flex h-full flex-col overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-xl">
				<div class="absolute -top-12 -right-12 size-36 rounded-full {c.format === 'capstone' ? 'bg-green-400/20' : 'bg-deep-100'} blur-2xl"></div>
				<div class="relative flex items-center justify-between">
					<span class="grid size-12 place-items-center rounded-2xl {c.format === 'capstone' ? 'bg-green-500 text-night' : 'bg-night text-green-400'}">
						<Icon name={c.format === 'capstone' ? 'trophy' : 'flag'} class="size-6" />
					</span>
					<span class="text-3xl font-extrabold text-fog">Day {c.day}</span>
				</div>
				<p class="relative mt-5 text-xs font-semibold text-slate-ink">{c.block ? `End of Block ${c.block.number}: ${c.block.theme}` : `Day ${c.day}`}</p>
				<h2 class="relative mt-1 text-xl font-extrabold group-hover:text-green-700">{c.title}</h2>
				<p class="relative mt-2 text-sm text-slate-ink">{c.description}</p>
				<p class="relative mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 text-sm font-semibold">
					<span class="flex items-center gap-1.5"><Icon name="book" class="size-4 text-green-700" />{c.modules.length} modules</span>
					<span class="flex items-center gap-1.5"><Icon name="message" class="size-4 text-green-700" />{c.questions} sample questions</span>
				</p>
			</a>
		</li>
	{/each}
</ol>
