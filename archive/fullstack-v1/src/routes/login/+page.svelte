<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';

	let { data, form } = $props();
	let email = $state(untrack(() => form?.email ?? ''));
	let password = $state('');
	let busy = $state(false);
	let formEl: HTMLFormElement;

	function useDemo(e: string) {
		email = e;
		password = data.demoPassword;
		queueMicrotask(() => formEl.requestSubmit());
	}

	const roleIcon: Record<string, string> = { learner: 'rocket', tech_evaluator: 'clipboard', sales: 'mic', manager: 'users' };
</script>

<svelte:head><title>Sign in · Solace SE Journey</title></svelte:head>

<div class="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
	<section class="relative hidden overflow-hidden bg-night p-12 text-white lg:flex lg:flex-col">
		<div class="grid-bg absolute inset-0"></div>
		<div class="absolute -top-32 -left-24 size-[28rem] animate-float rounded-full bg-green-500/25 blur-3xl"></div>
		<div class="absolute right-0 bottom-0 size-96 rounded-full bg-deep-400/50 blur-3xl"></div>
		<a href="/" class="relative"><Logo /></a>
		<div class="relative mt-auto max-w-md">
			<p class="eyebrow text-green-400">Welcome back</p>
			<h1 class="mt-3 text-5xl leading-[1.05] font-extrabold tracking-tight">
				Pick up right <span class="text-gradient animate-shimmer">where you left off.</span>
			</h1>
			<p class="mt-5 text-lg text-white/70">Ten modules, three checkpoints and a pitch bootcamp, all in one place.</p>
		</div>
		<div class="relative mt-12 grid grid-cols-3 gap-3 text-center">
			{#each [['90', 'days'], ['10', 'modules'], ['16/20', 'pitch target']] as [n, l] (l)}
				<div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
					<p class="text-2xl font-extrabold text-green-400">{n}</p>
					<p class="text-xs text-white/60">{l}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex items-center justify-center bg-mist px-5 py-12 sm:px-10">
		<div class="w-full max-w-md">
			<a href="/" class="mb-8 inline-block rounded-2xl bg-night px-4 py-3 text-white lg:hidden"><Logo /></a>
			<h2 class="text-3xl font-extrabold tracking-tight">Sign in</h2>
			<p class="mt-1 text-slate-ink">Use your work email.</p>

			<form
				bind:this={formEl}
				method="POST"
				class="mt-8 space-y-4"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<div>
					<label class="label" for="email">Email</label>
					<input class="input" id="email" name="email" type="email" autocomplete="email" required bind:value={email} />
				</div>
				<div>
					<label class="label" for="password">Password</label>
					<input class="input" id="password" name="password" type="password" autocomplete="current-password" required bind:value={password} />
				</div>
				{#if form?.message}
					<p class="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
						<Icon name="alert" class="size-4" />{form.message}
					</p>
				{/if}
				<button class="btn-primary w-full py-3" disabled={busy}>
					{busy ? 'Signing in…' : 'Sign in'}
					<Icon name="arrow-right" class="size-4" />
				</button>
			</form>

			{#if data.demo.length}
			<div class="mt-10">
				<div class="flex items-center gap-3">
					<span class="h-px flex-1 bg-fog"></span>
					<span class="eyebrow text-[10px] text-slate-ink">Demo accounts · password {data.demoPassword}</span>
					<span class="h-px flex-1 bg-fog"></span>
				</div>
				<ul class="mt-4 grid gap-2 sm:grid-cols-2">
					{#each data.demo as a (a.email)}
						<li>
							<button
								type="button"
								onclick={() => useDemo(a.email)}
								class="group flex w-full items-center gap-3 rounded-xl border border-fog bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10"
							>
								<span class="grid size-9 shrink-0 place-items-center rounded-lg {a.role === 'learner' ? 'bg-green-100 text-green-800' : a.role === 'sales' ? 'bg-pitch-100 text-pitch-800' : 'bg-deep-100 text-deep'}">
									<Icon name={roleIcon[a.role]} class="size-[18px]" />
								</span>
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{a.name}</span>
									<span class="block truncate text-xs text-slate-ink">{a.roleLabel}</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
			{/if}
		</div>
	</section>
</div>
