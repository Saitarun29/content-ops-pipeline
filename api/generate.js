// POST /api/generate
// One content idea in -> brief + X post/thread + LinkedIn + Instagram carousel + Reel script + schedule out.
// Live mode uses Gemini when GEMINI_API_KEY is set; otherwise (or on any failure) a deterministic demo generator runs.

import { presetFor } from './_presets.js';

const LIMITS = { idea: 280, audience: 160, tone: 40, voice: 400 };
const TONES = ['Professional', 'Conversational', 'Bold', 'Educational', 'Playful'];
const MODEL = 'gemini-2.0-flash';

// Best-effort per-instance rate limit (serverless instances are short-lived; this is a guard, not a quota system).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 12;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > max;
}

function clean(v, max) {
  return String(v ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 8_000) break;
  }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (err) {
    // Last-resort guard: a clear JSON error, never a stack trace.
    if (!res.headersSent) return res.status(500).json({ error: 'Something went wrong generating that package. Try again.' });
    return res.end();
  }
}

async function handle(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST with JSON: { idea, audience, tone, voice }' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'anon').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Give it a minute and try again.' });

  const body = await readBody(req);
  const input = {
    idea: clean(body.idea, LIMITS.idea),
    audience: clean(body.audience, LIMITS.audience) || 'founders and operators',
    tone: TONES.includes(body.tone) ? body.tone : 'Professional',
    voice: clean(body.voice, LIMITS.voice),
  };
  if (input.idea.length < 8) return res.status(400).json({ error: 'Describe the idea in at least a few words (8+ characters).' });

  const started = Date.now();
  let result = null;
  let mode = 'demo';
  let note;

  if (process.env.GEMINI_API_KEY) {
    // One retry for a transient failure; if live generation still fails, the
    // request falls back to demo output and says so, rather than erroring out.
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      try {
        result = await generateLive(input, process.env.GEMINI_API_KEY);
        mode = 'live';
      } catch (err) {
        if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
      }
    }
    if (!result) note = 'Live AI unavailable after a retry, served demo output instead.';
  }
  if (!result) result = generateDemo(input);

  const ms = Date.now() - started;
  return res.status(200).json({
    mode,
    model: mode === 'live' ? MODEL : 'rule-based demo',
    note,
    input,
    ...result,
    meta: { generatedAt: new Date().toISOString(), ms },
  });
}

/* ------------------------------------------------------------------ */
/* Live: Gemini                                                        */
/* ------------------------------------------------------------------ */

async function generateLive(input, key) {
  const prompt = `You are a senior content strategist running a content operations pipeline.
Turn ONE idea into a complete multi-channel content package.

IDEA: ${input.idea}
AUDIENCE: ${input.audience}
TONE: ${input.tone}
BRAND VOICE NOTES: ${input.voice || 'clear, specific, no hype, no emojis overload'}

Return ONLY JSON with exactly this shape:
{
 "brief": { "title": string, "angle": string, "objective": string, "audience": string, "keyMessages": [3 strings], "proofPoints": [2-3 strings], "cta": string, "keywords": [5 strings], "pillar": string },
 "x": { "post": string (<= 270 characters, no hashtags spam, max 1 hashtag), "thread": [3 strings, each <= 270 characters, numbered like "1/" ] },
 "linkedin": { "post": string (900-1400 characters, short lines, a strong first line hook, ends with a question) },
 "instagram": { "slides": [6 short slide headlines, <= 60 chars each, slide 1 is the hook, slide 6 is the CTA], "caption": string (<= 600 chars), "hashtags": [8-12 strings starting with #] },
 "reel": { "hooks": [3 alternative opening lines], "script": [ { "t": "0-3s", "visual": string, "voiceover": string } ... 5-6 beats covering 0-30s ], "onScreenText": [3 strings], "cta": string, "audio": string },
 "schedule": [ { "channel": "X"|"LinkedIn"|"Instagram"|"Reel"|"X Thread", "day": "Mon".."Sun", "time": "HH:MM", "why": string } ... 5 items across one week ]
}
Be concrete and specific to the idea. Never invent statistics as facts; label estimates as estimates.`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.8, maxOutputTokens: 4096 },
        }),
      }
    );
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const parsed = JSON.parse(text.replace(/^```json\s*|```$/g, ''));
    return normalize(parsed, input);
  } finally {
    clearTimeout(timer);
  }
}

