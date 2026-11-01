// Curated demo packages for the four UI presets (files starting with "_" are not routed by Vercel).
// Used only in demo mode, so a first-time visitor sees a realistic, hand-checked result with one click.
// Figures are illustrative and labelled as such.

const S = (channel, day, time, why) => ({ channel, day, time, why });

export const PRESET_PACKAGES = {
  'why most automation projects fail in the first 90 days, and how to avoid it': {
    brief: {
      title: 'Why Automation Projects Fail in the First 90 Days',
      angle: 'Most automations do not fail on day one. They quietly decay by week 12 because nobody owns them. Position ownership, monitoring and a human checkpoint as the real deliverable.',
      objective: 'Build authority with agency owners and ops leads, and start qualified conversations about workflow audits.',
      audience: 'Agency owners and operations leads running 5–50 person teams',
      keyMessages: [
        'Automations fail from neglect, not bad tooling: no owner, no alerts, no docs.',
        'Automate a process only after it has been done the same way 10 times by hand.',
        'Every workflow needs an owner, an error alert and a 15-minute monthly review.',
      ],
      proofPoints: [
        'Common pattern in audits: workflows break silently when an API field or a form changes (illustrative).',
        'A simple run log plus an error channel catches most failures within hours instead of weeks (typical, estimated).',
      ],
      cta: 'Comment "AUDIT" and I will share the 90-day automation checklist.',
      keywords: ['automation', 'n8n', 'operations', 'agency', 'workflow ownership'],
      pillar: 'Point of view',
    },
    x: {
      post: 'Most automation projects don\'t fail on launch day.\n\nThey fail around week 12, quietly:\n→ an API field changes\n→ nobody gets the error\n→ the team goes back to spreadsheets\n\nThe fix isn\'t a better tool. It\'s an owner, an alert and a monthly review.',
      thread: [
        '1/ Why automation projects fail in the first 90 days (and it\'s rarely the tech). I\'ve seen the same 3 patterns again and again in ops teams. 🧵',
        '2/ The patterns: automating a process that isn\'t stable yet, no named owner once the builder moves on, and silent failures with no error alert. Each one turns "saved time" into hidden rework.',
        '3/ The fix: run it by hand 10 times first. Give every workflow an owner, an error channel and a run log. Review it for 15 minutes a month. Boring, and it works. Comment "AUDIT" for my checklist.',
      ],
    },
    linkedin: {
      post: `Most automation projects don't fail on launch day.

They fail around week 12. Quietly.

A form field gets renamed. An API token expires. The workflow stops, nobody gets an alert, and three weeks later someone asks why the CRM is empty.

The team goes back to spreadsheets, and "automation doesn't work for us" becomes the story.

After building and auditing a lot of these, the root cause is almost never the tool. It's one of three things:

1. The process wasn't stable. If the team does it differently every week, you're automating chaos.
2. Nobody owns it. The builder moves on and the workflow becomes an orphan.
3. Failures are silent. No error alert, no run log, no way to see what broke.

What I put in place now, before anything goes live:

→ Run it by hand 10 times first. Then automate.
→ One named owner per workflow.
→ An error alert to a Slack channel people actually read.
→ A 15-minute review on the first Monday of every month.

None of this is exciting. All of it is the difference between a demo and a system.

What's the longest an automation of yours ran broken before anyone noticed?`,
    },
    instagram: {
      slides: [
        'Why automations die in 90 days',
        'It\'s not the tool. It\'s neglect.',
        'Mistake 1: automating an unstable process',
        'Mistake 2: no owner after launch',
        'Mistake 3: failures nobody sees',
        'Comment "AUDIT" for the checklist',
      ],
      caption: 'Your automation worked on launch day. Will it still work in 90 days? Most break quietly: a renamed field, an expired token, an error nobody sees. Swipe for the 3 mistakes I see most in agency and ops teams, and what to do instead. Comment "AUDIT" and I\'ll send the checklist.',
      hashtags: ['#automation', '#n8n', '#workflowautomation', '#agencyowner', '#operations', '#nocode', '#aiautomation', '#systemsthinking', '#productivity', '#businessprocess'],
    },
    reel: {
      hooks: [
        'Your automation will break in 90 days. Here\'s why.',
        'The real reason agencies give up on automation.',
        '3 boring rules that keep automations alive.',
      ],
      script: [
        { t: '0-3s', visual: 'Face to camera, red "ERROR" sticker pops in', voiceover: 'Your automation will break in 90 days. Here\'s why.' },
        { t: '3-9s', visual: 'Screen: n8n execution list full of failed runs', voiceover: 'Not on launch day. Around week twelve, when a field changes and nobody gets the error.' },
        { t: '9-15s', visual: 'Text: "Rule 1: run it by hand 10 times"', voiceover: 'Rule one: don\'t automate a process until you\'ve done it the same way ten times.' },
        { t: '15-21s', visual: 'Text: "Rule 2: one owner" + name tag graphic', voiceover: 'Rule two: every workflow gets one named owner. Not "the team".' },
        { t: '21-27s', visual: 'Slack error alert notification sliding in', voiceover: 'Rule three: errors go to a channel people read, plus a 15-minute monthly review.' },
        { t: '27-30s', visual: 'Face to camera, CTA text', voiceover: 'Comment AUDIT and I\'ll send you the checklist.' },
      ],
      onScreenText: ['Run it by hand 10x', 'One owner', 'Alerts + monthly review'],
      cta: 'Comment "AUDIT" for the checklist.',
      audio: 'Low-key lo-fi beat at 15% volume, voiceover-forward',
    },
    schedule: [
      S('LinkedIn', 'Tue', '09:00', 'B2B audience checks the feed before the first meetings.'),
      S('X', 'Tue', '13:00', 'Short post seeds the topic at lunch.'),
      S('Instagram', 'Wed', '18:30', 'Carousels get the most saves in the evening.'),
      S('X Thread', 'Thu', '10:00', 'Deeper thread once the topic has early replies.'),
      S('Reel', 'Fri', '19:00', 'Video reuses the carousel points for weekend reach.'),
    ],
  },

  'launching auto-invoice reconciliation: match payments to invoices without spreadsheets': {
    brief: {
      title: 'Launch: Auto-Invoice Reconciliation',
      angle: 'Lead with the month-end pain everyone in finance recognises (the VLOOKUP marathon), then show the before/after in one screen.',
      objective: 'Drive trial sign-ups from finance teams and give sales a shareable launch asset.',
      audience: 'Finance managers and controllers at growing SaaS companies',
      keyMessages: [
        'Payments are matched to invoices automatically, including partial and combined payments.',
        'Exceptions land in one review queue, so humans only touch what is actually unclear.',
        'Month-end close gets shorter because reconciliation happens daily, not at the end.',
      ],
      proofPoints: [
        'Beta teams reported most payments matching without manual work (illustrative; publish real beta numbers once approved).',
        'Supports partial payments, one payment covering many invoices, and bank-fee differences.',
      ],
      cta: 'Turn it on in Settings → Billing, or book a 15-minute walkthrough.',
      keywords: ['reconciliation', 'accounts receivable', 'month-end close', 'finance automation', 'invoices'],
      pillar: 'Product launch',
    },
    x: {
      post: 'New: auto-invoice reconciliation. ✨\n\nPayments now match to invoices on their own, including partial payments and one payment covering 5 invoices.\n\nAnything unclear goes to a single review queue.\n\nMonth-end without the VLOOKUP marathon.',
      thread: [
        '1/ We just shipped auto-invoice reconciliation. If your month-end involves a bank export, an invoice export and a very long spreadsheet, this one\'s for you. 🧵',
        '2/ How it works: every incoming payment is matched to open invoices by amount, reference and customer. Partial payments, combined payments and small bank-fee differences are handled automatically.',
        '3/ What it doesn\'t do: guess. Anything uncertain goes to a review queue with the best suggestion attached, so you approve in one click. Live today in Settings → Billing.',
      ],
    },
    linkedin: {
      post: `Month-end close shouldn't need a 4,000-row spreadsheet.

Today we're launching auto-invoice reconciliation.

Here's the before:
• Export payments from the bank
• Export open invoices
• VLOOKUP, filter, highlight, repeat
• Chase the ones that don't match

Here's the after:
• Payments match to invoices automatically, every day
• Partial payments and "one transfer for five invoices" are handled
• Small bank-fee differences are flagged, not ignored
• Anything uncertain lands in one review queue, with a suggested match

The part we cared about most: it doesn't guess. If the match isn't clear, a human decides, and the decision takes one click.

Reconciliation becomes a daily 10-minute check instead of a month-end project.

It's live today for all plans in Settings → Billing.

Finance folks: what's the strangest payment reference you've ever had to match?`,
    },
    instagram: {
      slides: [
        'Month-end, minus the spreadsheet',
        'Before: 3 exports and a VLOOKUP',
        'After: payments match automatically',
        'Partial + combined payments handled',
        'Unclear? One-click review queue',
        'Live now · Settings → Billing',
      ],
      caption: 'We built auto-invoice reconciliation for every finance team that has lost a Friday to a spreadsheet. Payments match to invoices on their own, edge cases go to a review queue, and month-end gets a lot quieter. Live today. Link in bio for a 15-minute walkthrough.',
      hashtags: ['#fintech', '#saas', '#accountsreceivable', '#financeteam', '#monthend', '#automation', '#productlaunch', '#accounting', '#cfo', '#bookkeeping'],
    },
    reel: {
      hooks: [
        'POV: it\'s month-end and you didn\'t open a spreadsheet.',
        'We deleted the worst part of month-end close.',
        'Watch 200 payments reconcile in 5 seconds.',
      ],
      script: [
        { t: '0-3s', visual: 'Tired person, laptop, giant spreadsheet', voiceover: 'POV: it\'s month-end and you\'re about to VLOOKUP for three hours.' },
        { t: '3-8s', visual: 'Record scratch, cut to clean product dashboard', voiceover: 'Or, you open this. Payments already matched to invoices.' },
        { t: '8-16s', visual: 'Screen recording: list turning green row by row', voiceover: 'Partial payments, one transfer for five invoices, bank fees. Handled automatically.' },
        { t: '16-24s', visual: 'Review queue with a suggested match, click Approve', voiceover: 'Anything unclear lands here with a suggestion. One click and it\'s done.' },
        { t: '24-30s', visual: 'Settings → Billing toggle switching on, logo', voiceover: 'Auto-reconciliation is live today. Turn it on in Settings.' },
      ],
      onScreenText: ['Before: 3 hours', 'After: auto-matched', 'Live today'],
      cta: 'Turn it on in Settings → Billing.',
      audio: 'Upbeat trending instrumental with a record-scratch transition',
    },
    schedule: [
      S('LinkedIn', 'Tue', '08:30', 'Launch post goes first where finance buyers are.'),
      S('X', 'Tue', '09:00', 'Same-morning announcement for the product community.'),
      S('X Thread', 'Tue', '16:00', 'Explainer thread for people who saw the announcement.'),
      S('Instagram', 'Wed', '12:30', 'Before/after carousel at lunch.'),
      S('Reel', 'Thu', '18:00', 'Demo video for broader reach after launch day.'),
    ],
  },

  'how i plan a week of content in 30 minutes with one idea and an ai workflow': {
    brief: {
      title: 'One Idea, One Week of Content, 30 Minutes',
      angle: 'Show the actual system (idea → brief → drafts → review → schedule) as a repeatable Sunday ritual, not an AI magic trick.',
      objective: 'Grow followers among solo creators and drive DMs for the workflow template.',
      audience: 'Solo creators and personal-brand builders posting on 2+ platforms',
      keyMessages: [
        'Start from one strong idea, not five weak ones.',
        'AI drafts, you edit. The 10-minute review is where your voice comes back in.',
        'Batching + scheduling beats daily inspiration.',
      ],
      proofPoints: [
        'My own routine: one Sunday session produces posts for X, LinkedIn, Instagram and one reel (personal example).',
        'Typical time saving vs writing each platform from scratch: most of the drafting time (estimate).',
      ],
      cta: 'DM me "WEEK" and I will send the Notion + n8n template.',
      keywords: ['content creation', 'personal brand', 'ai workflow', 'batching', 'notion'],
      pillar: 'Behind the build',
    },
    x: {
      post: 'I plan a full week of content in 30 minutes.\n\nNot by writing faster. By running one idea through a system:\n\n1 idea → brief → drafts for every platform → 10-min edit → scheduled\n\nInspiration is unreliable. Systems aren\'t.',
      thread: [
        '1/ Every Sunday I spend 30 minutes and walk away with a week of posts for X, LinkedIn, Instagram and one reel. Here\'s the exact system. 🧵',
        '2/ It starts in Notion. I drop one idea in a database and set status to "Idea". An n8n workflow picks it up, writes a brief, then drafts each platform in its native format.',
        '3/ Then the most important part: I edit for 10 minutes. AI gets the structure, I put my voice back in. Approve → it\'s scheduled. DM "WEEK" for the template.',
      ],
    },
    linkedin: {
      post: `I used to spend Sunday afternoons staring at a blank page.

Now I spend 30 minutes and leave with a week of content.

I didn't get more creative. I built a system.

Here's the whole thing:

1. One idea. Not five. One strong idea I genuinely have an opinion on.
2. A brief. Angle, audience, 3 key messages, one call to action.
3. Drafts per platform. A short X post and a thread, a LinkedIn post, a 6-slide carousel, a 30-second reel script.
4. A 10-minute edit. This is the non-negotiable step. AI handles structure, I add the stories and the voice.
5. Schedule. Each piece goes into a slot on my content calendar.

The tools are Notion for the calendar and n8n to run the pipeline. The tools matter less than the order.

The result: I post consistently without it eating my week.

What's the hardest part of staying consistent for you: ideas, writing or posting?`,
    },
    instagram: {
      slides: [
        'A week of content in 30 minutes',
        'Step 1: Pick ONE strong idea',
        'Step 2: Turn it into a brief',
        'Step 3: Draft every platform at once',
        'Step 4: Edit for 10 min (your voice)',
        'DM "WEEK" for my template',
      ],
      caption: 'Consistency isn\'t a motivation problem, it\'s a system problem. This is the exact 30-minute Sunday routine I use to plan a full week of posts from one idea. Save it for your next planning session, and DM me "WEEK" for the Notion + n8n template.',
      hashtags: ['#contentcreator', '#personalbranding', '#contentstrategy', '#buildinpublic', '#aitools', '#notion', '#n8n', '#creatoreconomy', '#productivity', '#batching', '#socialmediatips'],
    },
    reel: {
      hooks: [
        'I plan a week of content in 30 minutes. Watch.',
        'Stop writing every post from scratch.',
        'One idea. Five posts. Zero blank pages.',
      ],
      script: [
        { t: '0-3s', visual: 'Timer starting at 30:00, face to camera', voiceover: 'I plan a whole week of content in 30 minutes. Watch.' },
        { t: '3-8s', visual: 'Typing one idea into a Notion card', voiceover: 'It starts with one idea. Just one, in Notion.' },
        { t: '8-15s', visual: 'n8n workflow lighting up node by node', voiceover: 'My workflow turns it into a brief, then drafts for X, LinkedIn, Instagram and a reel.' },
        { t: '15-23s', visual: 'Editing a draft, highlighting and rewriting a line', voiceover: 'Then I spend ten minutes editing. That\'s where my voice goes back in.' },
        { t: '23-27s', visual: 'Cards dragging into "Scheduled"', voiceover: 'Approve, schedule, done for the week.' },
        { t: '27-30s', visual: 'Timer stops, CTA text', voiceover: 'DM me WEEK and I\'ll send you the template.' },
      ],
      onScreenText: ['1 idea', 'AI drafts', 'You edit'],
      cta: 'DM "WEEK" for the template.',
      audio: 'Fast-cut trending beat, cuts synced to each step',
    },
    schedule: [
      S('X', 'Mon', '09:00', 'Start the week with the short, punchy version.'),
      S('LinkedIn', 'Tue', '08:30', 'Story-led post for a professional audience.'),
      S('Instagram', 'Wed', '19:00', 'Save-worthy carousel in the evening.'),
      S('X Thread', 'Thu', '12:00', 'Step-by-step thread for people who engaged Monday.'),
      S('Reel', 'Sat', '11:00', 'Weekend scroll is strongest for creator content.'),
    ],
  },

  'using whatsapp reminders to cut appointment no-shows at clinics': {
    brief: {
      title: 'Cutting Clinic No-Shows with WhatsApp Reminders',
      angle: 'No-shows are a communication gap, not a patient problem. A friendly two-step WhatsApp reminder (24h + 2h) with one-tap confirm or reschedule closes it.',
      objective: 'Educate clinic owners and generate enquiries for reminder-workflow setups.',
      audience: 'Clinic owners and front-desk managers at small and mid-size clinics',
      keyMessages: [
        'Patients miss appointments because they forget, not because they don\'t care.',
        'WhatsApp works because patients already read it; SMS and email often go unseen.',
        'Make rescheduling one tap, so a cancellation becomes a filled slot, not an empty chair.',
      ],
      proofPoints: [
        'Clinics that add reminders commonly see fewer no-shows (results vary; measure your own baseline first).',
        'A two-touch sequence (24 hours and 2 hours before) is a common, low-effort starting point.',
      ],
      cta: 'Message me "CLINIC" for the reminder message templates.',
      keywords: ['clinic', 'no-shows', 'whatsapp', 'patient reminders', 'front desk'],
      pillar: 'Education',
    },
    x: {
      post: 'Most clinic no-shows aren\'t rude patients. They\'re busy people who forgot.\n\nA simple fix:\n→ WhatsApp reminder 24h before\n→ another 2h before\n→ one tap to confirm or reschedule\n\nEmpty chairs become filled slots.',
      thread: [
        '1/ Clinics lose hours every week to no-shows. The good news: most of it is fixable with a reminder patients will actually read. Here\'s a simple setup. 🧵',
        '2/ Send two WhatsApp messages: 24 hours before (confirm or reschedule) and 2 hours before (directions + what to bring). Keep it warm, short and in the patient\'s language.',
        '3/ The key detail: rescheduling must be one tap. A patient who reschedules is a slot you can refill. Track no-show rate for 4 weeks before and after. Message "CLINIC" for templates.',
      ],
    },
    linkedin: {
      post: `Every empty chair at a clinic has a cost: a doctor's time, a front desk's effort, and a patient who still needs care.

Most no-shows aren't patients who don't care. They're busy people who forgot.

A simple, respectful fix most clinics can set up in a week:

1. A WhatsApp reminder 24 hours before.
"Hi Priya, a reminder of your appointment with Dr. Rao tomorrow at 11:00. Reply 1 to confirm or 2 to reschedule."

2. A second reminder 2 hours before.
Directions, parking and what to bring.

3. One-tap rescheduling.
If a patient can't come, make it easy to move, not awkward to cancel. That slot can go to someone on the waitlist.

Why WhatsApp? Because patients already read it. Email and SMS reminders are easy to miss.

How to know it works: note your no-show rate for 4 weeks, switch reminders on, and compare the next 4 weeks. Measure your own baseline first.

Clinic owners: what's your current approach to reminders?`,
    },
    instagram: {
      slides: [
        'Fewer no-shows, without the awkward calls',
        'Why patients miss appointments',
        'Reminder 1: 24 hours before',
        'Reminder 2: 2 hours before',
        'Make rescheduling one tap',
        'Message "CLINIC" for the templates',
      ],
      caption: 'No-shows cost clinics time and patients care. Most are simply forgotten appointments. Swipe for a simple two-message WhatsApp reminder routine, with one-tap rescheduling so empty chairs become filled slots. Message "CLINIC" for the ready-to-use templates.',
      hashtags: ['#clinicmanagement', '#healthcare', '#patientexperience', '#whatsappbusiness', '#automation', '#smallbusiness', '#frontdesk', '#doctorsofinstagram', '#healthtech', '#appointments'],
    },
    reel: {
      hooks: [
        'Your clinic\'s no-shows are a messaging problem.',
        'This 2-message routine fills empty appointment slots.',
        'Stop calling patients to remind them.',
      ],
      script: [
        { t: '0-3s', visual: 'Empty waiting-room chair, clock ticking', voiceover: 'That empty chair? Usually it\'s just a patient who forgot.' },
        { t: '3-9s', visual: 'Phone showing a friendly WhatsApp reminder', voiceover: 'Send a WhatsApp reminder 24 hours before, with reply 1 to confirm or 2 to reschedule.' },
        { t: '9-16s', visual: 'Second message with a map pin', voiceover: 'Then a short one two hours before: directions and what to bring.' },
        { t: '16-23s', visual: 'Patient taps "Reschedule", calendar slot fills from waitlist', voiceover: 'If they can\'t make it, rescheduling is one tap, and you can refill the slot.' },
        { t: '23-30s', visual: 'Front-desk smiling, text "Measure 4 weeks before & after"', voiceover: 'Track four weeks before and after. Message CLINIC for the templates.' },
      ],
      onScreenText: ['24h reminder', '2h reminder', 'One-tap reschedule'],
      cta: 'Message "CLINIC" for the templates.',
      audio: 'Soft, warm acoustic track at low volume',
    },
    schedule: [
      S('LinkedIn', 'Tue', '10:00', 'Clinic owners check LinkedIn mid-morning between patients.'),
      S('Instagram', 'Wed', '13:30', 'Lunch-break scroll for front-desk teams.'),
      S('X', 'Wed', '18:00', 'Short version for the health-tech crowd.'),
      S('Reel', 'Thu', '20:00', 'Evening video reach; visual explainer.'),
      S('X Thread', 'Fri', '11:00', 'How-to thread to close the week.'),
    ],
  },
};

export function presetFor(idea) {
  const key = String(idea || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  return PRESET_PACKAGES[key] || null;
}
