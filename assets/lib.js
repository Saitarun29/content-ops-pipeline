// Pure helpers shared by the UI. No DOM access, so they run under node:test.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const COLUMNS = ['Idea', 'Drafting', 'Review', 'Scheduled', 'Published'];
export const LIMITS = { x: 280, linkedin: 3000, igCaption: 2200, igHashtags: 30 };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// X weights most emoji and CJK as 2 characters. Close enough for drafting.
export function xLength(s) {
  let n = 0;
  for (const ch of String(s ?? '')) n += ch.codePointAt(0) > 0x10ff ? 2 : 1;
  return n;
}

export function meterState(len, max) {
  if (len > max) return 'bad';
  if (len / max > 0.9) return 'warn';
  return 'ok';
}

// Mon=0 … Sun=6
export const weekdayIndex = (date) => (date.getDay() + 6) % 7;

// Next calendar date (strictly after `from`) that falls on `day` ("Mon".."Sun").
export function nextDate(day, from = new Date()) {
  const idx = DAYS.indexOf(day);
  const target = idx === -1 ? 0 : idx;
  let diff = target - weekdayIndex(from);
  if (diff <= 0) diff += 7;
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + diff);
}

// The 7 days starting tomorrow, in calendar order.
export function upcomingWeek(from = new Date()) {
  return Array.from({ length: 7 }, (_, k) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1 + k));
}

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Schedule slots sorted by their next real date, then time.
export function sortSchedule(schedule, from = new Date()) {
  return [...(schedule || [])].sort((a, b) => nextDate(a.day, from) - nextDate(b.day, from) || String(a.time).localeCompare(String(b.time)));
}

// Seconds per beat from labels like "3-8s"; falls back to 4s.
export function beatDurations(script) {
  return (script || []).map((b) => {
    const m = String(b?.t ?? '').match(/(\d+)\s*-\s*(\d+)/);
    return m ? Math.max(1.5, Number(m[2]) - Number(m[1])) : 4;
  });
}

// Board operations (immutable, return new arrays)
export function cardsFromRun(run, from = new Date()) {
  const title = run.brief.title.length > 52 ? run.brief.title.slice(0, 50).trimEnd() + '…' : run.brief.title;
  return run.schedule.map((s, i) => ({
    id: `${run.runId}-${i}`,
    run: run.runId,
    title,
    channel: s.channel,
    status: 'Review',
    date: isoDate(nextDate(DAYS.includes(s.day) ? s.day : 'Mon', from)),
    time: s.time,
  }));
}

export function moveCard(board, id, status) {
  if (!COLUMNS.includes(status)) return board;
  return board.map((c) => (c.id === id ? { ...c, status } : c));
}

export function shiftCard(board, id, delta) {
  const c = board.find((x) => x.id === id);
  if (!c) return board;
  const ni = COLUMNS.indexOf(c.status) + delta;
  if (ni < 0 || ni >= COLUMNS.length) return board;
  return moveCard(board, id, COLUMNS[ni]);
}

export function approveRun(board, runId) {
  let moved = 0;
  const next = board.map((c) => {
    if (c.run === runId && c.status === 'Review') { moved++; return { ...c, status: 'Scheduled' }; }
    return c;
  });
  return { board: next, moved };
}

export function sanitizeBoard(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string' && COLUMNS.includes(c.status))
    .map((c) => ({ id: c.id, run: c.run, title: c.title.slice(0, 120), channel: String(c.channel || ''), status: c.status, date: String(c.date || ''), time: String(c.time || '') }));
}