// Make sure live output always matches the shape the UI expects; fill any gaps from the demo generator.
function normalize(p, input) {
  const d = generateDemo(input);
  const arr = (v, n, fb) => (Array.isArray(v) && v.length ? v.slice(0, n).map((x) => (typeof x === 'string' ? x : String(x))) : fb);
  const str = (v, fb) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
  const b = p.brief || {};
  const brief = {
    title: str(b.title, d.brief.title),
    angle: str(b.angle, d.brief.angle),
    objective: str(b.objective, d.brief.objective),
    audience: str(b.audience, d.brief.audience),
    keyMessages: arr(b.keyMessages, 4, d.brief.keyMessages),
    proofPoints: arr(b.proofPoints, 3, d.brief.proofPoints),
    cta: str(b.cta, d.brief.cta),
    keywords: arr(b.keywords, 6, d.brief.keywords),
    pillar: str(b.pillar, d.brief.pillar),
    tone: input.tone,
  };
  const x = {
    post: fit(str(p.x?.post, d.x.post), 280),
    thread: arr(p.x?.thread, 3, d.x.thread).map((t) => fit(t, 280)),
  };
  while (x.thread.length < 3) x.thread.push(d.x.thread[x.thread.length]);
  const instagram = {
    slides: arr(p.instagram?.slides, 6, d.instagram.slides),
    caption: str(p.instagram?.caption, d.instagram.caption),
    hashtags: arr(p.instagram?.hashtags, 12, d.instagram.hashtags).map((h) => (h.startsWith('#') ? h : `#${h}`).replace(/\s+/g, '')),
  };
  while (instagram.slides.length < 6) instagram.slides.push(d.instagram.slides[instagram.slides.length]);
  const script = Array.isArray(p.reel?.script) && p.reel.script.length
    ? p.reel.script.slice(0, 7).map((s, i) => ({
        t: str(s?.t, d.reel.script[i]?.t || ''),
        visual: str(s?.visual, ''),
        voiceover: str(s?.voiceover, ''),
      }))
    : d.reel.script;
  const reel = {
    hooks: arr(p.reel?.hooks, 3, d.reel.hooks),
    script,
    onScreenText: arr(p.reel?.onScreenText, 4, d.reel.onScreenText),
    cta: str(p.reel?.cta, d.reel.cta),
    audio: str(p.reel?.audio, d.reel.audio),
  };
  const schedule = Array.isArray(p.schedule) && p.schedule.length
    ? p.schedule.slice(0, 7).map((s, i) => ({
        channel: str(s?.channel, d.schedule[i % d.schedule.length].channel),
        day: str(s?.day, d.schedule[i % d.schedule.length].day).slice(0, 3),
        time: str(s?.time, d.schedule[i % d.schedule.length].time),
        why: str(s?.why, ''),
      }))
    : d.schedule;
  return {
    brief,
    x,
    linkedin: { post: str(p.linkedin?.post, d.linkedin.post) },
    instagram,
    reel,
    schedule,
  };
}

function fit(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.7 ? cut.slice(0, sp) : cut).replace(/[\s,;:.-]+$/, '') + '…';
}

/* ------------------------------------------------------------------ */
/* Demo: deterministic, rule-based generator                           */
/* ------------------------------------------------------------------ */

const STOP = new Set('a an the and or but of for to in on at by with from into about how why what when your our my is are be can will this that these those it its you we they i vs versus without using use more most less just than then so do does not no yes get make help'.split(' '));

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (arr, seed, off = 0) => arr[(seed + off) % arr.length];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.split(' ').map((w, i) => (i > 0 && STOP.has(w.toLowerCase()) ? w.toLowerCase() : cap(w))).join(' ');

function keywordsOf(idea) {
  const words = idea.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  const seen = [];
  for (const w of words) if (!seen.includes(w)) seen.push(w);
  return seen.slice(0, 6);
}

