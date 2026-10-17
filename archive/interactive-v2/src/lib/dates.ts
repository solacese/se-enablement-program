// Dates are plain YYYY-MM-DD strings, computed in UTC so day maths never drifts.

export function parseDate(d: string) {
	const [y, m, day] = d.split('-').map(Number);
	return Date.UTC(y, m - 1, day);
}

export function toISODate(ms: number) {
	return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number) {
	return toISODate(parseDate(d) + n * 864e5);
}

export function diffDays(a: string, b: string) {
	return Math.round((parseDate(a) - parseDate(b)) / 864e5);
}

export function todayISO() {
	const n = new Date();
	return toISODate(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

/** Program day N falls on start + (N - 1). Day 1 is the start date. */
export function dateForDay(start: string, day: number) {
	return addDays(start, day - 1);
}

export function dayNumber(start: string, today = todayISO()) {
	return diffDays(today, start) + 1;
}

/** Week W covers days 7(W-1)+1 … 7W. */
export function weekDays(week: number): [number, number] {
	return [(week - 1) * 7 + 1, week * 7];
}

const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtLong = new Intl.DateTimeFormat('en-US', {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});

/**
 * Program dates (YYYY-MM-DD) are calendar dates and format as-is. Timestamps
 * (ISO with a time) are moments and format in the viewer's local time zone.
 */
export function formatDate(d: string | null | undefined, long = false) {
	if (!d) return '—';
	if (d.length > 10) {
		const opts: Intl.DateTimeFormatOptions = long
			? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
			: { month: 'short', day: 'numeric' };
		return new Intl.DateTimeFormat('en-US', opts).format(new Date(d));
	}
	return (long ? fmtLong : fmt).format(parseDate(d));
}

export function formatRange(a: string, b: string) {
	return `${formatDate(a)} – ${formatDate(b)}`;
}

export function relativeDays(d: string, today = todayISO()) {
	const n = diffDays(d, today);
	if (n === 0) return 'today';
	if (n === 1) return 'tomorrow';
	if (n === -1) return 'yesterday';
	return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
