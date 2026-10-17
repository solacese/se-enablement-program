<script lang="ts">
	import { base } from '$app/paths';
	import { untrack } from 'svelte';
	import { EVIDENCE_LABELS, type EvidenceType } from '$lib/content/types';
	import { StepTracker, provideSteps } from '$lib/components/content/steps.svelte';
	import EvidenceList from '$lib/components/EvidenceList.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ProgressRing from '$lib/components/ui/ProgressRing.svelte';
	import { learner } from '$lib/data/learner.svelte';
	import { formatDate, formatRange } from '$lib/dates';
	import { buildView } from '$lib/progress';

	let { data } = $props();
	const m = $derived(data.module);
	const view = $derived(buildView(learner.state)!);
	const L = $derived({
		state: view.modules.find((x) => x.id === data.module.id)!,
		done: Object.keys(learner.state.steps[data.module.id] ?? {}),
		evidence: learner.state.evidence.filter((e) => e.module_id === data.module.id),
		checkpointDate: view.checkpoints.find((c) => c.id === data.module.checkpoint)?.date ?? null
	});
	const locked = $derived(L.state.status === 'locked');
	const submitted = $derived(!!L.state.exitProofSubmittedAt);
	const prerequisites = $derived(data.prerequisites.map((p) => ({ ...p, met: !L.state.lockedBy.includes(p.title) })));

	// One tracker per module page; <Step> components in the Markdown read it from context.
	const tracker = untrack(
		() =>
			new StepTracker(data.module.steps, L.done, !locked, async (step, done) => {
				await learner.setStep(data.module.id, step, done);
				return !learner.saveError;
			})
	);
	provideSteps(tracker);
	// Resync when the module or saved data changes; only those inputs are tracked.
	$effect.pre(() => {
		const steps = data.module.steps;
		const done = L.done;
		const editable = !locked;
		untrack(() => tracker.sync(steps, done, editable));
	});

	let evType = $state<EvidenceType>(untrack(() => data.module.evidence_types[0] ?? 'notes'));
	$effect.pre(() => {
		if (!data.module.evidence_types.includes(untrack(() => evType))) evType = data.module.evidence_types[0] ?? 'notes';
	});
	let busy = $state(false);
	let evidenceError = $state<string | null>(null);
	let evidenceSaved = $state(false);
	let submitError = $state<string | null>(null);
	const weeks = $derived(m.weeks.length > 1 ? `Weeks ${m.weeks[0]}–${m.weeks.at(-1)}` : `Week ${m.weeks[0]}`);
	const pendingSteps = $derived(m.steps.length - tracker.count);

	async function saveEvidence(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const f = new FormData(form);
		const file = f.get('file');
		busy = true;
		evidenceSaved = false;
		evidenceError = await learner.addEvidence(m.id, {
			type: evType,
			title: String(f.get('title') ?? ''),
			content: String(f.get('content') ?? ''),
			file: file instanceof File ? file : null
		});
		busy = false;
		if (!evidenceError) {
			form.reset();
			evidenceSaved = true;
		}
	}

	function submitProof(e: SubmitEvent) {
		e.preventDefault();
		submitError = learner.submitExitProof(m.id);
	}
</script>

<svelte:head><title>{m.title} · Solace SE Journey</title></svelte:head>

<nav class="mb-4 flex items-center gap-2 text-sm text-slate-ink" aria-label="Breadcrumb">
	<a href="{base}/modules/" class="font-semibold hover:text-night">Modules</a>
	<Icon name="chevron-right" class="size-4" />
	<span>Block {data.block.number}: {data.block.theme}</span>
</nav>

