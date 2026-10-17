<script lang="ts">
	import { untrack } from 'svelte';
	import { program } from '$lib/content/program';
	import type { LearnerProfile } from '$lib/data/types';
	import { dateForDay, formatDate, todayISO } from '$lib/dates';
	import Icon from './ui/Icon.svelte';

	type Draft = Omit<LearnerProfile, 'created_at'>;
	let {
		initial,
		submitLabel,
		dark = false,
		onsave
	}: { initial?: LearnerProfile | null; submitLabel: string; dark?: boolean; onsave: (p: Draft) => void | Promise<void> } = $props();

	const p = program();
	const oems = p.platform.oem.modules.map((id) => ({ id, title: p.modules.find((m) => m.id === id)?.title ?? id }));
	let f = $state<Draft>(
		untrack(() => ({
			name: initial?.name ?? '',
			email: initial?.email ?? '',
			title: initial?.title ?? 'Sales Engineer',
			start_date: initial?.start_date ?? todayISO(),
			primary_oem: initial?.primary_oem ?? oems[0]?.id ?? null,
			tech_evaluator: initial?.tech_evaluator ?? '',
			pitch_manager: initial?.pitch_manager ?? '',
			pitch_sales: initial?.pitch_sales ?? '',
			unlock_all: initial?.unlock_all ?? false
		}))
	);
	let error = $state<string | null>(null);
	let saved = $state(false);

	const milestones = $derived(
		/^\d{4}-\d{2}-\d{2}$/.test(f.start_date)
			? [
					...p.checkpoints.map((c) => ({ label: c.title, date: dateForDay(f.start_date, c.day) })),
					{ label: `${p.pitch.title} starts`, date: dateForDay(f.start_date, p.pitch.start_day) }
				].sort((a, b) => a.date.localeCompare(b.date))
			: []
	);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!f.name.trim()) return (error = 'Enter your name.');
		if (!/^\d{4}-\d{2}-\d{2}$/.test(f.start_date)) return (error = 'Pick your start date.');
		error = null;
		await onsave({ ...f, name: f.name.trim(), email: f.email.trim(), title: f.title.trim() });
		saved = true;
		setTimeout(() => (saved = false), 2500);
	}

	const lbl = $derived(dark ? 'label text-white' : 'label');
	const hint = $derived(dark ? 'hint text-white/60' : 'hint');
</script>

<form onsubmit={submit} class="space-y-5" novalidate>
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<label class={lbl} for="pf-name">Your name</label>
			<input id="pf-name" class="input" autocomplete="name" required bind:value={f.name} />
		</div>
		<div>
			<label class={lbl} for="pf-email">Work email <span class="font-normal opacity-70">(optional)</span></label>
			<input id="pf-email" class="input" type="email" autocomplete="email" bind:value={f.email} />
		</div>
		<div>
			<label class={lbl} for="pf-title">Title</label>
			<input id="pf-title" class="input" bind:value={f.title} />
		</div>
		<div>
			<label class={lbl} for="pf-start">Start date (day 1)</label>
			<input id="pf-start" class="input" type="date" required bind:value={f.start_date} />
			<p class={hint}>Every date on both tracks is worked out from this.</p>
		</div>
		<div>
			<label class={lbl} for="pf-oem">Primary partner channel (week {p.platform.oem.week})</label>
			<select id="pf-oem" class="input" bind:value={f.primary_oem}>
				{#each oems as o (o.id)}<option value={o.id}>{o.title}</option>{/each}
			</select>
			<p class={hint}>The other one is self-paced.</p>
		</div>
	</div>

	{#if milestones.length}
		<ul class="grid gap-2 sm:grid-cols-2" aria-label="Your key dates">
			{#each milestones as m (m.label)}
				<li class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm {dark ? 'bg-white/5 text-white/85 ring-1 ring-white/10' : 'bg-mist'}">
					<Icon name="calendar" class="size-4 shrink-0 {dark ? 'text-green-400' : 'text-green-700'}" />
					<span class="font-semibold">{m.label}</span><span class="ml-auto opacity-70">{formatDate(m.date)}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<fieldset class="grid gap-4 sm:grid-cols-3">
		<legend class="{lbl} mb-2">Your evaluators <span class="font-normal opacity-70">(optional, you can add them later)</span></legend>
		<div>
			<label class="{hint} mt-0 mb-1 block" for="pf-tech">Senior SE (checkpoints)</label>
			<input id="pf-tech" class="input" bind:value={f.tech_evaluator} />
		</div>
		<div>
			<label class="{hint} mt-0 mb-1 block" for="pf-mgr">Manager (pitch)</label>
			<input id="pf-mgr" class="input" bind:value={f.pitch_manager} />
		</div>
		<div>
			<label class="{hint} mt-0 mb-1 block" for="pf-sales">Sales rep (pitch)</label>
			<input id="pf-sales" class="input" bind:value={f.pitch_sales} />
		</div>
	</fieldset>

	<label class="flex items-start gap-3 rounded-xl p-3 text-sm {dark ? 'bg-white/5 ring-1 ring-white/10' : 'border border-fog'}">
		<input type="checkbox" class="mt-0.5 size-4 accent-green-600" bind:checked={f.unlock_all} />
		<span>
			<span class="font-semibold">Unlock all modules</span>
			<span class="block {dark ? 'text-white/60' : 'text-slate-ink'}">Normally modules unlock in order as you submit each exit proof. Only turn this on if your manager agrees.</span>
		</span>
	</label>

	{#if error}<p class="text-sm font-semibold {dark ? 'text-red-300' : 'text-red-700'}" role="alert">{error}</p>{/if}
	<div class="flex items-center gap-3">
		<button class="btn-primary px-6 py-3"><Icon name={initial ? 'check' : 'rocket'} class="size-4" />{submitLabel}</button>
		{#if saved}<span class="text-sm font-semibold {dark ? 'text-green-300' : 'text-green-700'}" role="status">Saved.</span>{/if}
	</div>
</form>
