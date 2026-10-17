<script lang="ts">
	import type { OverallStatus } from '$lib/types';
	import Badge from './Badge.svelte';
	let { status }: { status: OverallStatus } = $props();
	const map: Record<OverallStatus, { tone: 'green' | 'amber' | 'red' | 'grey' | 'night'; text: string }> = {
		on_track: { tone: 'green', text: 'On track' },
		behind: { tone: 'amber', text: 'Behind' },
		blocked: { tone: 'red', text: 'Blocked' },
		not_started: { tone: 'grey', text: 'Not started' },
		complete: { tone: 'night', text: 'Graduated' }
	};
</script>

<Badge tone={map[status].tone}>
	<span class="size-1.5 rounded-full bg-current"></span>
	{map[status].text}
</Badge>
