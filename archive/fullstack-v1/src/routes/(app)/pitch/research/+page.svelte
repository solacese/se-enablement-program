<script lang="ts">
	import { enhance } from '$app/forms';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatDate } from '$lib/dates';

	let { data, form } = $props();
	const s = $derived(data.scenario);
	let saved = $state(false);
	let saving = $state(false);
	const icons: Record<string, string> = { company_overview: 'broker', stated_priorities: 'target', use_cases: 'sparkles', hypotheses: 'compass' };
</script>

<svelte:head><title>Research · Pitch bootcamp</title></svelte:head>

{#if !s}
	<section class="card p-6">
		<EmptyState icon="search" title="Research opens once your scenario is assigned">
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
		<div class="space-y-5">
			<div>
				<h2 class="text-xl font-extrabold">Research workspace</h2>
				<p class="mt-1 text-sm text-slate-ink">Research {s.company} and what {s.contact_name} cares about. Short notes beat long essays.</p>
			</div>
			{#each data.content.research_prompts as rp, i (rp.id)}
				<div class="card p-5">
					<div class="flex items-start gap-3">
						<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-pitch-100 text-pitch-800"><Icon name={icons[rp.id] ?? 'notes'} class="size-[18px]" /></span>
						<div class="min-w-0 flex-1">
							<label for="r_{rp.id}" class="label">{i + 1}. {rp.title}</label>
							<p id="h_{rp.id}" class="hint -mt-1 mb-2">{rp.hint}</p>
							<textarea id="r_{rp.id}" name="r_{rp.id}" rows="4" class="input" aria-describedby="h_{rp.id}">{s.research[rp.id] ?? ''}</textarea>
						</div>
					</div>
				</div>
			{/each}

			<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-night to-deep p-5 text-white shadow-xl shadow-night/20 sm:p-6">
				<div class="absolute -right-10 -bottom-16 size-48 rounded-full bg-pitch-400/25 blur-3xl"></div>
				<div class="relative">
					<p class="eyebrow text-[10px] text-pitch-300">Scored: Priority Restatement</p>
					<label for="priority_restatement" class="mt-1 block text-lg font-bold">Your priority restatement</label>
					<p id="h_restate" class="mt-1 text-sm text-white/70">
						Write how you'll open: the contact's priorities in their own words, so they say "yes, exactly". You'll say this live.
					</p>
					<textarea
						id="priority_restatement"
						name="priority_restatement"
						rows="4"
						aria-describedby="h_restate"
						class="mt-3 block w-full rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-pitch-300 focus:ring-4 focus:ring-pitch-300/20 focus:outline-none"
						placeholder="You want … so that …"
					>{s.priority_restatement ?? ''}</textarea>
				</div>
			</div>
		</div>

		<aside class="xl:sticky xl:top-24 xl:self-start">
			<div class="card space-y-4 p-5">
				<div>
					<p class="eyebrow text-[10px] text-pitch-800">Researching</p>
					<p class="mt-1 font-bold">{s.contact_name}</p>
					<p class="text-sm text-slate-ink">{s.contact_title ?? ''}{s.contact_title ? ' · ' : ''}{s.company}</p>
				</div>
				{#if s.contact_profile}<p class="rounded-xl bg-pitch-50 p-3 text-sm text-night/80">{s.contact_profile}</p>{/if}
				<button class="btn-pitch w-full" disabled={saving}>
					<Icon name="check" class="size-4" />{saving ? 'Saving…' : 'Save research'}
				</button>
				<div aria-live="polite" class="min-h-5 text-center text-sm">
					{#if saved}<span class="inline-flex items-center gap-1 font-semibold text-green-700"><Icon name="check" class="size-4" />Saved</span>
					{:else if form?.message}<span class="font-semibold text-red-700">{form.message}</span>
					{:else}<span class="text-xs text-slate-ink">Last saved {formatDate(s.updated_at, true)}</span>{/if}
				</div>
				<a href="/pitch/discovery" class="flex items-center justify-between rounded-xl border border-fog/70 px-3 py-2.5 text-sm font-semibold hover:border-pitch-300 hover:bg-pitch-50">
					Next: plan discovery<Icon name="arrow-right" class="size-4" />
				</a>
			</div>
		</aside>
	</form>
{/if}
