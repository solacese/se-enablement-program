import { getCheckpoint, getModule, program } from '$lib/content/program';
import type { EvidenceType } from '$lib/content/types';
import { addDays, todayISO } from '$lib/dates';
import type { CheckpointAttempt } from '$lib/types';
import { repository } from './index';
import { migrate } from './local';
import type { LearnerRepository } from './repository';
import { emptyState, type EvidenceRecord, type LearnerProfile, type LearnerState } from './types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_CONFIG_CHARS = 200_000;

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

/**
 * The learner's data, reactive. Pages read `learner.state` and change it only through
 * these methods (or `update` for feature modules such as pitch), and every change is
 * persisted through the repository.
 */
export class LearnerStore {
	state = $state<LearnerState>(emptyState());
	ready = $state(false);
	saveError = $state<string | null>(null);
	private loading: Promise<void> | null = null;

	constructor(readonly repo: LearnerRepository) {}

	/** Load once per page session; safe to call from every page. */
	init() {
		this.loading ??= (async () => {
			this.state = await this.repo.load();
			this.ready = true;
			this.repo.subscribe?.(async () => (this.state = await this.repo.load()));
		})();
		return this.loading;
	}

	/** Apply a change and save it. */
	update(fn: (s: LearnerState) => void) {
		fn(this.state);
		return this.persist();
	}

	private async persist() {
		try {
			await this.repo.save($state.snapshot(this.state) as LearnerState);
			this.saveError = null;
		} catch {
			this.saveError = 'Couldn’t save your changes. Your browser storage may be full or blocked.';
		}
	}

	// Profile

	saveProfile(p: Omit<LearnerProfile, 'created_at'>) {
		return this.update((s) => {
			s.profile = { ...p, created_at: s.profile?.created_at ?? now() };
		});
	}

	// Setup tasks, steps and exit proofs

	setTask(taskId: string, status: string) {
		return this.update((s) => {
			s.tasks[taskId] = { status, updated_at: now() };
		});
	}

	setStep(moduleId: string, stepId: string, done: boolean) {
		return this.update((s) => {
			const m = (s.steps[moduleId] ??= {});
			if (done) m[stepId] = now();
			else delete m[stepId];
		});
	}

	submitExitProof(moduleId: string) {
		if (!this.state.evidence.some((e) => e.module_id === moduleId))
			return 'Add at least one piece of evidence before you submit your exit proof.';
		this.update((s) => {
			s.exit_proofs[moduleId] = now();
		});
		return null;
	}

	// Evidence

	/** Validate and store one piece of evidence. Returns an error message, or null on success. */
	async addEvidence(
		moduleId: string,
		input: { type: EvidenceType; title: string; content: string; file: File | null }
	): Promise<string | null> {
		const m = getModule(moduleId);
		if (!m || !m.evidence_types.includes(input.type)) return 'Pick a kind of evidence this module accepts.';
		const title = input.title.trim().slice(0, 140) || null;
		let content = input.content.trim();
		const file = input.file && input.file.size > 0 ? input.file : null;
		let fileRef: string | null = null;

		if (input.type === 'screenshot') {
			if (!file) return 'Choose an image to upload.';
			if (!file.type.startsWith('image/')) return 'Screenshots need to be an image (PNG, JPG, GIF or WebP).';
			if (file.size > MAX_FILE_BYTES) return 'That image is over 5 MB. Try a smaller screenshot or a recording link instead.';
			fileRef = await this.repo.putFile(file, file.name);
		}
		if (input.type === 'config' && file) {
			if (file.size > MAX_CONFIG_CHARS) return 'That file is too large. Paste the relevant part instead.';
			content = (content ? content + '\n\n' : '') + (await file.text());
		}
		if (input.type === 'recording_link' && !/^https?:\/\/\S+$/.test(content))
			return 'Paste a full link to the recording, starting with https://';
		if ((input.type === 'notes' || input.type === 'config') && !content)
			return input.type === 'notes' ? 'Write a few notes first.' : 'Paste a snippet or attach a file.';

		const record: EvidenceRecord = {
			id: uid(),
			module_id: moduleId,
			type: input.type,
			title,
			content: content || null,
			file_ref: fileRef,
			file_name: input.type === 'screenshot' || input.type === 'config' ? (file?.name ?? null) : null,
			submitted_at: now()
		};
		await this.update((s) => {
			s.evidence.unshift(record);
		});
		return null;
	}

	async deleteEvidence(id: string) {
		const ev = this.state.evidence.find((e) => e.id === id);
		if (ev?.file_ref) await this.repo.deleteFile(ev.file_ref).catch(() => {});
		await this.update((s) => {
			s.evidence = s.evidence.filter((e) => e.id !== id);
		});
	}

