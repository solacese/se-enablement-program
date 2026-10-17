<script lang="ts">
	let { class: cls = '' }: { class?: string } = $props();
</script>

<span class="inline-flex items-center gap-2.5 {cls}">
	<svg viewBox="0 0 32 32" class="size-8 shrink-0" aria-hidden="true">
		<rect width="32" height="32" rx="9" fill="#093B5F" />
		<path d="M10 16 22 9M10 16l12 7M22 9v14" stroke="#00C895" stroke-width="2" stroke-linecap="round" opacity=".55" />
		<circle cx="10" cy="16" r="3.6" fill="#00C895" />
		<circle cx="22" cy="9" r="2.8" fill="#00C895" />
		<circle cx="22" cy="23" r="2.8" fill="#00C895" />
	</svg>
	<span class="leading-none">
		<span class="block text-[15px] font-extrabold tracking-tight">Solace <span class="text-green-500">SE</span> Journey</span>
		<span class="block text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">Enablement program</span>
	</span>
</span>
