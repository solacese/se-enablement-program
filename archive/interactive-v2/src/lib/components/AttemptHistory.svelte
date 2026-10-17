<script lang="ts">
	import type { CheckpointAttempt } from '$lib/types';
	import { formatDate } from '$lib/dates';
	import Icon from './ui/Icon.svelte';
	import Badge from './ui/Badge.svelte';

	let { attempts, titles }: { attempts: CheckpointAttempt[]; titles: Record<string, string> } = $props();
	const result = { passed: ['green', 'Passed'], needs_work: ['amber', 'Needs work'], scheduled: ['sky', 'Scheduled'] } as const;
</script>

<ol class="relative space-y-4 border-l-2 border-fog pl-6">
	{#each [...attempts].reverse() as a (a.id)}
		<li class="relative">
			<span class="absolute top-1 -left-[33px] grid size-4 place-items-center rounded-full ring-4 ring-white {a.status === 'passed' ? 'bg-green-500' : a.status === 'needs_work' ? 'bg-pitch-400' : 'bg-sky-500'}"></span>
			<div class="flex flex-wrap items-center gap-2">
				<p class="font-bold">Attempt {a.attempt_number}</p>
				<Badge tone={result[a.status][0]}>{result[a.status][1]}</Badge>
				<span class="text-xs text-slate-ink">{formatDate(a.scheduled_date, true)}{a.evaluator_name ? ` · ${a.evaluator_name}` : ''}</span>
			</div>
			{#if a.results.length}
				<ul class="mt-3 grid gap-2">
					{#each a.results as r (r.module_id)}
						<li class="rounded-xl border p-3 text-sm {r.result === 'pass' ? 'border-green-200 bg-green-50/60' : 'border-pitch-300/60 bg-pitch-50'}">
							<p class="flex items-center gap-2 font-semibold">
								<Icon name={r.result === 'pass' ? 'check' : 'alert'} class="size-4 {r.result === 'pass' ? 'text-green-700' : 'text-pitch-700'}" />
								{titles[r.module_id] ?? r.module_id}
								<span class="ml-auto text-xs font-bold {r.result === 'pass' ? 'text-green-700' : 'text-pitch-700'}">{r.result === 'pass' ? 'Pass' : 'Needs work'}</span>
							</p>
							{#if r.notes}<p class="mt-1 pl-6 text-slate-ink">{r.notes}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if a.notes}
				<blockquote class="mt-3 flex gap-2 rounded-xl bg-mist p-3 text-sm"><Icon name="message" class="mt-0.5 size-4 shrink-0 text-deep" /><span><span class="font-semibold">Evaluator feedback:</span> {a.notes}</span></blockquote>
			{/if}
			{#if a.retake_window_end}<p class="mt-2 text-xs font-semibold text-pitch-700">Retake window until {formatDate(a.retake_window_end, true)}</p>{/if}
		</li>
	{/each}
</ol>
