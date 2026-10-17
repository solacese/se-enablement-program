<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatDate } from '$lib/dates';

	let { data, form } = $props();

	let draft = $state<string | null>(null);
	let saving = $state(false);
	let gutter = $state<HTMLDivElement>();

	const text = $derived<string>(draft ?? (form && 'text' in form && typeof form.text === 'string' ? form.text : data.text));
	const dirty = $derived(draft !== null && draft !== data.text);
	const lineCount = $derived(text.split('\n').length);
	const fileName = $derived(data.path.split('/').pop());
	const isModule = $derived(data.path.startsWith('content/modules/'));

	function syncScroll(e: Event) {
		if (gutter) gutter.scrollTop = (e.currentTarget as HTMLTextAreaElement).scrollTop;
	}

	function onKey(e: KeyboardEvent) {
		// Tab inserts two spaces (YAML forbids tabs). Shift+Tab still moves focus out.
		if (e.key === 'Tab' && !e.shiftKey && data.editable) {
			const t = e.currentTarget as HTMLTextAreaElement;
			e.preventDefault();
			const { selectionStart: a, selectionEnd: b } = t;
			draft = text.slice(0, a) + '  ' + text.slice(b);
			requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
		}
	}

	beforeNavigate((nav) => {
		if (dirty && !saving && nav.type !== 'form' && !confirm('Discard unsaved changes?')) nav.cancel();
	});
</script>

<svelte:head><title>{fileName} · Program content · Solace SE Journey</title></svelte:head>

<a href="/content" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-deep hover:underline">
	<Icon name="chevron-right" class="size-4 rotate-180" />Program content
</a>

