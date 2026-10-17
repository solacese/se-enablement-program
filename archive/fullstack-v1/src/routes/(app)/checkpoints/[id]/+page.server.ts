import { error } from '@sveltejs/kit';
import { getCheckpoint, program } from '$lib/server/content';
import { requireOwnEnrollment } from '$lib/server/guards';
import { buildView } from '$lib/server/progress';

export const load = (event) => {
	const { enrollment } = requireOwnEnrollment(event);
	const cp = getCheckpoint(event.params.id);
	if (!cp) error(404, 'Checkpoint not found.');
	const view = buildView(enrollment);
	const state = view.checkpoints.find((c) => c.id === cp.id)!;
	const p = program();
	return {
		cp,
		state,
		today: view.today,
		evaluator: view.techEvaluator,
		modules: cp.modules.map((id) => {
			const m = p.modules.find((x) => x.id === id)!;
			return {
				id,
				title: m.title,
				exitProof: m.exit_proof,
				state: view.modules.find((x) => x.id === id)!,
				questions: [...(cp.question_bank[id] ?? []), ...m.prep_questions.filter((q) => !(cp.question_bank[id] ?? []).includes(q))]
			};
		})
	};
};
