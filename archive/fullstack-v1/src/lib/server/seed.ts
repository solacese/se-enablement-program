// Demo data so the app is explorable on first run. All people and companies are
// fictional. Dates are relative to today so the demo always looks "live".
import { addDays, dateForDay, todayISO } from '$lib/dates';
import { hashPassword, type Role } from './auth';
import { orderedModules, program } from './content';
import { get, id, now, run, tx } from './db';

export const DEMO_PASSWORD = 'demo1234';

export const DEMO_ACCOUNTS: { email: string; name: string; role: Role; title: string }[] = [
	{ email: 'alex@solace.demo', name: 'Alex Rivera', role: 'learner', title: 'Sales Engineer' },
	{ email: 'jordan@solace.demo', name: 'Jordan Lee', role: 'learner', title: 'Sales Engineer' },
	{ email: 'sam@solace.demo', name: 'Sam Okafor', role: 'learner', title: 'Sales Engineer' },
	{ email: 'riley@solace.demo', name: 'Riley Chen', role: 'learner', title: 'Sales Engineer' },
	{ email: 'priya@solace.demo', name: 'Priya Nair', role: 'tech_evaluator', title: 'Senior Sales Engineer' },
	{ email: 'dana@solace.demo', name: 'Dana Whitfield', role: 'manager', title: 'Director, Sales Engineering' },
	{ email: 'chris@solace.demo', name: 'Chris Morgan', role: 'sales', title: 'Account Executive' }
];

export function seedIfEmpty() {
	if (get('SELECT 1 AS x FROM users LIMIT 1')) return;
	tx(seed);
	console.log(`[seed] Demo data created. Sign in with any demo account, password "${DEMO_PASSWORD}".`);
}

