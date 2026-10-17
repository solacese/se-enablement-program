<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth';
	import { learner } from '$lib/data/learner.svelte';
	import { dayNumber } from '$lib/dates';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';

	let { children } = $props();
	let drawer = $state(false);
	afterNavigate(() => (drawer = false));

	learner.init();
	const identity = $derived(learner.ready ? auth.current() : null);
	$effect(() => {
		if (learner.ready && !identity) auth.signIn();
	});

	const programDay = $derived(learner.state.profile ? dayNumber(learner.state.profile.start_date) : null);

	type Item = { href: string; label: string; icon: string; accent?: 'amber' };
	const nav: { section: string; items: Item[] }[] = [
		{
			section: 'My journey',
			items: [
				{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
				{ href: '/modules', label: 'Modules', icon: 'book' },
				{ href: '/checkpoints', label: 'Checkpoints', icon: 'flag' },
				{ href: '/pitch', label: 'My pitch', icon: 'target', accent: 'amber' }
			]
		},
		{
			section: 'Program',
			items: [
				{ href: '/tracks/platform', label: 'Technical path', icon: 'route' },
				{ href: '/tracks/pitch', label: 'Pitch bootcamp', icon: 'mic', accent: 'amber' }
			]
		}
	];

	const active = (href: string) => {
		const path = page.url.pathname.slice(base.length);
		return path === href || path.startsWith(href + '/');
	};
	const initials = $derived((identity?.name ?? '').split(' ').map((p) => p[0]).join('').slice(0, 2));
</script>

{#snippet sidebar()}
	<div class="flex h-full flex-col bg-night text-white">
		<a href="{base}/" class="px-5 pt-6 pb-5" aria-label="Solace SE Journey home"><Logo /></a>
		{#if programDay != null}
			<div class="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-deep/60 p-4 ring-1 ring-white/10">
				<p class="eyebrow text-[10px] text-green-300">Your journey</p>
				{#if programDay < 1}
					<p class="mt-1 text-sm font-semibold">Starts in {1 - programDay} day{1 - programDay === 1 ? '' : 's'}</p>
				{:else}
					<p class="mt-1 text-2xl font-extrabold">Day {Math.min(programDay, 90)}<span class="text-sm font-semibold text-white/50"> / 90</span></p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
						<div class="h-full rounded-full bg-green-500" style="width:{Math.min(100, (programDay / 90) * 100)}%"></div>
					</div>
				{/if}
			</div>
		{/if}
		<nav class="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Main">
			{#each nav as group (group.section)}
				<div>
					<p class="eyebrow px-3 pb-2 text-[10px] text-white/40">{group.section}</p>
					<ul class="space-y-1">
						{#each group.items as item (item.href)}
							{@const on = active(item.href)}
							<li>
								<a
									href="{base}{item.href}/"
									aria-current={on ? 'page' : undefined}
									class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition {on
										? item.accent === 'amber'
											? 'bg-pitch-400 text-night'
											: 'bg-green-500 text-night'
										: 'text-white/75 hover:bg-white/5 hover:text-white'}"
								>
									<Icon name={item.icon} class="size-[18px] {on ? '' : item.accent === 'amber' ? 'text-pitch-300' : 'text-green-400'}" />
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</nav>
		<div class="border-t border-white/10 p-4">
			<a href="{base}/settings/" class="flex items-center gap-3 rounded-xl p-1 hover:bg-white/5 {active('/settings') ? 'bg-white/10' : ''}">
				<span class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-green-400 to-deep-400 text-sm font-bold text-night">{initials || '?'}</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-semibold">{identity?.name ?? ''}</span>
					<span class="block truncate text-xs text-white/50">Profile & settings</span>
				</span>
				<Icon name="sliders" class="size-[18px] text-white/60" />
			</a>
		</div>
	</div>
{/snippet}

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>

<div class="min-h-screen lg:pl-72">
	<aside class="fixed inset-y-0 left-0 hidden w-72 lg:block">{@render sidebar()}</aside>

	<div class="sticky top-0 z-30 flex items-center justify-between bg-night px-4 py-3 text-white lg:hidden">
		<a href="{base}/"><Logo /></a>
		<button class="rounded-lg p-2 hover:bg-white/10" onclick={() => (drawer = true)} aria-label="Open menu" aria-expanded={drawer}>
			<Icon name="menu" />
		</button>
	</div>
	{#if drawer}
		<div class="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
			<button class="absolute inset-0 bg-night/60 backdrop-blur-sm" onclick={() => (drawer = false)} aria-label="Close menu"></button>
			<div class="absolute inset-y-0 left-0 w-72 shadow-2xl">{@render sidebar()}</div>
		</div>
	{/if}

	<main id="main" class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
		{#if learner.saveError}
			<p class="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
				<Icon name="alert" class="size-4" />{learner.saveError}
			</p>
		{/if}
		{#if identity}
			{@render children()}
		{:else}
			<div class="grid min-h-[60vh] place-items-center" aria-busy="true">
				<span class="size-10 animate-spin rounded-full border-4 border-green-500/20 border-t-green-500"></span>
			</div>
		{/if}
	</main>
</div>
