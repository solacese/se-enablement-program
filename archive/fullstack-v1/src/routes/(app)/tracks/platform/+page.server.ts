import { orderedModules, program } from '$lib/server/content';
import { requireUser } from '$lib/server/guards';
import { buildView, getEnrollmentByUser } from '$lib/server/progress';
import { dateForDay } from '$lib/dates';

export const load = (event) => {
	const user = requireUser(event);
	const e = user.role === 'learner' ? getEnrollmentByUser(user.id) : undefined;
	const view = e ? buildView(e) : null;
	const p = program();
	const modules = orderedModules();
	return {
		track: p.platform,
		start: e?.start_date ?? null,
		blocks: p.platform.blocks.map((b) => {
			const cp = p.checkpoints.find((c) => c.id === b.checkpoint)!;
			return {
				...b,
				startDate: e ? dateForDay(e.start_date, b.days[0]) : null,
				endDate: e ? dateForDay(e.start_date, b.days[1]) : null,
				checkpoint: { id: cp.id, title: cp.title, day: cp.day, description: cp.description, format: cp.format, status: view?.checkpoints.find((c) => c.id === cp.id)?.status ?? null },
				modules: b.modules.map((id) => {
					const m = modules.find((x) => x.id === id)!;
					return { id, title: m.title, summary: m.summary, icon: m.icon, weeks: m.weeks, exitProof: m.exit_proof, oem: m.oem, status: view?.modules.find((x) => x.id === id)?.status ?? null };
				})
			};
		})
	};
};