function topicPhrase(idea) {
  // Turn "Why most automation projects fail in the first 90 days" into a usable noun phrase.
  let t = idea.trim().replace(/[.!?]+$/, '');
  t = t.replace(/^(how to|how|why|what|when|the case for|a guide to|guide to|thread on|post about|write about)\s+/i, '');
  return t.length > 90 ? t.slice(0, 90).replace(/\s+\S*$/, '') : t;
}

const TONE_KIT = {
  Professional: { open: 'A practical note on something I get asked about a lot:', close: 'What has worked for your team?', sign: 'Small system, properly run.' },
  Conversational: { open: 'Quick one, because it keeps coming up:', close: 'Curious how you handle this. Tell me below.', sign: 'That\'s really it.' },
  Bold: { open: 'Most people get this wrong:', close: 'Agree or disagree? I want the pushback.', sign: 'Systems beat hustle.' },
  Educational: { open: 'A simple 3-step framework for this:', close: 'Save this and share it with someone who needs it.', sign: 'Simple beats clever.' },
  Playful: { open: 'Hot take, served warm:', close: 'Your turn: what would you add?', sign: 'Less chaos, more coffee.' },
};

function generateDemo(input) {
  const preset = presetFor(input.idea);
  if (preset) {
    return { ...structuredClone(preset), brief: { ...structuredClone(preset.brief), tone: input.tone, voiceNotes: input.voice || 'Clear, specific, no hype.' } };
  }

  const { idea, audience, tone, voice } = input;
  const seed = hash(idea + audience + tone);
  const kit = TONE_KIT[tone] || TONE_KIT.Professional;
  const topic = cap(topicPhrase(idea));
  const aud = audience.replace(/\.$/, '');
  const kws = keywordsOf(idea);

  const cta = pick([
    'Comment "SYSTEM" and I will send the checklist.',
    'Follow for the full framework next week.',
    'DM me "WORKFLOW" for the template.',
  ], seed);

  const brief = {
    title: titleCase(topic),
    angle: pick([
      `Treat "${topic}" as a repeatable system for ${aud}: map it, automate the repetitive parts, keep a human on judgment.`,
      `A before/after story: what changes for ${aud} when "${topic}" stops being a one-off effort and becomes a workflow.`,
      `Myth vs reality on "${topic}", told from the operator's seat, with one framework ${aud} can apply this week.`,
    ], seed),
    objective: pick([
      `Build authority with ${aud} and start qualified conversations from one idea.`,
      `Educate ${aud} and earn saves and shares, the strongest signal of useful content.`,
      `Drive profile visits and inbound DMs from ${aud}.`,
    ], seed, 1),
    audience: aud,
    keyMessages: [
      `For ${aud}, the bottleneck is usually process, not effort.`,
      'Start with one repeatable step and measure it weekly.',
      'Automate the repetitive 80%; keep humans on judgment, taste and review.',
    ],
    proofPoints: [
      'Mini case: a team replaced a manual checklist with a 4-step workflow (illustrative example).',
      'Typical outcome to test: fewer handoffs and faster turnaround (estimate, varies by team).',
      'A simple scorecard: hours saved per week, error rate, and cycle time.',
    ],
    cta,
    keywords: kws.length ? kws.slice(0, 5) : ['automation', 'workflow', 'systems'],
    pillar: pick(['Education', 'Behind the build', 'Point of view', 'Case study'], seed, 2),
    tone,
    voiceNotes: voice || 'Clear, specific, no hype.',
  };

  const xPost = fit(`${kit.open}\n\n${topic}.\n\nThe short version for ${aud}:\n→ map the steps end to end\n→ automate the repetitive 80%\n→ keep a human on review\n\n${kit.sign}`, 280);
  const thread = [
    fit(`1/ ${topic}. A short thread for ${aud}. 🧵 The problem is rarely effort. It is handoffs nobody owns, and every one adds delay and a chance to drop the ball.`, 280),
    fit('2/ The fix: write the workflow down as steps (trigger → input → decision → output). Anything that repeats the same way every time is a candidate for automation. Judgment stays human.', 280),
    fit(`3/ Measure it. Track time per cycle for 2 weeks before and after. If it is not faster and calmer, simplify again. ${cta}`, 280),
  ];

  const linkedin = [
    kit.open,
    '',
    `${topic}.`,
    '',
    `I keep seeing ${aud} put in more hours to fix what is really a systems problem.`,
    '',
    'The pattern usually looks like this:',
    '• The work depends on one person remembering every step',
    '• Handoffs live in DMs and spreadsheets',
    '• Nobody can see what is stuck until it is late',
    '',
    'What changes when you treat it as a system:',
    '',
    '1. Map it. Write it down as trigger → steps → output. If you cannot draw it, you cannot automate it.',
    '2. Automate the repetitive 80%. Status changes, drafts, reminders, formatting.',
    '3. Keep a human checkpoint. Review is where quality and brand voice live.',
    '4. Measure weekly. Cycle time, hours saved, errors caught.',
    '',
    'The goal is not "more AI". It is calmer work, fewer dropped balls, and time back for the work only you can do.',
    '',
    kit.close,
  ].join('\n');

  const slides = [
    fit(topic, 60),
    'The problem isn\'t effort',
    'Step 1 · Map the workflow',
    'Step 2 · Automate the repetitive 80%',
    'Step 3 · Keep a human on review',
    fit(cta.replace(/\.$/, ''), 60),
  ];
  const caption = fit(`${topic}. It is not about working harder, it is about a system that runs without you chasing it. Swipe for the 3-step framework I use with ${aud}. ${cta}`, 600);
  const baseTags = ['#automation', '#workflow', '#contentstrategy', '#aitools', '#productivity', '#systemsthinking', '#n8n', '#buildinpublic'];
  const kwTags = kws.filter((k) => k.length > 4).slice(0, 3).map((k) => `#${k.replace(/-/g, '')}`);
  const hashtags = [...new Set([...kwTags, ...baseTags])].slice(0, 11);

  const hooks = [
    fit(`${topic}, in 30 seconds.`, 100),
    fit(`For ${aud}: this one change saves hours every week.`, 100),
    'Here\'s the system nobody shows you.',
  ];
  const script = [
    { t: '0-3s', visual: 'Face to camera, hook as text overlay', voiceover: hooks[0] },
    { t: '3-8s', visual: 'Screen: messy spreadsheet and 20 open tabs', voiceover: 'This is how most teams handle it today. Manual, scattered, slow.' },
    { t: '8-15s', visual: 'Whiteboard: trigger → steps → output', voiceover: 'Step one: map the workflow. Trigger, steps, output.' },
    { t: '15-22s', visual: 'Screen recording of the automation running', voiceover: 'Step two: automate the repetitive part. Drafts, status updates, reminders.' },
    { t: '22-27s', visual: 'Approve button click, green check', voiceover: 'Step three: keep a human on review. That is where quality lives.' },
    { t: '27-30s', visual: 'Face to camera, CTA text', voiceover: cta },
  ];
  const reel = {
    hooks,
    script,
    onScreenText: ['Map it', 'Automate the 80%', 'Human review'],
    cta,
    audio: pick(['Low-key lo-fi beat, voiceover-forward', 'Trending upbeat instrumental at 15% volume', 'Minimal ambient pad, crisp cuts on each step'], seed),
  };

  // Heuristic best-practice windows (not account analytics)
  const schedule = [
    { channel: 'LinkedIn', day: 'Tue', time: '09:00', why: 'Weekday morning, B2B feed peaks before meetings start.' },
    { channel: 'X', day: 'Tue', time: '12:30', why: 'Lunch-hour scroll; the short post seeds the topic.' },
    { channel: 'Instagram', day: 'Wed', time: '18:30', why: 'Carousels get the most saves in the evening.' },
    { channel: 'X Thread', day: 'Thu', time: '10:00', why: 'Deeper thread mid-week once the topic has traction.' },
    { channel: 'Reel', day: 'Fri', time: '19:00', why: 'Short video for weekend reach; reuses the carousel steps.' },
  ];

  return { brief, x: { post: xPost, thread }, linkedin: { post: linkedin }, instagram: { slides, caption, hashtags }, reel, schedule };
}

export { generateDemo, normalize };
