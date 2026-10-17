import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/guards';
import {
	emailTaken,
	enrollSE,
	evaluatorOptions,
	isISODate,
	milestoneDays,
	oemOptions,
	personOfRole,
	tempPassword
} from '$lib/server/team';
import { todayISO } from '$lib/dates';

export const load = (event) => {
	const user = requireRole(event, 'manager');
	return {
		today: todayISO(),
		evaluators: evaluatorOptions(),
		oems: oemOptions(),
		milestones: milestoneDays(),
		me: user.id
	};
};

export const actions = {
	default: async (event) => {
		requireRole(event, 'manager');
		const f = await event.request.formData();
		const s = (k: string) => String(f.get(k) ?? '').trim();
		const values = {
			name: s('name'),
			email: s('email').toLowerCase(),
			title: s('title'),
			start_date: s('start_date'),
			primary_oem: s('primary_oem'),
			tech: s('tech'),
			manager: s('manager'),
			sales: s('sales')
		};
		const errors: Record<string, string> = {};
		if (!values.name) errors.name = 'Enter a name.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.';
		else if (emailTaken(values.email)) errors.email = 'Someone already uses this email.';
		if (!isISODate(values.start_date)) errors.start_date = 'Pick a start date.';
		if (values.primary_oem && !oemOptions().some((o) => o.id === values.primary_oem))
			errors.primary_oem = 'Pick one of the OEM modules.';
		const choice = s('password_mode') === 'custom' ? 'custom' : 'generate';
		const custom = String(f.get('password') ?? '');
		if (choice === 'custom' && custom.length < 8) errors.password = 'Use at least 8 characters.';

		let tech: string | null = null, manager: string | null = null, sales: string | null = null;
		try { tech = personOfRole(values.tech, 'tech_evaluator'); } catch { errors.tech = 'Pick a technical evaluator from the list.'; }
		try { manager = personOfRole(values.manager, 'manager'); } catch { errors.manager = 'Pick a manager from the list.'; }
		try { sales = personOfRole(values.sales, 'sales'); } catch { errors.sales = 'Pick a sales evaluator from the list.'; }

		if (Object.keys(errors).length) return fail(400, { errors, values });

		const password = choice === 'custom' ? custom : tempPassword();
		const enrollmentId = enrollSE({
			name: values.name,
			email: values.email,
			title: values.title || null,
			password,
			startDate: values.start_date,
			primaryOem: values.primary_oem || null,
			techEvaluatorId: tech,
			pitchManagerId: manager,
			pitchSalesId: sales
		});
		return {
			created: {
				enrollmentId,
				name: values.name,
				email: values.email,
				// Shown once; only the hash is stored.
				password: choice === 'generate' ? password : null
			}
		};
	}
};
