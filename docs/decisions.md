# Decisions

Short notes on the choices that shaped this project, written when they were made. Each one has a trade-off; I would rather record both sides than pretend there was an obvious answer.

## 1. A human approves before anything is scheduled — 31 Oct 2026

Drafts stop at `Review`. A Slack ping asks a person to read them, and only that person moves a page to `Scheduled`. This repo contains no publisher at all.

**Why:** A draft that is 90% right is still wrong in the sentence a client will quote back at you. Tone, a claim that needs checking, a hook that sounds like someone else — those are judgement calls, and they are cheap to make at review time and expensive after posting.

**Trade-off:** The pipeline is slower than full auto-posting, and it depends on a reviewer actually showing up. A page can sit in Review for days. I accept that: an unscheduled post is a delay, a bad published post is a reputation problem.

## 2. Demo mode needs no API key — 31 Oct 2026

`POST /api/generate` works with no key configured. The four presets return hand-written packages from `api/_presets.js`; any other idea gets a deterministic, template-based package built from the input. The response carries a `mode` field and the UI header shows a "Demo data" badge.

**Why:** A portfolio demo that opens with "enter your API key" gets closed, not evaluated. Anyone should be able to click one preset and see the complete output shape — brief, drafts, schedule, board — in seconds.

**Trade-off:** Templated output for non-preset ideas is visibly formulaic, and a curated preset can make the demo look better than a cold live run would. The badge and the `mode` field exist so that gap is disclosed rather than hidden.

## 3. Notion is the calendar and the source of truth — 31 Oct 2026

The workflow keeps no database of its own. A Notion page's `Status` property (Idea, Drafting, Review, Scheduled, Published) is the state machine, and the page body holds the full drafts.

**Why:** The people reviewing content already live in Notion. If the automation kept its state somewhere else, the board a human sees and the state the workflow reads would drift apart, and drift is where "I thought that was already posted" comes from.

**Trade-off:** Polling every 5 minutes instead of a real trigger, a property schema that has to be created by hand (see the README setup list), and Notion's API rate limits as a ceiling on volume. Fine at content-team scale; this design would not survive a newsroom publishing hundreds of items a day.

## 4. Two model calls, brief first, drafts second — 31 Oct 2026

The n8n workflow and the web API both ask the model for a brief first (angle, audience, key messages, CTA, pillar), then pass that brief into a second call that writes the channel drafts.

**Why:** Drafts written straight from a one-line idea wander — the LinkedIn post picks one angle, the carousel picks another. Writing the brief first gives every channel the same brief to work from, and gives the reviewer one short document to correct before five long ones exist.

**Trade-off:** Two calls cost more and take longer than one, and an error in the brief is faithfully repeated in every draft. The review step (decision 1) is the backstop for that.

## 5. Platform limits are enforced in code, not in the prompt — 1 Nov 2026

The prompt asks for an X post under 280 characters; then `fit()` in `api/generate.js` trims it anyway, a Code node in n8n checks lengths, and the UI shows live counters against the limits in `assets/lib.js` (X 280, LinkedIn 3,000, Instagram caption 2,200, 30 hashtags).

**Why:** Models treat length instructions as a suggestion. A post that arrives 40 characters over the limit pushes manual editing back onto the reviewer — exactly the work this pipeline exists to remove.

**Trade-off:** Trimming at a word boundary can cut a sentence short or drop the call to action. That is why enforced limits pair with human review rather than replacing it, and why the demo presets are hand-checked instead of generated.

## 6. Live failure falls back to demo output, labelled — 1 Nov 2026

If the Gemini call fails — timeout at 20 seconds, a non-200 response, unparseable JSON — the handler retries once. If it fails again, the request returns the demo package with `note: "Live AI unavailable after a retry, served demo output instead."` and `mode: "demo"`.

**Why:** A visitor who hits a model outage should still see a working product, and an operator should be able to tell at a glance which mode served the result. In the n8n version the same instinct applies: a failed run leaves the page in `Drafting`, a visible stuck state, rather than silently marking it done.

**Trade-off:** Fallback output can be mistaken for live output if someone ignores the badge and the note. Labelling in both the API response and the UI is the mitigation; removing the fallback would trade a small confusion risk for a hard failure.

## 7. Plain HTML, CSS and JavaScript for the front end — 1 Nov 2026

No framework, no build step, no dependencies in `package.json`. The UI is ES modules served as-is; `assets/lib.js` keeps the testable logic (limits, counters, board operations) free of DOM access.

**Why:** The whole demo is one page and a board. A framework would add a build pipeline, a dependency tree to maintain, and nothing the page needs. Keeping the pure logic in `lib.js` means the smoke test (`scripts/smoke.mjs`) can exercise it under plain Node.

**Trade-off:** Rendering is manual string-building, which gets unwieldy as views multiply. If this grew past a handful of views, that choice would need revisiting — at its current size it is the simpler thing to keep correct.
