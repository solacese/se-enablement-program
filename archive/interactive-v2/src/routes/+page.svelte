<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { learner } from '$lib/data/learner.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Logo from '$lib/components/layout/Logo.svelte';
	import { reveal } from '$lib/actions';

	let { data } = $props();
	let motion = $state(false);
	let activeBlock = $state<number | null>(null);
	// The page is prerendered for first-time visitors; returning SEs get "continue".
	let returning = $state(false);
	onMount(async () => {
		motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
		await learner.init();
		returning = !!learner.state.profile;
	});
	const home = $derived(returning ? `${base}/dashboard/` : `${base}/start/`);

	const pct = (day: number) => ((day - 1) / data.platform.days) * 100;
	const blockFill = [
		'from-green-400 to-green-600 shadow-green-500/40',
		'from-[#2dd4bf] to-deep-300 shadow-teal-400/30',
		'from-deep-300 to-deep-400 shadow-deep-300/30'
	];
	const blockText = ['text-green-400', 'text-teal-300', 'text-deep-300'];

	// Event-mesh hero: nodes and links with events travelling along them.
	const nodes = [
		{ x: 90, y: 210, r: 16, label: 'Broker' },
		{ x: 250, y: 90, r: 12, label: 'Cloud' },
		{ x: 270, y: 320, r: 12, label: 'DR site' },
		{ x: 420, y: 190, r: 18, label: 'Mesh' },
		{ x: 560, y: 70, r: 11, label: 'MQTT' },
		{ x: 590, y: 300, r: 11, label: 'Agents' },
		{ x: 520, y: 400, r: 9, label: 'SAP' },
		{ x: 660, y: 180, r: 13, label: 'Insights' }
	];
	const links: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [5, 6], [3, 7], [4, 7], [1, 4]];
	const path = (a: number, b: number) => {
		const p = nodes[a], q = nodes[b];
		const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - 30;
		return `M${p.x},${p.y} Q${mx},${my} ${q.x},${q.y}`;
	};

	const how = [
		{ icon: 'book', title: 'Learn', text: 'Each module starts with what you’ll build and why customers care.' },
		{ icon: 'config', title: 'Build', text: 'Step-by-step checklists with docs links and “how to verify” hints. Progress saves as you go.' },
		{ icon: 'upload', title: 'Prove', text: 'Every module ends with an exit proof: notes, screenshots, configs or a recording.' },
		{ icon: 'flag', title: 'Validate', text: 'Live checkpoints with a senior SE and a graded pitch with managers and sales.' }
	];
</script>

<svelte:head>
	<title>Solace SE Journey · Your path from day one to demo day</title>
	<meta name="description" content="The Solace Sales Engineer enablement program: a 90-day technical path and a pitch bootcamp, in one guided app." />
</svelte:head>

