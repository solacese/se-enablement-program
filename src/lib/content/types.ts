// Shapes of the program content in /content. Kept in a shared module so both
// server code and components can use them.

export interface Block {
	id: string;
	number: number;
	days: [number, number];
	theme: string;
	tagline?: string;
	modules: string[];
	checkpoint: string;
}

export interface SetupTask {
	id: string;
	title: string;
	due_day: number;
	needed_by_day?: number;
	description: string;
	states: string[];
}

export interface PlatformTrack {
	id: string;
	title: string;
	short_title: string;
	duration_days: number;
	goal: string;
	blocks: Block[];
	setup_tasks: SetupTask[];
	oem: { week: number; modules: string[]; note: string };
	outcomes: string[];
}

export interface PitchStage {
	id: string;
	title: string;
	week: number;
	scored: boolean;
	graded?: boolean;
	description: string;
}

export interface RubricDimension {
	id: string;
	title: string;
	proficient: string;
}

export interface PitchTrack {
	id: string;
	title: string;
	short_title: string;
	start_day: number;
	duration_weeks: number;
	goal: string;
	evaluators: string;
	components: { id: string; number: number; title: string; focus: string; description: string }[];
	evaluation_flow: { title: string; description: string }[];
	stages: PitchStage[];
	rubric: {
		max_per_dimension: number;
		graduation_target: number;
		dimensions: RubricDimension[];
		scale: Record<number, string>;
	};
	retake: { coaching_focus_count: number; coaching_days: number; window_days: number };
	deck: { title: string; url: string; sections: string[] };
	research_prompts: { id: string; title: string; hint: string }[];
	common_objections: string[];
}

export interface ModuleStep {
	id: string;
	title: string;
	minutes: number | null;
}

export interface Module {
	id: string;
	file: string; // path usable with import.meta.glob keys, e.g. /content/modules/01-x.md
	title: string;
	track: string;
	block: number;
	order: number;
	weeks: number[];
	estimated_hours: number | null;
	icon: string;
	oem: boolean;
	summary: string;
	why_it_matters: string;
	prerequisites: string[];
	exit_proof: string;
	evidence_types: EvidenceType[];
	checkpoint: string;
	prep_questions: string[];
	steps: ModuleStep[];
}

export type EvidenceType = 'notes' | 'screenshot' | 'config' | 'recording_link';

export interface Checkpoint {
	id: string;
	title: string;
	track: string;
	day: number;
	format: 'quiz' | 'capstone';
	evaluator_role: string;
	description: string;
	modules: string[];
	retake_window_days: number;
	general_questions: string[];
	question_bank: Record<string, string[]>;
}

export interface ScenarioTemplate {
	fields: { id: string; label: string; type: string; required?: boolean; hint?: string }[];
	verticals: string[];
}

export interface Program {
	platform: PlatformTrack;
	pitch: PitchTrack;
	modules: Module[];
	checkpoints: Checkpoint[];
	scenarioTemplate: ScenarioTemplate;
}

export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
	notes: 'Notes',
	screenshot: 'Screenshot',
	config: 'Config file or snippet',
	recording_link: 'Recording link'
};
