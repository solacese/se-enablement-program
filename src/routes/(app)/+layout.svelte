<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';

	let { children } = $props();
	let drawer = $state(false);
	afterNavigate(() => (drawer = false));

	type Item = { href: string; label: string; icon: string; accent?: 'amber' };
	const nav: { section: string; items: Item[] }[] = [
		{
			section: 'Technical path',
			items: [
				{ href: '/tracks/platform', label: '90-day overview', icon: 'route' },
				{ href: '/modules', label: 'Modules', icon: 'book' },
				{ href: '/checkpoints', label: 'Checkpoints', icon: 'flag' }
			]
		},
		{
			section: 'Pitch',
			items: [{ href: '/tracks/pitch', label: 'Pitch bootcamp', icon: 'mic', accent: 'amber' }]
		}
	];

	const active = (href: string) => {
		const path = page.url.pathname.slice(base.length);
		return path === href || path.startsWith(href + '/');
	};
</script>

{#snippet sidebar()}
	<div class="flex h-full flex-col bg-night text-white">
		<a href="{base}/" class="px-5 pt-6 pb-5" aria-label="Solace SE Journey home"><Logo /></a>
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
			<a href="{base}/" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white">
				<Icon name="home" class="size-[18px] text-green-400" />Journey overview
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
		{@render children()}
	</main>
</div>
