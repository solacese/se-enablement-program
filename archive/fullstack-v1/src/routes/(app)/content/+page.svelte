<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { formatDate } from '$lib/dates';

	let { data } = $props();
	let q = $state('');

	const groups = [
		{ id: 'tracks', title: 'Tracks', icon: 'route', blurb: 'Blocks, stages, rubric and graduation target.', accent: 'from-green-400 to-deep-300' },
		{ id: 'modules', title: 'Modules', icon: 'book', blurb: 'Front matter plus a Markdown body with ordered steps.', accent: 'from-green-500 to-green-700' },
		{ id: 'checkpoints', title: 'Checkpoints', icon: 'flag', blurb: 'Modules covered and the question bank.', accent: 'from-deep-300 to-deep' },
		{ id: 'scenarios', title: 'Scenarios', icon: 'target', blurb: 'The template managers fill in. No real contact data.', accent: 'from-pitch-300 to-pitch-500' },
		{ id: 'other', title: 'Other files', icon: 'notes', blurb: '', accent: 'from-fog to-slate-ink' }
	] as const;

	const filtered = $derived(
		q.trim()
			? data.files.filter((f) => (f.path + ' ' + f.title).toLowerCase().includes(q.trim().toLowerCase()))
			: data.files
	);
</script>

<svelte:head><title>Program content · Solace SE Journey</title></svelte:head>

<PageHeader
	eyebrow="Content as data"
	title="Program content"
	subtitle="Tracks, modules, checkpoints and the scenario template live in version-controlled files under content/. Change a file and the app follows, no code changes."
/>

<section class="mt-6 grid gap-4 md:grid-cols-3" aria-label="How content editing works">
	{#each [
		{ icon: 'edit', title: 'Edit a file', text: 'Open any file below, or edit it in your editor. Markdown modules use YAML front matter.' },
		{ icon: 'check', title: 'Validate', text: 'The app checks YAML syntax, module ids and cross-references, and reports problems clearly.' },
		{ icon: 'rocket', title: 'Commit and deploy', text: 'In development the app hot-reloads. In production, commit the change and redeploy.' }
	] as s, i (s.title)}
		<div class="card flex gap-3 p-5">
			<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-night text-sm font-extrabold text-green-400">{i + 1}</span>
			<div>
				<p class="flex items-center gap-1.5 font-bold"><Icon name={s.icon} class="size-4 text-green-700" />{s.title}</p>
				<p class="mt-1 text-sm text-slate-ink">{s.text}</p>
			</div>
		</div>
	{/each}
</section>

<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
	<div class="flex items-center gap-2 text-sm">
		{#if data.editable}
			<Badge tone="green"><Icon name="edit" class="size-3" />Editing enabled in development</Badge>
		{:else}
			<Badge tone="grey"><Icon name="lock" class="size-3" />Read-only in production</Badge>
		{/if}
		<span class="text-slate-ink">{data.files.length} files</span>
	</div>
	<label class="relative w-full sm:w-72">
		<span class="sr-only">Filter files</span>
		<Icon name="search" class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-ink" />
		<input class="input pl-9" placeholder="Filter by name or path" bind:value={q} />
	</label>
</div>

{#if filtered.length === 0}
	<div class="mt-6"><EmptyState icon="search" title="No files match “{q}”" /></div>
{/if}

{#each groups as g (g.id)}
	{@const items = filtered.filter((f) => f.group === g.id)}
	{#if items.length}
		<section class="mt-8" aria-labelledby="g-{g.id}">
			<div class="flex items-end justify-between gap-2">
				<div>
					<h2 id="g-{g.id}" class="flex items-center gap-2 text-xl font-extrabold">
						<span class="grid size-8 place-items-center rounded-lg bg-gradient-to-br text-white {g.accent}"><Icon name={g.icon} class="size-4" /></span>
						{g.title}
						<span class="text-sm font-semibold text-slate-ink">{items.length}</span>
					</h2>
					{#if g.blurb}<p class="mt-1 text-sm text-slate-ink">{g.blurb}</p>{/if}
				</div>
				<code class="hidden text-xs text-slate-ink sm:block">content/{g.id === 'other' ? '' : g.id + '/'}</code>
			</div>
			<ul class="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
				{#each items as f (f.path)}
					<li>
						<a href="/content/edit?path={encodeURIComponent(f.path)}" class="card group relative flex h-full flex-col overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
							<span class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r {g.accent}"></span>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-bold group-hover:underline">{f.title}</span>
									<code class="block truncate text-xs text-slate-ink">{f.path}</code>
								</span>
								<span class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-deep">
									<Icon name={data.editable ? 'edit' : 'eye'} class="size-3.5" />{data.editable ? 'Edit' : 'View'}
								</span>
							</span>
							{#if f.stats.length}
								<span class="mt-4 grid grid-cols-4 gap-2">
									{#each f.stats as s (s.label)}
										<span class="rounded-lg bg-mist px-2 py-1.5 text-center">
											<span class="block truncate text-sm font-extrabold">{s.value}</span>
											<span class="block truncate text-[10px] font-semibold text-slate-ink uppercase">{s.label}</span>
										</span>
									{/each}
								</span>
							{/if}
							{#if f.note}<span class="mt-3 line-clamp-2 text-xs text-slate-ink">{f.note}</span>{/if}
							<span class="mt-auto pt-3 text-[11px] text-slate-ink">Modified {formatDate(f.updated)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/each}
