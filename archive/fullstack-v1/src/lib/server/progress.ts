import { addDays, dateForDay, dayNumber, diffDays, formatDate, todayISO, weekDays } from '$lib/dates';
import type {
	CheckpointAttempt,
	CheckpointState,
	EnrollmentRow,
	EnrollmentView,
	Flag,
	ModuleState,
	OverallStatus,
	Person,
	PitchSession,
	PitchStageId,
	PitchStageState,
	PitchState,
	TaskState
} from '$lib/types';
import { blockForModule, orderedModules, program } from './content';
import { all, get } from './db';

const PERSON_COLS = 'id, name, email, role, title';

export function getPerson(id: string | null): Person | null {
	if (!id) return null;
	return get<Person>(`SELECT ${PERSON_COLS} FROM users WHERE id = ?`, id) ?? null;
}

export function getEnrollmentByUser(userId: string) {
	return get<EnrollmentRow>('SELECT * FROM enrollments WHERE user_id = ?', userId);
}

export function getEnrollment(id: string) {
	return get<EnrollmentRow>('SELECT * FROM enrollments WHERE id = ?', id);
}

/** The primary OEM module; defaults to the first one listed in the track. */
export function primaryOem(e: EnrollmentRow) {
	return e.primary_oem ?? program().platform.oem.modules[0];
}

export function loadAttempts(enrollmentId: string): CheckpointAttempt[] {
	const rows = all<Omit<CheckpointAttempt, 'results'>>(
		`SELECT a.*, u.name AS evaluator_name FROM checkpoint_attempts a
		 LEFT JOIN users u ON u.id = a.evaluator_id
		 WHERE a.enrollment_id = ? ORDER BY a.checkpoint_id, a.attempt_number`,
		enrollmentId
	);
	const results = all<{ attempt_id: string; module_id: string; result: 'pass' | 'needs_work'; notes: string | null }>(
		`SELECT r.* FROM checkpoint_module_results r JOIN checkpoint_attempts a ON a.id = r.attempt_id
		 WHERE a.enrollment_id = ?`,
		enrollmentId
	);
	return rows.map((a) => ({
		...a,
		results: results.filter((r) => r.attempt_id === a.id).map(({ attempt_id: _, ...r }) => r)
	}));
}

