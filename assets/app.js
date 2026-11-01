// Content Ops Pipeline — UI (vanilla ES modules, no build step)
import {
  DAYS, COLUMNS, LIMITS, esc, xLength, meterState, nextDate, upcomingWeek, weekdayIndex,
  sortSchedule, beatDurations, cardsFromRun, moveCard, shiftCard, approveRun, sanitizeBoard,
} from './lib.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const ICON = {
  copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  left: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5 4 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 3 6 6M9 3 3 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  reply: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 7.5a5 4.5 0 1 1 2.2 3.7L2.5 13l.6-2.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  repost: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v8h7M12 13V5H5M2.5 4.5 4 3l1.5 1.5M13.5 11.5 12 13l-1.5-1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  like: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5S2.5 10.2 2.5 6.3A2.8 2.8 0 0 1 8 4.8a2.8 2.8 0 0 1 5.5 1.5C13.5 10.2 8 13.5 8 13.5Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  views: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13V8M6.5 13V4M10 13V7M13.5 13V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  share: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 2 7 9M14 2l-4.5 12L7 9 2 6.5Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
};

/* ---------------- Presets ---------------- */
const PRESETS = [
  { label: 'Agency ops', sub: 'Why automations fail', idea: 'Why most automation projects fail in the first 90 days, and how to avoid it', audience: 'agency owners and operations leads', tone: 'Professional', voice: 'Calm, specific, systems-thinking. Short sentences. No hype words like "game-changer".' },
  { label: 'SaaS launch', sub: 'Feature announcement', idea: 'Launching auto-invoice reconciliation: match payments to invoices without spreadsheets', audience: 'finance teams at growing SaaS companies', tone: 'Conversational', voice: 'Friendly product voice, clear benefit first, show the before and after. Avoid jargon.' },
  { label: 'Creator', sub: 'Build in public', idea: 'How I plan a week of content in 30 minutes with one idea and an AI workflow', audience: 'solo creators and personal-brand builders', tone: 'Bold', voice: 'Direct, first person, confident but not arrogant. Practical steps over theory.' },
  { label: 'Clinic', sub: 'Educational series', idea: 'Using WhatsApp reminders to cut appointment no-shows at clinics', audience: 'clinic owners and front-desk managers', tone: 'Educational', voice: 'Warm, trustworthy, plain language. Explain like a helpful consultant. No fear-mongering.' },
];

const form = $('#form');
const ideaEl = $('#idea');
const audEl = $('#audience');
const toneEl = $('#tone');
const voiceEl = $('#voice');
const errEl = $('#err');

function renderPresets() {
  $('#presets').innerHTML = PRESETS.map((p, i) => `<button type="button" class="preset" aria-pressed="false" data-i="${i}"><b>${esc(p.label)}</b><span>${esc(p.sub)}</span></button>`).join('');
  $$('#presets .preset').forEach((b) => b.addEventListener('click', () => {
    const p = PRESETS[Number(b.dataset.i)];
    ideaEl.value = p.idea; audEl.value = p.audience; toneEl.value = p.tone; voiceEl.value = p.voice;
    $$('#presets .preset').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    updateCounts();
    run();
  }));
}
function updateCounts() {
  $('#ideaCount').textContent = `${ideaEl.value.length} / 280`;
  $('#voiceCount').textContent = `${voiceEl.value.length} / 400`;
}
[ideaEl, voiceEl].forEach((el) => el.addEventListener('input', () => { updateCounts(); ideaEl.removeAttribute('aria-invalid'); }));
form.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
form.addEventListener('submit', (e) => { e.preventDefault(); run(); });

/* ---------------- Mode badge ---------------- */
function setMode(mode) {
  const b = $('#modeBadge');
  b.classList.toggle('live', mode === 'live');
  b.classList.toggle('demo', mode !== 'live');
  $('#modeText').textContent = mode === 'live' ? 'Live' : 'Demo data';
}

