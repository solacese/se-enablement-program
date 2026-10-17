# Solace SE Journey

A guided web app for new Solace Sales Engineers. It walks each SE through the **New SE Pitch Bootcamp** and **The Solace Platform in 90 Days**, tracks progress, collects evidence for exit proofs, and supports the live checkpoints and graded pitch sessions that close each stage.

The build brief is in [se-enablement-app-spec.md](se-enablement-app-spec.md).

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | SvelteKit 2 + Svelte 5, TypeScript | One full-stack app with server-side form actions; small, deployable footprint (`adapter-node`) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography` | Solace palette as theme tokens in [src/app.css](src/app.css) |
| Content | mdsvex (Markdown → Svelte) + YAML | Module bodies are Markdown with a few components; tracks, checkpoints and rubric are YAML |
| Database | SQLite via Node's built-in `node:sqlite` | No native build step. Migrations are portable SQL (TEXT UUID keys, ISO dates) so they also run on Postgres |
| Auth | Email + password, scrypt hashes, cookie sessions | Simple for v1; SSO can replace `login()` in [src/lib/server/auth.ts](src/lib/server/auth.ts) |
| Files | `FileStorage` interface, local disk in dev | Swap in object storage in [src/lib/server/storage.ts](src/lib/server/storage.ts) |
| Font | Figtree (self-hosted via Fontsource), falling back to Segoe UI | |

SvelteKit 3 had been out for less than two weeks when this was built, so the app pins the mature SvelteKit 2 line.

## Getting started

Requires **Node 22.13 or later** (for `node:sqlite`).

```bash
npm install
npm run dev          # http://localhost:5173
```

On first start the app creates `data/app.db`, runs migrations and seeds a demo team. Every demo account uses the password **`demo1234`**, and the login page has one-click buttons for each:

| Account | Role | What you'll see |
|---|---|---|
| `alex@solace.demo` | Learner, day 41 | Block 1 done, Day 30 passed, part-way through APIs; pitch baseline 11/20 and a practice session scheduled |
| `jordan@solace.demo` | Learner, day 69 | Behind on Insights; Day 60 **needs work** (coaching + retake window); pitch graded 14/20 → retake coaching |
| `sam@solace.demo` | Learner, day 4 | **Blocked**: Enterprise evaluation broker not requested |
| `riley@solace.demo` | Learner | Starts in 5 days |
| `priya@solace.demo` | Technical evaluator (senior SE) | Checkpoint reviews, evidence, question banks |
| `dana@solace.demo` | Manager | Team roster, enrollment, assignments, content; also a pitch evaluator |
| `chris@solace.demo` | Pitch evaluator (sales) | Pitch scoring |

Seed dates are relative to today, so the demo always looks current.

Other commands:

```bash
npm run check        # type-check Svelte + TS
npm run build        # production build into ./build
npm start            # run the production build (PORT=3000 by default)
npm run db:reset     # delete the local DB and uploads; demo data re-seeds on next start
```

Stop the dev server before `npm run db:reset`: the server keeps its database connection open.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `data/app.db` | SQLite file |
| `UPLOAD_DIR` | `data/uploads` | Evidence uploads |
| `SHOW_DEMO_ACCOUNTS` | (shown) | Set to `false` to hide the demo account buttons on the login page |
| `ORIGIN` | | Required by `adapter-node` in production, e.g. `https://se-journey.example.com` |

## What's where

```
content/                     Program content (edit these, not code)
  tracks/                    platform-90-day.yaml, pitch-bootcamp.yaml
  modules/                   01-broker-fundamentals.md … 10-boomi-event-streams.md
  checkpoints/               day-30.yaml, day-60.yaml, day-90-capstone.yaml
  scenarios/_template.yaml   Scenario fields and verticals (no real contact data)
migrations/                  Portable SQL migrations, applied on start
src/lib/server/
  content.ts                 Loads and validates content
  progress.ts                Derives dates, gating, checkpoint and pitch state, flags, roster status
  db.ts auth.ts storage.ts   Database, sessions, file storage
src/lib/components/content/  <Step>, <Verify>, <Callout> used inside module Markdown
src/routes/
  +page.svelte               Welcome splash with the journey timeline
  (app)/dashboard            Learner dashboard
  (app)/modules/[id]         Guided module: overview, steps, exit proof, checkpoint prep
  (app)/checkpoints/[id]     Learner checkpoint view
  (app)/pitch/…              Pitch bootcamp: scenario, research, discovery, plan, sessions
  (app)/evaluate/…           Evaluator views (technical checkpoints and pitch scoring)
  (app)/team/…               Manager roster, enrollment, SE management
  (app)/content/…            Content browser and dev-mode editor
```

