// The program rules: derived dates, module gating, checkpoint and pitch state, and flags.
// A pure function of the learner's data and today's date, so it runs the same in the
// browser now and on a server later.
import { blockForModule, orderedModules, program } from '$lib/content/program';
import type { LearnerProfile, LearnerState } from '$lib/data/types';
import { addDays, dateForDay, dayNumber, diffDays, formatDate, todayISO, weekDays } from '$lib/dates';
import type {
	CheckpointState,
	Flag,
	LearnerView,
	ModuleState,
	OverallStatus,
	PitchStageId,
	PitchStageState,
	PitchState,
	TaskState
} from '$lib/types';

/** The primary OEM module; defaults to the first one listed in the track. */
export function primaryOem(p: LearnerProfile) {
	return p.primary_oem ?? program().platform.oem.modules[0];
}

const STAGE_TITLES: Record<PitchStageId, string> = {
	baseline: 'Baseline',
	coaching: 'Coaching',
	practice: 'Practice',
	graded: 'Graded Eval',
	retake_coaching: 'Retake coaching',
	retake: 'Retake eval'
};

export function stageTitle(id: PitchStageId, attempt?: number) {
	if (id === 'retake' && attempt) return `Retake eval #${attempt - 1}`;
	if (id === 'retake_coaching' && attempt) return `Retake coaching #${attempt - 1}`;
	return STAGE_TITLES[id];
}

function buildPitch(s: LearnerState, start: string, today: string): PitchState {
	const p = program().pitch;
	const target = p.rubric.graduation_target;
	const max = p.rubric.max_per_dimension * p.rubric.dimensions.length;
	const startDay = p.start_day;
	const endDay = startDay + p.duration_weeks * 7 - 1;
	const startDate = dateForDay(start, startDay);
	const endDate = dateForDay(start, endDay);
	const sessions = [...s.pitch_sessions].sort((a, b) => a.created_at.localeCompare(b.created_at));

	const completed = sessions.filter((x) => x.status === 'completed');
	const scored = completed.filter((x) => x.total != null);
	const evals = completed.filter((x) => (x.stage === 'graded' || x.stage === 'retake') && x.total != null);
	const passed = evals.some((x) => x.total! >= target);
	const lastEval = evals.at(-1);
	const failedLast = !!lastEval && lastEval.total! < target;
	const pendingRetake = sessions.some((x) => x.stage === 'retake' && x.status === 'scheduled');

	const stages: PitchStageState[] = p.stages.map((st) => {
		const [a, b] = weekDays(st.week);
		const ss = sessions.filter((x) => x.stage === st.id);
		return {
			id: st.id as PitchStageId,
			title: st.title,
			scored: st.scored,
			startDate: dateForDay(start, startDay + a - 1),
			endDate: dateForDay(start, startDay + b - 1),
			sessions: ss,
			done: ss.some((x) => x.status === 'completed'),
			current: false
		};
	});

	// Retake rounds are appended after the graded eval, each with its own coaching stage.
	for (const x of sessions.filter((x) => x.stage === 'retake_coaching' || x.stage === 'retake')) {
		stages.push({
			id: x.stage,
			title: stageTitle(x.stage, x.attempt_number),
			scored: x.stage === 'retake',
			startDate: x.session_date ?? endDate,
			endDate: x.retake_window_end ?? lastEval?.retake_window_end ?? endDate,
			sessions: [x],
			done: x.status === 'completed',
			current: false
		});
	}

	const current = stages.find((x) => !x.done);
	if (current && !passed) current.current = true;

	let status: PitchState['status'] = today < startDate ? 'not_started' : 'in_progress';
	if (passed) status = 'graduated';
	else if (failedLast) status = pendingRetake ? 'retake' : 'coaching';

	return {
		startDay,
		endDay,
		startDate,
		endDate,
		started: today >= startDate,
		scenarioAssigned: !!s.scenario,
		stages,
		sessions,
		scored,
		latestScore: scored.at(-1)?.total ?? null,
		passed,
		status,
		retakeWindowEnd: failedLast ? lastEval!.retake_window_end : null,
		focusDimensions: failedLast ? (lastEval!.focus_dimensions ?? []) : [],
		target,
		max
	};
}

