# Solace SE Journey

A guided web app for new Solace Sales Engineers. It walks each SE through **The Solace Platform in 90 Days** and the **New SE Pitch Bootcamp**: both tracks on one timeline, step-by-step modules with exit proofs, checkpoint prep, and pitch research, discovery and scoring.

This version is a **static, learner-only site** hosted on GitHub Pages. There is no server, database or sign-in yet. Each SE's progress is saved in their own browser. The code is structured so a backend and GitHub SSO can be added later without rewriting the pages (see [Adding a backend and SSO](#adding-a-backend-and-sso)).

The original brief is in [se-enablement-app-spec.md](se-enablement-app-spec.md).

## Stack

| Layer | Choice |
|---|---|
| App | SvelteKit 2 + Svelte 5, TypeScript, built with `adapter-static` (every page prerendered) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography`; Solace palette in [src/app.css](src/app.css) |
| Content | mdsvex (Markdown → Svelte) for modules; YAML for tracks, checkpoints and the rubric |
| Learner data | Browser storage: localStorage for progress, IndexedDB for screenshots |
| Hosting | GitHub Pages, deployed by [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |

## Getting started

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # type-check
npm run build        # static site in ./build
npm run preview      # serve the build locally
```

The first visit goes to **Get started**, where an SE enters their name and start date. To look around without typing anything, choose **Explore with sample progress** (an SE on day 41). Settings has a reset.

## Deploying to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The workflow type-checks, builds with `BASE_PATH=/<repo-name>` and publishes `build/`.

The site is then at `https://<owner>.github.io/<repo-name>/`. For a custom domain or a `<owner>.github.io` repository, set `BASE_PATH` to an empty string in the workflow.

To test a Pages-style build locally:

```bash
BASE_PATH=/se-enablement-program npm run build
```

## How SEs use it

- **Dashboard:** today and the next two weeks, progress per track, flags (for example the Enterprise evaluation broker not yet requested), and both tracks on one timeline.
- **Modules:** overview, steps they check off (saved as they go), evidence (notes, config snippets, recording links, screenshots), exit proof, and checkpoint prep questions. Modules unlock in order as exit proofs are submitted.
- **Checkpoints:** readiness, the question bank, scheduling, and **logging the result** after the live session (pass or needs work per module, plus feedback). A needs-work result opens coaching and a retake window. Every attempt is kept.
- **Pitch bootcamp:** the scenario their manager assigned (entered by the SE), research, discovery planner, pitch plan with the Solace Hub deck link, and sessions where they **log the rubric scores their evaluators gave them**. Below 16/20 opens coaching on the lowest dimensions and a retake window.
- **Settings:** profile, evaluator names, start date, primary OEM module, and **download / restore a backup**.

### What to tell SEs about their data

Progress lives in the browser they use. It doesn't sync between devices, and clearing site data erases it. Ask SEs to **download a backup** from Settings now and then. A backup also lets an evaluator look over an SE's evidence before a session, by restoring it in a separate browser profile.

## Editing program content

All program content lives in `content/` and is version-controlled. Edit a file and push: the next deploy picks it up. In `npm run dev` changes hot-reload. The app checks content on load and reports problems such as unknown module ids or duplicate step ids.

```
content/
  tracks/platform-90-day.yaml    Blocks, setup tasks, OEM options, outcomes
  tracks/pitch-bootcamp.yaml     Stages, rubric, graduation target, retake window, Solace Hub deck link
  modules/*.md                   One file per module: front matter + steps
  checkpoints/*.yaml             Modules covered, question banks, retake windows
  scenarios/_template.yaml       Scenario fields and verticals (no real contact data)
```

### Modules

Front matter holds the metadata (id, title, block, weeks, prerequisites, exit proof, evidence types, checkpoint, prep questions). The body holds the overview and ordered steps:

```md
<Step id="ha-failover" title="Fail over and check message sync" minutes="60">

Spool persistent messages on a queue, then stop the primary container.

<Verify>

Every message published before the failure is consumed from the backup.

</Verify>

</Step>

<Callout title="Customer angle" tone="tip">

Use `tone="info"`, `"tip"` or `"warning"`.

</Callout>
```

