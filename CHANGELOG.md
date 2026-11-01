# Changelog

Dated notes on what changed, newest first. Versions are not numbered; this is a working demo, not a packaged release.

## 2026-11-01 — Editorial redesign and production pass

- Restyled the demo as an editorial desk: warm cream paper background (#FAF4E8), rust accent (#B44924), flat surfaces, Fraunces serif headlines, byline and rule-line details in place of the previous monochrome dashboard look shared with sibling projects.
- Rewrote the README end to end: the workflow problem first, the pipeline step by step as it actually runs, production notes, data and privacy, and an honest limitations list. Removed the badge-wall header.
- Added `docs/decisions.md` recording the main design decisions and their trade-offs.
- Added `.env.example` listing every variable the web demo and the n8n workflow read, with no values.
- Production pass on `api/generate.js`: the live model call now gets one retry before falling back to demo output, and an outer guard returns a plain JSON error instead of a stack trace. Removed a piece of filler wording from the demo generator's tone kit.
- Added `scripts/smoke.mjs` (run with `npm run smoke`): exercises the API handler in demo mode, the demo generator, the presets and the board helpers, with no API keys needed. `package.json` now declares Node engines and working `dev` / `test` / `smoke` scripts.
- Demo UI honesty pass: removed the estimated "manual work removed" figure and the invented engagement counts from the X preview, labelled the seeded calendar cards as sample cards, and pointed the footer contact at hello@saitarun.com.

## 2026-11-01 — README polish

- Polished the README wording and structure after the initial release.

## 2026-10-31 — Initial release

- First public release. Live demo: https://content-ops-pipeline.vercel.app
- Web demo: one idea in, a brief plus X post and thread, LinkedIn post, 6-slide Instagram carousel, 30-second reel script and a posting schedule out, with platform-style previews, character counters and copy buttons.
- Notion-style calendar board (Idea, Drafting, Review, Scheduled, Published) with drag-and-drop, saved in the browser.
- `POST /api/generate` serverless function: input validation, per-IP rate limit, Gemini 2.0 Flash in live mode, deterministic demo packages with no key.
- Importable n8n workflow (`n8n/content-ops-pipeline.n8n.json`): polls a Notion calendar, drafts via an LLM, writes back for review, and pings Slack. Nothing is scheduled without human approval.