export function buildView(s: LearnerState, today = todayISO()): LearnerView | null {
	const profile = s.profile;
	if (!profile) return null;
	const p = program();
	const start = profile.start_date;
	const day = dayNumber(start, today);
	const oemPrimary = primaryOem(profile);
	const proofs = s.exit_proofs;

	const tasks: TaskState[] = p.platform.setup_tasks.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		status: s.tasks[t.id]?.status ?? t.states[0],
		updatedAt: s.tasks[t.id]?.updated_at ?? null,
		dueDate: dateForDay(start, t.due_day),
		neededByDate: t.needed_by_day ? dateForDay(start, t.needed_by_day) : null
	}));
	// A setup task counts as done once it reaches its final state (e.g. "received").
	const taskDone = (tid: string) => {
		const t = p.platform.setup_tasks.find((x) => x.id === tid)!;
		return tasks.find((x) => x.id === tid)!.status === t.states.at(-1);
	};
	const titles = new Map<string, string>([
		...p.modules.map((m) => [m.id, m.title] as [string, string]),
		...p.platform.setup_tasks.map((t) => [t.id, t.title] as [string, string])
	]);

	const modules: ModuleState[] = orderedModules().map((m) => {
		const done = s.steps[m.id] ?? {};
		const stepsDone = m.steps.filter((x) => done[x.id]).length;
		const evidenceCount = s.evidence.filter((x) => x.module_id === m.id).length;
		const submitted = proofs[m.id] ?? null;
		const unmet = m.prerequisites.filter((pre) =>
			p.modules.some((x) => x.id === pre) ? !proofs[pre] : !taskDone(pre)
		);
		const lockedBy = profile.unlock_all ? [] : unmet.map((x) => titles.get(x) ?? x);
		const weeks = m.weeks.length ? m.weeks : [1];
		const startDay = weekDays(Math.min(...weeks))[0];
		const endDay = weekDays(Math.max(...weeks))[1];
		const status: ModuleState['status'] = submitted
			? 'complete'
			: lockedBy.length
				? 'locked'
				: stepsDone > 0 || evidenceCount > 0
					? 'in_progress'
					: 'available';
		const isPrimaryOem = m.oem && m.id === oemPrimary;
		const selfPaced = m.oem && !isPrimaryOem;
		const endDate = dateForDay(start, endDay);
		return {
			id: m.id,
			title: m.title,
			summary: m.summary,
			block: blockForModule(m.id)?.number ?? m.block,
			weeks,
			icon: m.icon,
			oem: m.oem,
			isPrimaryOem,
			selfPaced,
			stepsTotal: m.steps.length,
			stepsDone,
			evidenceCount,
			exitProofSubmittedAt: submitted,
			status,
			lockedBy,
			startDay,
			endDay,
			startDate: dateForDay(start, startDay),
			endDate,
			behind: !submitted && !selfPaced && today > endDate,
			checkpoint: m.checkpoint
		};
	});

	const checkpoints: CheckpointState[] = p.checkpoints.map((c) => {
		const mine = s.checkpoint_attempts
			.filter((a) => a.checkpoint_id === c.id)
			.sort((a, b) => a.attempt_number - b.attempt_number);
		const latest = mine.at(-1) ?? null;
		const requiredModules = c.modules.filter((id) => !modules.find((m) => m.id === id)?.selfPaced);
		const passed = mine.some((a) => a.status === 'passed');
		let status: CheckpointState['status'] = 'upcoming';
		if (passed) status = 'passed';
		else if (latest?.status === 'scheduled') status = mine.length > 1 ? 'retake_scheduled' : 'scheduled';
		else if (latest?.status === 'needs_work') status = 'coaching';
		const lastFailed = [...mine].reverse().find((a) => a.status === 'needs_work');
		const date = dateForDay(start, c.day);
		const inCoaching = status === 'coaching' || status === 'retake_scheduled';
		return {
			id: c.id,
			title: c.title,
			day: c.day,
			date,
			format: c.format,
			block: p.platform.blocks.find((b) => b.checkpoint === c.id)?.number ?? 0,
			modules: c.modules,
			requiredModules,
			attempts: mine,
			latest,
			status,
			missingProofs: requiredModules.filter((id) => !proofs[id]).map((id) => titles.get(id) ?? id),
			coachingModules: inCoaching ? (lastFailed?.results.filter((r) => r.result === 'needs_work').map((r) => r.module_id) ?? []) : [],
			retakeWindowEnd: inCoaching ? (lastFailed?.retake_window_end ?? null) : null,
			overdue: !passed && today > (latest?.retake_window_end ?? addDays(date, 7)) && latest?.status !== 'scheduled'
		};
	});

	const pitch = buildPitch(s, start, today);
	const flags = buildFlags({ day, today, tasks, modules, checkpoints, pitch });

	const currentModule =
		modules.find((m) => m.status === 'in_progress' && !m.selfPaced) ??
		modules.find((m) => m.status === 'available' && !m.selfPaced) ??
		modules.find((m) => m.status !== 'complete' && m.status !== 'locked') ??
		null;

	const required = modules.filter((m) => !m.selfPaced);
	const allPassed = checkpoints.every((c) => c.status === 'passed');
	const inCoaching =
		checkpoints.some((c) => c.status === 'coaching' || c.status === 'retake_scheduled') ||
		pitch.status === 'coaching' ||
		pitch.status === 'retake';

	let overall: OverallStatus = 'on_track';
	if (day < 1) overall = 'not_started';
	else if (allPassed && pitch.passed) overall = 'complete';
	else if (flags.some((f) => f.level === 'blocker')) overall = 'blocked';
	else if (modules.some((m) => m.behind) || checkpoints.some((c) => c.overdue)) overall = 'behind';

	return {
		profile,
		techEvaluator: profile.tech_evaluator || null,
		pitchManager: profile.pitch_manager || null,
		pitchSales: profile.pitch_sales || null,
		today,
		day,
		endDate: dateForDay(start, p.platform.duration_days),
		modules,
		checkpoints,
		pitch,
		tasks,
		flags,
		currentModule,
		overall,
		inCoaching,
		progress: {
			modulesComplete: required.filter((m) => m.status === 'complete').length,
			modulesTotal: required.length,
			stepsDone: required.reduce((n, m) => n + m.stepsDone, 0),
			stepsTotal: required.reduce((n, m) => n + m.stepsTotal, 0),
			proofsSubmitted: modules.filter((m) => m.exitProofSubmittedAt).length,
			checkpointsPassed: checkpoints.filter((c) => c.status === 'passed').length,
			checkpointsTotal: checkpoints.length,
			pitchScore: pitch.latestScore
		}
	};
}

