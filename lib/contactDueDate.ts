// Build ISO timestamps for contact to-do due dates (local date + time).

/** Combine YYYY-MM-DD and HH:mm into an ISO string for Supabase. */
export function localDateTimeToIso(dateStr: string, timeStr: string): string {
  const time = timeStr?.trim() || '09:00';
  const [hh, mm] = time.split(':').map((s) => parseInt(s, 10));
  const h = Number.isFinite(hh) ? hh : 9;
  const m = Number.isFinite(mm) ? mm : 0;
  const [y, mo, d] = dateStr.split('-').map((s) => parseInt(s, 10));
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  return dt.toISOString();
}

/** Default end time: one hour after start (for device calendar). */
export function addOneHourIso(isoStart: string): string {
  const d = new Date(isoStart);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}