<div class="bg-night text-white">
	<!-- Top bar -->
	<header class="absolute inset-x-0 top-0 z-20">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
			<Logo />
			<nav class="hidden items-center gap-8 text-sm font-semibold text-white/70 md:flex" aria-label="Sections">
				<a href="#journey" class="hover:text-white">The journey</a>
				<a href="#tracks" class="hover:text-white">Two tracks</a>
				<a href="#outcomes" class="hover:text-white">Outcomes</a>
			</nav>
			<a href={home} class="btn rounded-full bg-white/10 px-5 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20">
				{returning ? 'Open my dashboard' : 'Get started'}
			</a>
		</div>
	</header>

	<!-- Hero -->
	<section class="relative isolate overflow-hidden">
		<div class="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"></div>
		<div class="absolute -top-40 -left-40 -z-10 size-[40rem] animate-float rounded-full bg-green-500/25 blur-[120px]"></div>
		<div class="absolute top-20 -right-40 -z-10 size-[36rem] rounded-full bg-deep-400/50 blur-[120px] [animation-delay:-3s] motion-safe:animate-float"></div>
		<div class="absolute bottom-0 left-1/3 -z-10 size-[24rem] rounded-full bg-pitch-400/15 blur-[100px]"></div>

		<div class="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
			<div class="animate-rise">
				<p class="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-green-300 ring-1 ring-green-400/30">
					<span class="relative flex size-2">
						<span class="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex size-2 rounded-full bg-green-400"></span>
					</span>
					New SE enablement · {data.platform.days} days · 2 tracks
				</p>
				<h1 class="mt-6 text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
					From <span class="text-gradient animate-shimmer">day one</span><br />to demo day.
				</h1>
				<p class="mt-6 max-w-xl text-lg text-white/70 sm:text-xl">
					A guided journey that takes you from running your first broker to pitching the full Solace Platform, with a clear
					proof at every step.
				</p>
				<div class="mt-9 flex flex-wrap gap-3">
					<a href={home} class="btn-primary rounded-full px-7 py-3.5 text-base">
						{returning ? 'Continue my journey' : 'Start the journey'}
						<Icon name="arrow-right" class="size-5" />
					</a>
					<a href="#journey" class="btn rounded-full px-7 py-3.5 text-base text-white ring-1 ring-white/25 hover:bg-white/10">
						See the timeline
					</a>
				</div>
				<dl class="mt-12 grid max-w-lg grid-cols-4 gap-4">
					{#each [[data.platform.days, 'days'], [data.counts.modules, 'modules'], [data.counts.checkpoints, 'checkpoints'], [`${data.pitch.target}/${data.pitch.max}`, 'pitch target']] as [n, l] (l)}
						<div>
							<dt class="sr-only">{l}</dt>
							<dd class="text-3xl font-extrabold text-white">{n}</dd>
							<dd class="text-xs font-medium text-white/50">{l}</dd>
						</div>
					{/each}
				</dl>
			</div>

			<div class="relative hidden lg:block" aria-hidden="true">
				<svg viewBox="0 0 740 470" class="w-full drop-shadow-[0_0_40px_rgba(0,200,149,0.25)]">
					<defs>
						<radialGradient id="node" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stop-color="#52dcb2" />
							<stop offset="100%" stop-color="#00a57b" />
						</radialGradient>
						<linearGradient id="link" x1="0" x2="1">
							<stop offset="0%" stop-color="#00C895" stop-opacity=".15" />
							<stop offset="50%" stop-color="#00C895" stop-opacity=".55" />
							<stop offset="100%" stop-color="#5fd4ff" stop-opacity=".2" />
						</linearGradient>
					</defs>
					{#each links as [a, b], i (i)}
						<path id="l{i}" d={path(a, b)} fill="none" stroke="url(#link)" stroke-width="2" />
					{/each}
					{#if motion}
						{#each links as _, i (i)}
							<circle r="4" fill={i % 3 === 2 ? '#FFB547' : '#c4f4e4'}>
								<animateMotion dur="{2.6 + (i % 4) * 0.7}s" begin="{(i * 0.37) % 2}s" repeatCount="indefinite">
									<mpath href="#l{i}" />
								</animateMotion>
							</circle>
						{/each}
					{/if}
					{#each nodes as n (n.label)}
						<g>
							<circle cx={n.x} cy={n.y} r={n.r + 14} fill="#00C895" opacity=".08" />
							<circle cx={n.x} cy={n.y} r={n.r} fill="url(#node)" stroke="#03213B" stroke-width="3" />
							<text x={n.x} y={n.y + n.r + 22} text-anchor="middle" fill="rgba(255,255,255,.7)" font-size="13" font-weight="600">{n.label}</text>
						</g>
					{/each}
				</svg>
				<div class="absolute right-0 bottom-0 animate-rise rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md [animation-delay:.4s]">
					<p class="eyebrow text-[10px] text-green-300">Exit proof</p>
					<p class="mt-1 text-sm font-semibold">Live publish & consume ✓</p>
				</div>
				<div class="absolute bottom-6 left-0 animate-rise rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md [animation-delay:.7s]">
					<p class="eyebrow text-[10px] text-pitch-300">Pitch score</p>
					<p class="mt-1 text-sm font-semibold">17 / 20 · Graduated</p>
				</div>
			</div>
		</div>
		<a href="#journey" class="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-semibold text-white/50 hover:text-white sm:flex">
			Scroll the journey
			<Icon name="chevron-down" class="size-5 motion-safe:animate-bounce" />
		</a>
	</section>

	<!-- Ribbon: both tracks on one 90-day timeline -->
	<section id="journey" class="relative scroll-mt-10 border-t border-white/10 bg-night-900 py-20 sm:py-28">
		<div class="mx-auto max-w-7xl px-5 sm:px-8">
			<div use:reveal class="max-w-3xl">
				<p class="eyebrow text-green-400">The journey at a glance</p>
				<h2 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Two tracks. One timeline.</h2>
				<p class="mt-4 text-lg text-white/65">
					The technical path runs {data.platform.days} days in three blocks. The pitch bootcamp joins at day {data.pitch.startDay}, right
					after your first checkpoint, and runs alongside Block 2.
				</p>
			</div>

			<div use:reveal={150} class="mt-14 overflow-x-auto pb-4">
				<div class="relative min-w-[760px] px-2 pt-12 pb-2">
					<!-- day scale -->
					<div class="absolute inset-x-2 top-0 flex justify-between text-[11px] font-semibold text-white/40">
						{#each [1, 15, 30, 45, 60, 75, 90] as d (d)}<span>Day {d}</span>{/each}
					</div>
					<!-- blocks -->
					<div class="relative flex h-24 gap-1.5">
						{#each data.blocks as b, i (b.id)}
							<button
								type="button"
								class="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left text-night shadow-xl transition hover:-translate-y-1 {blockFill[i % 3]} {activeBlock !== null && activeBlock !== b.number ? 'opacity-40' : ''}"
								style="width:{((b.days[1] - b.days[0] + 1) / data.platform.days) * 100}%"
								onmouseenter={() => (activeBlock = b.number)}
								onmouseleave={() => (activeBlock = null)}
								onfocus={() => (activeBlock = b.number)}
								onblur={() => (activeBlock = null)}
								aria-label="Block {b.number}, days {b.days[0]} to {b.days[1]}: {b.theme}. Modules: {b.moduleTitles.join(', ')}"
							>
								<span class="text-[11px] font-bold tracking-widest uppercase opacity-70">Block {b.number} · Days {b.days[0]}–{b.days[1]}</span>
								<span class="text-lg leading-tight font-extrabold">{b.theme}</span>
								<span class="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.35)_50%,transparent_70%)] bg-[length:250%_100%] opacity-0 transition group-hover:animate-shimmer group-hover:opacity-100"></span>
							</button>
						{/each}
					</div>
					<!-- checkpoints -->
					<div class="relative h-12">
						{#each data.checkpoints as c (c.id)}
							<div class="absolute top-0 flex -translate-x-1/2 flex-col items-center" style="left:{Math.min(99.2, pct(c.day) + 100 / data.platform.days)}%">
								<span class="h-3 w-px bg-white/40"></span>
								<span class="relative grid size-8 place-items-center rounded-full bg-white text-night shadow-lg shadow-green-500/30">
									<span class="absolute inset-0 rounded-full bg-green-400 motion-safe:animate-pulse-ring"></span>
									<Icon name={c.format === 'capstone' ? 'trophy' : 'flag'} class="relative size-4" />
								</span>
							</div>
						{/each}
					</div>
					<!-- pitch band -->
					<div class="relative h-20">
						<div
							class="absolute top-0 flex h-full flex-col justify-center rounded-2xl bg-gradient-to-r from-pitch-400 to-pitch-300 px-4 text-night shadow-xl shadow-pitch-400/30"
							style="left:{pct(data.pitch.startDay)}%; width:{((data.pitch.endDay - data.pitch.startDay + 1) / data.platform.days) * 100}%"
						>
							<span class="text-[11px] font-bold tracking-widest uppercase opacity-70">Days {data.pitch.startDay}–{data.pitch.endDay}</span>
							<span class="font-extrabold">{data.pitch.title}</span>
						</div>
					</div>
					<div class="relative mt-2 h-8">
						{#each data.pitch.stages as s (s.id)}
							<span
								class="absolute top-0 -translate-x-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-pitch-100 ring-1 ring-pitch-300/30"
								style="left:{pct(data.pitch.startDay + (s.week - 1) * 7)}%"
							>{s.title}</span>
						{/each}
					</div>
					<div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/55">
						<span class="flex items-center gap-2"><span class="size-3 rounded bg-green-500"></span>Technical path</span>
						<span class="flex items-center gap-2"><span class="size-3 rounded bg-pitch-400"></span>Pitch bootcamp</span>
						<span class="flex items-center gap-2"><Icon name="flag" class="size-3.5 text-white" />Live checkpoint with a senior SE</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Step-by-step journey path -->
	<section class="relative overflow-hidden bg-night py-20 sm:py-28">
		<div class="absolute top-1/4 -left-40 size-[30rem] rounded-full bg-green-500/10 blur-[120px]"></div>
		<div class="absolute -right-40 bottom-1/4 size-[30rem] rounded-full bg-pitch-400/10 blur-[120px]"></div>
		<div class="relative mx-auto max-w-6xl px-5 sm:px-8">
			<div use:reveal class="mx-auto max-w-2xl text-center">
				<p class="eyebrow text-green-400">Stop by stop</p>
				<h2 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Your route to the capstone</h2>
				<p class="mt-4 text-lg text-white/65">Each stop ends with something you can show working, not just describe.</p>
			</div>

			<ol class="relative mt-16">
				<span class="absolute top-0 bottom-0 left-6 w-1 rounded-full bg-gradient-to-b from-green-500 via-teal-400 to-deep-300 md:left-1/2 md:-translate-x-1/2" aria-hidden="true"></span>
				{#each data.stops as s, i (s.title)}
					{@const left = i % 2 === 0}
					{@const isPitch = s.kind === 'pitch'}
					{@const isCp = s.kind === 'checkpoint'}
					<li class="relative mb-10 pl-20 md:mb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0 md:[&:not(:first-child)]:-mt-24">
						<span
							class="absolute top-4 left-6 z-10 grid -translate-x-1/2 place-items-center rounded-full ring-8 ring-night md:left-1/2 {isCp
								? 'size-14 bg-white text-night shadow-[0_0_40px_rgba(0,200,149,0.6)]'
								: isPitch
									? 'size-12 bg-pitch-400 text-night shadow-[0_0_30px_rgba(255,181,71,0.5)]'
									: 'size-11 bg-deep text-green-400 ring-night'}"
						>
							<Icon name={s.icon} class={isCp ? 'size-6' : 'size-5'} />
						</span>
						<div use:reveal={60} class="{left ? 'md:col-start-1 md:text-right' : 'md:col-start-2'}">
							<article
								class="group relative inline-block w-full rounded-3xl p-6 text-left ring-1 transition duration-300 hover:-translate-y-1 {isCp
									? 'bg-gradient-to-br from-green-500 to-green-600 text-night ring-green-300 shadow-2xl shadow-green-500/25'
									: isPitch
										? 'bg-gradient-to-br from-pitch-400/20 to-pitch-400/5 ring-pitch-300/40 hover:ring-pitch-300'
										: 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.07] hover:ring-green-400/40'}"
							>
								<div class="flex flex-wrap items-center gap-2 {left ? 'md:justify-end' : ''}">
									<span class="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase {isCp ? 'bg-night text-green-300' : isPitch ? 'bg-pitch-400 text-night' : 'bg-green-500/15 text-green-300'}">{s.when}</span>
									{#if s.block}<span class="text-[11px] font-semibold tracking-wider uppercase {isCp ? 'text-night/70' : blockText[(s.block - 1) % 3]}">Block {s.block}</span>{/if}
									{#if isPitch}<span class="text-[11px] font-semibold tracking-wider text-pitch-300 uppercase">Pitch track</span>{/if}
								</div>
								<h3 class="mt-3 text-2xl font-extrabold tracking-tight">{s.title}</h3>
								<p class="mt-2 {isCp ? 'text-night/80' : 'text-white/65'}">{s.summary}</p>
								{#if s.proof}
									<p class="mt-4 flex items-start gap-2 rounded-xl bg-night/60 px-3 py-2.5 text-sm text-left ring-1 ring-white/5 {left ? 'md:ml-auto' : ''}">
										<Icon name="check" class="mt-0.5 size-4 shrink-0 text-green-400" />
										<span><span class="font-semibold text-green-300">Exit proof:</span> <span class="text-white/80">{s.proof}</span></span>
									</p>
								{/if}
								{#if s.tags?.length}
									<div class="mt-4 flex flex-wrap gap-1.5 {left ? 'md:justify-end' : ''}">
										{#each s.tags as t (t)}
											<span class="rounded-full px-2.5 py-1 text-xs font-semibold {isPitch ? 'bg-pitch-400/15 text-pitch-100' : 'bg-white/10 text-white/80'}">{t}</span>
										{/each}
									</div>
								{/if}
							</article>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- Two tracks -->
	<section id="tracks" class="scroll-mt-10 bg-mist py-20 text-night sm:py-28">
		<div class="mx-auto max-w-7xl px-5 sm:px-8">
			<div use:reveal class="max-w-2xl">
				<p class="eyebrow text-green-700">Two tracks</p>
				<h2 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Technical depth. Pitch credibility.</h2>
			</div>
			<div class="mt-12 grid gap-6 lg:grid-cols-2">
				<article use:reveal class="relative overflow-hidden rounded-3xl bg-night p-8 text-white shadow-2xl shadow-night/20 sm:p-10">
					<div class="absolute -top-20 -right-20 size-64 rounded-full bg-green-500/30 blur-3xl"></div>
					<div class="relative">
						<span class="grid size-12 place-items-center rounded-2xl bg-green-500 text-night"><Icon name="route" class="size-6" /></span>
						<h3 class="mt-6 text-3xl font-extrabold">{data.platform.title}</h3>
						<p class="mt-3 text-white/70">{data.platform.goal}</p>
						<ul class="mt-8 space-y-3">
							{#each data.blocks as b, i (b.id)}
								<li class="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
									<span class="text-2xl font-extrabold {blockText[i % 3]}">{b.number}</span>
									<div>
										<p class="font-bold">{b.theme} <span class="text-sm font-medium text-white/50">· Days {b.days[0]}–{b.days[1]}</span></p>
										<p class="mt-1 text-sm text-white/60">{b.moduleTitles.join(' · ')}</p>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				</article>
				<article use:reveal={120} class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pitch-300 to-pitch-400 p-8 text-night shadow-2xl shadow-pitch-400/30 sm:p-10">
					<div class="absolute -right-16 -bottom-16 size-64 rounded-full bg-white/30 blur-3xl"></div>
					<div class="relative">
						<span class="grid size-12 place-items-center rounded-2xl bg-night text-pitch-300"><Icon name="mic" class="size-6" /></span>
						<h3 class="mt-6 text-3xl font-extrabold">{data.pitch.title}</h3>
						<p class="mt-3 text-night/75">{data.pitch.goal}</p>
						<div class="mt-8 grid gap-3 sm:grid-cols-2">
							{#each data.pitch.dimensions as d (d.id)}
								<div class="rounded-2xl bg-white/50 p-4 ring-1 ring-night/5 backdrop-blur">
									<p class="font-bold">{d.title}</p>
									<p class="mt-1 text-sm text-night/70">{d.proficient}</p>
								</div>
							{/each}
						</div>
						<p class="mt-6 flex items-center gap-3 rounded-2xl bg-night px-4 py-3 font-semibold text-white">
							<Icon name="target" class="size-5 text-pitch-300" />
							Graduate with {data.pitch.target}/{data.pitch.max} or more on the graded eval
						</p>
					</div>
				</article>
			</div>

			<div class="mt-20">
				<h3 use:reveal class="text-center text-2xl font-extrabold">How every module works</h3>
				<ol class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each how as h, i (h.title)}
						<li use:reveal={i * 90} class="card relative p-6 transition hover:-translate-y-1 hover:shadow-xl">
							<span class="absolute top-5 right-5 text-5xl font-extrabold text-mist">{i + 1}</span>
							<span class="relative grid size-11 place-items-center rounded-xl bg-green-500 text-night"><Icon name={h.icon} /></span>
							<p class="relative mt-4 text-lg font-bold">{h.title}</p>
							<p class="relative mt-1 text-sm text-slate-ink">{h.text}</p>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	</section>

	<!-- Outcomes + CTA -->
	<section id="outcomes" class="relative scroll-mt-10 overflow-hidden bg-deep py-20 sm:py-28">
		<div class="grid-bg absolute inset-0 opacity-50"></div>
		<div class="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
			<div use:reveal>
				<p class="eyebrow text-green-400">Outcomes</p>
				<h2 class="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">By day {data.platform.days}, you can…</h2>
				<p class="mt-4 text-lg text-white/70">Pitch Solace credibly and run technical engagements on your own.</p>
				<a href={home} class="btn-primary mt-8 rounded-full px-7 py-3.5 text-base">
					{returning ? 'Continue my journey' : 'Start the journey'}
					<Icon name="arrow-right" class="size-5" />
				</a>
			</div>
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each data.outcomes as o, i (o)}
					<li use:reveal={i * 70} class="flex gap-3 rounded-2xl bg-night/50 p-5 ring-1 ring-white/10">
						<span class="grid size-7 shrink-0 place-items-center rounded-full bg-green-500 text-night"><Icon name="check" class="size-4" strokeWidth={3} /></span>
						<span class="text-white/85">{o}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<footer class="border-t border-white/10 bg-night-900 py-8 text-sm text-white/50">
		<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8">
			<Logo />
			<p>Internal enablement for Solace Sales Engineers.</p>
		</div>
	</footer>
</div>
