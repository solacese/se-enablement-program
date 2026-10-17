import { orderedModules, program } from '$lib/server/content';
import { requireUser } from '$lib/server/guards';
import { buildView, getEnrollmentByUser } from '$lib/server/progress';

export const load = (event) => {
	const user = requireUser(event);
	const e = user.role === 'learner' ? getEnrollmentByUser(user.id) : undefined;
	const view = e ? buildView(e) : null;
	const p = program();
	const modules = orderedModules();
	return {
		day: view?.day ?? null,
		blocks: p.platform.blocks.map((b) => ({
			number: b.number,
			theme: b.theme,
			tagline: b.tagline,
			days: b.days,
			checkpoint: p.checkpoints.find((c) => c.id === b.checkpoint)!.title,
			checkpointId: b.checkpoint,
			checkpointStatus: view?.checkpoints.find((c) => c.id === b.checkpoint)?.status ?? null,
			modules: b.modules.map((id) => {
				const m = modules.find((x) => x.id === id)!;
				return {
					id: m.id,
					title: m.title,
					summary: m.summary,
					icon: m.icon,
					weeks: m.weeks,
					steps: m.steps.length,
					hours: m.estimated_hours,
					exitProof: m.exit_proof,
					state: view?.modules.find((x) => x.id === id) ?? null
				};
			})
		})),
		oemNote: p.platform.oem.note
	};
};
