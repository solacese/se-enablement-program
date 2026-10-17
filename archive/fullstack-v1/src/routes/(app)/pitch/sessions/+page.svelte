<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatDate, formatRange, relativeDays } from '$lib/dates';
	import type { PitchSession } from '$lib/types';

	let { data } = $props();
	const p = $derived(data.pitch);
	const rubric = $derived(data.content.rubric);
	const dims = $derived(rubric.dimensions);
	const dimTitle = (id: string) => dims.find((d) => d.id === id)?.title ?? id;

	const stageName = (st: { id: string; title: string; sessions: PitchSession[] }) =>
		st.id === 'retake_coaching' && st.sessions[0] ? `Retake coaching #${st.sessions[0].attempt_number - 1}` : st.title;
	const titles = $derived(new Map(p.stages.flatMap((st) => st.sessions.map((s) => [s.id, stageName(st)] as const))));
	const titleFor = (s: PitchSession) => titles.get(s.id) ?? s.stage;
	const isEval = (s: PitchSession) => s.stage === 'graded' || s.stage === 'retake';

	const evals = $derived(p.scored.filter(isEval));
	const best = $derived(evals.length ? Math.max(...evals.map((s) => s.total!)) : null);

	// ----- Trend chart geometry -----
	const W = 640, H = 270, L = 36, R = 76, T = 30, B = 48;
	const y = (v: number) => T + (H - T - B) * (1 - v / p.max);
	const points = $derived(
		p.scored.map((s, i, arr) => ({
			s,
			x: arr.length === 1 ? (L + W - R) / 2 : L + 20 + (i * (W - L - R - 40)) / (arr.length - 1),
			y: y(s.total!)
		}))
	);
	const line = $derived(points.map((pt, i) => `${i ? 'L' : 'M'}${pt.x},${pt.y}`).join(' '));
	const area = $derived(points.length > 1 ? `${line} L${points.at(-1)!.x},${y(0)} L${points[0].x},${y(0)} Z` : '');
	const ticks = $derived([0, 5, 10, 15, 20].filter((t) => t <= p.max));

	const cell = (n: number | undefined) =>
		n == null ? 'bg-mist text-slate-ink' : n <= 2 ? 'bg-red-100 text-red-800' : n === 3 ? 'bg-pitch-100 text-pitch-800' : 'bg-green-100 text-green-800';

	const stageIcon: Record<string, string> = { baseline: 'flag', coaching: 'message', practice: 'mic', graded: 'trophy', retake_coaching: 'message', retake: 'trophy' };
</script>

<svelte:head><title>Sessions & scorecard · Pitch bootcamp</title></svelte:head>

<!-- Summary -->
<section class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Summary">
	<div class="card p-5">
		<p class="eyebrow text-[10px] text-slate-ink">Latest score</p>
		<p class="mt-1 text-3xl font-extrabold">{p.latestScore ?? '–'}<span class="text-base text-slate-ink">/{p.max}</span></p>
		<p class="text-xs text-slate-ink">{p.scored.length ? titleFor(p.scored.at(-1)!) : 'No scored sessions yet'}</p>
	</div>
	<div class="card p-5">
		<p class="eyebrow text-[10px] text-slate-ink">Best graded eval</p>
		<p class="mt-1 text-3xl font-extrabold">{best ?? '–'}<span class="text-base text-slate-ink">/{p.max}</span></p>
		<p class="text-xs text-slate-ink">Target {p.target} or more</p>
	</div>
	<div class="card p-5">
		<p class="eyebrow text-[10px] text-slate-ink">Sessions</p>
		<p class="mt-1 text-3xl font-extrabold">{p.sessions.filter((s) => s.status === 'completed').length}<span class="text-base text-slate-ink"> done</span></p>
		<p class="text-xs text-slate-ink">{p.sessions.filter((s) => s.status === 'scheduled').length} scheduled</p>
	</div>
	<div class="rounded-2xl p-5 {p.passed ? 'bg-gradient-to-br from-green-500 to-green-400 text-night' : 'bg-night text-white'}">
		<p class="eyebrow text-[10px] {p.passed ? 'text-night/70' : 'text-pitch-300'}">Result</p>
		<p class="mt-1 flex items-center gap-2 text-2xl font-extrabold">
			<Icon name={p.passed ? 'trophy' : p.status === 'coaching' || p.status === 'retake' ? 'target' : 'clock'} class="size-6" />
			{p.passed ? 'Graduated' : p.status === 'coaching' ? 'Coaching' : p.status === 'retake' ? 'Retake scheduled' : 'Not graded yet'}
		</p>
		<p class="text-xs {p.passed ? 'text-night/70' : 'text-white/60'}">{p.passed ? `Passed ${formatDate(evals.find((s) => s.total! >= p.target)?.session_date)}` : p.retakeWindowEnd ? `Retake window ends ${formatDate(p.retakeWindowEnd)}` : `Graded eval ${formatDate(p.stages.find((s) => s.id === 'graded')?.startDate)}`}</p>
	</div>