<!-- Header -->
<header class="relative overflow-hidden rounded-3xl bg-night px-6 py-8 text-white shadow-xl shadow-night/20 sm:px-10 sm:py-10">
	<div class="grid-bg absolute inset-0 opacity-60"></div>
	<div class="absolute -top-24 -right-10 size-80 animate-float rounded-full bg-green-500/30 blur-3xl"></div>
	<div class="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex max-w-3xl gap-5">
			<span class="hidden size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-night shadow-lg shadow-green-500/30 sm:grid">
				<Icon name={m.icon} class="size-8" />
			</span>
			<div>
				<p class="eyebrow text-green-400">Module {data.index} of {data.total} · {weeks}{L ? ` · ${formatRange(L.state.startDate, L.state.endDate)}` : ''}</p>
				<h1 class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{m.title}</h1>
				<p class="mt-3 text-lg text-white/75">{m.summary}</p>
				<div class="mt-4 flex flex-wrap gap-2">
					{#if submitted}<Badge tone="green"><Icon name="check" class="size-3.5" />Exit proof submitted</Badge>
					{:else if locked}<Badge tone="grey"><Icon name="lock" class="size-3.5" />Locked</Badge>
					{:else if L.state.status === 'in_progress'}<Badge tone="sky">In progress</Badge>
					{:else}<Badge tone="blue">Ready to start</Badge>{/if}
					{#if L.state.behind}<Badge tone="amber">Behind schedule</Badge>{/if}
					{#if L.state.isPrimaryOem}<Badge tone="amber">Primary OEM</Badge>{/if}
					{#if L.state.selfPaced}<Badge tone="grey">Self-paced</Badge>{/if}
				</div>
			</div>
		</div>
			<div class="flex shrink-0 items-center gap-4 rounded-2xl bg-white/5 p-4 pr-6 ring-1 ring-white/10">
				<ProgressRing value={tracker.count} max={m.steps.length} size={92} stroke={9} label="Steps complete" track="rgba(255,255,255,.12)">
					<span class="text-xl font-extrabold">{tracker.count}<span class="text-sm text-white/50">/{m.steps.length}</span></span>
				</ProgressRing>
				<div class="text-sm whitespace-nowrap">
					<p class="font-semibold">Steps done</p>
					<p class="text-white/60">{L.state.evidenceCount} evidence item{L.state.evidenceCount === 1 ? '' : 's'}</p>
					<a href="#exit-proof" class="mt-1 inline-block font-semibold text-green-300 hover:underline">Exit proof ↓</a>
				</div>
			</div>
	</div>
</header>

{#if locked}
	<div class="mt-6 flex items-start gap-3 rounded-2xl border border-fog bg-white p-4">
		<Icon name="lock" class="mt-0.5 size-5 shrink-0 text-deep" />
		<div class="text-sm">
			<p class="font-semibold">You can preview this module, but it unlocks after: {L.state.lockedBy.join(', ')}.</p>
			<p class="text-slate-ink">Modules unlock in order so each exit proof is in before the next module starts. Your manager can override this.</p>
		</div>
	</div>
{/if}

<div class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
	<div class="min-w-0 space-y-10">
		<!-- 1. Overview -->
		<section aria-labelledby="overview">
			<h2 id="overview" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">1</span>Overview</h2>
			<div class="mt-5 grid gap-4 md:grid-cols-2">
				<div class="card p-5">
					<p class="eyebrow text-[10px] text-green-700">What you'll build</p>
					<p class="mt-2 text-night/85">{m.summary}</p>
				</div>
				<div class="card border-pitch-300/50 bg-gradient-to-br from-pitch-50 to-white p-5">
					<p class="eyebrow text-[10px] text-pitch-700">Why it matters with customers</p>
					<p class="mt-2 text-night/85">{m.why_it_matters}</p>
				</div>
				<div class="card flex items-center gap-4 p-5">
					<span class="grid size-11 place-items-center rounded-xl bg-deep-100 text-deep"><Icon name="clock" /></span>
					<div>
						<p class="eyebrow text-[10px] text-slate-ink">Estimated time</p>
						<p class="font-bold">{m.estimated_hours ? `About ${m.estimated_hours} hours` : '—'} <span class="font-medium text-slate-ink">· {weeks}</span></p>
					</div>
				</div>
				<div class="card p-5">
					<p class="eyebrow text-[10px] text-slate-ink">Prerequisites</p>
					{#if prerequisites.length}
						<ul class="mt-2 space-y-1.5">
							{#each prerequisites as p (p.id)}
								<li class="flex items-center gap-2 text-sm">
									<Icon name={p.met === false ? 'lock' : 'check'} class="size-4 {p.met === false ? 'text-slate-ink' : 'text-green-700'}" />
									{#if p.isModule}<a href="{base}/modules/{p.id}/" class="font-semibold hover:underline">{p.title}</a>{:else}<a href="{base}/dashboard/#setup" class="font-semibold hover:underline">{p.title}</a>{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2 text-sm font-semibold">None. Start here.</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- 2. Steps (Markdown body) -->
		<section aria-labelledby="steps">
			<div class="flex flex-wrap items-end justify-between gap-2">
				<h2 id="steps" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">2</span>Steps</h2>
				{#if !locked}<p class="text-sm text-slate-ink">Check steps off as you go. Progress saves automatically.</p>{/if}
			</div>
			{#if tracker.error}<p class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">{tracker.error}</p>{/if}
			<article class="prose mt-4 max-w-none prose-headings:text-night prose-a:text-green-700 prose-strong:text-night">
				<data.Body />
			</article>
		</section>

		<!-- 3. Exit proof -->
		<section id="exit-proof" class="scroll-mt-24" aria-labelledby="exit-proof-h">
			<h2 id="exit-proof-h" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">3</span>Exit proof</h2>
			<div class="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-night shadow-xl shadow-green-500/20">
				<div class="absolute -right-10 -bottom-16 size-48 rounded-full bg-white/20 blur-2xl"></div>
				<p class="eyebrow relative text-[11px] text-night/70">Show it working</p>
				<p class="relative mt-2 text-xl font-extrabold">{m.exit_proof}</p>
				<p class="relative mt-2 text-sm text-night/75">Accepted evidence: {m.evidence_types.map((t) => EVIDENCE_LABELS[t]).join(', ')}.</p>
			</div>

				{#if submitted}
					<div class="mt-4 flex items-center gap-3 rounded-2xl border border-green-300 bg-green-50 p-4">
						<span class="grid size-9 place-items-center rounded-full bg-green-500 text-night"><Icon name="check" class="size-5" strokeWidth={3} /></span>
						<div class="text-sm">
							<p class="font-bold">Exit proof submitted {formatDate(L.state.exitProofSubmittedAt, true)}.</p>
							<p class="text-slate-ink">Bring it to the {data.checkpoint?.title ?? 'checkpoint'}. You can still add evidence.</p>
						</div>
					</div>
				{/if}

				<div class="mt-6 grid gap-6 lg:grid-cols-2">
					<form onsubmit={saveEvidence} class="card space-y-4 p-5" novalidate>
						<fieldset disabled={locked}>
							<legend class="font-bold">Add evidence</legend>
							<div class="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Kind of evidence">
								{#each m.evidence_types as t (t)}
									<label class="flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition {evType === t ? 'border-green-500 bg-green-50' : 'border-fog hover:border-deep-300'}">
										<input type="radio" name="type" value={t} bind:group={evType} class="sr-only" />
										<Icon name={t} class="size-4 {evType === t ? 'text-green-700' : 'text-slate-ink'}" />{EVIDENCE_LABELS[t]}
									</label>
								{/each}
							</div>
							<div class="mt-4">
								<label class="label" for="ev-title">Title <span class="font-normal text-slate-ink">(optional)</span></label>
								<input id="ev-title" name="title" class="input" placeholder="e.g. Failover with sequence numbers" />
							</div>
							<div class="mt-4">
								{#if evType === 'notes'}
									<label class="label" for="ev-content">Notes</label>
									<textarea id="ev-content" name="content" rows="5" class="input" placeholder="What you built, what broke, and how you fixed it."></textarea>
								{:else if evType === 'config'}
									<label class="label" for="ev-content">Config snippet</label>
									<textarea id="ev-content" name="content" rows="6" class="input font-mono text-xs" placeholder="Paste a docker-compose.yml or CLI config. Remove secrets."></textarea>
									<label class="label mt-3" for="ev-file">…or attach a file</label>
									<input id="ev-file" name="file" type="file" accept=".yml,.yaml,.json,.txt,.conf,.xml,.properties" class="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-night file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
								{:else if evType === 'screenshot'}
									<label class="label" for="ev-file">Screenshot</label>
									<input id="ev-file" name="file" type="file" accept="image/*" required class="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-night file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
									<p class="hint">PNG, JPG, GIF or WebP, up to 5 MB. Saved in this browser.</p>
								{:else}
									<label class="label" for="ev-content">Recording link</label>
									<input id="ev-content" name="content" type="url" required class="input" placeholder="https://" />
								{/if}
							</div>
							{#if evidenceError}<p class="mt-3 text-sm font-medium text-red-700" role="alert">{evidenceError}</p>{/if}
							{#if evidenceSaved}<p class="mt-3 text-sm font-semibold text-green-700" role="status">Evidence saved.</p>{/if}
							<button class="btn-dark mt-4 w-full" disabled={busy}><Icon name="upload" class="size-4" />{busy ? 'Saving…' : 'Save evidence'}</button>
						</fieldset>
					</form>

					<div class="space-y-4">
						{#if L.evidence.length}
							<EvidenceList items={L.evidence}>
								{#snippet actions(ev)}
									<button class="rounded-lg p-1.5 text-slate-ink hover:bg-red-50 hover:text-red-700" aria-label="Delete {ev.title ?? 'evidence'}" onclick={() => learner.deleteEvidence(ev.id)}><Icon name="trash" class="size-4" /></button>
								{/snippet}
							</EvidenceList>
						{:else}
							<EmptyState icon="upload" title="No evidence yet">Add notes, screenshots, configs or a recording link. Evaluators see them before your checkpoint.</EmptyState>
						{/if}

						{#if !submitted}
							<form onsubmit={submitProof} class="card p-5">
								<p class="font-bold">Ready to submit?</p>
								<p class="mt-1 text-sm text-slate-ink">
									Submitting marks this module complete and unlocks the next one.
									{#if pendingSteps > 0}<span class="font-semibold text-pitch-700">You still have {pendingSteps} unchecked step{pendingSteps === 1 ? '' : 's'}.</span>{/if}
								</p>
								{#if submitError}<p class="mt-2 text-sm font-medium text-red-700" role="alert">{submitError}</p>{/if}
								<button class="btn-primary mt-4 w-full" disabled={locked || L.evidence.length === 0}><Icon name="check" class="size-4" strokeWidth={3} />Submit exit proof</button>
							</form>
						{/if}
					</div>
				</div>
		</section>

		<!-- 4. Checkpoint prep -->
		<section aria-labelledby="prep">
			<h2 id="prep" class="flex items-center gap-3 text-2xl font-extrabold"><span class="grid size-8 place-items-center rounded-lg bg-night text-sm text-green-400">4</span>Checkpoint prep</h2>
			<div class="card mt-5 p-6">
				{#if data.checkpoint}
					<p class="text-sm text-slate-ink">
						This module is covered in the <a href="{base}/checkpoints/{data.checkpoint.id}/" class="font-semibold text-green-700 hover:underline">{data.checkpoint.title}</a>{L.checkpointDate ? ` on ${formatDate(L.checkpointDate, true)}` : ` (day ${data.checkpoint.day})`}. A senior SE may ask:
					</p>
				{/if}
				<ol class="mt-4 space-y-3">
					{#each [...m.prep_questions, ...(data.checkpoint?.general ?? [])] as q, i (q)}
						<li class="flex gap-3">
							<span class="grid size-7 shrink-0 place-items-center rounded-full bg-deep-100 text-xs font-bold text-deep">{i + 1}</span>
							<span class="pt-0.5">“{q}”</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<nav class="grid gap-3 sm:grid-cols-2" aria-label="Module navigation">
			{#if data.prev}
				<a href="{base}/modules/{data.prev.id}/" class="card flex items-center gap-3 p-4 hover:border-deep-300">
					<Icon name="chevron-left" class="size-5 text-slate-ink" />
					<span><span class="block text-xs text-slate-ink">Previous</span><span class="font-semibold">{data.prev.title}</span></span>
				</a>
			{:else}<span></span>{/if}
			{#if data.next}
				<a href="{base}/modules/{data.next.id}/" class="card flex items-center justify-end gap-3 p-4 text-right hover:border-deep-300">
					<span><span class="block text-xs text-slate-ink">Next</span><span class="font-semibold">{data.next.title}</span></span>
					<Icon name="chevron-right" class="size-5 text-slate-ink" />
				</a>
			{/if}
		</nav>
	</div>

	<!-- Sticky step navigator -->
	<aside class="hidden xl:block">
		<div class="sticky top-8 space-y-4">
			<div class="card p-5">
				<p class="eyebrow text-[10px] text-slate-ink">On this page</p>
				<ol class="mt-3 space-y-1">
					{#each m.steps as s, i (s.id)}
						<li>
							<a href="#step-{s.id}" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-mist">
								<span class="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold {tracker.done[s.id] ? 'bg-green-500 text-night' : 'bg-deep-100 text-deep'}">
									{#if tracker.done[s.id]}<Icon name="check" class="size-3" strokeWidth={3.5} />{:else}{i + 1}{/if}
								</span>
								<span class="truncate {tracker.done[s.id] ? 'text-slate-ink' : 'font-medium'}">{s.title}</span>
							</a>
						</li>
					{/each}
					<li class="border-t border-fog/70 pt-1">
						<a href="#exit-proof" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50">
							<Icon name="target" class="size-5" />Exit proof
						</a>
					</li>
					<li>
						<a href="#prep" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-deep hover:bg-mist">
							<Icon name="flag" class="size-5" />Checkpoint prep
						</a>
					</li>
				</ol>
			</div>
		</div>
	</aside>
</div>
