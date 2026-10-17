<script lang="ts">
	import type { CheckpointState, ModuleState, PitchState } from '$lib/types';
	import { diffDays, formatDate, formatRange } from '$lib/dates';
	import { base } from '$app/paths';
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		day,
		modules,
		checkpoints,
		pitch,
		totalDays = 90,
		linkModules = true
	}: {
		day: number;
		modules: ModuleState[];
		checkpoints: CheckpointState[];
		pitch: PitchState;
		totalDays?: number;
		linkModules?: boolean;
	} = $props();

	const left = (d: number) => `${((d - 1) / totalDays) * 100}%`;
	const width = (a: number, b: number) => `${((b - a + 1) / totalDays) * 100}%`;
	const weeks = $derived(Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => i + 1));

	// Modules that share weeks (the two OEM modules) go in separate lanes.
	const lanes = $derived.by(() => {
		const out: ModuleState[][] = [];
		for (const m of modules) {
			const lane = out.find((l) => l.every((x) => x.endDay < m.startDay || x.startDay > m.endDay));
			if (lane) lane.push(m);
			else out.push([m]);
		}
		return out;
	});

	const moduleStyle = {
		complete: 'bg-gradient-to-r from-green-500 to-green-600 text-night border-green-600',
		in_progress: 'bg-green-100 text-green-900 border-green-500 border-2 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(0,200,149,.18)_6px,rgba(0,200,149,.18)_12px)]',
		available: 'bg-white text-deep border-deep-300 border-dashed border-2',
		locked: 'bg-mist text-slate-ink border-fog'
	};
	const statusText = { complete: 'Complete', in_progress: 'In progress', available: 'Ready to start', locked: 'Locked' };

	const cpStyle = (c: CheckpointState) =>
		c.status === 'passed'
			? 'bg-green-500 text-night'
			: c.status === 'coaching' || c.status === 'retake_scheduled'
				? 'bg-pitch-400 text-night'
				: 'bg-night text-green-400';

	const stageBlocks = $derived(pitch.stages.filter((s) => s.id !== 'retake' && s.id !== 'retake_coaching'));
	const pitchDayOf = (s: { startDate: string }) => pitch.startDay + diffDays(s.startDate, pitch.startDate);
	const todayIn = $derived(day >= 1 && day <= totalDays);
</script>

