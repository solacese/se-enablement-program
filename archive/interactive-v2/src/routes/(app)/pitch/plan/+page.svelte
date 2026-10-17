<script lang="ts">
	import { base } from '$app/paths';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { program } from '$lib/content/program';
	import { learner } from '$lib/data/learner.svelte';
	import { savePlan } from '$lib/pitch';

	const content = program().pitch;
	const s = $derived(learner.state.scenario);
	const deck = content.deck;

	let uid = 0;
	type Obj = { key: number; objection: string; response: string; custom: boolean };
	function initial() {
		const plan = learner.state.scenario?.pitch_plan ?? { sections: [], objections: [], next_step: '' };
		const common = content.common_objections;
		const objs: Obj[] = common.map((o) => ({
			key: uid++,
			objection: o,
			response: plan.objections.find((x) => x.objection === o)?.response ?? '',
			custom: false
		}));
		for (const o of plan.objections) if (!common.includes(o.objection)) objs.push({ key: uid++, ...o, custom: true });
		return {
			chosen: Object.fromEntries(plan.sections.map((x) => [x.name, x.reason])) as Record<string, string>,
			objections: objs,
			next: plan.next_step
		};
	}
	const init = initial();
	let chosen = $state<Record<string, string>>(init.chosen);
	let objections = $state<Obj[]>(init.objections);
	let nextStep = $state(init.next);
	let saved = $state(false);
	let error = $state<string | null>(null);

	function save(e: SubmitEvent) {
		e.preventDefault();
		const plan = {
			sections: Object.entries(chosen).map(([name, reason]) => ({ name, reason })),
			objections: objections.map((o) => ({ objection: o.objection, response: o.response })),
			next_step: nextStep
		};
		let err: string | null = null;
		learner.update((st) => {
			err = savePlan(st, plan);
		});
		error = err;
		saved = !err;
	}

	const chosenCount = $derived(Object.keys(chosen).length);
	const answered = $derived(objections.filter((o) => o.objection.trim() && o.response.trim()).length);

	function toggle(name: string, on: boolean) {
		if (on) chosen[name] = chosen[name] ?? '';
		else delete chosen[name];
		saved = false;
	}
	function addObjection() {
		objections.push({ key: uid++, objection: '', response: '', custom: true });
		saved = false;
		queueMicrotask(() => document.getElementById(`o_${objections.at(-1)!.key}`)?.focus());
	}
	function removeObjection(key: number) {
		objections = objections.filter((o) => o.key !== key);
		saved = false;
	}
</script>

<svelte:head><title>Pitch plan · Pitch bootcamp</title></svelte:head>

