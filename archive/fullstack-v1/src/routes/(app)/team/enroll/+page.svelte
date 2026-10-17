<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { dateForDay, formatDate, relativeDays } from '$lib/dates';

	let { data, form } = $props();

	let startInput = $state<string | null>(null);
	let passwordMode = $state<'generate' | 'custom'>('generate');
	let submitting = $state(false);
	let copied = $state(false);

	const v = $derived(form && 'values' in form ? form.values : undefined);
	const err = $derived<Record<string, string>>((form && 'errors' in form ? form.errors : undefined) ?? {});
	const created = $derived(form && 'created' in form ? form.created : null);
	const start = $derived(startInput ?? v?.start_date ?? data.today);
	const validStart = $derived(/^\d{4}-\d{2}-\d{2}$/.test(start));
	const preview = $derived(validStart ? data.milestones.map((m) => ({ ...m, date: dateForDay(start, m.day) })) : []);

	const kindStyle = {
		start: 'bg-green-500 text-night',
		pitch: 'bg-pitch-400 text-night',
		checkpoint: 'bg-deep text-white'
	};

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			/* clipboard unavailable */
		}
	}
</script>

<svelte:head><title>Enroll a new SE · Solace SE Journey</title></svelte:head>

<a href="/team" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-deep hover:underline">
	<Icon name="chevron-right" class="size-4 rotate-180" />Team
</a>

<PageHeader
	eyebrow="Manager view"
	title="Enroll a new SE"
	subtitle="Set a start date and every date on both tracks follows from it. The pitch bootcamp starts on day {data.milestones.find((m) => m.kind === 'pitch')?.day}."
/>

