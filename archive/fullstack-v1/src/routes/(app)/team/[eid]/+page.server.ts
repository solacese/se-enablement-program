import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { program } from '$lib/server/content';
import { requireRole } from '$lib/server/guards';
import { buildView, getEnrollment } from '$lib/server/progress';
import {
	evaluatorOptions,
	getScenarioIdentity,
	initials,
	isISODate,
	milestoneDates,
	oemOptions,
	openWindows,
	personOfRole,
	SCENARIO_IDENTITY,
	setGatingOverride,
	updateEvaluators,
	updatePrimaryOem,
	updateStartDate,
	upsertScenarioIdentity,
	type ScenarioIdentity
} from '$lib/server/team';

function enrollmentFor(event: RequestEvent<{ eid: string }>) {
	requireRole(event, 'manager');
	const e = getEnrollment(event.params.eid);
	if (!e) error(404, 'Enrollment not found.');
	return e;
}

export const load = (event) => {
	const e = enrollmentFor(event);
	const view = buildView(e);
	const p = program();
	return {
		view,
		initials: initials(view.learner.name),
		scenario: getScenarioIdentity(e.id) ?? null,
		template: p.scenarioTemplate,
		evaluators: evaluatorOptions(),
		oems: oemOptions(),
		milestones: milestoneDates(e.start_date),
		windows: openWindows(view),
		rubric: p.pitch.rubric.dimensions.map((d) => ({ id: d.id, title: d.title }))
	};
};

export const actions = {
	evaluators: async (event) => {
		const e = enrollmentFor(event);
		const f = await event.request.formData();
		try {
			updateEvaluators(e.id, {
				tech: personOfRole(f.get('tech'), 'tech_evaluator'),
				manager: personOfRole(f.get('manager'), 'manager'),
				sales: personOfRole(f.get('sales'), 'sales')
			});
		} catch {
			return fail(400, { form: 'evaluators', message: 'Pick evaluators from the lists.' });
		}
		return { form: 'evaluators', ok: 'Evaluators saved.' };
	},

	scenario: async (event) => {
		const e = enrollmentFor(event);
		const f = await event.request.formData();
		const tpl = program().scenarioTemplate;
		const values = Object.fromEntries(
			SCENARIO_IDENTITY.map((k) => [k, String(f.get(k) ?? '').trim() || null])
		) as ScenarioIdentity;
		const errors: Record<string, string> = {};
		for (const field of tpl.fields)
			if (field.required && !values[field.id as keyof ScenarioIdentity]) errors[field.id] = `${field.label} is required.`;
		for (const k of ['vertical', 'company', 'contact_name'] as const)
			if (!values[k] && !errors[k]) errors[k] = 'Required.';
		if (values.vertical && !tpl.verticals.includes(values.vertical)) errors.vertical = 'Pick a vertical from the list.';
		if (Object.keys(errors).length) return fail(400, { form: 'scenario', errors, values });
		upsertScenarioIdentity(e.id, values);
		return { form: 'scenario', ok: 'Scenario saved. The SE’s research and plans are untouched.' };
	},

	oem: async (event) => {
		const e = enrollmentFor(event);
		const f = await event.request.formData();
		const oem = String(f.get('primary_oem') ?? '');
		if (!oemOptions().some((o) => o.id === oem)) return fail(400, { form: 'oem', message: 'Pick one of the OEM modules.' });
		updatePrimaryOem(e.id, oem);
		return { form: 'oem', ok: 'Primary OEM module saved.' };
	},

	start: async (event) => {
		const e = enrollmentFor(event);
		const f = await event.request.formData();
		const start = String(f.get('start_date') ?? '');
		if (!isISODate(start)) return fail(400, { form: 'start', message: 'Pick a valid start date.' });
		updateStartDate(e.id, start);
		return { form: 'start', ok: 'Start date saved. All dates moved with it.' };
	},

	gating: async (event) => {
		const e = enrollmentFor(event);
		const f = await event.request.formData();
		const on = f.get('override') === '1';
		setGatingOverride(e.id, on);
		return { form: 'gating', ok: on ? 'Gating override is on.' : 'Gating override is off.' };
	}
};
