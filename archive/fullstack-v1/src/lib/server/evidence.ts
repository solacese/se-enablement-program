import type { EvidenceType } from '$lib/content/types';
import type { EnrollmentRow } from '$lib/types';
import { all, get, id, now, run } from './db';
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, storage } from './storage';

export interface EvidenceItem {
	id: string;
	module_id: string;
	type: EvidenceType;
	title: string | null;
	content: string | null;
	file_ref: string | null;
	file_name: string | null;
	submitted_at: string;
}

export function listEvidence(enrollmentId: string, moduleId?: string) {
	return moduleId
		? all<EvidenceItem>('SELECT * FROM evidence WHERE enrollment_id = ? AND module_id = ? ORDER BY submitted_at DESC', enrollmentId, moduleId)
		: all<EvidenceItem>('SELECT * FROM evidence WHERE enrollment_id = ? ORDER BY submitted_at DESC', enrollmentId);
}

export function doneSteps(enrollmentId: string, moduleId: string) {
	return all<{ step_id: string }>('SELECT step_id FROM step_progress WHERE enrollment_id = ? AND module_id = ?', enrollmentId, moduleId).map((r) => r.step_id);
}

export function setStep(enrollmentId: string, moduleId: string, stepId: string, done: boolean) {
	if (done)
		run('INSERT INTO step_progress (enrollment_id, module_id, step_id, completed_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', enrollmentId, moduleId, stepId, now());
	else run('DELETE FROM step_progress WHERE enrollment_id = ? AND module_id = ? AND step_id = ?', enrollmentId, moduleId, stepId);
}

const isUrl = (s: string) => {
	try {
		const u = new URL(s);
		return u.protocol === 'https:' || u.protocol === 'http:';
	} catch {
		return false;
	}
};

/** Validate and store one piece of evidence. Returns an error message, or null on success. */
export async function addEvidence(e: EnrollmentRow, moduleId: string, allowed: EvidenceType[], form: FormData): Promise<string | null> {
	const type = String(form.get('type') ?? '') as EvidenceType;
	if (!allowed.includes(type)) return 'Pick a kind of evidence this module accepts.';
	const title = String(form.get('title') ?? '').trim().slice(0, 140) || null;
	const content = String(form.get('content') ?? '').trim();
	const file = form.get('file');
	let fileRef: string | null = null;
	let fileName: string | null = null;

	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_UPLOAD_BYTES) return 'That file is over 10 MB. Try a smaller screenshot or a link instead.';
		const type_ = file.type || 'application/octet-stream';
		if (type === 'screenshot' && !type_.startsWith('image/')) return 'Screenshots need to be an image (PNG, JPG, GIF or WebP).';
		if (type === 'config' && !ALLOWED_TYPES.includes(type_) && !/\.(ya?ml|json|txt|conf|properties|xml|env)$/i.test(file.name))
			return 'Config files should be YAML, JSON, XML or plain text.';
		fileRef = await storage.save(new Uint8Array(await file.arrayBuffer()), file.name, type_);
		fileName = file.name;
	}

	if (type === 'screenshot' && !fileRef) return 'Choose an image to upload.';
	if (type === 'recording_link' && !isUrl(content)) return 'Paste a full link to the recording, starting with https://';
	if ((type === 'notes' || type === 'config') && !content && !fileRef) return type === 'notes' ? 'Write a few notes first.' : 'Paste a snippet or attach a file.';

	run(
		'INSERT INTO evidence (id, enrollment_id, module_id, type, title, content, file_ref, file_name, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		id(), e.id, moduleId, type, title, content || null, fileRef, fileName, now()
	);
	return null;
}

export function deleteEvidence(enrollmentId: string, evidenceId: string) {
	run('DELETE FROM evidence WHERE id = ? AND enrollment_id = ?', evidenceId, enrollmentId);
}

export function submitExitProof(enrollmentId: string, moduleId: string) {
	run('INSERT INTO exit_proofs (enrollment_id, module_id, submitted_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', enrollmentId, moduleId, now());
}

export function withdrawExitProof(enrollmentId: string, moduleId: string) {
	run('DELETE FROM exit_proofs WHERE enrollment_id = ? AND module_id = ?', enrollmentId, moduleId);
}

export function evidenceOwner(fileRef: string) {
	return get<{ enrollment_id: string }>('SELECT enrollment_id FROM evidence WHERE file_ref = ?', fileRef);
}