/* ---------------- Trace ---------------- */
const STEPS = ['trigger', 'brief', 'drafts', 'review', 'schedule'];
function traceSet(step, state, label = '') {
  const li = $(`#trace li[data-step="${step}"]`);
  li.classList.remove('run', 'done', 'wait');
  if (state) li.classList.add(state);
  $('em', li).textContent = label;
}
function traceReset(meta = 'Idle') {
  STEPS.forEach((s) => traceSet(s, null));
  $('#traceMeta').textContent = meta;
}

/* ---------------- Generate ---------------- */
let current = null;
let busy = false;

function showError(msg) {
  errEl.textContent = msg;
  errEl.hidden = false;
}

async function run() {
  if (busy) return;
  const idea = ideaEl.value.trim();
  errEl.hidden = true;
  if (idea.length < 8) {
    ideaEl.setAttribute('aria-invalid', 'true');
    showError('Write the idea in a few words (at least 8 characters), or pick a preset.');
    ideaEl.focus();
    return;
  }
  busy = true;
  const btn = $('#goBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Running';
  $('#approveBtn').disabled = true;
  $('#panel').setAttribute('aria-busy', 'true');
  showSkeleton();
  traceReset('Running');

  const t0 = performance.now();
  traceSet('trigger', 'run');
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 30_000);
  const req = fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, audience: audEl.value.trim(), tone: toneEl.value, voice: voiceEl.value.trim() }),
    signal: ctrl.signal,
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Request failed (${r.status}).`);
    return j;
  });

  try {
    await sleep(300);
    traceSet('trigger', 'done', '0.3s');
    traceSet('brief', 'run');
    const [data] = await Promise.all([req, sleep(500)]);
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    traceSet('brief', 'done', `${secs}s`);
    traceSet('drafts', 'run');
    await sleep(450);
    traceSet('drafts', 'done', `${data.schedule.length} drafts`);
    traceSet('review', 'wait', 'Waiting');
    $('#traceMeta').textContent = data.mode === 'live' ? `Live · ${data.model}` : 'Demo data';

    current = { ...data, runId: `r${Date.now().toString(36)}` };
    setMode(data.mode);
    $('#lastRun').textContent = `${secs}s`;
    if (data.note) toast(data.note);
    renderTab(activeTab);
    addRunToBoard(current);
    renderProps(current, 'Review');
    $('#approveBtn').disabled = false;
    if (window.innerWidth < 1040) $('#out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    traceReset('Failed');
    const msg = e.name === 'AbortError' ? 'The request timed out after 30 seconds. Run it again.' : (e.message || 'Something went wrong. Run it again.');
    showError(msg);
    if (current) renderTab(activeTab); else $('#panel').innerHTML = emptyHTML;
  } finally {
    clearTimeout(timeout);
    busy = false;
    btn.disabled = false;
    btn.textContent = 'Run pipeline';
    $('#panel').removeAttribute('aria-busy');
  }
}

$('#approveBtn').addEventListener('click', async () => {
  if (!current) return;
  $('#approveBtn').disabled = true;
  traceSet('review', 'done', 'Approved');
  traceSet('schedule', 'run');
  await sleep(350);
  const res = approveRun(board, current.runId);
  board = res.board;
  res.board.forEach((c) => { if (c.run === current.runId) freshIds.add(c.id); });
  save(); renderBoard();
  traceSet('schedule', 'done', `${res.moved} slots`);
  $('#traceMeta').textContent = 'Complete';
  renderProps(current, 'Scheduled');
  toast(`Approved. ${res.moved} posts moved to Scheduled.`);
});

function renderProps(d, status) {
  const first = sortSchedule(d.schedule)[0];
  const chans = [...new Set(d.schedule.map((s) => s.channel))];
  $('#props').innerHTML = `
    <div class="props-h"><span>Notion page properties</span><span class="mono">PATCH /v1/pages</span></div>
    <div class="prop"><span>Name</span><div>${esc(d.brief.title)}</div></div>
    <div class="prop"><span>Status</span><div><span class="status s-${status}">${status}</span></div></div>
    <div class="prop"><span>Channels</span><div class="chips">${chans.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div></div>
    <div class="prop"><span>Publish date</span><div class="mono">${first ? `${esc(first.day)} ${fmtDate(nextDate(first.day))}, ${esc(first.time)}` : '—'}</div></div>
    <div class="prop"><span>Reviewer</span><div>${status === 'Review' ? 'Pinged in #content-review' : 'Approved'}</div></div>`;
  $('#props').hidden = false;
}

/* ---------------- Tabs ---------------- */
let activeTab = 'brief';
const emptyHTML = $('#panel').innerHTML;
const tabs = $$('#tabs [role="tab"]');
function selectTab(btn, focus = false) {
  activeTab = btn.dataset.tab;
  tabs.forEach((x) => { const on = x === btn; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
  $('#panel').setAttribute('aria-labelledby', btn.id);
  if (focus) btn.focus();
  if (current && !busy) renderTab(activeTab);
}
tabs.forEach((b, i) => {
  b.addEventListener('click', () => selectTab(b));
  b.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); selectTab(tabs[(i + k + tabs.length) % tabs.length], true); }
    if (e.key === 'Home') { e.preventDefault(); selectTab(tabs[0], true); }
    if (e.key === 'End') { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
  });
});

function showSkeleton() {
  $('#panel').innerHTML = `<div aria-label="Loading drafts">${[88, 64, 76, 52, 70].map((w) => `<div class="skel" style="width:${w}%"></div>`).join('')}</div>`;
}

function renderTab(tab) {
  const p = $('#panel');
  p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
  const views = { brief: viewBrief, x: viewX, linkedin: viewLinkedIn, instagram: viewInstagram, reel: viewReel, schedule: viewSchedule };
  p.innerHTML = views[tab](current);
  wireCopy(p);
  if (tab === 'instagram') wireCarousel(p);
  if (tab === 'reel') wireReel(p, current);
  if (tab === 'linkedin') wireLinkedIn(p);
}

/* ---------------- Helpers ---------------- */
const copyStore = new Map();
let copyId = 0;
function copyBtn(text, label = 'Copy') {
  const id = `c${++copyId}`;
  copyStore.set(id, text);
  return `<button type="button" class="copy" data-copy="${id}" aria-label="${esc(label)}">${ICON.copy}<span>${esc(label)}</span></button>`;
}
function wireCopy(root) {
  $$('[data-copy]', root).forEach((b) => b.addEventListener('click', async () => {
    const text = copyStore.get(b.dataset.copy) || '';
    let ok = true;
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    if (!ok) { toast('Copy failed. Select the text and copy it manually.'); return; }
    const old = b.innerHTML;
    b.classList.add('ok');
    b.innerHTML = `${ICON.check}<span>Copied</span>`;
    setTimeout(() => { b.classList.remove('ok'); b.innerHTML = old; }, 1300);
  }));
}
function meter(len, max) {
  const st = meterState(len, max);
  return `<span class="meter ${st === 'ok' ? '' : st}" title="${len} of ${max} characters"><span class="bar"><i style="width:${Math.min(100, (len / max) * 100).toFixed(1)}%"></i></span>${len}/${max}</span>`;
}
const AV = 'ST';

/* ---------------- Views ---------------- */
function viewBrief(d) {
  const b = d.brief;
  const all = [
    `# ${b.title}`, `Angle: ${b.angle}`, `Objective: ${b.objective}`, `Audience: ${b.audience}`, `Tone: ${b.tone} · Pillar: ${b.pillar}`,
    'Key messages:', ...b.keyMessages.map((m) => `- ${m}`), 'Proof points:', ...b.proofPoints.map((m) => `- ${m}`), `CTA: ${b.cta}`, `Keywords: ${b.keywords.join(', ')}`,
  ].join('\n');
  const li = (arr) => `<ul>${arr.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
  return `
  <div class="brief-head">
    <div>
      <p class="brief-title">${esc(b.title)}</p>
      <div class="chips"><span class="chip">${esc(b.pillar)}</span><span class="chip">${esc(b.tone)}</span><span class="chip">${d.mode === 'live' ? 'Live' : 'Demo data'}</span></div>
    </div>
    ${copyBtn(all, 'Copy brief')}
  </div>
  <dl class="dl">
    <dt>Angle</dt><dd>${esc(b.angle)}</dd>
    <dt>Objective</dt><dd>${esc(b.objective)}</dd>
    <dt>Audience</dt><dd>${esc(b.audience)}</dd>
    <dt>Key messages</dt><dd>${li(b.keyMessages)}</dd>
    <dt>Proof points</dt><dd>${li(b.proofPoints)}</dd>
    <dt>Call to action</dt><dd>${esc(b.cta)}</dd>
    <dt>Keywords</dt><dd><div class="chips">${b.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div></dd>
  </dl>`;
}

function xCard(text, n) {
  return `<article class="mock">
    <div class="who"><div class="av" aria-hidden="true">${AV}</div><div><b>Sai Tarun</b> <span class="h">@SaiTarunRonanki${n ? ` · ${n}` : ''}</span></div></div>
    <div class="txt">${esc(text)}</div>
    <div class="mock-foot">
      <div class="acts" aria-hidden="true"><span>${ICON.reply}12</span><span>${ICON.repost}8</span><span>${ICON.like}64</span><span>${ICON.views}2.1K</span></div>
      ${meter(xLength(text), LIMITS.x)} ${copyBtn(text)}
    </div>
  </article>`;
}
function viewX(d) {
  return `<div class="split">
    <div><p class="section-label"><span>Single post</span>${copyBtn(d.x.post, 'Copy post')}</p>${xCard(d.x.post)}</div>
    <div><p class="section-label"><span>Thread · ${d.x.thread.length} posts</span>${copyBtn(d.x.thread.join('\n\n'), 'Copy thread')}</p>
      <div class="thread">${d.x.thread.map((t, i) => xCard(t, `${i + 1}/${d.x.thread.length}`)).join('')}</div></div>
  </div>`;
}

function viewLinkedIn(d) {
  const t = d.linkedin.post;
  const lines = t.split('\n').filter(Boolean);
  return `<div class="split">
    <article class="mock li">
      <div class="who"><div class="av" aria-hidden="true">${AV}</div><div><b>Sai Tarun Ronanki</b><div class="meta-line">AI Systems &amp; Agentic Workflows Builder · now</div></div></div>
      <div class="txt clamp" id="liText">${esc(t)}</div>
      <button class="more" id="liMore" type="button" aria-expanded="false" aria-controls="liText">…see more</button>
    </article>
    <div>
      <p class="section-label"><span>Post details</span>${copyBtn(t, 'Copy post')}</p>
      <table class="stat-table">
        <tr><th scope="row">Length</th><td>${meter(t.length, LIMITS.linkedin)}</td></tr>
        <tr><th scope="row">Hook (above the fold)</th><td>${esc(lines[0] || '')}</td></tr>
        <tr><th scope="row">Lines · words</th><td class="num">${lines.length} · ${t.split(/\s+/).filter(Boolean).length}</td></tr>
        <tr><th scope="row">Ends with a question</th><td>${/\?\s*$/.test(t.trim()) ? 'Yes' : 'No'}</td></tr>
      </table>
    </div>
  </div>`;
}
function wireLinkedIn(root) {
  const btn = $('#liMore', root); const txt = $('#liText', root);
  btn?.addEventListener('click', () => {
    const clamped = txt.classList.toggle('clamp');
    btn.textContent = clamped ? '…see more' : 'Show less';
    btn.setAttribute('aria-expanded', String(!clamped));
  });
}

function viewInstagram(d) {
  const ig = d.instagram;
  const n = ig.slides.length;
  const capFull = `${ig.caption}\n\n${ig.hashtags.join(' ')}`;
  return `<div class="split">
    <article class="mock ig" aria-label="Instagram carousel preview">
      <div class="who"><div class="av" aria-hidden="true">${AV}</div><div><b>tarunaistudio</b></div></div>
      <div class="ig-stage">
        <span class="ig-count" aria-live="polite">1/${n}</span>
        <button class="ig-nav prev" type="button" aria-label="Previous slide" disabled>${ICON.left}</button>
        <button class="ig-nav next" type="button" aria-label="Next slide">${ICON.right}</button>
        <div class="ig-track">${ig.slides.map((s, i) => `<div class="slide ${i === 0 ? 'first' : i === n - 1 ? 'last' : ''}" aria-hidden="${i !== 0}">
          <span class="n">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>
          <div><div class="rule"></div><h3>${esc(s)}</h3></div>
          <div class="foot"><span>@tarunaistudio</span><span>${i < n - 1 ? 'Swipe' : 'Save for later'}</span></div></div>`).join('')}</div>
      </div>
      <div class="ig-dots" aria-hidden="true">${ig.slides.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
      <div class="cap"><b>tarunaistudio</b> ${esc(ig.caption)}\n<span class="ht">${esc(ig.hashtags.join(' '))}</span></div>
    </article>
    <div>
      <p class="section-label"><span>Slides</span>${copyBtn(ig.slides.map((s, i) => `Slide ${i + 1}: ${s}`).join('\n'), 'Copy slides')}</p>
      <div class="rows">${ig.slides.map((s, i) => `<button type="button" class="row" data-go="${i}"><span class="t">Slide ${i + 1}</span><span class="s">${esc(s)}</span><span class="meta mono">${s.length}</span></button>`).join('')}</div>
      <p class="section-label" style="margin-top:16px"><span>Caption and hashtags</span>${copyBtn(capFull, 'Copy caption')}</p>
      <table class="stat-table">
        <tr><th scope="row">Caption</th><td style="white-space:pre-wrap">${esc(ig.caption)}</td></tr>
        <tr><th scope="row">Hashtags</th><td><div class="chips">${ig.hashtags.map((h) => `<span class="chip">${esc(h)}</span>`).join('')}</div></td></tr>
        <tr><th scope="row">Limits</th><td>${meter(capFull.length, LIMITS.igCaption)} <span class="meta num">· ${ig.hashtags.length}/${LIMITS.igHashtags} hashtags</span></td></tr>
      </table>
    </div>
  </div>`;
}
function wireCarousel(root) {
  const track = $('.ig-track', root);
  const slides = [...track.children];
  const n = slides.length;
  let i = 0;
  const prev = $('.ig-nav.prev', root); const next = $('.ig-nav.next', root);
  const go = (k) => {
    i = Math.max(0, Math.min(n - 1, k));
    track.style.transform = `translateX(-${i * 100}%)`;
    prev.disabled = i === 0; next.disabled = i === n - 1;
    $('.ig-count', root).textContent = `${i + 1}/${n}`;
    slides.forEach((s, j) => s.setAttribute('aria-hidden', String(j !== i)));
    $$('.ig-dots i', root).forEach((d, j) => d.classList.toggle('on', j === i));
    $$('[data-go]', root).forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  };
  prev.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => go(i + 1));
  $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.go))));
  const stage = $('.ig-stage', root);
  let x0 = null;
  stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  go(0);
}

function viewReel(d) {
  const r = d.reel;
  const full = [
    'Hook options:', ...r.hooks.map((h, i) => `${String.fromCharCode(65 + i)}. ${h}`), '', 'Script:',
    ...r.script.map((s) => `[${s.t}] VO: ${s.voiceover}\n        Visual: ${s.visual}`), '', `On-screen text: ${r.onScreenText.join(' / ')}`, `CTA: ${r.cta}`, `Audio: ${r.audio}`,
  ].join('\n');
  return `<div class="reel-wrap">
    <div class="phone" aria-label="Reel preview">
      <div class="phone-screen">
        <div class="label-top"><span>Reels</span><span class="mono">0:30</span></div>
        <div class="ost" id="ost"></div>
        <div class="vo" id="vo"></div>
        <div class="prog" id="prog">${r.script.map(() => '<i></i>').join('')}</div>
      </div>
    </div>
    <div>
      <p class="section-label"><span>Hook options for A/B testing</span>${copyBtn(full, 'Copy script')}</p>
      <div class="rows">${r.hooks.map((h, i) => `<div class="row static"><span class="hook-key">Hook ${String.fromCharCode(65 + i)}</span><span class="s">${esc(h)}</span>${copyBtn(h)}</div>`).join('')}</div>
      <p class="section-label" style="margin-top:16px"><span>Script · 30 seconds · select a beat to preview</span></p>
      <div class="rows">${r.script.map((s, i) => `<button type="button" class="row" data-beat="${i}"><span class="t">${esc(s.t)}</span><span><span class="s">${esc(s.voiceover)}</span><span class="v">Visual: ${esc(s.visual)}</span></span><span></span></button>`).join('')}</div>
      <p class="note">Audio: ${esc(r.audio)}. On-screen text: ${r.onScreenText.map(esc).join(' → ')}.</p>
    </div>
  </div>`;
}
let reelTimer = null;
function wireReel(root, d) {
  clearTimeout(reelTimer);
  const beats = d.reel.script;
  const durs = beatDurations(beats);
  const show = (k, auto = true) => {
    clearTimeout(reelTimer);
    const i = k % beats.length;
    const ost = $('#ost', root);
    if (!ost || !document.body.contains(root)) return;
    const onScreen = d.reel.onScreenText;
    ost.textContent = i === 0 ? d.reel.hooks[0] : i === beats.length - 1 ? d.reel.cta : onScreen[Math.min(onScreen.length - 1, Math.max(0, i - 2))] || '';
    ost.classList.remove('enter'); void ost.offsetWidth; ost.classList.add('enter');
    $('#vo', root).textContent = beats[i].voiceover;
    $$('#prog i', root).forEach((el, j) => { el.className = j < i ? 'past' : j === i ? 'on' : ''; el.style.setProperty('--d', `${durs[i] * 0.6}s`); });
    $$('[data-beat]', root).forEach((el, j) => el.setAttribute('aria-current', String(j === i)));
    if (auto) reelTimer = setTimeout(() => { if (activeTab === 'reel') show(i + 1); }, durs[i] * 600);
  };
  $$('[data-beat]', root).forEach((el) => el.addEventListener('click', () => show(Number(el.dataset.beat))));
  show(0);
}

function viewSchedule(d) {
  const week = upcomingWeek();
  const sorted = sortSchedule(d.schedule);
  const byDay = Object.fromEntries(DAYS.map((x) => [x, []]));
  d.schedule.forEach((s) => byDay[DAYS.includes(s.day) ? s.day : 'Mon'].push(s));
  const txt = sorted.map((s) => `${s.day} ${fmtDate(nextDate(s.day))} ${s.time} · ${s.channel}: ${s.why}`).join('\n');
  return `<p class="section-label"><span>Next 7 days</span>${copyBtn(txt, 'Copy schedule')}</p>
  <div class="week">${week.map((dt) => {
    const day = DAYS[weekdayIndex(dt)];
    return `<div class="day"><h5><span>${day}</span><span>${fmtDate(dt)}</span></h5>${byDay[day].sort((a, b) => String(a.time).localeCompare(String(b.time)))
      .map((s) => `<div class="slot"><b>${esc(s.channel)}</b><span>${esc(s.time)}</span></div>`).join('')}</div>`;
  }).join('')}</div>
  <div class="table-wrap"><table class="data">
    <thead><tr><th scope="col">Channel</th><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Why this slot</th></tr></thead>
    <tbody>${sorted.map((s) => `<tr><td>${esc(s.channel)}</td><td class="mono">${esc(s.day)} ${fmtDate(nextDate(s.day))}</td><td class="mono">${esc(s.time)}</td><td class="why">${esc(s.why)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="note">Times are local to your browser and based on general best-practice windows, not your account analytics. The n8n workflow writes the first slot to the Notion <code>Publish date</code> property.</p>`;
}

/* ---------------- Board ---------------- */
const KEY = 'contentops.board.v2';
function seedBoard() {
  const now = new Date();
  const d = (n) => { const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  return [
    { id: 's1', title: 'Customer story: 3 hours a week saved on reporting', channel: 'LinkedIn', status: 'Idea', date: '', time: '' },
    { id: 's2', title: 'Myth vs reality: "AI will replace your ops team"', channel: 'X Thread', status: 'Idea', date: '', time: '' },
    { id: 's3', title: 'Behind the build: Notion + n8n content engine', channel: 'Reel', status: 'Drafting', date: d(4), time: '19:00' },
    { id: 's4', title: '5 workflows every agency should automate', channel: 'Instagram', status: 'Scheduled', date: d(2), time: '18:30' },
    { id: 's5', title: 'Why we keep a human in the review loop', channel: 'LinkedIn', status: 'Published', date: d(-3), time: '09:00' },
    { id: 's6', title: 'One idea, six assets', channel: 'X', status: 'Published', date: d(-5), time: '12:30' },
  ];
}
function load() {
  try { const v = sanitizeBoard(JSON.parse(localStorage.getItem(KEY))); if (v) return v; } catch {}
  return seedBoard();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(board)); } catch {} }
let board = load();
let freshIds = new Set();

function cardHTML(c) {
  const ci = COLUMNS.indexOf(c.status);
  const date = c.date ? new Date(`${c.date}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  return `<div class="kcard ${freshIds.has(c.id) ? 'fresh' : ''}" draggable="true" tabindex="0" data-id="${esc(c.id)}" aria-label="${esc(c.title)}, ${esc(c.channel)}, ${c.status}">
    <div class="kt">${esc(c.title)}</div>
    <div class="km"><span class="chip">${esc(c.channel)}</span>${date ? `<span class="date">${esc(date)}${c.time ? ` · ${esc(c.time)}` : ''}</span>` : ''}</div>
    <div class="kact">
      <button type="button" data-mv="-1" aria-label="Move to ${COLUMNS[ci - 1] || 'previous'}" ${ci === 0 ? 'disabled' : ''}>${ICON.left}</button>
      <button type="button" data-mv="1" aria-label="Move to ${COLUMNS[ci + 1] || 'next'}" ${ci === COLUMNS.length - 1 ? 'disabled' : ''}>${ICON.right}</button>
      <button type="button" data-del aria-label="Delete card">${ICON.x}</button>
    </div>
  </div>`;
}
function renderBoard(focusId) {
  const el = $('#board');
  el.innerHTML = COLUMNS.map((col) => {
    const cards = board.filter((c) => c.status === col);
    return `<div class="col" data-col="${col}" role="list" aria-label="${col}">
      <div class="col-h"><span class="status s-${col}">${col}</span><span class="ct">${cards.length}</span></div>
      ${cards.length ? cards.map(cardHTML).join('') : '<div class="col-empty">No cards</div>'}
    </div>`;
  }).join('');
  wireBoard(el);
  freshIds = new Set();
  if (focusId) $(`.kcard[data-id="${CSS.escape(focusId)}"]`, el)?.focus();
}
function commit(next, focusId) { board = next; save(); renderBoard(focusId); }
function wireBoard(el) {
  $$('.kcard', el).forEach((card) => {
    const id = card.dataset.id;
    card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; requestAnimationFrame(() => card.classList.add('dragging')); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('keydown', (e) => {
      if (e.target !== card) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); freshIds.add(id); commit(shiftCard(board, id, e.key === 'ArrowRight' ? 1 : -1), id); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); commit(board.filter((x) => x.id !== id)); }
    });
    $$('[data-mv]', card).forEach((b) => b.addEventListener('click', () => { freshIds.add(id); commit(shiftCard(board, id, Number(b.dataset.mv))); }));
    $('[data-del]', card).addEventListener('click', () => commit(board.filter((x) => x.id !== id)));
  });
  $$('.col', el).forEach((col) => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', (e) => {
      e.preventDefault(); col.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      if (id) { freshIds.add(id); commit(moveCard(board, id, col.dataset.col)); }
    });
  });
}
function addRunToBoard(run) {
  const items = cardsFromRun(run);
  items.forEach((c) => freshIds.add(c.id));
  commit([...items, ...board]);
  toast(`${items.length} drafts added to the calendar in Review.`);
}
$('#resetBoard').addEventListener('click', () => { commit(seedBoard()); toast('Calendar reset to sample cards.'); });

/* ---------------- Toast ---------------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------------- Init ---------------- */
setMode('demo');
renderPresets();
renderBoard();
updateCounts();