</section>

<!-- Retake -->
{#if (p.status === 'coaching' || p.status === 'retake') && p.focusDimensions.length}
	<section class="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-50 to-pitch-100 p-6 ring-1 ring-pitch-300 sm:p-8" aria-labelledby="retake-h">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-xl">
				<p class="eyebrow text-[10px] text-pitch-800">Targeted coaching</p>
				<h2 id="retake-h" class="mt-1 text-2xl font-extrabold">Below {p.target} on your graded eval. Here's the plan.</h2>
				<p class="mt-2 text-sm text-night/80">
					Coaching focuses on your lowest-scoring dimensions, then you get a retake. Every attempt stays on your record so the trend stays visible.
				</p>
				<ul class="mt-4 grid gap-3 sm:grid-cols-2">
					{#each p.focusDimensions as f (f)}
						{@const d = dims.find((x) => x.id === f)}
						<li class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-pitch-300/50">
							<p class="flex items-center gap-2 font-bold"><Icon name="target" class="size-4 text-pitch-700" />{d?.title ?? f}</p>
							<p class="mt-1 text-xs text-slate-ink">Proficient: {d?.proficient}</p>
						</li>
					{/each}
				</ul>
			</div>
			{#if p.retakeWindowEnd}
				<div class="shrink-0 rounded-2xl bg-night p-5 text-center text-white shadow-xl">
					<Icon name="calendar" class="mx-auto size-6 text-pitch-300" />
					<p class="mt-2 text-xs font-semibold text-white/60 uppercase">Retake window closes</p>
					<p class="text-2xl font-extrabold">{formatDate(p.retakeWindowEnd, true)}</p>
					<p class="text-sm text-pitch-300">{relativeDays(p.retakeWindowEnd, data.today)}</p>
				</div>
			{/if}
		</div>
	</section>
{/if}

<div class="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
	<!-- Trend -->
	<section class="card p-5 sm:p-6" aria-labelledby="trend-h">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 id="trend-h" class="text-lg font-extrabold">Score trend</h2>
			<div class="flex items-center gap-4 text-xs font-semibold text-slate-ink">
				<span class="flex items-center gap-1.5"><span class="h-0.5 w-5 rounded bg-pitch-500"></span>Total score</span>
				<span class="flex items-center gap-1.5"><span class="w-5 border-t-2 border-dashed border-green-600"></span>Target {p.target}</span>
			</div>
		</div>
		{#if points.length}
			<div class="mt-4 overflow-x-auto">
				<svg viewBox="0 0 {W} {H}" class="w-full min-w-[22rem]" role="img" aria-labelledby="trend-title trend-desc">
					<title id="trend-title">Pitch score trend</title>
					<desc id="trend-desc">{p.scored.map((s) => `${titleFor(s)}: ${s.total} of ${p.max}`).join('; ')}. Target {p.target}.</desc>
					<defs>
						<linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0" stop-color="#ffb547" stop-opacity="0.35" />
							<stop offset="1" stop-color="#ffb547" stop-opacity="0" />
						</linearGradient>
					</defs>
					{#each ticks as t (t)}
						<line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#03213b" stroke-opacity={t === 0 ? 0.25 : 0.07} />
						<text x={L - 10} y={y(t) + 4} text-anchor="end" class="fill-slate-ink text-[12px]">{t}</text>
					{/each}
					<rect x={L} y={y(p.max)} width={W - L - R} height={y(p.target) - y(p.max)} fill="#00c895" fill-opacity="0.07" />
					<line x1={L} x2={W - R} y1={y(p.target)} y2={y(p.target)} stroke="#00a57b" stroke-width="2" stroke-dasharray="6 5" />
					<text x={W - R + 8} y={y(p.target) + 4} class="fill-green-800 text-[13px] font-bold">Target {p.target}</text>
					{#if area}<path d={area} fill="url(#trend-fill)" />{/if}
					<path d={line} fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
					{#each points as pt (pt.s.id)}
						{@const pass = pt.s.total! >= p.target}
						<g>
							<title>{titleFor(pt.s)} · {formatDate(pt.s.session_date)}: {pt.s.total}/{p.max}</title>
							<circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
							<circle cx={pt.x} cy={pt.y} r="7" fill={isEval(pt.s) ? (pass ? '#00c895' : '#f59e0b') : '#fff'} stroke={isEval(pt.s) && pass ? '#007a5b' : '#f59e0b'} stroke-width="2.5" />
							<text x={pt.x} y={pt.y - 15} text-anchor="middle" class="fill-night text-[15px] font-extrabold">{pt.s.total}</text>
							<text x={pt.x} y={H - B + 22} text-anchor="middle" class="fill-night text-[13px] font-semibold">{titleFor(pt.s)}</text>
							<text x={pt.x} y={H - B + 38} text-anchor="middle" class="fill-slate-ink text-[12px]">{formatDate(pt.s.session_date)}</text>
						</g>
					{/each}
				</svg>
			</div>
			<p class="mt-2 text-xs text-slate-ink">Filled points are graded evals. Hollow points are baseline and practice runs.</p>
		{:else}
			<div class="mt-4"><EmptyState icon="pulse" title="No scored sessions yet">Your trend appears after your baseline session is scored.</EmptyState></div>
		{/if}
	</section>

	<!-- Scorecard -->
	<section class="card p-5 sm:p-6" aria-labelledby="score-h">
		<h2 id="score-h" class="text-lg font-extrabold">Scorecard</h2>
		<p class="text-sm text-slate-ink">Each dimension 1–{rubric.max_per_dimension}. Graduate with {p.target}/{p.max} on a graded eval.</p>
		{#if p.scored.length}
			<div class="mt-4 overflow-x-auto">
				<table class="w-full min-w-[20rem] border-separate border-spacing-1 text-sm">
					<thead>
						<tr>
							<th scope="col" class="text-left text-xs font-semibold text-slate-ink">Dimension</th>
							{#each p.scored as s (s.id)}
								<th scope="col" class="px-1 text-center text-xs font-bold">{titleFor(s)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each dims as d (d.id)}
							<tr>
								<th scope="row" class="py-1 pr-2 text-left font-semibold">
									{d.title}
									{#if p.focusDimensions.includes(d.id)}<span class="ml-1 align-middle"><Badge tone="amber">Focus</Badge></span>{/if}
								</th>
								{#each p.scored as s (s.id)}
									{@const n = s.scores?.[d.id]}
									<td class="rounded-lg text-center font-bold {cell(n)}" title={n ? rubric.scale[n] : undefined}>{n ?? '–'}</td>
								{/each}
							</tr>
						{/each}
						<tr>
							<th scope="row" class="pt-2 pr-2 text-left font-extrabold">Total</th>
							{#each p.scored as s (s.id)}
								<td class="rounded-lg bg-night pt-1 pb-1 text-center font-extrabold text-white">{s.total}<span class="text-[10px] font-semibold text-white/60">/{p.max}</span></td>
							{/each}
						</tr>
						<tr>
							<th scope="row" class="pr-2 text-left text-xs font-semibold text-slate-ink">Result</th>
							{#each p.scored as s (s.id)}
								<td class="text-center">
									{#if isEval(s)}
										{#if s.total! >= p.target}<Badge tone="green"><Icon name="check" class="size-3" />Pass</Badge>{:else}<Badge tone="red"><Icon name="x" class="size-3" />Below</Badge>{/if}
									{:else}<span class="text-xs text-slate-ink">Not graded</span>{/if}
								</td>
							{/each}
						</tr>
					</tbody>
				</table>
			</div>
			<p class="mt-3 text-xs text-slate-ink">
				Scale: {Object.entries(rubric.scale).map(([k, v]) => `${k} ${v}`).join(' · ')}
			</p>
		{:else}
			<div class="mt-4"><EmptyState icon="clipboard" title="Scores appear after your first scored session" /></div>
		{/if}
	</section>
</div>

<!-- Stage pipeline -->
<section class="mt-6" aria-labelledby="stages-h">
	<h2 id="stages-h" class="text-lg font-extrabold">Session stages</h2>
	<ol class="mt-3 flex flex-wrap items-center gap-2" aria-label="Stage progress">
		{#each p.stages as st, i (st.id + i)}
			<li class="flex items-center gap-2">
				<span class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold {st.done ? 'bg-night text-white' : st.current ? 'bg-pitch-400 text-night ring-4 ring-pitch-300/40' : 'bg-white text-slate-ink ring-1 ring-fog'}">
					{#if st.done}<Icon name="check" class="size-3.5 text-green-400" strokeWidth={3} />{/if}{stageName(st)}
				</span>
				{#if i < p.stages.length - 1}<Icon name="chevron-right" class="size-3.5 text-slate-ink" />{/if}
			</li>
		{/each}
	</ol>

	<div class="mt-4 space-y-4">
		{#each p.stages as st, i (st.id + i)}
			<article class="card overflow-hidden {st.current ? 'ring-2 ring-pitch-400' : ''}">
				<div class="flex flex-wrap items-center gap-4 p-5">
					<span class="grid size-11 shrink-0 place-items-center rounded-xl {st.done ? 'bg-night text-pitch-300' : st.current ? 'bg-pitch-400 text-night' : 'bg-mist text-slate-ink'}">
						<Icon name={stageIcon[st.id] ?? 'flag'} class="size-5" />
					</span>
					<div class="min-w-0 flex-1">
						<h3 class="font-bold">{stageName(st)}</h3>
						<p class="text-xs text-slate-ink">{st.scored ? 'Scored' : 'Feedback only'} · {formatRange(st.startDate, st.endDate)}</p>
					</div>
					{#if st.done}<Badge tone="night">Done</Badge>{:else if st.sessions.some((s) => s.status === 'scheduled')}<Badge tone="sky">Scheduled</Badge>{:else if st.current}<Badge tone="amber">Up next</Badge>{:else}<Badge tone="grey">Not scheduled</Badge>{/if}
				</div>
				{#each st.sessions as s (s.id)}
					<div class="border-t border-fog/70 bg-mist/40 p-5">
						<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
							<span class="flex items-center gap-1.5 font-semibold"><Icon name="calendar" class="size-4 text-pitch-700" />{formatDate(s.session_date, true)}</span>
							<span class="flex items-center gap-1.5 text-slate-ink"><Icon name="users" class="size-4" />{[s.manager_name, s.sales_name].filter(Boolean).join(' & ') || 'Evaluators TBC'}</span>
							{#if s.stage === 'retake' || s.stage === 'graded'}<span class="text-xs font-semibold text-slate-ink">Attempt {s.attempt_number}</span>{/if}
							{#if s.total != null}
								<span class="ml-auto flex items-center gap-2">
									<span class="text-xl font-extrabold">{s.total}<span class="text-xs text-slate-ink">/{p.max}</span></span>
									{#if isEval(s)}{#if s.total >= p.target}<Badge tone="green">Pass</Badge>{:else}<Badge tone="red">Below target</Badge>{/if}{/if}
								</span>
							{:else if s.status === 'scheduled'}
								<span class="ml-auto text-xs font-semibold text-slate-ink">{relativeDays(s.session_date ?? data.today, data.today)}</span>
							{/if}
						</div>
						{#if s.status === 'completed'}
							<div class="mt-4 grid gap-3 md:grid-cols-2">
								{#if s.feedback}
									<div class="rounded-xl bg-white p-4 ring-1 ring-fog/70">
										<p class="eyebrow text-[10px] text-pitch-800">Feedback</p>
										<p class="mt-1 text-sm">{s.feedback}</p>
									</div>
								{/if}
								{#if s.observations}
									<div class="rounded-xl bg-white p-4 ring-1 ring-fog/70">
										<p class="eyebrow text-[10px] text-slate-ink">Evaluator observations</p>
										<p class="mt-1 text-sm">{s.observations}</p>
									</div>
								{/if}
							</div>
							{#if s.focus_dimensions?.length}
								<p class="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
									Coaching focus: {#each s.focus_dimensions as f (f)}<Badge tone="amber">{dimTitle(f)}</Badge>{/each}
									{#if s.retake_window_end}<span class="text-slate-ink">· retake by {formatDate(s.retake_window_end, true)}</span>{/if}
								</p>
							{/if}
						{:else if st.id === 'retake_coaching' || st.id === 'retake'}
							{#if p.focusDimensions.length}
								<p class="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
									Focus: {#each p.focusDimensions as f (f)}<Badge tone="amber">{dimTitle(f)}</Badge>{/each}
								</p>
							{/if}
						{/if}
					</div>
				{:else}
					<p class="border-t border-fog/70 bg-mist/40 px-5 py-3 text-sm text-slate-ink">Your evaluators will schedule this session.</p>
				{/each}
			</article>
		{/each}
	</div>
</section>