## Editing program content

All program content lives in `content/` and is version-controlled. Changing a file updates the app without code changes: in dev it hot-reloads; in production it's picked up by the next build. Managers can browse content at **/content**, and in dev mode edit it in the browser (the editor validates before saving).

The app checks content on load and fails with a readable list of problems (unknown module ids, missing checkpoints, duplicate step ids).

### Modules

Each module is Markdown with YAML front matter:

```yaml
---
id: ha-dr
title: HA and DR
track: platform-90-day
block: 1
order: 2
weeks: [3]
estimated_hours: 14
icon: shield                     # broker, shield, cloud, plug, puzzle, map, pulse, sparkles, handshake…
summary: What the SE will build.
why_it_matters: Why it matters in customer conversations.
prerequisites: [broker-fundamentals, enterprise-eval-broker]   # module ids or setup task ids
exit_proof: >
  Messages sync on the HA backup; DR failover and fail-back with message continuity.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-30
prep_questions:
  - Draw your HA group. What does each node do?
---
```

The body holds the overview text and the ordered steps. Each step is a `<Step>` block; its `id` is what progress is saved against, so **keep step ids stable** once SEs have started. Leave a blank line after opening tags and before closing tags so the Markdown inside is rendered:

```md
<Step id="ha-failover" title="Fail over and check message sync" minutes="60">

Spool persistent messages on a queue, then stop the primary container.

<Verify>

Every message published before the failure is consumed from the backup.

</Verify>

Docs: [Solace docs](https://docs.solace.com)

</Step>

<Callout title="Customer angle" tone="tip">

Use `tone="info"`, `"tip"` or `"warning"`.

</Callout>
```

`Step`, `Verify` and `Callout` are imported automatically; content files never need a `<script>` tag. Avoid bare `{` `}` in prose (Svelte treats them as expressions); they're fine inside code.

### Tracks, checkpoints and the rubric

- **Blocks, setup tasks, OEM options and outcomes**: [content/tracks/platform-90-day.yaml](content/tracks/platform-90-day.yaml). The Enterprise evaluation broker request is a setup task due on day 1.
- **Bootcamp stages, rubric, graduation target, retake window and the Solace Hub deck link**: [content/tracks/pitch-bootcamp.yaml](content/tracks/pitch-bootcamp.yaml). Replace `deck.url` with the current Solace Hub link; the app links to the deck rather than storing a copy.
- **Checkpoint question banks and retake windows**: `content/checkpoints/*.yaml`.

## How the program logic works

- **Dates** all derive from the enrollment start date (day 1). Week *W* is days 7(*W*−1)+1 to 7*W*. The pitch bootcamp starts on `start_day` (30). Changing a start date moves everything.
- **Gating**: a module unlocks when its `prerequisites` are done (module exit proofs submitted; setup tasks in their final state). Learners can preview locked modules. Managers can override gating per SE.
- **Exit proofs**: an SE adds evidence (notes, screenshots, configs, recording links), then submits. At least one piece of evidence is required.
- **Checkpoints**: the evaluator records pass / needs-work per module. Any needs-work opens coaching on those modules and a retake window (`retake_window_days`). Attempts are never deleted.
- **Pitch**: each scored session records 1–5 per rubric dimension. A graded or retake total below the target opens coaching on the lowest dimensions and a retake window. Every attempt stays on the scorecard trend.
- **Roster status**: *blocked* if a blocker flag is raised (e.g. eval broker not requested, evidence missing after a checkpoint date), *behind* if a module or checkpoint is past its planned date, otherwise *on track*.

## Accessibility and branding

Solace palette: Classic Green `#00C895`, Deep Blue `#093B5F`, Dark Blue `#03213B`, greys `#F4F4F4` / `#D6D6D6`. Green is used as a fill and on dark backgrounds (7.4:1 on Dark Blue); text on white uses a darker green (`green-700`, 5.3:1) to meet WCAG AA. The pitch track uses an amber accent so the two tracks are distinct at a glance. Animations respect `prefers-reduced-motion`.

## Open questions (from the spec)

- **Hosting and access**: internal-only behind SSO? Where will it be hosted?
- **Solace Hub**: a direct deck link is implemented; pulling the section list automatically would need Solace Hub API access. Sections are listed in `pitch-bootcamp.yaml` for now.
- **Retake window length and attempt limits**: configurable in content (`retake_window_days`, `retake.window_days`); no attempt limit is enforced.
- **Docs links** in module content point at top-level Solace docs, tutorials and repos; content owners should replace them with the exact pages they want SEs to use.
