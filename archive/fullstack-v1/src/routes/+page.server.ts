import { homeFor } from '$lib/server/auth';
import { orderedModules, program } from '$lib/server/content';
import { weekDays } from '$lib/dates';

export type Stop = {
	kind: 'kickoff' | 'module' | 'checkpoint' | 'pitch';
	when: string;
	day: number;
	title: string;
	summary: string;
	icon: string;
	proof?: string;
	block?: number;
	tags?: string[];
};

const weeksLabel = (w: number[]) => (w.length > 1 ? `Weeks ${Math.min(...w)}–${Math.max(...w)}` : `Week ${w[0]}`);

export const load = ({ locals }) => {
	const p = program();
	const modules = orderedModules();
	const pitchStart = p.pitch.start_day;
	const graded = p.pitch.stages.find((s) => s.graded) ?? p.pitch.stages.at(-1)!;
	const gradedDay = pitchStart + weekDays(graded.week)[1] - 1;
	const setup = p.platform.setup_tasks[0];

	const stops: Stop[] = [
		{
			kind: 'kickoff',
			when: 'Day 1',
			day: 1,
			title: 'Kickoff',
			summary: 'Meet your evaluators, see both tracks on one timeline, and get your lab ready.',
			icon: 'rocket',
			tags: setup ? [setup.title] : []
		}
	];
	let pitchStartAdded = false;
	let gradedAdded = false;
	let prevDay = 0;
	for (const b of p.platform.blocks) {
		const cp = p.checkpoints.find((c) => c.id === b.checkpoint)!;
		for (const id of b.modules) {
			const m = modules.find((x) => x.id === id)!;
			stops.push({
				kind: 'module',
				when: weeksLabel(m.weeks),
				day: weekDays(Math.min(...m.weeks))[0],
				title: m.title,
				summary: m.summary,
				icon: m.icon,
				proof: m.exit_proof,
				block: b.number,
				tags: m.oem ? ['Partner channel'] : []
			});
		}
		if (!gradedAdded && gradedDay > prevDay && gradedDay <= cp.day) {
			stops.push({
				kind: 'pitch',
				when: `Day ${gradedDay}`,
				day: gradedDay,
				title: `${p.pitch.title}: ${graded.title}`,
				summary: `A manager and a sales rep score your live discovery and pitch. ${p.pitch.rubric.graduation_target}/20 or more graduates you.`,
				icon: 'trophy',
				tags: p.pitch.rubric.dimensions.map((d) => d.title)
			});
			gradedAdded = true;
		}
		stops.push({
			kind: 'checkpoint',
			when: `Day ${cp.day}`,
			day: cp.day,
			title: cp.title,
			summary: cp.description,
			icon: cp.format === 'capstone' ? 'trophy' : 'flag',
			block: b.number
		});
		if (!pitchStartAdded && pitchStart > prevDay && pitchStart <= cp.day) {
			stops.push({
				kind: 'pitch',
				when: `Day ${pitchStart}`,
				day: pitchStart,
				title: `${p.pitch.title} begins`,
				summary: `You're assigned a vertical and a real contact. Over ${p.pitch.duration_weeks} weeks: ${p.pitch.stages.map((s) => s.title).join(' → ')}.`,
				icon: 'mic',
				tags: p.pitch.components.map((c) => c.title)
			});
			pitchStartAdded = true;
		}
		prevDay = cp.day;
	}

	return {
		user: locals.user,
		home: locals.user ? homeFor(locals.user.role) : '/login',
		stops,
		blocks: p.platform.blocks.map((b) => ({
			...b,
			moduleTitles: b.modules.map((id) => modules.find((m) => m.id === id)!.title)
		})),
		checkpoints: p.checkpoints.map((c) => ({ id: c.id, title: c.title, day: c.day, format: c.format })),
		pitch: {
			title: p.pitch.title,
			goal: p.pitch.goal,
			startDay: pitchStart,
			endDay: pitchStart + p.pitch.duration_weeks * 7 - 1,
			stages: p.pitch.stages.map((s) => ({ id: s.id, title: s.title, week: s.week })),
			dimensions: p.pitch.rubric.dimensions,
			target: p.pitch.rubric.graduation_target,
			max: p.pitch.rubric.max_per_dimension * p.pitch.rubric.dimensions.length,
			components: p.pitch.components
		},
		platform: { title: p.platform.title, goal: p.platform.goal, days: p.platform.duration_days },
		outcomes: p.platform.outcomes,
		counts: { modules: modules.length, checkpoints: p.checkpoints.length }
	};
};
