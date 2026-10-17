// What we store about a learner. Record shapes deliberately mirror the SQL schema in
// archive/fullstack-v1/migrations so a future backend can store them as-is.
import type { EvidenceType } from '$lib/content/types';
import type { CheckpointAttempt, PitchSession } from '$lib/types';

export const SCHEMA_VERSION = 1;

export interface LearnerProfile {
	name: string;
	email: string;
	title: string;
	/** Day 1 of the program, YYYY-MM-DD. Every other date derives from it. */
	start_date: string;
	primary_oem: string | null;
	/** Names of the people running sessions. Free text until there's a user directory. */
	tech_evaluator: string;
	pitch_manager: string;
	pitch_sales: string;
	/** Self-paced override of module gating (a manager decision once there's a backend). */
	unlock_all: boolean;
	created_at: string;
}

export interface EvidenceRecord {
	id: string;
	module_id: string;
	type: EvidenceType;
	title: string | null;
	content: string | null;
	/** Key into the repository's file store (screenshots). */
	file_ref: string | null;
	file_name: string | null;
	submitted_at: string;
}

export interface DiscoveryQuestion {
	question: string;
	priority: string;
}

export interface PitchPlan {
	sections: { name: string; reason: string }[];
	objections: { objection: string; response: string }[];
	next_step: string;
}

export interface Scenario {
	vertical: string;
	company: string;
	company_profile: string | null;
	contact_name: string;
	contact_title: string | null;
	contact_profile: string | null;
	met_at: string | null;
	research: Record<string, string>;
	priority_restatement: string | null;
	discovery: DiscoveryQuestion[];
	pitch_plan: PitchPlan;
	assigned_at: string;
	updated_at: string;
}

export interface LearnerState {
	schema_version: number;
	profile: LearnerProfile | null;
	/** module id → step id → completed at */
	steps: Record<string, Record<string, string>>;
	/** setup task id → status */
	tasks: Record<string, { status: string; updated_at: string }>;
	evidence: EvidenceRecord[];
	/** module id → submitted at */
	exit_proofs: Record<string, string>;
	checkpoint_attempts: CheckpointAttempt[];
	scenario: Scenario | null;
	pitch_sessions: PitchSession[];
}

export function emptyState(): LearnerState {
	return {
		schema_version: SCHEMA_VERSION,
		profile: null,
		steps: {},
		tasks: {},
		evidence: [],
		exit_proofs: {},
		checkpoint_attempts: [],
		scenario: null,
		pitch_sessions: []
	};
}
