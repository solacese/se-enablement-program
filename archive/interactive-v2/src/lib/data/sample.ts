// Sample progress for exploring the app: an SE on day 41 with Block 1 done, the Day 30
// checkpoint passed, and the pitch bootcamp under way. People and companies are fictional.
import { orderedModules, program } from '$lib/content/program';
import { addDays, dateForDay, todayISO } from '$lib/dates';
import type { PitchSession } from '$lib/types';
import { emptyState, type LearnerState } from './types';

export function sampleState(): LearnerState {
	const s = emptyState();
	const start = addDays(todayISO(), -40);
	const at = (day: number) => dateForDay(start, day) + 'T15:00:00.000Z';
	const modules = orderedModules();
	const id = () => crypto.randomUUID();

	s.profile = {
		name: 'Alex Rivera',
		email: 'alex@example.com',
		title: 'Sales Engineer',
		start_date: start,
		primary_oem: 'sap-aem',
		tech_evaluator: 'Priya Nair',
		pitch_manager: 'Dana Whitfield',
		pitch_sales: 'Chris Morgan',
		unlock_all: false,
		created_at: at(1)
	};
	s.tasks['enterprise-eval-broker'] = { status: 'received', updated_at: at(4) };

	const complete = (moduleId: string, day: number) => {
		const m = modules.find((x) => x.id === moduleId)!;
		s.steps[m.id] = Object.fromEntries(m.steps.map((st) => [st.id, at(day - 1)]));
		s.evidence.push(
			{ id: id(), module_id: m.id, type: 'notes', title: 'What I built', content: `Worked through every step of ${m.title}. ${m.exit_proof}`, file_ref: null, file_name: null, submitted_at: at(day) },
			{ id: id(), module_id: m.id, type: 'recording_link', title: 'Demo recording', content: `https://recordings.example.com/${m.id}`, file_ref: null, file_name: null, submitted_at: at(day) }
		);
		s.exit_proofs[m.id] = at(day);
	};
	complete('broker-fundamentals', 13);
	complete('ha-dr', 21);
	complete('solace-cloud', 28);
	const apis = modules.find((x) => x.id === 'apis-protocols')!;
	s.steps[apis.id] = Object.fromEntries(apis.steps.slice(0, 2).map((st) => [st.id, at(38)]));

	s.checkpoint_attempts.push(
		{
			id: id(), checkpoint_id: 'day-30', attempt_number: 1, scheduled_date: dateForDay(start, 30), evaluator_id: null, evaluator_name: 'Priya Nair',
			status: 'passed', notes: 'Strong DR demo with sequence numbers. Topic design answers were crisp.', retake_window_end: null, completed_at: at(30),
			results: ['broker-fundamentals', 'ha-dr', 'solace-cloud'].map((m) => ({ module_id: m, result: 'pass' as const, notes: 'Clear explanation, setup worked first time.' }))
		},
		{
			id: id(), checkpoint_id: 'day-60', attempt_number: 1, scheduled_date: dateForDay(start, 60), evaluator_id: null, evaluator_name: 'Priya Nair',
			status: 'scheduled', notes: null, retake_window_end: null, completed_at: null, results: []
		}
	);

	s.scenario = {
		vertical: 'Airlines',
		company: 'Northwind Air (fictional)',
		company_profile: 'Mid-size carrier, ~180 aircraft, modernising its operations control centre.',
		contact_name: 'Morgan Blake (fictional)',
		contact_title: 'VP Digital Operations',
		contact_profile: 'Owns disruption management. Said their biggest pain is passengers hearing about delays before gate staff do.',
		met_at: 'Travel-tech conference (sample)',
		research: {
			company_overview: 'Hub-and-spoke carrier, two hubs. Recently announced an ops modernisation programme.',
			stated_priorities: 'Faster disruption response\nOne view of flight status across ops, crew and customer apps',
			use_cases: 'Flight status events to gate apps, crew re-assignment, passenger notifications.',
			hypotheses: 'Status data is batch-synced between ops and customer systems today.'
		},
		priority_restatement: 'You want everyone, from ops control to the passenger app, working from the same real-time flight status, so disruptions are handled before customers notice.',
		discovery: [{ question: 'Walk me through what happens today from a delay being detected to a passenger being notified.', priority: 'Faster disruption response' }],
		pitch_plan: {
			sections: [{ name: 'Why event-driven, why now', reason: 'Frame the delay-notification gap.' }],
			objections: [{ objection: 'We already use Kafka for streaming.', response: 'Many airlines run both. Solace covers the operational, low-latency, many-protocol side.' }],
			next_step: 'Workshop with the ops control centre team.'
		},
		assigned_at: at(24),
		updated_at: at(36)
	};

	const session = (stage: PitchSession['stage'], day: number, scores: number[] | null, feedback: string | null, scheduled = false): PitchSession => {
		const dims = program().pitch.rubric.dimensions;
		const sc = scores && !scheduled ? Object.fromEntries(dims.map((d, i) => [d.id, scores[i]])) : null;
		return {
			id: id(), stage, attempt_number: 1, session_date: dateForDay(start, day),
			manager_evaluator_id: null, sales_evaluator_id: null, manager_name: 'Dana Whitfield', sales_name: 'Chris Morgan',
			status: scheduled ? 'scheduled' : 'completed', scores: sc, total: sc ? Object.values(sc).reduce((a, b) => a + b, 0) : null,
			feedback: scheduled ? null : feedback, observations: scheduled ? null : 'Good energy and preparation. Slow down when restating priorities.',
			focus_dimensions: null, retake_window_end: null, completed_at: scheduled ? null : at(day), created_at: at(day - 3)
		};
	};
	s.pitch_sessions.push(
		session('baseline', 31, [3, 2, 3, 3], 'Good research. Discovery questions were mostly closed. Ask "how" and "what happens when".'),
		session('coaching', 38, null, 'Practised turning closed questions into open ones. Rehearsed the Kafka objection.'),
		session('practice', 45, null, null, true)
	);
	return s;
}
