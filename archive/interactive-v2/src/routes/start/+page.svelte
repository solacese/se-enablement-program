<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import ProfileForm from '$lib/components/ProfileForm.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';
	import { learner } from '$lib/data/learner.svelte';
	import { sampleState } from '$lib/data/sample';

	learner.init();
	let restoreError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	const dashboard = () => goto(`${base}/dashboard/`);

	async function useSample() {
		await learner.replace(sampleState());
		dashboard();
	}

	async function restore(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			await learner.importData(await file.text());
			dashboard();
		} catch (err) {
			restoreError = err instanceof Error ? err.message : 'That file couldn’t be restored.';
		}
	}
</script>

<svelte:head><title>Get started · Solace SE Journey</title></svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1fr_1.15fr]">
	<section class="relative overflow-hidden bg-night p-8 text-white sm:p-12 lg:flex lg:flex-col">
		<div class="grid-bg absolute inset-0"></div>
		<div class="absolute -top-32 -left-24 size-[28rem] animate-float rounded-full bg-green-500/25 blur-3xl"></div>
		<div class="absolute right-0 bottom-0 size-96 rounded-full bg-deep-400/50 blur-3xl"></div>
		<a href="{base}/" class="relative"><Logo /></a>
		<div class="relative mt-12 max-w-md lg:mt-auto">
			<p class="eyebrow text-green-400">Welcome aboard</p>
			<h1 class="mt-3 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
				Let's map <span class="text-gradient animate-shimmer">your 90 days.</span>
			</h1>
			<p class="mt-5 text-lg text-white/70">Tell us when you started and we'll lay out both tracks, every module and each checkpoint on your timeline.</p>
		</div>
		<div class="relative mt-10 space-y-3">
			<button type="button" onclick={useSample} class="group flex w-full items-center gap-4 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-green-400/50">
				<span class="grid size-11 shrink-0 place-items-center rounded-xl bg-pitch-400 text-night"><Icon name="compass" /></span>
				<span class="min-w-0 flex-1">
					<span class="block font-bold">Explore with sample progress</span>
					<span class="block text-sm text-white/60">See the app as an SE on day 41. You can reset it in Settings.</span>
				</span>
				<Icon name="arrow-right" class="size-5 text-white/50 transition group-hover:translate-x-1" />
			</button>
			<button type="button" onclick={() => fileInput.click()} class="group flex w-full items-center gap-4 rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-green-400/50">
				<span class="grid size-11 shrink-0 place-items-center rounded-xl bg-deep-400 text-white"><Icon name="upload" /></span>
				<span class="min-w-0 flex-1">
					<span class="block font-bold">Restore from a backup</span>
					<span class="block text-sm text-white/60">Pick up on a new device with the file you exported from Settings.</span>
				</span>
			</button>
			<input bind:this={fileInput} type="file" accept="application/json,.json" class="hidden" onchange={restore} />
			{#if restoreError}<p class="text-sm font-semibold text-red-300" role="alert">{restoreError}</p>{/if}
		</div>
	</section>

	<section class="flex items-center justify-center bg-mist px-5 py-12 sm:px-10">
		<div class="w-full max-w-xl">
			{#if learner.ready && learner.state.profile}
				<div class="card mb-8 flex flex-wrap items-center gap-4 p-5">
					<span class="grid size-11 place-items-center rounded-full bg-green-500 font-bold text-night"><Icon name="check" strokeWidth={3} /></span>
					<p class="min-w-0 flex-1"><span class="block font-bold">Welcome back, {learner.state.profile.name}</span><span class="text-sm text-slate-ink">Your progress is saved in this browser.</span></p>
					<a href="{base}/dashboard/" class="btn-primary">Continue<Icon name="arrow-right" class="size-4" /></a>
				</div>
			{/if}
			<h2 class="text-3xl font-extrabold tracking-tight">{learner.state.profile ? 'Update your details' : 'Set up your journey'}</h2>
			<p class="mt-1 text-slate-ink">Your progress is saved in this browser. No account needed.</p>
			<div class="mt-8">
				{#if learner.ready}
					<ProfileForm
						initial={learner.state.profile}
						submitLabel={learner.state.profile ? 'Save and continue' : 'Start my journey'}
						onsave={async (p) => {
							await learner.saveProfile(p);
							dashboard();
						}}
					/>
				{/if}
			</div>
		</div>
	</section>
</div>