function buildFlags(x: {
	day: number;
	today: string;
	tasks: TaskState[];
	modules: ModuleState[];
	checkpoints: CheckpointState[];
	pitch: PitchState;
}): Flag[] {
	const flags: Flag[] = [];
	if (x.day < 1) return flags;
	const setup = program().platform.setup_tasks;

	for (const t of x.tasks) {
		const def = setup.find((s) => s.id === t.id)!;
		if (t.status === def.states[0]) {
			flags.push({
				level: 'blocker',
				title: `${t.title}: not done yet`,
				detail: `This was due on day ${def.due_day}. ${def.description}`,
				href: '/dashboard/#setup'
			});
		} else if (t.status !== def.states.at(-1) && t.neededByDate && x.today >= addDays(t.neededByDate, -3)) {
			flags.push({
				level: 'warning',
				title: `${t.title}: still waiting`,
				detail: `Requested but not received. It's needed by ${formatDate(t.neededByDate, true)}. Chase it with your manager.`,
				href: '/dashboard/#setup'
			});
		}
	}

	for (const c of x.checkpoints) {
		if (c.status === 'passed') continue;
		const until = diffDays(c.date, x.today);
		if (c.missingProofs.length && until <= 7 && c.status !== 'coaching') {
			flags.push({
				level: until < 0 ? 'blocker' : 'warning',
				title: `Evidence missing before the ${c.title}`,
				detail: `Exit proofs still needed: ${c.missingProofs.join(', ')}.`,
				href: `/checkpoints/${c.id}/`
			});
		}
		if (c.status === 'coaching') {
			flags.push({
				level: 'info',
				title: `${c.title}: coaching and retake window open`,
				detail: c.retakeWindowEnd ? `Retake by ${formatDate(c.retakeWindowEnd, true)}.` : 'Schedule your retake after coaching.',
				href: `/checkpoints/${c.id}/`
			});
		}
	}

	for (const m of x.modules.filter((m) => m.behind)) {
		flags.push({
			level: 'warning',
			title: `${m.title} is behind schedule`,
			detail: `Planned to finish by ${formatDate(m.endDate, true)} (day ${m.endDay}).`,
			href: `/modules/${m.id}/`
		});
	}

	if (!x.pitch.scenarioAssigned && x.day >= x.pitch.startDay - 7 && !x.pitch.passed) {
		flags.push({
			level: x.day >= x.pitch.startDay ? 'warning' : 'info',
			title: 'Pitch scenario not added yet',
			detail: `The Pitch Bootcamp starts on day ${x.pitch.startDay}. Add the vertical and contact your manager assigns you.`,
			href: '/pitch/'
		});
	}
	if (x.pitch.status === 'coaching') {
		flags.push({
			level: 'info',
			title: 'Pitch coaching and retake window open',
			detail: x.pitch.retakeWindowEnd ? `Retake the graded eval by ${formatDate(x.pitch.retakeWindowEnd, true)}.` : 'Schedule your retake after coaching.',
			href: '/pitch/sessions/'
		});
	}
	const order = { blocker: 0, warning: 1, info: 2 };
	return flags.sort((a, b) => order[a.level] - order[b.level]);
}