	// Checkpoints. SEs log what their evaluator decided in the live session.

	scheduleCheckpoint(checkpointId: string, date: string, evaluator: string) {
		const attempts = this.attempts(checkpointId);
		if (attempts.some((a) => a.status === 'passed')) return 'This checkpoint is already passed.';
		const latest = attempts.at(-1);
		this.update((s) => {
			if (latest?.status === 'scheduled') {
				const a = s.checkpoint_attempts.find((x) => x.id === latest.id)!;
				a.scheduled_date = date;
				a.evaluator_name = evaluator || null;
			} else {
				s.checkpoint_attempts.push(newAttempt(checkpointId, (latest?.attempt_number ?? 0) + 1, date, evaluator));
			}
		});
		return null;
	}

	/**
	 * Record the result of a checkpoint session. Any needs-work module opens coaching and
	 * a retake window; every attempt is kept.
	 */
	recordCheckpoint(
		checkpointId: string,
		input: { date: string; evaluator: string; notes: string; results: Record<string, { result: 'pass' | 'needs_work' | ''; notes: string }> }
	) {
		const cp = getCheckpoint(checkpointId);
		if (!cp) return 'Unknown checkpoint.';
		const missing = cp.modules.filter((id) => !input.results[id]?.result);
		if (missing.length)
			return `Choose pass or needs work for: ${missing.map((id) => getModule(id)?.title ?? id).join(', ')}.`;
		const passed = cp.modules.every((id) => input.results[id].result === 'pass');
		const date = input.date || todayISO();
		const latest = this.attempts(checkpointId).at(-1);
		this.update((s) => {
			let a = latest?.status === 'scheduled' ? s.checkpoint_attempts.find((x) => x.id === latest.id) : undefined;
			if (!a) {
				a = newAttempt(checkpointId, (latest?.attempt_number ?? 0) + 1, date, input.evaluator);
				s.checkpoint_attempts.push(a);
			}
			a.status = passed ? 'passed' : 'needs_work';
			a.scheduled_date = date;
			a.evaluator_name = input.evaluator || a.evaluator_name;
			a.notes = input.notes.trim() || null;
			a.completed_at = now();
			a.retake_window_end = passed ? null : addDays(date, cp.retake_window_days);
			a.results = cp.modules.map((id) => ({
				module_id: id,
				result: input.results[id].result as 'pass' | 'needs_work',
				notes: input.results[id].notes.trim() || null
			}));
		});
		return null;
	}

	private attempts(checkpointId: string) {
		return this.state.checkpoint_attempts
			.filter((a) => a.checkpoint_id === checkpointId)
			.sort((a, b) => a.attempt_number - b.attempt_number);
	}

	// Backup, restore and reset

	async exportData(): Promise<string> {
		const files: Record<string, string> = {};
		for (const e of this.state.evidence) {
			if (!e.file_ref) continue;
			const blob = await this.repo.getFile(e.file_ref);
			if (blob) files[e.file_ref] = await blobToDataUrl(blob);
		}
		return JSON.stringify(
			{ app: 'se-journey', exported_at: now(), program: program().platform.id, state: $state.snapshot(this.state), files },
			null,
			2
		);
	}

	async importData(json: string) {
		const doc = JSON.parse(json);
		if (doc?.app !== 'se-journey' || !doc.state) throw new Error('This isn’t an SE Journey export file.');
		const state = migrate(doc.state);
		for (const [ref, dataUrl] of Object.entries((doc.files ?? {}) as Record<string, string>)) {
			const blob = await (await fetch(dataUrl)).blob();
			const newRef = await this.repo.putFile(blob, ref.replace(/^[0-9a-f-]{36}-/, ''));
			for (const e of state.evidence) if (e.file_ref === ref) e.file_ref = newRef;
		}
		this.state = state;
		await this.persist();
	}

	async replace(state: LearnerState) {
		for (const e of this.state.evidence) if (e.file_ref) await this.repo.deleteFile(e.file_ref).catch(() => {});
		this.state = state;
		await this.persist();
	}

	reset() {
		return this.replace(emptyState());
	}
}

function newAttempt(checkpointId: string, n: number, date: string, evaluator: string): CheckpointAttempt {
	return {
		id: uid(),
		checkpoint_id: checkpointId,
		attempt_number: n,
		scheduled_date: date,
		evaluator_id: null,
		evaluator_name: evaluator || null,
		status: 'scheduled',
		notes: null,
		retake_window_end: null,
		completed_at: null,
		results: []
	};
}

function blobToDataUrl(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(r.error);
		r.readAsDataURL(blob);
	});
}

export const learner = new LearnerStore(repository);
