import { error } from '@sveltejs/kit';
import { getCheckpoint, program } from '$lib/content/program';

/** Prerender a page for every checkpoint. */
export const entries = () => program().checkpoints.map((c) => ({ id: c.id }));

export const load = ({ params }) => {
	const cp = getCheckpoint(params.id);
	if (!cp) error(404, 'Checkpoint not found.');
	const p = program();
	return {
		cp,
		modules: cp.modules.map((id) => {
			const m = p.modules.find((x) => x.id === id)!;
			const bank = cp.question_bank[id] ?? [];
			return { id, title: m.title, exitProof: m.exit_proof, questions: [...bank, ...m.prep_questions.filter((q) => !bank.includes(q))] };
		})
	};
};