{#if !s}
	<section class="card p-6">
		<EmptyState icon="notes" title="Your pitch plan opens once you add your scenario">
			Enter the vertical and contact your manager assigned on the <a href="{base}/pitch/" class="font-semibold text-pitch-800 underline">overview</a>.
		</EmptyState>
	</section>
{:else}
	<form class="grid gap-6 xl:grid-cols-[1fr_22rem]" oninput={() => { saved = false; error = null; }} onsubmit={save}>
		<div class="space-y-6">
			<!-- Deck link -->
			<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-300 via-pitch-400 to-pitch-500 p-6 text-night shadow-xl shadow-pitch-500/25 sm:p-8">
				<div class="absolute -top-20 -right-10 size-64 rounded-full bg-white/30 blur-3xl"></div>
				<div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div class="max-w-lg">
						<p class="eyebrow text-[10px] text-night/70">Step 1</p>
						<h2 class="mt-1 text-2xl font-extrabold">Open the {deck.title}</h2>
						<p class="mt-2 text-sm text-night/80">
							The deck lives on Solace Hub. This app links to it rather than storing a copy, so you always work from the latest version.
						</p>
					</div>
					<a href={deck.url} target="_blank" rel="noopener noreferrer" class="btn-dark shrink-0 rounded-full px-6 py-3 text-base">
						Open on Solace Hub<Icon name="external" class="size-4" /><span class="sr-only">(opens in a new tab)</span>
					</a>
				</div>
			</section>

			<!-- Sections -->
			<section class="card p-5 sm:p-6" aria-labelledby="sections-h">
				<div class="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 id="sections-h" class="text-lg font-extrabold">Choose your deck sections</h2>
						<p class="text-sm text-slate-ink">Pick only what ties to {s.contact_name}'s priorities, and say why.</p>
					</div>
					<Badge tone="amber">{chosenCount} chosen</Badge>
				</div>
				<ul class="mt-4 space-y-2">
					{#each deck.sections as name, i (name)}
						{@const on = name in chosen}
						<li class="rounded-2xl border transition {on ? 'border-pitch-300 bg-pitch-50' : 'border-fog/70 hover:border-pitch-300'}">
							<label class="flex cursor-pointer items-center gap-3 p-3.5">
								<input
									type="checkbox"
									name="section"
									value={name}
									checked={on}
									onchange={(e) => toggle(name, e.currentTarget.checked)}
									class="size-5 rounded accent-pitch-500"
								/>
								<span class="flex-1 font-semibold">{name}</span>
								<span class="text-xs font-semibold text-slate-ink">{String(i + 1).padStart(2, '0')}</span>
							</label>
							{#if on}
								<div class="px-3.5 pb-3.5 sm:pl-11">
									<label for="reason_{i}" class="sr-only">Why this section: {name}</label>
									<input
										id="reason_{i}"
										name="reason_{i}"
										class="input"
										bind:value={chosen[name]}
										placeholder="Why this section? Which priority does it answer?"
									/>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>

			<!-- Objections -->
			<section class="card p-5 sm:p-6" aria-labelledby="obj-h">
				<div class="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 id="obj-h" class="text-lg font-extrabold">Prepare for objections</h2>
						<p class="text-sm text-slate-ink">Address the concern directly. Don't deflect. Leave a common one blank if it won't come up.</p>
					</div>
					<Badge tone={answered ? 'green' : 'grey'}>{answered} prepared</Badge>
				</div>
				<ul class="mt-4 space-y-3">
					{#each objections as o (o.key)}
						<li class="rounded-2xl bg-mist p-4">
							{#if o.custom}
								<div class="flex items-start gap-2">
									<div class="flex-1">
										<label for="o_{o.key}" class="label">Objection</label>
										<input id="o_{o.key}" name="objection" class="input" bind:value={o.objection} placeholder="What might they push back on?" />
									</div>
									<button type="button" class="mt-7 rounded-lg p-2 text-slate-ink hover:bg-red-50 hover:text-red-700" onclick={() => removeObjection(o.key)} aria-label="Remove objection">
										<Icon name="trash" class="size-4" />
									</button>
								</div>
							{:else}
								<input type="hidden" name="objection" value={o.objection} />
								<p class="flex items-start gap-2 font-semibold"><Icon name="message" class="mt-0.5 size-4 shrink-0 text-pitch-700" />“{o.objection}”</p>
							{/if}
							<label for="resp_{o.key}" class="sr-only">Your response{o.custom ? '' : ` to: ${o.objection}`}</label>
							<textarea id="resp_{o.key}" name="response" rows="2" class="input mt-2" bind:value={o.response} placeholder="Your response"></textarea>
						</li>
					{/each}
				</ul>
				<button type="button" class="btn-ghost mt-4" onclick={addObjection}><Icon name="plus" class="size-4" />Add an objection</button>
			</section>

			<!-- Next step -->
			<section class="card p-5 sm:p-6">
				<label for="next_step" class="text-lg font-extrabold">Intended next step</label>
				<p class="hint mb-3">How you'll close: a specific, dated action the contact agrees to.</p>
				<textarea id="next_step" name="next_step" rows="2" class="input" bind:value={nextStep} placeholder="e.g. A 90-minute architecture workshop with the ops team next week"></textarea>
			</section>
		</div>

		<aside class="xl:sticky xl:top-24 xl:self-start">
			<div class="card space-y-4 p-5">
				<h3 class="font-bold">Plan summary</h3>
				<ul class="space-y-2 text-sm">
					<li class="flex justify-between"><span>Deck sections</span><span class="font-bold">{chosenCount}</span></li>
					<li class="flex justify-between"><span>With a reason</span><span class="font-bold">{Object.values(chosen).filter((r) => r.trim()).length}</span></li>
					<li class="flex justify-between"><span>Objections prepared</span><span class="font-bold">{answered}</span></li>
					<li class="flex justify-between"><span>Next step</span><span class="font-bold">{nextStep.trim() ? 'Set' : '–'}</span></li>
				</ul>
				<button class="btn-pitch w-full"><Icon name="check" class="size-4" />Save pitch plan</button>
				<div aria-live="polite" class="min-h-5 text-center text-sm">
					{#if saved}<span class="inline-flex items-center gap-1 font-semibold text-green-700"><Icon name="check" class="size-4" />Saved</span>
					{:else if error}<span class="font-semibold text-red-700">{error}</span>{/if}
				</div>
			</div>
		</aside>
	</form>
{/if}
