<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatDate } from '$lib/dates';

	let { data, children } = $props();
	const p = $derived(data.pitch);

	const statusText = {
		not_started: 'Starts soon',
		in_progress: 'In progress',
		coaching: 'Coaching',
		retake: 'Retake scheduled',
		graduated: 'Graduated'
	};

	const tabs = $derived([
		{ href: '/pitch', label: 'Overview', icon: 'compass', done: false },
		{ href: '/pitch/research', label: 'Research', icon: 'search', done: data.prep.research },
		{ href: '/pitch/discovery', label: 'Discovery', icon: 'message', done: data.prep.discovery },
		{ href: '/pitch/plan', label: 'Pitch plan', icon: 'notes', done: data.prep.plan },
		{ href: '/pitch/sessions', label: 'Sessions & scorecard', icon: 'trophy', done: p.passed }
	]);
	const current = $derived(page.url.pathname.replace(/\/$/, ''));
	const subtitle = $derived(
		data.scenario
			? `${data.scenario.vertical} · ${data.scenario.company} · ${data.scenario.contact_name}`
			: 'Research a real contact, run discovery live, and pitch to a rubric.'
	);
</script>

<PageHeader eyebrow="Pitch bootcamp · {formatDate(p.startDate)} – {formatDate(p.endDate)}" title={data.content.title} {subtitle} tone="amber">
	{#snippet actions()}
		<div class="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
			<span class="grid size-11 place-items-center rounded-xl bg-pitch-400 text-night"><Icon name={p.passed ? 'trophy' : 'target'} class="size-5" /></span>
			<span>
				<span class="block text-xs font-semibold text-white/60">{statusText[p.status]}</span>
				<span class="block text-2xl leading-tight font-extrabold">
					{p.latestScore ?? '–'}<span class="text-sm font-semibold text-white/50">/{p.max}</span>
					<span class="ml-1 text-xs font-semibold text-pitch-300">target {p.target}</span>
				</span>
			</span>
		</div>
	{/snippet}
</PageHeader>

<nav class="sticky top-[60px] z-20 -mx-4 mt-6 overflow-x-auto bg-mist/90 px-4 py-2 backdrop-blur lg:top-0 lg:mx-0 lg:px-0" aria-label="Pitch bootcamp">
	<ul class="flex min-w-max gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-fog/70">
		{#each tabs as t (t.href)}
			{@const on = current === t.href}
			<li>
				<a
					href={t.href}
					aria-current={on ? 'page' : undefined}
					class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition {on
						? 'bg-night text-white shadow'
						: 'text-slate-ink hover:bg-pitch-50 hover:text-night'}"
				>
					<Icon name={t.icon} class="size-4 {on ? 'text-pitch-300' : ''}" />
					{t.label}
					{#if t.done}
						<span class="grid size-4 place-items-center rounded-full bg-green-500 text-night" title="Done"><Icon name="check" class="size-2.5" strokeWidth={3.5} /><span class="sr-only">(done)</span></span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<div class="mt-6">
	{@render children()}
</div>
