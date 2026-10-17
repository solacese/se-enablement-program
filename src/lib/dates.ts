// Program time is counted in days and weeks from day 1.

/** Week W covers days 7(W-1)+1 … 7W. */
export function weekDays(week: number): [number, number] {
	return [(week - 1) * 7 + 1, week * 7];
}