<PageHeader eyebrow={data.kind === 'markdown' ? 'Markdown + front matter' : 'YAML'} title={fileName ?? data.path}>
	<p class="mt-2 font-mono text-sm text-white/70">{data.path}</p>
	<div class="mt-4 flex flex-wrap gap-2">
		{#if data.editable}
			<Badge tone="green"><Icon name="edit" class="size-3" />Editable in development</Badge>
		{:else}
			<Badge tone="grey"><Icon name="lock" class="size-3" />Read-only</Badge>
		{/if}
		<Badge tone={data.check.problem ? 'red' : 'sky'}>{data.check.problem ? 'Has problems' : `Valid · ${data.check.summary}`}</Badge>
		<span class="text-xs text-white/60 self-center">Modified {formatDate(data.updated, true)}</span>
	</div>
</PageHeader>

{#if !data.editable}
	<div class="mt-6 flex gap-3 rounded-2xl border border-deep-100 bg-deep-100/40 p-4 text-sm text-deep" role="note">
		<Icon name="info" class="mt-0.5 size-5 shrink-0" />
		<p><span class="font-bold">Content is version-controlled.</span> Edit the file in the repo and redeploy.</p>
	</div>
{/if}

<div class="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
	<form
		method="POST"
		action="?/save&path={encodeURIComponent(data.path)}"
		class="min-w-0"
		use:enhance={() => {
			saving = true;
			return async ({ update, result }) => {
				await update({ reset: false, invalidateAll: true });
				if (result.type === 'success') draft = null;
				saving = false;
			};
		}}
	>
		<div class="overflow-hidden rounded-2xl bg-night shadow-xl shadow-night/20 ring-1 ring-night">
			<div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
				<span class="flex items-center gap-2">
					<span class="flex gap-1.5" aria-hidden="true"><span class="size-3 rounded-full bg-red-400/80"></span><span class="size-3 rounded-full bg-pitch-400/80"></span><span class="size-3 rounded-full bg-green-500/80"></span></span>
					<span class="ml-2 font-mono text-xs text-white/70">{fileName}{dirty ? ' •' : ''}</span>
				</span>
				<span class="font-mono text-[11px] text-white/50">{lineCount} lines</span>
			</div>
			<div class="relative flex h-[65vh] min-h-96">
				<div bind:this={gutter} class="w-12 shrink-0 overflow-hidden border-r border-white/10 bg-night-900 py-3 pr-2 text-right font-mono text-[13px] leading-6 text-white/30 select-none" aria-hidden="true">
					{#each { length: lineCount } as _, i (i)}<div>{i + 1}</div>{/each}
				</div>
				<label for="editor" class="sr-only">File contents</label>
				<textarea
					id="editor"
					name="text"
					class="h-full min-w-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre text-green-50 caret-green-400 focus:outline-none"
					spellcheck="false"
					autocapitalize="off"
					wrap="off"
					readonly={!data.editable}
					value={text}
					oninput={(e) => (draft = e.currentTarget.value)}
					onscroll={syncScroll}
					onkeydown={onKey}
				></textarea>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-3">
			{#if data.editable}
				<button class="btn-primary" disabled={saving || !dirty}><Icon name="check" class="size-4" />{saving ? 'Saving…' : 'Validate and save'}</button>
				<button type="button" class="btn-ghost" disabled={!dirty || saving} onclick={() => (draft = null)}>Discard changes</button>
			{/if}
			{#if form && 'ok' in form && form.ok && !dirty}
				<p class="flex items-center gap-1.5 text-sm font-semibold text-green-700" role="status"><Icon name="check" class="size-4" />{form.ok}</p>
			{:else if form && 'message' in form && form.message}
				<p class="flex items-center gap-1.5 text-sm font-semibold text-red-700" role="alert"><Icon name="alert" class="size-4" />{form.message}</p>
			{:else if data.check.problem}
				<p class="flex items-center gap-1.5 text-sm font-semibold text-red-700"><Icon name="alert" class="size-4" />{data.check.problem}</p>
			{/if}
		</div>
	</form>

	<aside class="space-y-4">
		{#if isModule}
			<section class="card p-5" aria-labelledby="guide-h">
				<h2 id="guide-h" class="flex items-center gap-2 font-extrabold"><Icon name="book" class="size-4 text-green-700" />Module body tags</h2>
				<p class="hint">The body is Markdown. These tags add structure; no imports needed.</p>
				<dl class="mt-4 space-y-4 text-sm">
					<div>
						<dt><code class="rounded bg-mist px-1.5 py-0.5 text-xs font-semibold text-deep">&lt;Step id="…" title="…" minutes="…"&gt;</code></dt>
						<dd class="mt-1 text-slate-ink">One checklist step, closed with <code class="text-xs">&lt;/Step&gt;</code>. Keep <code class="text-xs">id</code> stable: progress is saved against it.</dd>
					</div>
					<div>
						<dt><code class="rounded bg-mist px-1.5 py-0.5 text-xs font-semibold text-deep">&lt;Verify&gt;…&lt;/Verify&gt;</code></dt>
						<dd class="mt-1 text-slate-ink">A “how to verify” hint inside a step.</dd>
					</div>
					<div>
						<dt><code class="rounded bg-mist px-1.5 py-0.5 text-xs font-semibold text-deep">&lt;Callout title="…" tone="tip"&gt;</code></dt>
						<dd class="mt-1 text-slate-ink">A highlighted note. Tone is <code class="text-xs">info</code>, <code class="text-xs">tip</code> or <code class="text-xs">warning</code>.</dd>
					</div>
				</dl>
				<pre class="mt-4 overflow-x-auto rounded-xl bg-night p-3 font-mono text-[11px] leading-5 text-green-100">{`<Step id="ha-manual" title="Build an HA group" minutes="120">

Instructions in Markdown…

<Verify>
What a working setup looks like.
</Verify>

</Step>`}</pre>
			</section>
		{/if}
		<section class="card p-5">
			<h2 class="flex items-center gap-2 font-extrabold"><Icon name="check" class="size-4 text-green-700" />Before saving</h2>
			<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-ink">
				<li>YAML must parse. Indent with spaces, not tabs.</li>
				{#if data.kind === 'markdown'}<li>Front matter sits between <code class="text-xs">---</code> lines and needs an <code class="text-xs">id</code>.</li>{/if}
				<li>Referenced module and task ids must exist.</li>
				<li>Never commit customer or contact data.</li>
			</ul>
		</section>
	</aside>
</div>
