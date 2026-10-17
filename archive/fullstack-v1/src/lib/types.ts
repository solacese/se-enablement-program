// View models shared between server loads and components.
import type { Role } from '$lib/server/auth';

export type { Role };

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'complete';

export interface ModuleState {
	id: string;
	title: string;
	summary: string;
	block: number;
	weeks: number[];
	icon: string;
	oem: boolean;
	isPrimaryOem: boolean;
	selfPaced: boolean;
	stepsTotal: number;
	stepsDone: number;
	evidenceCount: number;
	exitProofSubmittedAt: string | null;
	status: ModuleStatus;
	lockedBy: string[];
	startDay: number;
	endDay: number;
	startDate: string;
	endDate: string;
	behind: boolean;
	checkpoint: string;
}

export interface CheckpointResultRow {
	module_id: string;
	result: 'pass' | 'needs_work';
	notes: string | null;
}

export interface CheckpointAttempt {
	id: string;
	checkpoint_id: string;
	attempt_number: number;
	scheduled_date: string | null;
	evaluator_id: string | null;
	evaluator_name: string | null;
	status: 'scheduled' | 'passed' | 'needs_work';
	notes: string | null;
	retake_window_end: string | null;
	completed_at: string | null;
	results: CheckpointResultRow[];
}

export type CheckpointStatus = 'upcoming' | 'scheduled' | 'passed' | 'coaching' | 'retake_scheduled';

export interface CheckpointState {
	id: string;
	title: string;
	day: number;
	date: string;
	format: 'quiz' | 'capstone';
	block: number;
	modules: string[];
	requiredModules: string[];
	attempts: CheckpointAttempt[];
	latest: CheckpointAttempt | null;
	status: CheckpointStatus;
	missingProofs: string[];
	coachingModules: string[];
	retakeWindowEnd: string | null;
	overdue: boolean;
}

export type PitchStageId = 'baseline' | 'coaching' | 'practice' | 'graded' | 'retake_coaching' | 'retake';

export interface PitchSession {
	id: string;
	stage: PitchStageId;
	attempt_number: number;
	session_date: string | null;
	manager_evaluator_id: string | null;
	sales_evaluator_id: string | null;
	manager_name: string | null;
	sales_name: string | null;
	status: 'scheduled' | 'completed';
	scores: Record<string, number> | null;
	total: number | null;
	feedback: string | null;
	observations: string | null;
	focus_dimensions: string[] | null;
	retake_window_end: string | null;
	completed_at: string | null;
	created_at: string;
}

export interface PitchStageState {
	id: PitchStageId;
	title: string;
	scored: boolean;
	startDate: string;
	endDate: string;
	sessions: PitchSession[];
	done: boolean;
	current: boolean;
}

export type PitchStatus = 'not_started' | 'in_progress' | 'coaching' | 'retake' | 'graduated';

export interface PitchState {
	startDay: number;
	endDay: number;
	startDate: string;
	endDate: string;
	started: boolean;
	scenarioAssigned: boolean;
	stages: PitchStageState[];
	sessions: PitchSession[];
	scored: PitchSession[];
	latestScore: number | null;
	passed: boolean;
	status: PitchStatus;
	retakeWindowEnd: string | null;
	focusDimensions: string[];
	target: number;
	max: number;
}

export interface Flag {
	level: 'blocker' | 'warning' | 'info';
	title: string;
	detail: string;
	href?: string;
}

export interface TaskState {
	id: string;
	title: string;
	description: string;
	status: string;
	dueDate: string;
	neededByDate: string | null;
	updatedAt: string | null;
}

export type OverallStatus = 'on_track' | 'behind' | 'blocked' | 'not_started' | 'complete';

export interface EnrollmentRow {
	id: string;
	user_id: string;
	start_date: string;
	primary_oem: string | null;
	tech_evaluator_id: string | null;
	pitch_manager_id: string | null;
	pitch_sales_id: string | null;
	gating_override: number;
	created_at: string;
}

export interface Person {
	id: string;
	name: string;
	email: string;
	role: Role;
	title: string | null;
}

export interface EnrollmentView {
	enrollment: EnrollmentRow;
	learner: Person;
	techEvaluator: Person | null;
	pitchManager: Person | null;
	pitchSales: Person | null;
	today: string;
	day: number;
	endDate: string;
	modules: ModuleState[];
	checkpoints: CheckpointState[];
	pitch: PitchState;
	tasks: TaskState[];
	flags: Flag[];
	currentModule: ModuleState | null;
	overall: OverallStatus;
	inCoaching: boolean;
	progress: {
		modulesComplete: number;
		modulesTotal: number;
		stepsDone: number;
		stepsTotal: number;
		proofsSubmitted: number;
		checkpointsPassed: number;
		checkpointsTotal: number;
		pitchScore: number | null;
	};
}
