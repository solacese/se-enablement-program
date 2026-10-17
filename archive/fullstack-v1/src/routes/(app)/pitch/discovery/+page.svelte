<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	let { data, form } = $props();
	const s = $derived(data.scenario);

	let uid = 0;
	type Row = { key: number; question: string; priority: string };
	const initial = (): Row[] => {
		const r = (data.scenario?.discovery ?? []).map((x) => ({ key: uid++, ...x }));
		return r.length ? r : [{ key: uid++, question: '', priority: '' }];
	};
	let rows = $state<Row[]>(initial());

	let saved = $state(false);
	let saving = $state(false);

	const CLOSED = /^\s*(do|does|is|are|can|will|have|did)\b/i;
	const isClosed = (q: string) => CLOSED.test(q);
	const filled = $derived(rows.filter((r) => r.question.trim()));
	const closedCount = $derived(filled.filter((r) => isClosed(r.question)).length);
	const untied = $derived(filled.filter((r) => !r.priority.trim()).length);
	const coverage = $derived(
		data.priorities.map((p) => ({ p, n: filled.filter((r) => r.priority.trim().toLowerCase() === p.toLowerCase()).length }))
	);

	function add() {
		rows.push({ key: uid++, question: '', priority: '' });
		saved = false;
		queueMicrotask(() => document.getElementById(`q_${rows.at(-1)!.key}`)?.focus());
	}
	function remove(key: number) {
		rows = rows.filter((r) => r.key !== key);
		saved = false;
	}
</script>

<svelte:head><title>Discovery · Pitch bootcamp</title></svelte:head>

{#if !s}
	<section class="card p-6">
		<EmptyState icon="message" title="Discovery planning opens once your scenario is assigned">
			Your manager assigns your vertical and contact before day {data.pitch.startDay}.
		</EmptyState>
	</section>
{:else}
	<form
		method="POST"
		action="?/save"
		class="grid gap-6 xl:grid-cols-[1fr_22rem]"
		oninput={() => (saved = false)}
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				saving = false;
				saved = result.type === 'success';
			};
		}}
	>
		<div>
			<h2 class="text-xl font-extrabold">Discovery planner</h2>
			<p class="mt-1 text-sm text-slate-ink">
				Draft open, research-based questions for {s.contact_name}. Tie each one to a priority they stated, so every answer moves your pitch.
			</p>

			<datalist id="priorities">
				{#each data.priorities as p (p)}<option value={p}></option>{/each}
			</datalist>

			<ol class="mt-5 space-y-3">
				{#each rows as row, i (row.key)}
					{@const closed = isClosed(row.question)}
					<li class="card p-4 sm:p-5 {closed ? 'ring-2 ring-pitch-300' : ''}">
						<div class="flex items-start gap-3">
							<span class="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-night text-xs font-bold text-pitch-300">{i + 1}</span>
							<div class="grid min-w-0 flex-1 gap-3 md:grid-cols-[1fr_15rem]">
								<div>
									<label for="q_{row.key}" class="label">Question</label>
									<textarea id="q_{row.key}" name="question" rows="3" class="input" bind:value={row.question} placeholder="How do you … today? What happens when …?" aria-describedby={closed ? `c_${row.key}` : undefined}></textarea>
									{#if closed}
										<p id="c_{row.key}" class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-pitch-800">
											<Icon name="info" class="mt-px size-3.5 shrink-0" />
											This looks like a yes/no question. Try starting with "How", "What" or "Walk me through".
										</p>
									{/if}
								</div>
								<div>
									<label for="p_{row.key}" class="label">Tied to priority</label>
									<input id="p_{row.key}" name="priority" list="priorities" class="input" bind:value={row.priority} placeholder="Pick or type a priority" autocomplete="off" />
								</div>
							</div>
							<button type="button" class="mt-1 rounded-lg p-2 text-slate-ink hover:bg-red-50 hover:text-red-700" onclick={() => remove(row.key)} aria-label="Remove question {i + 1}">
								<Icon name="trash" class="size-4" />
							</button>
						</div>
					</li>
				{/each}
			</ol>
			<button type="button" class="btn-ghost mt-4" onclick={add}><Icon name="plus" class="size-4" />Add a question</button>
		</div>

		<aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
			<div class="card space-y-4 p-5">
				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="rounded-xl bg-mist p-2">
						<p class="text-2xl font-extrabold">{filled.length}</p>
						<p class="text-[11px] font-semibold text-slate-ink">questions</p>
					</div>
					<div class="rounded-xl p-2 {closedCount ? 'bg-pitch-50' : 'bg-green-50'}">
						<p class="text-2xl font-extrabold {closedCount ? 'text-pitch-800' : 'text-green-800'}">{closedCount}</p>
						<p class="text-[11px] font-semibold text-slate-ink">look closed</p>
					</div>
					<div class="rounded-xl p-2 {untied ? 'bg-pitch-50' : 'bg-green-50'}">
						<p class="text-2xl font-extrabold {untied ? 'text-pitch-800' : 'text-green-800'}">{untied}</p>
						<p class="text-[11px] font-semibold text-slate-ink">no priority</p>
					</div>
				</div>
				<button class="btn-pitch w-full" disabled={saving}><Icon name="check" class="size-4" />{saving ? 'Saving…' : 'Save discovery plan'}</button>
				<div aria-live="polite" class="min-h-5 text-center text-sm">
					{#if saved}<span class="inline-flex items-center gap-1 font-semibold text-green-700"><Icon name="check" class="size-4" />Saved</span>
					{:else if form?.message}<span class="font-semibold text-red-700">{form.message}</span>{/if}
				</div>
			</div>

			<div class="card p-5">
				<h3 class="font-bold">Stated priorities</h3>
				{#if coverage.length}
					<p class="hint">From your research. Aim for at least two questions each.</p>
					<ul class="mt-3 space-y-2">
						{#each coverage as c (c.p)}
							<li class="flex items-start justify-between gap-3 text-sm">
								<span class="flex items-start gap-2"><Icon name="target" class="mt-0.5 size-4 shrink-0 text-pitch-700" />{c.p}</span>
								<Badge tone={c.n >= 2 ? 'green' : c.n ? 'amber' : 'grey'}>{c.n}</Badge>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-slate-ink">
						Add the contact's stated priorities on the <a href="/pitch/research" class="font-semibold text-pitch-800 underline">research page</a>, one per line, to pick them here.
					</p>
				{/if}
			</div>
		</aside>
	</form>
{/if}
