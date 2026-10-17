<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EvidenceType } from '$lib/content/types';
	import { EVIDENCE_LABELS } from '$lib/content/types';
	import { formatDate } from '$lib/dates';
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Item {
		id: string;
		type: EvidenceType;
		title: string | null;
		content: string | null;
		file_ref: string | null;
		file_name: string | null;
		submitted_at: string;
	}
	let { items, actions }: { items: Item[]; actions?: Snippet<[Item]> } = $props();
	const tint: Record<EvidenceType, string> = {
		notes: 'bg-deep-100 text-deep',
		screenshot: 'bg-sky-100 text-sky-900',
		config: 'bg-night text-green-400',
		recording_link: 'bg-pitch-100 text-pitch-800'
	};
</script>

<ul class="grid gap-3">
	{#each items as ev (ev.id)}
		<li class="min-w-0 rounded-2xl border border-fog/80 bg-white p-4">
			<div class="flex items-start gap-3">
				<span class="grid size-9 shrink-0 place-items-center rounded-lg {tint[ev.type]}"><Icon name={ev.type} class="size-[18px]" /></span>
				<div class="min-w-0 flex-1">
					<p class="font-semibold">{ev.title ?? EVIDENCE_LABELS[ev.type]}</p>
					<p class="text-xs text-slate-ink">{EVIDENCE_LABELS[ev.type]} · {formatDate(ev.submitted_at)}</p>
				</div>
				{@render actions?.(ev)}
			</div>
			{#if ev.type === 'screenshot' && ev.file_ref}
				<a href="/uploads/{ev.file_ref}" target="_blank" rel="noopener" class="mt-3 block overflow-hidden rounded-xl border border-fog">
					<img src="/uploads/{ev.file_ref}" alt={ev.title ?? 'Screenshot evidence'} class="max-h-72 w-full object-cover object-top" loading="lazy" />
				</a>
			{/if}
			{#if ev.type === 'recording_link' && ev.content}
				<a href={ev.content} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-pitch-50 px-3 py-2 text-sm font-semibold text-pitch-800 hover:underline">
					<Icon name="external" class="size-4 shrink-0" /><span class="truncate">{ev.content}</span>
				</a>
			{/if}
			{#if ev.type === 'config' && ev.content}
				<pre class="code-block mb-0 max-h-64">{ev.content}</pre>
			{/if}
			{#if ev.type === 'notes' && ev.content}
				<p class="mt-3 text-sm whitespace-pre-line text-night/85">{ev.content}</p>
			{/if}
			{#if ev.file_ref && ev.type !== 'screenshot'}
				<a href="/uploads/{ev.file_ref}" class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:underline">
					<Icon name="notes" class="size-4" />{ev.file_name}
				</a>
			{/if}
		</li>
	{/each}
</ul>
