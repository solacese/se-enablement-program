<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';

	let { data, children } = $props();
	let drawer = $state(false);
	afterNavigate(() => (drawer = false));

	type Item = { href: string; label: string; icon: string; accent?: 'amber' };
	const nav = $derived.by((): { section: string; items: Item[] }[] => {
		const role = data.user.role;
		const program: Item[] = [
			{ href: '/tracks/platform', label: 'Technical path', icon: 'route' },
			{ href: '/tracks/pitch', label: 'Pitch bootcamp', icon: 'mic', accent: 'amber' }
		];
		if (role === 'learner')
			return [
				{
					section: 'My journey',
					items: [
						{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
						{ href: '/modules', label: 'Modules', icon: 'book' },
						{ href: '/checkpoints', label: 'Checkpoints', icon: 'flag' },
						{ href: '/pitch', label: 'My pitch', icon: 'target', accent: 'amber' }
					]
				},
				{ section: 'Program', items: program }
			];
		const work: Item[] =
			role === 'manager'
				? [
						{ href: '/team', label: 'Team', icon: 'users' },
						{ href: '/evaluate', label: 'Evaluations', icon: 'clipboard' },
						{ href: '/content', label: 'Program content', icon: 'sliders' }
					]
				: [{ href: '/evaluate', label: 'My SEs', icon: 'clipboard' }];
		return [
			{ section: 'Workspace', items: work },
			{ section: 'Program', items: program }
		];
	});

	const active = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	const roleLabel = {
		learner: 'Learner',
		tech_evaluator: 'Technical evaluator',
		sales: 'Pitch evaluator',
		manager: 'Manager'
	};
	const initials = $derived(data.user.name.split(' ').map((p) => p[0]).join('').slice(0, 2));
</script>

{#snippet sidebar()}
	<div class="flex h-full flex-col bg-night text-white">
		<a href="/" class="px-5 pt-6 pb-5" aria-label="Solace SE Journey home"><Logo /></a>
		{#if data.programDay != null}
			<div class="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-deep/60 p-4 ring-1 ring-white/10">
				<p class="eyebrow text-[10px] text-green-300">Your journey</p>
				{#if data.programDay < 1}
					<p class="mt-1 text-sm font-semibold">Starts in {1 - data.programDay} day{1 - data.programDay === 1 ? '' : 's'}</p>
				{:else}
					<p class="mt-1 text-2xl font-extrabold">Day {Math.min(data.programDay, 90)}<span class="text-sm font-semibold text-white/50"> / 90</span></p>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
						<div class="h-full rounded-full bg-green-500" style="width:{Math.min(100, (data.programDay / 90) * 100)}%"></div>
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
									href={item.href}
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
			<div class="flex items-center gap-3">
				<span class="grid size-10 place-items-center rounded-full bg-gradient-to-br from-green-400 to-deep-400 text-sm font-bold text-night">{initials}</span>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold">{data.user.name}</p>
					<p class="truncate text-xs text-white/50">{roleLabel[data.user.role]}</p>
				</div>
				<form method="POST" action="/logout">
					<button class="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
						<Icon name="logout" class="size-[18px]" />
					</button>
				</form>
			</div>
		</div>
	</div>
{/snippet}

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>

<div class="min-h-screen lg:pl-72">
	<aside class="fixed inset-y-0 left-0 hidden w-72 lg:block">{@render sidebar()}</aside>

	<div class="sticky top-0 z-30 flex items-center justify-between bg-night px-4 py-3 text-white lg:hidden">
		<a href="/"><Logo /></a>
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
		{@render children()}
	</main>
</div>
