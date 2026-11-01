// Smoke test: runs the whole demo path with no API keys.
// Covers the API handler (demo mode, validation, method guard), the demo
// generator's output shape and limits, the curated presets, and the board
// helpers from assets/lib.js. Run: npm run smoke

import assert from 'node:assert/strict';

delete process.env.GEMINI_API_KEY;

const { default: handler, generateDemo } = await import('../api/generate.js');
const { presetFor } = await import('../api/_presets.js');
const lib = await import('../assets/lib.js');

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

/* ---- Handler, through mock req/res ---- */
function mockRes() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    headersSent: false,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; this.headersSent = true; return this; },
    end() { this.headersSent = true; return this; },
  };
}
const mockReq = (method, body) => ({ method, headers: {}, socket: { remoteAddress: '127.0.0.1' }, body });

let res = mockRes();
await handler(mockReq('GET'), res);
check('GET returns 405 with a JSON error', () => {
  assert.equal(res.statusCode, 405);
  assert.match(res.body.error, /Use POST/);
});

res = mockRes();
await handler(mockReq('POST', { idea: 'short' }), res);
check('idea under 8 characters returns 400 with a JSON error', () => {
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.error.length > 0);
  assert.equal(res.body.stack, undefined);
});

res = mockRes();
await handler(mockReq('POST', {
  idea: 'Why most automation projects fail in the first 90 days, and how to avoid it',
  audience: 'agency owners and operations leads',
  tone: 'Professional',
  voice: 'Calm, specific, short sentences.',
}), res);
check('valid POST returns 200 in demo mode with a full package', () => {
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, 'demo');
  assert.ok(res.body.brief.title.length > 0);
  assert.equal(res.body.instagram.slides.length, 6);
  assert.equal(res.body.schedule.length, 5);
});

/* ---- Demo generator shape and limits ---- */
const generic = generateDemo({ idea: 'How a small bakery can stop taking orders on paper', audience: 'bakery owners', tone: 'Conversational', voice: '' });
check('generic demo package has every section', () => {
  for (const k of ['brief', 'x', 'linkedin', 'instagram', 'reel', 'schedule']) assert.ok(generic[k], k);
  assert.equal(generic.x.thread.length, 3);
  assert.equal(generic.reel.script.length, 6);
});
check('generated drafts respect platform limits', () => {
  assert.ok(lib.xLength(generic.x.post) <= lib.LIMITS.x, 'x post');
  for (const t of generic.x.thread) assert.ok(lib.xLength(t) <= lib.LIMITS.x, 'x thread');
  assert.ok(generic.linkedin.post.length <= lib.LIMITS.linkedin, 'linkedin');
  const cap = `${generic.instagram.caption}\n\n${generic.instagram.hashtags.join(' ')}`;
  assert.ok(cap.length <= lib.LIMITS.igCaption, 'instagram caption');
  assert.ok(generic.instagram.hashtags.length <= lib.LIMITS.igHashtags, 'hashtags');
});

/* ---- Presets ---- */
check('all four UI presets resolve to curated packages', () => {
  const ideas = [
    'Why most automation projects fail in the first 90 days, and how to avoid it',
    'Launching auto-invoice reconciliation: match payments to invoices without spreadsheets',
    'How I plan a week of content in 30 minutes with one idea and an AI workflow',
    'Using WhatsApp reminders to cut appointment no-shows at clinics',
  ];
  for (const idea of ideas) assert.ok(presetFor(idea), idea);
  assert.equal(presetFor('an idea with no preset'), null);
});

/* ---- Board helpers ---- */
check('a run becomes Review cards, and approval moves them to Scheduled', () => {
  const run = { ...generic, runId: 'smoke1' };
  const cards = lib.cardsFromRun(run);
  assert.equal(cards.length, run.schedule.length);
  assert.ok(cards.every((c) => c.status === 'Review'));
  const { board, moved } = lib.approveRun(cards, 'smoke1');
  assert.equal(moved, cards.length);
  assert.ok(board.every((c) => c.status === 'Scheduled'));
});
check('sanitizeBoard drops malformed cards', () => {
  const clean = lib.sanitizeBoard([{ id: 'a', title: 'T', status: 'Idea' }, { id: 1, title: 'x', status: 'Idea' }, null]);
  assert.equal(clean.length, 1);
  assert.equal(lib.sanitizeBoard('nope'), null);
});

console.log(`\nSmoke test passed: ${passed} checks, demo mode, no API keys.`);
