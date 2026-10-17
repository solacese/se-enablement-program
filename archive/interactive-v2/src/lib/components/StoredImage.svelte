<script lang="ts">
	import { learner } from '$lib/data/learner.svelte';

	// Screenshots live in the repository's file store, not at a URL, so load them as blobs.
	let { ref, alt }: { ref: string; alt: string } = $props();
	let url = $state<string | null>(null);
	let missing = $state(false);

	$effect(() => {
		let objectUrl: string | null = null;
		missing = false;
		learner.repo.getFile(ref).then((blob) => {
			if (!blob) return (missing = true);
			url = objectUrl = URL.createObjectURL(blob);
		});
		return () => {
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	});
</script>

{#if url}
	<a href={url} target="_blank" rel="noopener" class="mt-3 block overflow-hidden rounded-xl border border-fog">
		<img src={url} {alt} class="max-h-72 w-full object-cover object-top" />
	</a>
{:else if missing}
	<p class="mt-3 rounded-xl bg-mist p-3 text-xs text-slate-ink">Image not found in this browser.</p>
{:else}
	<div class="mt-3 h-40 animate-pulse rounded-xl bg-mist"></div>
{/if}
