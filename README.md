# Content Ops Pipeline

One idea in, a brief and drafts for LinkedIn, Instagram and X out — and nothing gets scheduled until a person has read it.

[Live demo](https://content-ops-pipeline.vercel.app) · [Run locally](#run-locally) · [Design decisions](docs/decisions.md) · [Changelog](CHANGELOG.md)

I built this because my own content kept dying in the gaps between tools. The idea would be in a notes app, the draft half-finished in a Google Doc, the posting slot decided in my head, and the repurposing — turning one good post into a thread, a carousel and a reel — simply forgotten by Friday. This pipeline treats a post the way an editorial desk treats a story: it gets commissioned, drafted, reviewed, and only then put on the schedule.

## Try the demo

The live demo runs without any sign-up or API key. Three things worth doing:

1. Click the **Agency ops** preset. It runs a hand-checked sample package about why automation projects fail in the first 90 days, so you can see the full output shape in one click.
2. Open the **Instagram** tab and step through the carousel, then the **Reel** tab and click through the script beats — every draft is shown the way it would actually appear.
3. Click **Approve and schedule**. The drafts move from Review to Scheduled on the calendar board at the bottom, which is the whole point of the system: approval is a step in the workflow, not a chat message someone has to remember.

## The problem, as it usually feels

- Ideas are scattered: a notes app here, a voice note there, a half-line in a Doc.
- Every platform wants the same idea rewritten differently, so drafting one post quietly becomes drafting five.
- Scheduling is done by hand, late, and usually for whichever platform is loudest that day.
- Approval happens in DMs and comments, so nobody can later say what was actually approved.
- Repurposing is the first thing dropped when the week gets busy — which is most weeks.

None of that is a writing problem. It is a workflow problem, and workflow problems have workflow fixes.

## What it does

The production version is the n8n workflow in `n8n/content-ops-pipeline.n8n.json`. Step by step, exactly as the workflow runs:

1. **Poll.** Every 5 minutes, n8n checks a Notion content calendar for pages with `Status = Idea`.
2. **Lock.** A picked-up page is set to `Drafting` first, so a slow run or a second poll can never draft the same idea twice.
3. **Brief.** An LLM writes the brief: angle, objective, audience, key messages, proof points, call to action, content pillar.
4. **Drafts.** A second LLM step writes each channel in its own format: an X post and thread, a LinkedIn post, a 6-slide Instagram carousel with caption and hashtags, a 30-second reel script with three hook options, and a suggested posting schedule.
5. **Check.** A code step parses the output and enforces platform limits (X at 280 characters, LinkedIn at 3,000, Instagram captions at 2,200, 30 hashtags) before anything is saved.
6. **File it.** The drafts are written back onto the Notion page as properties, the full text is appended to the page body, and the status moves to `Review`.
7. **Ping a person.** A Slack message goes to the review channel. A reviewer edits in Notion and moves the page to `Scheduled`, which sets the publish date.

The web demo in this repo mirrors the same steps in the browser: `index.html` posts to `POST /api/generate`, the run trace shows trigger → brief → drafts → review → schedule, and the calendar board uses the same five statuses as the Notion database. Approving in the demo moves that run's cards to Scheduled, the same decision a reviewer makes in Notion.

A sample of what comes back (from the Agency ops preset — sample data, written by hand for the demo):

> **Brief angle:** Most automations do not fail on day one. They quietly decay by week 12 because nobody owns them.
> **LinkedIn draft, first lines:** "Most automation projects don't fail on launch day. They fail around week 12. Quietly."
> **Reel hook options:** "Your automation will break in 90 days. Here's why." / "3 boring rules that keep automations alive."

## Why it is built this way

Five decisions shape this project; the full reasoning and trade-offs are in [docs/decisions.md](docs/decisions.md).

- **A human approves before anything is scheduled.** Drafts stop at `Review` and a Slack ping asks a person to read them. Publishing is not automated in this repo, on purpose.
- **Demo mode needs no API key.** Without a key, the API returns deterministic sample packages — curated for the four presets, templated for anything else — and the header badge says "Demo data" so nobody mistakes it for live output.
- **Notion is the calendar, not a custom database.** The status field *is* the workflow state, so the board a human sees and the state the automation reads can never drift apart.
- **Limits are enforced in code, not requested in the prompt.** The model is asked for the right lengths, then the code checks and trims anyway.
- **When the live model fails, the run falls back and says so.** One retry, then demo output with a note in the response — never a blank screen or a stack trace.

## Architecture

```
Notion calendar (Status = Idea)
        │  poll every 5 min
        ▼
      n8n ── lock page (Drafting) ── LLM brief ── LLM channel drafts
        │                                                │
        │                          parse + enforce limits ┘
        ▼
Notion page updated (Status = Review) ── Slack review ping ── human approves ── Scheduled

Web demo:  index.html ── POST /api/generate ── Gemini 2.0 Flash (if key set)
                                              └─ demo generator (otherwise, or on failure)
```

| Part | What it is |
|---|---|
| `index.html`, `assets/` | The demo UI in plain HTML, CSS and JavaScript (ES modules). No framework, no build step. `assets/lib.js` holds the pure helpers — limits, counters, board logic — with no DOM access. |
| `api/generate.js` | One Vercel serverless function. Validates input, rate-limits, calls Gemini in JSON mode when a key is set, normalizes whatever comes back to one fixed schema. |
| `api/_presets.js` | The four curated demo packages. The leading underscore keeps Vercel from treating it as a route. |
| `n8n/content-ops-pipeline.n8n.json` | The importable production workflow: Schedule Trigger, HTTP Request, Split Out, Set and Code nodes. No secrets in the file. |
| `scripts/smoke.mjs` | A no-key smoke test for the demo generator, the API handler and the board helpers. Run it with `npm run smoke`. |

## Production notes

What keeps this from being a demo that falls over:

- **Input is validated before anything else.** Idea must be 8–280 characters; audience is capped at 160, tone at 40 (and matched against an allowlist), voice notes at 400. Bad input gets a JSON error with a plain message — `{ "error": "..." }` — never a stack trace.
- **The model call has a timeout and one retry.** Gemini calls abort at 20 seconds. The handler retries once, then falls back to demo output and labels it in the response (`mode`, plus a `note` when a fallback happened).
- **Output is normalized, not trusted.** Live model output is parsed and rebuilt field by field against the fixed schema; missing pieces are filled from the demo generator, and over-length posts are trimmed at a word boundary.
- **Rate and cost are bounded.** A best-effort limit of 12 requests per minute per IP guards the demo endpoint. It is per-instance and resets — a guard against accidents, not a quota system.
- **Keys stay server-side.** `GEMINI_API_KEY` is read only in the API function and never sent to the browser. The n8n workflow reads its tokens from the instance environment. See `.env.example` for the full list of variable names.
- **State changes are explicit.** In n8n, a page's status moves Idea → Drafting → Review → Scheduled, one step at a time, so a failed run leaves the page in a state that shows exactly where it stopped.

## Run locally

```bash
git clone https://github.com/Saitarun29/content-ops-pipeline
cd content-ops-pipeline
npx vercel dev
# open http://localhost:3000
```

No `npm install`, no keys. It runs in demo mode until you copy `.env.example` to `.env.local`, add a `GEMINI_API_KEY`, and restart — then the badge in the header switches to "Live".

Check the demo path any time with:

```bash
npm run smoke
```

### Using the n8n workflow

1. In n8n, open **Workflows → Import from file** and select `n8n/content-ops-pipeline.n8n.json`.
2. Set these on your instance: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `OPENAI_API_KEY`, `SLACK_WEBHOOK_URL`, and optionally `OPENAI_MODEL` (defaults to `gpt-4o-mini`) and `BRAND_VOICE_DEFAULT`. If your instance blocks `$env` in nodes, set `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` or switch the node headers to n8n credentials.
3. Create the Notion database with `Name` (title), `Status` (Idea, Drafting, Review, Scheduled, Published), `Audience`, `Tone` (select), `Brand voice`, `Brief`, `X Post`, `X Thread`, `LinkedIn`, `IG Carousel`, `Reel Script`, `Schedule`, `Channels` (multi-select) and `Publish date` (date), and share it with your integration.
4. Activate the workflow. It polls every 5 minutes for pages with `Status = Idea`.

## Data and privacy

- **All sample content is fictional and labelled.** The four preset packages and the seeded calendar cards are sample data, written for this demo. Where a preset mentions an outcome, it is marked "illustrative" or "estimated" in the text itself. There are no client stories in this repo.
- **The web demo stores almost nothing.** The calendar board lives in your browser's `localStorage` and nowhere else. The API keeps no database; the only server-side state is the short-lived in-memory rate-limit counter.
- **Live mode sends your idea text to the model provider.** With a Gemini key configured, the idea, audience, tone and voice notes you type go to Google's API to be drafted. In a client deployment of the n8n version, the same content passes through Notion, OpenAI and Slack under that business's own accounts — worth telling a team before switching it on, not after.

## Limitations and roadmap

Honest list, in roughly the order I would fix them:

- **Nothing actually posts.** `Scheduled` is a status with a date, not a publisher. Posting still happens by hand (or in Buffer, or wherever the team already posts). A publisher step that posts Scheduled pages at their publish date is the top roadmap item.
- **The Slack ping is one-way.** It is an incoming webhook, so there are no approve/request-changes buttons in Slack yet; review happens in Notion. Interactive buttons are on the roadmap.
- **Schedule times are general good-practice windows**, labelled as such in the UI — they are not based on your account's analytics, because the demo has no access to them.
- **The demo fallback is visibly templated for new ideas.** The four presets are hand-written; a typed idea outside them gets a structured but formulaic package. That is the honest trade-off of a no-key demo.
- **X character counting is approximate.** `assets/lib.js` weights emoji and CJK characters as 2, which is close enough for drafting, not an exact replica of X's counter.
- **The web board and Notion are not synced.** The demo board mirrors the workflow's statuses locally; it does not read or write your real Notion calendar.
- **No screenshot for now.** The old one in `docs/` predated the November 2026 editorial redesign, so I removed it rather than ship a picture of a design that no longer exists. Recapturing it from the current UI is on the list.

Roadmap after the publisher step: brand-voice memory that learns from edits made during review, and a feedback step that pulls post performance back into Notion so scheduling suggestions can use real numbers instead of general windows.

## Work with me

I'm Sai Tarun Ronanki, an AI Agents & Workflow Automation Consultant based in Hyderabad. I build automations that survive production: self-checking workflows that report their own failures, exceptions queues that route the unclear cases to a human instead of dropping them, and the unglamorous connections between CRM, billing, Sheets, Slack and ERP that make the whole thing one system instead of five tabs.

This pipeline is a small, public version of how I approach content operations for a business. If your team's follow-ups, drafts or hand-offs live in scattered tools and manual effort, I can build the version of this that runs on your stack.

- Email: [hello@saitarun.com](mailto:hello@saitarun.com)
- Site: [saitarun.com](https://saitarun.com)
- LinkedIn: [linkedin.com/in/saitarunronanki](https://www.linkedin.com/in/saitarunronanki)
- Instagram: [@tarunaistudio](https://www.instagram.com/tarunaistudio)

More of my work:

- [AI Lead Qualifier](https://github.com/Saitarun29/ai-lead-qualifier) — scores and routes inbound leads, with an exceptions queue for the ones a human should judge.
- [Knowledge Assistant (RAG)](https://github.com/Saitarun29/knowledge-assistant-rag) — answers from your own documents, with citations.
- [Portfolio site](https://github.com/Saitarun29/sai-tarun-portfolio) — the rest of the projects in one place.

MIT © 2026 Sai Tarun Ronanki