<div class="overflow-x-auto">
	<div class="relative min-w-[820px] pt-1 pb-2 pl-24">
		<!-- week scale -->
		<div class="relative mb-2 h-5 text-[10px] font-semibold text-slate-ink">
			{#each weeks as w (w)}
				<span class="absolute -translate-x-0 pl-1" style="left:{left((w - 1) * 7 + 1)}">W{w}</span>
			{/each}
		</div>

		<!-- technical lane(s) -->
		<div class="relative">
			<span class="absolute top-1 -left-24 flex w-20 items-center gap-1.5 text-xs font-bold text-green-700"><Icon name="route" class="size-4" />Technical</span>
			{#each lanes as lane, li (li)}
				<div class="relative mb-1.5 h-11">
					{#if li === 0}
						{#each [[1, 30], [31, 60], [61, 90]] as [a, b], i (i)}
							<div class="absolute inset-y-0 rounded-lg {i % 2 ? 'bg-deep/[0.04]' : 'bg-green-500/[0.05]'}" style="left:{left(a)};width:{width(a, b)}"></div>
						{/each}
					{/if}
					{#each lane as m (m.id)}
						<svelte:element
							this={linkModules ? 'a' : 'div'}
							href={linkModules ? `${base}/modules/${m.id}/` : undefined}
							class="absolute inset-y-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden rounded-lg border px-2 text-[11px] leading-tight font-bold transition hover:z-10 hover:shadow-lg {moduleStyle[m.status]} {m.selfPaced ? 'opacity-70' : ''}"
							style="left:calc({left(m.startDay)} + 2px);width:calc({width(m.startDay, m.endDay)} - 4px)"
							title="{m.title} · {statusText[m.status]} · {formatRange(m.startDate, m.endDate)}{m.selfPaced ? ' · self-paced' : ''}"
						>
							{#if m.status === 'complete'}<Icon name="check" class="size-3.5 shrink-0" strokeWidth={3} />{:else if m.status === 'locked'}<Icon name="lock" class="size-3 shrink-0" />{/if}
							<span class="truncate">{m.title}</span>
							{#if m.behind}<span class="ml-auto size-2 shrink-0 rounded-full bg-pitch-500" title="Behind schedule"></span>{/if}
						</svelte:element>
					{/each}
				</div>
			{/each}
		</div>

		<!-- checkpoints -->
		<div class="relative h-10">
			<span class="absolute top-2.5 -left-24 flex w-20 items-center gap-1.5 text-xs font-bold text-deep"><Icon name="flag" class="size-4" />Checks</span>
			{#each checkpoints as c (c.id)}
				<svelte:element
					this={linkModules ? 'a' : 'span'}
					href={linkModules ? `${base}/checkpoints/${c.id}/` : undefined}
					class="absolute top-1 flex {c.day > totalDays - 4 ? '-translate-x-full' : '-translate-x-1/2'} items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold whitespace-nowrap shadow-md ring-2 ring-white transition hover:scale-105 {cpStyle(c)}"
					style="left:{c.day > totalDays - 4 ? '100%' : left(c.day)}"
					title="{c.title} · {formatDate(c.date, true)}"
				>
					<Icon name={c.status === 'passed' ? 'check' : c.format === 'capstone' ? 'trophy' : 'flag'} class="size-3.5" strokeWidth={2.5} />
					Day {c.day}
				</svelte:element>
			{/each}
		</div>

		<!-- pitch lane -->
		<div class="relative h-11">
			<span class="absolute top-3 -left-24 flex w-20 items-center gap-1.5 text-xs font-bold text-pitch-700"><Icon name="mic" class="size-4" />Pitch</span>
			{#each stageBlocks as s (s.id)}
				{@const a = pitchDayOf(s)}
				<svelte:element
					this={linkModules ? 'a' : 'span'}
					href={linkModules ? `${base}/pitch/sessions/` : undefined}
					class="absolute inset-y-0.5 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 text-[11px] font-bold transition hover:shadow-lg {s.done
						? 'border-pitch-500 bg-gradient-to-r from-pitch-400 to-pitch-300 text-night'
						: s.current
							? 'border-2 border-pitch-500 bg-pitch-100 text-pitch-800'
							: 'border-pitch-300 border-dashed bg-pitch-50 text-pitch-700'}"
					style="left:calc({left(a)} + 2px);width:calc({width(a, a + 6)} - 4px)"
					title="{s.title} · {formatRange(s.startDate, s.endDate)}"
				>
					{#if s.done}<Icon name="check" class="size-3.5 shrink-0" strokeWidth={3} />{/if}
					<span class="truncate">{s.title}</span>
				</svelte:element>
			{/each}
		</div>

		{#if todayIn}
			<div class="pointer-events-none absolute top-5 bottom-0 z-20 w-0.5" style="left:calc(6rem + ({day - 0.5} / {totalDays}) * (100% - 6rem))">
				<div class="absolute inset-y-0 w-0.5 bg-gradient-to-b from-red-500 to-red-500/30"></div>
				<span class="absolute -top-5 -translate-x-1/2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow">Today · Day {day}</span>
			</div>
		{/if}
	</div>
</div>

<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-ink">
	<span class="flex items-center gap-1.5"><span class="size-3 rounded bg-green-500"></span>Complete</span>
	<span class="flex items-center gap-1.5"><span class="size-3 rounded border-2 border-green-500 bg-green-100"></span>In progress</span>
	<span class="flex items-center gap-1.5"><span class="size-3 rounded border-2 border-dashed border-deep-300 bg-white"></span>Ready</span>
	<span class="flex items-center gap-1.5"><span class="size-3 rounded border border-fog bg-mist"></span>Locked</span>
	<span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-pitch-500"></span>Behind schedule</span>
</div>
