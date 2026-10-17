<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import ProfileForm from '$lib/components/ProfileForm.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { learner } from '$lib/data/learner.svelte';
	import { todayISO } from '$lib/dates';

	let message = $state<{ ok: boolean; text: string } | null>(null);
	let confirmReset = $state(false);
	let fileInput: HTMLInputElement;

	async function exportData() {
		const blob = new Blob([await learner.exportData()], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `se-journey-${(learner.state.profile?.name ?? 'progress').toLowerCase().replace(/\W+/g, '-')}-${todayISO()}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
		message = { ok: true, text: 'Backup downloaded. Keep it somewhere safe.' };
	}

	async function importData(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		(e.target as HTMLInputElement).value = '';
		if (!file) return;
		try {
			await learner.importData(await file.text());
			message = { ok: true, text: 'Backup restored.' };
		} catch (err) {
			message = { ok: false, text: err instanceof Error ? err.message : 'That file couldn’t be restored.' };
		}
	}

	async function reset() {
		await learner.reset();
		goto(`${base}/start/`);
	}

	const counts = $derived({
		steps: Object.values(learner.state.steps).reduce((n, m) => n + Object.keys(m).length, 0),
		evidence: learner.state.evidence.length,
		sessions: learner.state.checkpoint_attempts.length + learner.state.pitch_sessions.length
	});
</script>

<svelte:head><title>Settings · Solace SE Journey</title></svelte:head>

<PageHeader eyebrow="Profile & settings" title="Settings" subtitle="Your details, your evaluators, and your saved progress." />

<div class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
	<section class="card p-6">
		<h2 class="text-lg font-extrabold">Your details</h2>
		<p class="mt-1 text-sm text-slate-ink">Changing your start date moves every date on both tracks.</p>
		<div class="mt-5">
			<ProfileForm initial={learner.state.profile} submitLabel="Save changes" onsave={(p) => learner.saveProfile(p)} />
		</div>
	</section>

	<div class="space-y-6">
		<section class="card p-6">
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="broker" class="size-5 text-green-700" />Your data</h2>
			<p class="mt-1 text-sm text-slate-ink">
				Saved in <span class="font-semibold text-night">{learner.repo.label.toLowerCase()}</span> only: {counts.steps} steps, {counts.evidence} evidence items, {counts.sessions} sessions. Clearing your browser data or switching device loses it, so download a backup now and then.
			</p>
			<div class="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
				<button class="btn-dark" onclick={exportData}><Icon name="upload" class="size-4 rotate-180" />Download backup</button>
				<button class="btn-ghost" onclick={() => fileInput.click()}><Icon name="upload" class="size-4" />Restore a backup</button>
				<input bind:this={fileInput} type="file" accept="application/json,.json" class="hidden" onchange={importData} />
			</div>
			<p class="hint mt-3">Share a backup with your evaluator if they want to look over your evidence before a session.</p>
			{#if message}<p class="mt-3 text-sm font-semibold {message.ok ? 'text-green-700' : 'text-red-700'}" role={message.ok ? 'status' : 'alert'}>{message.text}</p>{/if}
		</section>

		<section class="card border-red-200 p-6">
			<h2 class="text-lg font-extrabold">Start over</h2>
			<p class="mt-1 text-sm text-slate-ink">Erase your profile and all progress from this browser.</p>
			{#if confirmReset}
				<div class="mt-4 rounded-xl bg-red-50 p-4" role="alert">
					<p class="text-sm font-semibold text-red-800">This can’t be undone. Download a backup first if you might need it.</p>
					<div class="mt-3 flex gap-2">
						<button class="btn bg-red-700 text-white hover:bg-red-800" onclick={reset}>Erase everything</button>
						<button class="btn-ghost" onclick={() => (confirmReset = false)}>Cancel</button>
					</div>
				</div>
			{:else}
				<button class="btn-ghost mt-4 text-red-700" onclick={() => (confirmReset = true)}><Icon name="trash" class="size-4" />Erase my data</button>
			{/if}
		</section>
	</div>
</div>