export function loadPitchSessions(enrollmentId: string): PitchSession[] {
	type Row = Omit<PitchSession, 'scores' | 'focus_dimensions'> & { scores: string | null; focus_dimensions: string | null };
	return all<Row>(
		`SELECT s.*, m.name AS manager_name, x.name AS sales_name FROM pitch_sessions s
		 LEFT JOIN users m ON m.id = s.manager_evaluator_id
		 LEFT JOIN users x ON x.id = s.sales_evaluator_id
		 WHERE s.enrollment_id = ? ORDER BY s.created_at`,
		enrollmentId
	).map((r) => ({
		...r,
		scores: r.scores ? JSON.parse(r.scores) : null,
		focus_dimensions: r.focus_dimensions ? JSON.parse(r.focus_dimensions) : null
	}));
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

function buildPitch(e: EnrollmentRow, today: string): PitchState {
	const p = program().pitch;
	const target = p.rubric.graduation_target;
	const max = p.rubric.max_per_dimension * p.rubric.dimensions.length;
	const startDay = p.start_day;
	const endDay = startDay + p.duration_weeks * 7 - 1;
	const startDate = dateForDay(e.start_date, startDay);
	const endDate = dateForDay(e.start_date, endDay);
	const sessions = loadPitchSessions(e.id);
	const scenarioAssigned = !!get('SELECT 1 AS x FROM scenarios WHERE enrollment_id = ?', e.id);

	const completed = sessions.filter((s) => s.status === 'completed');
	const scored = completed.filter((s) => s.total != null);
	const evals = completed.filter((s) => (s.stage === 'graded' || s.stage === 'retake') && s.total != null);
	const passed = evals.some((s) => s.total! >= target);
	const lastEval = evals.at(-1);
	const failedLast = !!lastEval && lastEval.total! < target;
	const pendingRetake = sessions.some((s) => s.stage === 'retake' && s.status === 'scheduled');

	const stages: PitchStageState[] = p.stages.map((st) => {
		const [a, b] = weekDays(st.week);
		const ss = sessions.filter((s) => s.stage === st.id);
		return {
			id: st.id as PitchStageId,
			title: st.title,
			scored: st.scored,
			startDate: dateForDay(e.start_date, startDay + a - 1),
			endDate: dateForDay(e.start_date, startDay + b - 1),
			sessions: ss,
			done: ss.some((s) => s.status === 'completed'),
			current: false
		};
	});

	// Retake rounds are appended after the graded eval, each with its own coaching stage.
	if (evals.length && (failedLast || evals.length > 1 || sessions.some((s) => s.stage.startsWith('retake')))) {
		const retakes = sessions.filter((s) => s.stage === 'retake_coaching' || s.stage === 'retake');
		for (const s of retakes) {
			const window = s.retake_window_end ?? lastEval?.retake_window_end ?? endDate;
			stages.push({
				id: s.stage,
				title: stageTitle(s.stage, s.attempt_number),
				scored: s.stage === 'retake',
				startDate: s.session_date ?? endDate,
				endDate: window,
				sessions: [s],
				done: s.status === 'completed',
				current: false
			});
		}
	}

	const current = stages.find((s) => !s.done);
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
		scenarioAssigned,
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

export function buildView(e: EnrollmentRow, today = todayISO()): EnrollmentView {
	const p = program();
	const day = dayNumber(e.start_date, today);
	const learner = getPerson(e.user_id)!;
	const oemPrimary = primaryOem(e);

	const doneSteps = all<{ module_id: string; step_id: string }>(
		'SELECT module_id, step_id FROM step_progress WHERE enrollment_id = ?',
		e.id
	);
	const evidence = all<{ module_id: string; n: number }>(
		'SELECT module_id, COUNT(*) AS n FROM evidence WHERE enrollment_id = ? GROUP BY module_id',
		e.id
	);
	const proofs = new Map(
		all<{ module_id: string; submitted_at: string }>(
			'SELECT module_id, submitted_at FROM exit_proofs WHERE enrollment_id = ?',
			e.id
		).map((r) => [r.module_id, r.submitted_at])
	);
	const taskRows = new Map(
		all<{ task_id: string; status: string; updated_at: string }>(
			'SELECT task_id, status, updated_at FROM task_progress WHERE enrollment_id = ?',
			e.id
		).map((r) => [r.task_id, r])
	);

	const tasks: TaskState[] = p.platform.setup_tasks.map((t) => ({
		id: t.id,
		title: t.title,
		description: t.description,
		status: taskRows.get(t.id)?.status ?? t.states[0],
		updatedAt: taskRows.get(t.id)?.updated_at ?? null,
		dueDate: dateForDay(e.start_date, t.due_day),
		neededByDate: t.needed_by_day ? dateForDay(e.start_date, t.needed_by_day) : null
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
		const stepsDone = doneSteps.filter((s) => s.module_id === m.id && m.steps.some((x) => x.id === s.step_id)).length;
		const submitted = proofs.get(m.id) ?? null;
		const unmet = m.prerequisites.filter((pre) =>
			p.modules.some((x) => x.id === pre) ? !proofs.has(pre) : !taskDone(pre)
		);
		const lockedBy = e.gating_override ? [] : unmet.map((x) => titles.get(x) ?? x);
		const weeks = m.weeks.length ? m.weeks : [1];
		const startDay = weekDays(Math.min(...weeks))[0];
		const endDay = weekDays(Math.max(...weeks))[1];
		const status: ModuleState['status'] = submitted
			? 'complete'
			: lockedBy.length
				? 'locked'
				: stepsDone > 0 || evidence.some((x) => x.module_id === m.id)
					? 'in_progress'
					: 'available';
		const isPrimaryOem = m.oem && m.id === oemPrimary;
		const selfPaced = m.oem && !isPrimaryOem;
		const endDate = dateForDay(e.start_date, endDay);
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
			evidenceCount: evidence.find((x) => x.module_id === m.id)?.n ?? 0,
			exitProofSubmittedAt: submitted,
			status,
			lockedBy,
			startDay,
			endDay,
			startDate: dateForDay(e.start_date, startDay),
			endDate,
			behind: !submitted && !selfPaced && today > endDate,
			checkpoint: m.checkpoint
		};
	});

	const attempts = loadAttempts(e.id);
	const checkpoints: CheckpointState[] = p.checkpoints.map((c) => {
		const mine = attempts.filter((a) => a.checkpoint_id === c.id);
		const latest = mine.at(-1) ?? null;
		const requiredModules = c.modules.filter((id) => !modules.find((m) => m.id === id)?.selfPaced);
		const passed = mine.some((a) => a.status === 'passed');
		let status: CheckpointState['status'] = 'upcoming';
		if (passed) status = 'passed';
		else if (latest?.status === 'scheduled') status = mine.length > 1 ? 'retake_scheduled' : 'scheduled';
		else if (latest?.status === 'needs_work') status = 'coaching';
		const lastFailed = [...mine].reverse().find((a) => a.status === 'needs_work');
		const date = dateForDay(e.start_date, c.day);
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
			missingProofs: requiredModules.filter((id) => !proofs.has(id)).map((id) => titles.get(id) ?? id),
			coachingModules:
				status === 'coaching' || status === 'retake_scheduled'
					? (lastFailed?.results.filter((r) => r.result === 'needs_work').map((r) => r.module_id) ?? [])
					: [],
			retakeWindowEnd: status === 'coaching' || status === 'retake_scheduled' ? (lastFailed?.retake_window_end ?? null) : null,
			overdue: !passed && today > (latest?.retake_window_end ?? addDays(date, 7)) && latest?.status !== 'scheduled'
		};
	});

	const pitch = buildPitch(e, today);
	const flags = buildFlags({ e, day, today, tasks, modules, checkpoints, pitch });

	const currentModule =
		modules.find((m) => m.status === 'in_progress' && !m.selfPaced) ??
		modules.find((m) => m.status === 'available' && !m.selfPaced) ??
		modules.find((m) => m.status !== 'complete' && m.status !== 'locked') ??
		null;

	const required = modules.filter((m) => !m.selfPaced);
	const allPassed = checkpoints.every((c) => c.status === 'passed');
	const inCoaching = checkpoints.some((c) => c.status === 'coaching' || c.status === 'retake_scheduled') || pitch.status === 'coaching' || pitch.status === 'retake';

	let overall: OverallStatus = 'on_track';
	if (day < 1) overall = 'not_started';
	else if (allPassed && pitch.passed) overall = 'complete';
	else if (flags.some((f) => f.level === 'blocker')) overall = 'blocked';
	else if (modules.some((m) => m.behind) || checkpoints.some((c) => c.overdue)) overall = 'behind';

	return {
		enrollment: e,
		learner,
		techEvaluator: getPerson(e.tech_evaluator_id),
		pitchManager: getPerson(e.pitch_manager_id),
		pitchSales: getPerson(e.pitch_sales_id),
		today,
		day,
		endDate: dateForDay(e.start_date, p.platform.duration_days),
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
	e: EnrollmentRow;
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
				href: '/dashboard#setup'
			});
		} else if (t.status !== def.states.at(-1) && t.neededByDate && x.today >= addDays(t.neededByDate, -3)) {
			flags.push({
				level: 'warning',
				title: `${t.title}: still waiting`,
				detail: `Requested but not received. It's needed by ${formatDate(t.neededByDate, true)}. Chase it with your manager.`,
				href: '/dashboard#setup'
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
				href: `/checkpoints/${c.id}`
			});
		}
		if (c.status === 'coaching') {
			flags.push({
				level: 'info',
				title: `${c.title}: coaching and retake window open`,
				detail: c.retakeWindowEnd ? `Retake by ${formatDate(c.retakeWindowEnd, true)}.` : 'A retake will be scheduled after coaching.',
				href: `/checkpoints/${c.id}`
			});
		}
	}

	for (const m of x.modules.filter((m) => m.behind)) {
		flags.push({
			level: 'warning',
			title: `${m.title} is behind schedule`,
			detail: `Planned to finish by ${formatDate(m.endDate, true)} (day ${m.endDay}).`,
			href: `/modules/${m.id}`
		});
	}

	if (!x.pitch.scenarioAssigned && x.day >= x.pitch.startDay - 7 && !x.pitch.passed) {
		flags.push({
			level: x.day >= x.pitch.startDay ? 'warning' : 'info',
			title: 'Pitch scenario not assigned yet',
			detail: `The Pitch Bootcamp starts on day ${x.pitch.startDay}. A manager assigns your vertical and contact.`,
			href: '/pitch'
		});
	}
	if (x.pitch.status === 'coaching') {
		flags.push({
			level: 'info',
			title: 'Pitch coaching and retake window open',
			detail: x.pitch.retakeWindowEnd ? `Retake the graded eval by ${formatDate(x.pitch.retakeWindowEnd, true)}.` : 'A retake will be scheduled after coaching.',
			href: '/pitch/sessions'
		});
	}
	const order = { blocker: 0, warning: 1, info: 2 };
	return flags.sort((a, b) => order[a.level] - order[b.level]);
}

export function listEnrollments() {
	return all<EnrollmentRow>(
		'SELECT e.* FROM enrollments e JOIN users u ON u.id = e.user_id ORDER BY e.start_date DESC, u.name'
	);
}