{#if created}
	<section class="mt-6 overflow-hidden rounded-2xl border border-green-300 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg shadow-green-500/10" role="status">
		<div class="flex flex-wrap items-start gap-4">
			<span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-green-500 text-night"><Icon name="check" class="size-6" /></span>
			<div class="min-w-0 flex-1">
				<h2 class="text-lg font-extrabold">{created.name} is enrolled</h2>
				<p class="mt-1 text-sm text-slate-ink">They can sign in as <span class="font-semibold text-night">{created.email}</span>.</p>
				{#if created.password}
					<div class="mt-4 rounded-xl bg-night p-4 text-white">
						<p class="eyebrow text-[10px] text-green-300">Temporary password · shown once</p>
						<div class="mt-2 flex flex-wrap items-center gap-3">
							<code class="font-mono text-xl font-bold tracking-wider text-green-200">{created.password}</code>
							<button type="button" class="btn-sm btn rounded-lg bg-white/10 text-white hover:bg-white/20" onclick={() => copy(created.password!)}>
								<Icon name={copied ? 'check' : 'clipboard'} class="size-3.5" />{copied ? 'Copied' : 'Copy'}
							</button>
						</div>
						<p class="mt-2 text-xs text-white/70">Share it securely. It isn’t stored and can’t be shown again.</p>
					</div>
				{/if}
				<div class="mt-4 flex flex-wrap gap-2">
					<a href="/team/{created.enrollmentId}" class="btn-dark">Open {created.name.split(' ')[0]}’s page<Icon name="arrow-right" class="size-4" /></a>
					<a href="/team" class="btn-ghost">Back to team</a>
				</div>
			</div>
		</div>
	</section>
{/if}

<form
	method="POST"
	class="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"
	use:enhance={() => {
		submitting = true;
		return async ({ update, result }) => {
			await update();
			submitting = false;
			if (result.type === 'success') {
				startInput = null;
				passwordMode = 'generate';
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		};
	}}
	novalidate
>
	<div class="space-y-6">
		<fieldset class="card p-6">
			<legend class="sr-only">The SE</legend>
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="users" class="size-5 text-green-700" />The SE</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<label class="label" for="name">Full name</label>
					<input class="input" id="name" name="name" autocomplete="off" required value={v?.name ?? ''} aria-invalid={!!err.name} aria-describedby={err.name ? 'name-err' : undefined} />
					{#if err.name}<p id="name-err" class="mt-1 text-xs font-semibold text-red-700">{err.name}</p>{/if}
				</div>
				<div>
					<label class="label" for="email">Work email</label>
					<input class="input" id="email" name="email" type="email" autocomplete="off" required value={v?.email ?? ''} aria-invalid={!!err.email} aria-describedby={err.email ? 'email-err' : undefined} />
					{#if err.email}<p id="email-err" class="mt-1 text-xs font-semibold text-red-700">{err.email}</p>{/if}
				</div>
				<div>
					<label class="label" for="title">Title</label>
					<input class="input" id="title" name="title" placeholder="Sales Engineer" value={v?.title ?? ''} />
				</div>
			</div>
		</fieldset>

		<fieldset class="card p-6">
			<legend class="sr-only">Program setup</legend>
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="route" class="size-5 text-green-700" />Program setup</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<div>
					<label class="label" for="start_date">Start date</label>
					<input class="input" id="start_date" name="start_date" type="date" required value={start} oninput={(e) => (startInput = e.currentTarget.value)} aria-invalid={!!err.start_date} />
					<p class="hint">Day 1 of 90. Defaults to today.</p>
					{#if err.start_date}<p class="mt-1 text-xs font-semibold text-red-700">{err.start_date}</p>{/if}
				</div>
				<div>
					<label class="label" for="primary_oem">Primary OEM module</label>
					<select class="input" id="primary_oem" name="primary_oem">
						{#each data.oems as o (o.id)}
							<option value={o.id} selected={(v?.primary_oem || data.oems[0]?.id) === o.id}>{o.title}</option>
						{/each}
					</select>
					<p class="hint">The other OEM module stays self-paced.</p>
					{#if err.primary_oem}<p class="mt-1 text-xs font-semibold text-red-700">{err.primary_oem}</p>{/if}
				</div>
			</div>
		</fieldset>

		<fieldset class="card p-6">
			<legend class="sr-only">Evaluators</legend>
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="clipboard" class="size-5 text-green-700" />Evaluators</h2>
			<p class="hint">You can change these later from the SE’s page.</p>
			<div class="mt-4 grid gap-4 sm:grid-cols-3">
				{@render select('tech', 'Technical evaluator', data.evaluators.tech, v?.tech ?? data.evaluators.tech[0]?.id ?? '')}
				{@render select('manager', 'Pitch evaluator (manager)', data.evaluators.managers, v?.manager ?? data.me)}
				{@render select('sales', 'Pitch evaluator (sales)', data.evaluators.sales, v?.sales ?? data.evaluators.sales[0]?.id ?? '')}
			</div>
		</fieldset>

		<fieldset class="card p-6">
			<legend class="sr-only">Sign-in</legend>
			<h2 class="flex items-center gap-2 text-lg font-extrabold"><Icon name="lock" class="size-5 text-green-700" />Sign-in</h2>
			<div class="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Password">
				{#each [['generate', 'Generate a temporary password'], ['custom', 'Set a password']] as [val, text] (val)}
					<label class="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition has-[:checked]:border-green-500 has-[:checked]:bg-green-50 {passwordMode === val ? '' : 'border-fog'}">
						<input type="radio" name="password_mode" value={val} bind:group={passwordMode} class="accent-green-600" />
						{text}
					</label>
				{/each}
			</div>
			{#if passwordMode === 'custom'}
				<div class="mt-4 max-w-sm">
					<label class="label" for="password">Password</label>
					<input class="input" id="password" name="password" type="text" autocomplete="new-password" minlength="8" aria-invalid={!!err.password} />
					<p class="hint">At least 8 characters. Share it with the SE securely.</p>
				</div>
			{:else}
				<p class="hint mt-3">We’ll show the password once after you enroll.</p>
			{/if}
			{#if err.password}<p class="mt-1 text-xs font-semibold text-red-700">{err.password}</p>{/if}
		</fieldset>
	</div>

	<!-- Derived dates preview -->
	<aside class="xl:sticky xl:top-6 xl:self-start">
		<div class="overflow-hidden rounded-2xl bg-night text-white shadow-xl shadow-night/20">
			<div class="relative p-6">
				<div class="grid-bg absolute inset-0 opacity-60"></div>
				<div class="absolute -top-16 -right-10 size-48 rounded-full bg-green-500/25 blur-3xl"></div>
				<div class="relative">
					<p class="eyebrow text-[10px] text-green-300">Derived dates</p>
					<h2 class="mt-1 text-lg font-extrabold">Key dates for this start</h2>
					{#if preview.length}
						<ol class="mt-5 space-y-3">
							{#each preview as m (m.label)}
								<li class="flex items-center gap-3">
									<span class="grid h-10 w-12 shrink-0 place-items-center rounded-lg text-xs font-extrabold {kindStyle[m.kind]}">D{m.day}</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-sm font-semibold">{m.label}</span>
										<span class="block text-xs text-white/60">{formatDate(m.date, true)} · {relativeDays(m.date, data.today)}</span>
									</span>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="mt-4 text-sm text-white/70">Pick a start date to see the timeline.</p>
					{/if}
				</div>
			</div>
			<div class="border-t border-white/10 bg-white/5 p-6">
				{#if Object.keys(err).length}
					<p class="mb-3 flex items-center gap-2 text-sm font-semibold text-red-300" role="alert"><Icon name="alert" class="size-4" />Fix the highlighted fields.</p>
				{/if}
				<button class="btn-primary w-full rounded-full py-3" disabled={submitting}>
					<Icon name="plus" class="size-4" />{submitting ? 'Enrolling…' : 'Enroll SE'}
				</button>
			</div>
		</div>
	</aside>
</form>

{#snippet select(name: string, label: string, people: { id: string; name: string }[], selected: string)}
	<div>
		<label class="label" for={name}>{label}</label>
		<select class="input" id={name} name={name} aria-invalid={!!err[name]}>
			<option value="" selected={!selected}>Unassigned</option>
			{#each people as p (p.id)}
				<option value={p.id} selected={selected === p.id}>{p.name}</option>
			{/each}
		</select>
		{#if err[name]}<p class="mt-1 text-xs font-semibold text-red-700">{err[name]}</p>{/if}
	</div>
{/snippet}
