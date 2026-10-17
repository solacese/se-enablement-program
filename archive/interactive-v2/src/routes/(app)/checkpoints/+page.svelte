<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import CheckpointStatusBadge from '$lib/components/CheckpointStatusBadge.svelte';
	import { base } from '$app/paths';
	import { learner } from '$lib/data/learner.svelte';
	import { formatDate, relativeDays } from '$lib/dates';
	import { buildView } from '$lib/progress';

	const data = $derived(buildView(learner.state)!);
</script>

<svelte:head><title>Checkpoints · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Validation" title="Checkpoints" subtitle="A senior SE runs each checkpoint as a one-on-one live session. Schedule it here, then log the result and feedback afterwards." />

<ol class="mt-8 grid gap-5 lg:grid-cols-3">
	{#each data.checkpoints as c (c.id)}
		<li>
			<a href="{base}/checkpoints/{c.id}/" class="card group relative flex h-full flex-col overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-xl">
				<div class="absolute -top-12 -right-12 size-36 rounded-full {c.status === 'passed' ? 'bg-green-400/20' : c.status === 'coaching' ? 'bg-pitch-400/25' : 'bg-deep-100'} blur-2xl"></div>
				<div class="relative flex items-center justify-between">
					<span class="grid size-12 place-items-center rounded-2xl {c.status === 'passed' ? 'bg-green-500 text-night' : 'bg-night text-green-400'}">
						<Icon name={c.status === 'passed' ? 'check' : c.format === 'capstone' ? 'trophy' : 'flag'} class="size-6" strokeWidth={c.status === 'passed' ? 3 : 2} />
					</span>
					<CheckpointStatusBadge status={c.status} />
				</div>
				<p class="relative mt-5 text-xs font-semibold text-slate-ink">Day {c.day} · {formatDate(c.date, true)} · {relativeDays(c.date, data.today)}</p>
				<h2 class="relative mt-1 text-xl font-extrabold group-hover:text-green-700">{c.title}</h2>
				<p class="relative mt-2 text-sm text-slate-ink">{c.format === 'capstone' ? 'Full-platform, customer-style demo' : 'Live quiz'} covering {c.modules.length} modules.</p>
				<div class="relative mt-auto pt-5 text-sm">
					{#if c.missingProofs.length && c.status !== 'passed'}
						<p class="flex items-center gap-2 font-semibold text-pitch-700"><Icon name="alert" class="size-4" />{c.missingProofs.length} exit proof{c.missingProofs.length === 1 ? '' : 's'} to go</p>
					{:else}
						<p class="flex items-center gap-2 font-semibold text-green-700"><Icon name="check" class="size-4" />All exit proofs in</p>
					{/if}
					{#if c.attempts.length}<p class="mt-1 text-slate-ink">{c.attempts.length} attempt{c.attempts.length === 1 ? '' : 's'} on record</p>{/if}
				</div>
			</a>
		</li>
	{/each}
</ol>
