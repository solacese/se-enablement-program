import { error, fail } from '@sveltejs/kit';
import { blockForModule, getCheckpoint, getModule, orderedModules, program } from '$lib/server/content';
import { addEvidence, deleteEvidence, doneSteps, listEvidence, submitExitProof } from '$lib/server/evidence';
import { requireOwnEnrollment, requireUser } from '$lib/server/guards';
import { buildView, getEnrollmentByUser } from '$lib/server/progress';

export const load = (event) => {
	const user = requireUser(event);
	const m = getModule(event.params.id);
	if (!m) error(404, 'We couldn’t find that module.');
	const ordered = orderedModules();
	const i = ordered.findIndex((x) => x.id === m.id);
	const block = blockForModule(m.id)!;
	const cp = getCheckpoint(m.checkpoint);
	const p = program();
	const titleOf = (id: string) => p.modules.find((x) => x.id === id)?.title ?? p.platform.setup_tasks.find((t) => t.id === id)?.title ?? id;

	const e = user.role === 'learner' ? getEnrollmentByUser(user.id) : undefined;
	const view = e ? buildView(e) : null;
	const state = view?.modules.find((x) => x.id === m.id) ?? null;

	return {
		module: m,
		index: i + 1,
		total: ordered.length,
		block: { number: block.number, theme: block.theme },
		prev: ordered[i - 1] ? { id: ordered[i - 1].id, title: ordered[i - 1].title } : null,
		next: ordered[i + 1] ? { id: ordered[i + 1].id, title: ordered[i + 1].title } : null,
		prerequisites: m.prerequisites.map((id) => ({
			id,
			title: titleOf(id),
			isModule: p.modules.some((x) => x.id === id),
			met: state ? !state.lockedBy.includes(titleOf(id)) : null
		})),
		checkpoint: cp ? { id: cp.id, title: cp.title, day: cp.day, general: cp.general_questions, bank: cp.question_bank[m.id] ?? [] } : null,
		learner: e && view && state
			? {
					state,
					done: doneSteps(e.id, m.id),
					evidence: listEvidence(e.id, m.id),
					checkpointDate: view.checkpoints.find((c) => c.id === m.checkpoint)?.date ?? null,
					checkpointPassed: view.checkpoints.find((c) => c.id === m.checkpoint)?.status === 'passed',
					override: !!e.gating_override
				}
			: null
	};
};

function editable(event: Parameters<typeof requireOwnEnrollment>[0], moduleId: string) {
	const { enrollment } = requireOwnEnrollment(event);
	const m = getModule(moduleId);
	if (!m) error(404, 'Module not found.');
	const state = buildView(enrollment).modules.find((x) => x.id === m.id)!;
	return { enrollment, m, state };
}

export const actions = {
	evidence: async (event) => {
		const { enrollment, m, state } = editable(event, event.params.id);
		if (state.status === 'locked') return fail(409, { evidenceError: 'This module is locked until its prerequisites are done.' });
		const err = await addEvidence(enrollment, m.id, m.evidence_types, await event.request.formData());
		if (err) return fail(400, { evidenceError: err });
		return { evidenceSaved: true };
	},
	deleteEvidence: async (event) => {
		const { enrollment } = editable(event, event.params.id);
		const form = await event.request.formData();
		deleteEvidence(enrollment.id, String(form.get('id')));
		return { deleted: true };
	},
	submit: async (event) => {
		const { enrollment, m, state } = editable(event, event.params.id);
		if (state.status === 'locked') return fail(409, { submitError: 'This module is locked until its prerequisites are done.' });
		if (state.evidenceCount === 0) return fail(400, { submitError: 'Add at least one piece of evidence before you submit your exit proof.' });
		submitExitProof(enrollment.id, m.id);
		return { submitted: true };
	}
};
