import { error, fail } from '@sveltejs/kit';
import { addDays, todayISO } from '$lib/dates';
import { getCheckpoint, program } from '$lib/server/content';
import { all, get, id, now, run, tx } from '$lib/server/db';
import { listEvidence } from '$lib/server/evidence';
import { requireAssignedEnrollment } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

function context(event: Parameters<typeof requireAssignedEnrollment>[0] & { params: { eid: string; cid: string } }) {
	const { user, enrollment } = requireAssignedEnrollment(event, event.params.eid);
	const cp = getCheckpoint(event.params.cid);
	if (!cp) error(404, 'Checkpoint not found.');
	return { user, enrollment, cp };
}

export const load = (event) => {
	const { user, enrollment, cp } = context(event);
	const view = buildView(enrollment);
	const state = view.checkpoints.find((c) => c.id === cp.id)!;
	const p = program();
	return {
		cp,
		state,
		learner: view.learner,
		eid: enrollment.id,
		canRecord: user.role === 'tech_evaluator' || user.role === 'manager',
		me: user.id,
		defaultEvaluator: enrollment.tech_evaluator_id ?? user.id,
		evaluators: all<{ id: string; name: string }>("SELECT id, name FROM users WHERE role IN ('tech_evaluator', 'manager') ORDER BY name"),
		today: view.today,
		modules: cp.modules.map((mid) => {
			const m = p.modules.find((x) => x.id === mid)!;
			const ms = view.modules.find((x) => x.id === mid)!;
			return {
				id: mid,
				title: m.title,
				exitProof: m.exit_proof,
				state: ms,
				evidence: listEvidence(enrollment.id, mid),
				questions: cp.question_bank[mid] ?? m.prep_questions
			};
		})
	};
};

export const actions = {
	schedule: async (event) => {
		const { user, enrollment, cp } = context(event);
		if (user.role === 'sales') error(403, 'Only technical evaluators and managers can schedule checkpoints.');
		const form = await event.request.formData();
		const date = String(form.get('date') ?? '');
		const evaluator = String(form.get('evaluator') ?? '') || user.id;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400, { scheduleError: 'Pick a date for the session.' });
		const attempts = all<{ id: string; attempt_number: number; status: string }>(
			'SELECT id, attempt_number, status FROM checkpoint_attempts WHERE enrollment_id = ? AND checkpoint_id = ? ORDER BY attempt_number',
			enrollment.id, cp.id
		);
		if (attempts.some((a) => a.status === 'passed')) return fail(400, { scheduleError: 'This checkpoint is already passed.' });
		const latest = attempts.at(-1);
		if (latest?.status === 'scheduled') {
			run('UPDATE checkpoint_attempts SET scheduled_date = ?, evaluator_id = ? WHERE id = ?', date, evaluator, latest.id);
		} else {
			run(
				`INSERT INTO checkpoint_attempts (id, enrollment_id, checkpoint_id, attempt_number, scheduled_date, evaluator_id, status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
				id(), enrollment.id, cp.id, (latest?.attempt_number ?? 0) + 1, date, evaluator, now()
			);
		}
		return { scheduled: true };
	},

	record: async (event) => {
		const { user, enrollment, cp } = context(event);
		if (user.role === 'sales') error(403, 'Only technical evaluators and managers can record checkpoint results.');
		const form = await event.request.formData();
		const results = cp.modules.map((mid) => ({
			mid,
			result: String(form.get(`result_${mid}`) ?? ''),
			notes: String(form.get(`notes_${mid}`) ?? '').trim() || null
		}));
		const missing = results.filter((r) => r.result !== 'pass' && r.result !== 'needs_work');
		if (missing.length) {
			const titles = missing.map((r) => program().modules.find((m) => m.id === r.mid)?.title ?? r.mid);
			return fail(400, { recordError: `Choose pass or needs work for: ${titles.join(', ')}.` });
		}
		const notes = String(form.get('notes') ?? '').trim() || null;
		const passed = results.every((r) => r.result === 'pass');
		const today = todayISO();

		tx(() => {
			const latest = get<{ id: string; attempt_number: number; status: string; scheduled_date: string | null }>(
				'SELECT id, attempt_number, status, scheduled_date FROM checkpoint_attempts WHERE enrollment_id = ? AND checkpoint_id = ? ORDER BY attempt_number DESC LIMIT 1',
				enrollment.id, cp.id
			);
			let attemptId: string;
			let sessionDate = today;
			if (latest?.status === 'scheduled') {
				attemptId = latest.id;
				sessionDate = latest.scheduled_date && latest.scheduled_date < today ? latest.scheduled_date : today;
			} else {
				attemptId = id();
				run(
					`INSERT INTO checkpoint_attempts (id, enrollment_id, checkpoint_id, attempt_number, scheduled_date, evaluator_id, status, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
					attemptId, enrollment.id, cp.id, (latest?.attempt_number ?? 0) + 1, today, user.id, now()
				);
			}
			// A needs-work result opens coaching and a retake window. Every attempt is kept.
			run(
				`UPDATE checkpoint_attempts SET status = ?, notes = ?, evaluator_id = ?, scheduled_date = ?, completed_at = ?, retake_window_end = ? WHERE id = ?`,
				passed ? 'passed' : 'needs_work', notes, user.id, sessionDate, now(), passed ? null : addDays(today, cp.retake_window_days), attemptId
			);
			run('DELETE FROM checkpoint_module_results WHERE attempt_id = ?', attemptId);
			for (const r of results)
				run('INSERT INTO checkpoint_module_results (attempt_id, module_id, result, notes) VALUES (?, ?, ?, ?)', attemptId, r.mid, r.result, r.notes);
		});
		return { recorded: passed ? 'passed' : 'needs_work' };
	}
};
