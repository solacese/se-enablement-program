<script lang="ts">
	import type { CheckpointStatus } from '$lib/types';
	import Badge from './ui/Badge.svelte';
	let { status }: { status: CheckpointStatus } = $props();
	const map = {
		passed: ['green', 'Passed'],
		coaching: ['amber', 'Coaching · retake window open'],
		retake_scheduled: ['amber', 'Retake scheduled'],
		scheduled: ['sky', 'Scheduled'],
		upcoming: ['grey', 'Upcoming']
	} as const;
</script>

<Badge tone={map[status][0]}>{map[status][1]}</Badge>