- `Step`, `Verify` and `Callout` are imported automatically.
- Leave blank lines inside the tags so the Markdown renders.
- Progress is saved against each step's `id`, so keep ids stable once SEs have started.
- Avoid bare `{` `}` in prose. They're fine inside code.

Before rollout, replace `deck.url` in `pitch-bootcamp.yaml` with the real Solace Hub link, and point module docs links at the exact pages you want SEs to use.

## Code map

```
src/lib/content/program.ts   Loads and validates /content (bundled at build time)
src/lib/progress.ts          The program rules: dates, gating, checkpoint and pitch state, flags.
                             A pure function of (learner data, today).
src/lib/pitch.ts             Pitch bootcamp rules: scheduling, scoring, retakes
src/lib/data/
  types.ts                   LearnerState: the stored document (mirrors the SQL schema)
  repository.ts              LearnerRepository interface: where data lives
  local.ts                   LocalRepository: localStorage + IndexedDB
  index.ts                   Picks the repository implementation
  learner.svelte.ts          Reactive store: every read and write goes through it
  sample.ts                  Sample progress
src/lib/auth.ts              AuthProvider interface + LocalAuth
src/routes/                  Pages (splash, start, dashboard, modules, checkpoints, pitch, tracks, settings)
archive/fullstack-v1/        The earlier full-stack version (see below). Not built.
```

## Adding a backend and SSO

The static site keeps three seams so a backend slots in behind them:

1. **Data: `LearnerRepository`** ([src/lib/data/repository.ts](src/lib/data/repository.ts)). Pages never touch storage directly; they go through the `learner` store, which calls the repository. Add an `ApiRepository` (for example `GET/PUT /api/learners/me`, plus file uploads to object storage) and select it in [src/lib/data/index.ts](src/lib/data/index.ts). Stored records already use the column names of the reference SQL schema, and the backup files SEs download now can be imported into the database.
2. **Rules: `buildView(state, today)`** ([src/lib/progress.ts](src/lib/progress.ts)) and [src/lib/pitch.ts](src/lib/pitch.ts) are pure functions with no browser dependencies. A server can import the same modules, so statuses match exactly.
3. **Identity: `AuthProvider`** ([src/lib/auth.ts](src/lib/auth.ts)). Today it returns the local profile. For **GitHub SSO**, the OAuth flow must run on a server, because the client secret can't ship in a static site. The backend handles `/auth/github` and the callback (scopes `read:user user:email`, plus `read:org` to restrict sign-in to the Solace GitHub org), sets a session cookie, and exposes `/api/me`. A `GitHubAuth` provider then redirects to sign in and reads `/api/me`.

**Reference implementation.** [archive/fullstack-v1/](archive/fullstack-v1/) is a snapshot of an earlier full-stack build: SQLite with portable SQL migrations, cookie sessions, evidence storage, and the **evaluator and manager views** (team roster, enrollment, scenario assignment, checkpoint and pitch scoring). It isn't built or type-checked with the current app. Use it as a starting point when the backend exists, and delete it if it's no longer useful.

## Accessibility and branding

Solace palette: Classic Green `#00C895`, Deep Blue `#093B5F`, Dark Blue `#03213B`, greys `#F4F4F4` / `#D6D6D6`. Body text is Figtree, falling back to Segoe UI.

- Green is used as a fill and on dark backgrounds (7.4:1 on Dark Blue). Text on white uses a darker green (`#007A5B`, 5.3:1) to meet WCAG AA.
- The pitch track uses an amber accent so the two tracks are easy to tell apart.
- Animations respect `prefers-reduced-motion`.

## Open questions

- **Shared progress:** without a backend, managers can't see team progress and evaluators can't record results directly. Backups are the stopgap.
- **Solace Hub:** the app links to the deck. Pulling the section list automatically needs Solace Hub API access.
- **Retake windows and attempt limits:** the window lengths are set in content files; no attempt limit is enforced.