function seed() {
	const today = todayISO();
	const hash = hashPassword(DEMO_PASSWORD);
	const users: Record<string, string> = {};
	for (const a of DEMO_ACCOUNTS) {
		const uid = id();
		users[a.email.split('@')[0]] = uid;
		run(
			'INSERT INTO users (id, name, email, role, title, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			uid, a.name, a.email, a.role, a.title, hash, now()
		);
	}
	const { priya, dana, chris } = users;

	const enroll = (user: string, startOffset: number, oem: string | null = null) => {
		const eid = id();
		run(
			`INSERT INTO enrollments (id, user_id, start_date, primary_oem, tech_evaluator_id, pitch_manager_id, pitch_sales_id, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			eid, users[user], addDays(today, startOffset), oem, priya, dana, chris, now()
		);
		return { eid, start: addDays(today, startOffset) };
	};

	const at = (start: string, day: number) => dateForDay(start, day) + 'T15:00:00.000Z';
	const modules = orderedModules();

	const completeModule = (eid: string, start: string, moduleId: string, day: number) => {
		const m = modules.find((x) => x.id === moduleId)!;
		for (const s of m.steps)
			run('INSERT INTO step_progress VALUES (?, ?, ?, ?)', eid, m.id, s.id, at(start, day - 1));
		run(
			'INSERT INTO evidence (id, enrollment_id, module_id, type, title, content, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			id(), eid, m.id, 'notes', 'What I built', `Worked through every step of ${m.title}. Exit proof: ${m.exit_proof}`, at(start, day)
		);
		run(
			'INSERT INTO evidence (id, enrollment_id, module_id, type, title, content, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			id(), eid, m.id, 'recording_link', 'Demo recording', `https://recordings.example.com/${m.id}`, at(start, day)
		);
		run('INSERT INTO exit_proofs VALUES (?, ?, ?)', eid, m.id, at(start, day));
	};

	const partial = (eid: string, start: string, moduleId: string, n: number, day: number) => {
		const m = modules.find((x) => x.id === moduleId)!;
		for (const s of m.steps.slice(0, n)) run('INSERT INTO step_progress VALUES (?, ?, ?, ?)', eid, m.id, s.id, at(start, day));
	};

	const task = (eid: string, status: string, ts: string) =>
		run('INSERT INTO task_progress VALUES (?, ?, ?, ?)', eid, 'enterprise-eval-broker', status, ts);

	const checkpoint = (
		eid: string, start: string, cp: string, attempt: number, day: number,
		status: 'passed' | 'needs_work' | 'scheduled', results: Record<string, 'pass' | 'needs_work'>, notes: string
	) => {
		const aid = id();
		const done = status !== 'scheduled';
		const notesOrNull = notes || null;
		const window = status === 'needs_work' ? addDays(dateForDay(start, day), program().checkpoints.find((c) => c.id === cp)!.retake_window_days) : null;
		run(
			`INSERT INTO checkpoint_attempts (id, enrollment_id, checkpoint_id, attempt_number, scheduled_date, evaluator_id, status, notes, retake_window_end, completed_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			aid, eid, cp, attempt, dateForDay(start, day), priya, status, notesOrNull, window, done ? at(start, day) : null, at(start, day - 5)
		);
		for (const [mid, r] of Object.entries(results))
			run('INSERT INTO checkpoint_module_results VALUES (?, ?, ?, ?)', aid, mid, r,
				r === 'pass' ? 'Clear explanation, setup worked first time.' : 'Could not show the flow end to end. Revisit the topic mapping and failure handling.');
	};

	const scores = (a: number, b: number, c: number, d: number) => ({
		priority_restatement: a, discovery_quality: b, pitch_relevance: c, objection_handling: d
	});

	const pitchSession = (
		eid: string, start: string, stage: string, day: number,
		s: ReturnType<typeof scores> | null, feedback: string | null, opts: { attempt?: number; scheduled?: boolean; focus?: string[]; window?: string } = {}
	) => {
		const total = s ? Object.values(s).reduce((a, b) => a + b, 0) : null;
		run(
			`INSERT INTO pitch_sessions (id, enrollment_id, stage, attempt_number, session_date, manager_evaluator_id, sales_evaluator_id, status, scores, total, feedback, observations, focus_dimensions, retake_window_end, completed_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id(), eid, stage, opts.attempt ?? 1, dateForDay(start, day), dana, chris,
			opts.scheduled ? 'scheduled' : 'completed',
			s && !opts.scheduled ? JSON.stringify(s) : null,
			opts.scheduled ? null : total,
			opts.scheduled ? null : feedback,
			opts.scheduled ? null : 'Good energy and preparation. Slow down when restating priorities.',
			opts.focus ? JSON.stringify(opts.focus) : null,
			opts.window ?? null,
			opts.scheduled ? null : at(start, day),
			at(start, day - 3)
		);
	};

	const scenario = (eid: string, v: Record<string, string>, research: Record<string, string>, restatement: string, discovery: unknown[], plan: unknown) =>
		run(
			`INSERT INTO scenarios (enrollment_id, vertical, company, company_profile, contact_name, contact_title, contact_profile, met_at, research, priority_restatement, discovery, pitch_plan, assigned_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			eid, v.vertical, v.company, v.company_profile, v.contact_name, v.contact_title, v.contact_profile, v.met_at,
			JSON.stringify(research), restatement, JSON.stringify(discovery), JSON.stringify(plan), now(), now()
		);

	// Alex: day 41. Block 1 done, Day 30 passed, part-way through APIs; pitch baseline + coaching done.
	{
		const { eid, start } = enroll('alex', -40, 'sap-aem');
		task(eid, 'received', at(start, 4));
		completeModule(eid, start, 'broker-fundamentals', 13);
		completeModule(eid, start, 'ha-dr', 21);
		completeModule(eid, start, 'solace-cloud', 28);
		partial(eid, start, 'apis-protocols', 2, 38);
		checkpoint(eid, start, 'day-30', 1, 30, 'passed',
			{ 'broker-fundamentals': 'pass', 'ha-dr': 'pass', 'solace-cloud': 'pass' },
			'Strong DR demo with sequence numbers. Topic design answers were crisp.');
		checkpoint(eid, start, 'day-60', 1, 60, 'scheduled', {}, '');
		scenario(eid,
			{ vertical: 'Airlines', company: 'Northwind Air (fictional)', company_profile: 'Mid-size carrier, ~180 aircraft, modernising its operations control centre.', contact_name: 'Morgan Blake (fictional)', contact_title: 'VP Digital Operations', contact_profile: 'Owns disruption management. Said their biggest pain is passengers hearing about delays before gate staff do.', met_at: 'Travel-tech conference (demo)' },
			{ company_overview: 'Hub-and-spoke carrier, two hubs. Recently announced an ops modernisation programme.', stated_priorities: '1) Faster disruption response. 2) One view of flight status across ops, crew and customer apps.', use_cases: 'Flight status events to gate apps, crew re-assignment, passenger notifications.', hypotheses: 'Status data is batch-synced between ops and customer systems today.' },
			'You want everyone, from ops control to the passenger app, working from the same real-time flight status, so disruptions are handled before customers notice.',
			[{ question: 'Walk me through what happens today from a delay being detected to a passenger being notified.', priority: 'Faster disruption response' }],
			{ sections: [{ name: 'Why event-driven, why now', reason: 'Frame the delay-notification gap.' }], objections: [{ objection: 'We already use Kafka for streaming.', response: 'Many airlines run both. Solace covers the operational, low-latency, many-protocol side.' }], next_step: 'Workshop with the ops control centre team.' });
		pitchSession(eid, start, 'baseline', 31, scores(3, 2, 3, 3), 'Good research. Discovery questions were mostly closed. Ask "how" and "what happens when".');
		pitchSession(eid, start, 'coaching', 38, null, 'Practised turning closed questions into open ones. Rehearsed the Kafka objection.');
		pitchSession(eid, start, 'practice', 45, null, null, { scheduled: true });
	}

	// Jordan: day 69. Day 60 needs work on Micro-Integrations; pitch graded eval below target → coaching.
	{
		const { eid, start } = enroll('jordan', -68, 'boomi-event-streams');
		task(eid, 'received', at(start, 6));
		completeModule(eid, start, 'broker-fundamentals', 14);
		completeModule(eid, start, 'ha-dr', 22);
		completeModule(eid, start, 'solace-cloud', 29);
		completeModule(eid, start, 'apis-protocols', 43);
		completeModule(eid, start, 'micro-integrations', 50);
		completeModule(eid, start, 'event-portal', 57);
		partial(eid, start, 'insights-distributed-tracing', 1, 62);
		checkpoint(eid, start, 'day-30', 1, 30, 'passed',
			{ 'broker-fundamentals': 'pass', 'ha-dr': 'pass', 'solace-cloud': 'pass' }, 'Solid all round.');
		checkpoint(eid, start, 'day-60', 1, 60, 'needs_work',
			{ 'apis-protocols': 'pass', 'micro-integrations': 'needs_work', 'event-portal': 'pass' },
			'Great protocol demo. The micro-integration did not recover after a source restart, and the explanation was unclear.');
		scenario(eid,
			{ vertical: 'Capital markets', company: 'Harbor Point Capital (fictional)', company_profile: 'Regional broker-dealer expanding into electronic trading.', contact_name: 'Taylor Brooks (fictional)', contact_title: 'Head of Trading Technology', contact_profile: 'Focused on latency and on consolidating three market-data feeds.', met_at: 'Fintech summit (demo)' },
			{ company_overview: 'Growing e-trading desk, legacy MQ in the back office.', stated_priorities: 'Lower latency on market data; fewer middleware products.', use_cases: 'Market data distribution, order routing, post-trade.', hypotheses: 'They run separate middleware for front and back office.' },
			'You need market data to reach traders faster, and you want fewer middleware products to run.',
			[], {});
		pitchSession(eid, start, 'baseline', 31, scores(2, 2, 3, 3), 'Restatement missed the consolidation priority.');
		pitchSession(eid, start, 'coaching', 38, null, 'Worked on restating both priorities in the customer\'s own words.');
		pitchSession(eid, start, 'practice', 45, scores(3, 3, 3, 4), 'Better. Tie each deck section back to a priority out loud.');
		const r = program().pitch.retake;
		pitchSession(eid, start, 'graded', 57, scores(4, 3, 4, 3), 'Close. Discovery and objection handling need one more round.',
			{ focus: ['discovery_quality', 'objection_handling'], window: dateForDay(start, 57 + r.coaching_days + r.window_days) });
		pitchSession(eid, start, 'retake_coaching', 70, null, null, { attempt: 2, scheduled: true });
	}

	// Sam: day 4. Hasn't requested the Enterprise evaluation broker yet → blocked.
	{
		const { eid, start } = enroll('sam', -3);
		partial(eid, start, 'broker-fundamentals', 1, 2);
	}

	// Riley: starts next week.
	enroll('riley', 5);
}
