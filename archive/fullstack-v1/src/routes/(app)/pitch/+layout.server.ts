import { requireOwnEnrollment } from '$lib/server/guards';
import { loadScenario, pitchContent, prepProgress } from '$lib/server/pitch';
import { buildView } from '$lib/server/progress';

export const load = (event) => {
	const { enrollment } = requireOwnEnrollment(event);
	const view = buildView(enrollment);
	const scenario = loadScenario(enrollment.id);
	return {
		pitch: view.pitch,
		today: view.today,
		day: view.day,
		learner: view.learner,
		pitchManager: view.pitchManager,
		pitchSales: view.pitchSales,
		scenario,
		prep: prepProgress(scenario),
		content: pitchContent()
	};
};
