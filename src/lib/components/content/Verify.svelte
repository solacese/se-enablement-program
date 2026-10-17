<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	let { children }: { children?: Snippet } = $props();
</script>

<div class="not-prose my-4 flex gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
	<Icon name="eye" class="mt-0.5 size-4 shrink-0 text-green-700" />
	<div class="[&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:font-semibold [&_p]:m-0">
		<p class="eyebrow mb-0.5 text-[10px] text-green-700">How to verify</p>
		{@render children?.()}
	</div>
</div>
