<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';

	const copy: Record<number, string> = {
		401: 'Sign in to continue.',
		403: 'You don’t have access to this page.',
		404: 'We couldn’t find that page.'
	};
</script>

<svelte:head><title>{page.status} · Solace SE Journey</title></svelte:head>

<div class="relative grid min-h-screen place-items-center overflow-hidden bg-night px-6 text-white">
	<div class="grid-bg absolute inset-0"></div>
	<div class="absolute -top-32 left-1/4 size-96 rounded-full bg-green-500/20 blur-3xl"></div>
	<div class="relative max-w-lg text-center">
		<a href="/" class="inline-block"><Logo /></a>
		<p class="text-gradient mt-10 text-8xl font-extrabold">{page.status}</p>
		<h1 class="mt-4 text-2xl font-extrabold">{page.error?.message && page.status !== 500 ? page.error.message : (copy[page.status] ?? 'Something went wrong on our side.')}</h1>
		<p class="mt-2 text-white/60">{page.status === 500 ? 'Try again in a moment. If it keeps happening, let the program team know.' : 'Check the link, or head back to your workspace.'}</p>
		<div class="mt-8 flex justify-center gap-3">
			<a href="/" class="btn-primary rounded-full px-6"><Icon name="home" class="size-4" />Home</a>
			<a href="/login" class="btn rounded-full px-6 text-white ring-1 ring-white/25 hover:bg-white/10">Sign in</a>
		</div>
	</div>
</div>
