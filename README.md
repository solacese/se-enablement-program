# Solace SE Journey

A guide for new Solace Sales Engineers covering **The Solace Platform in 90 Days** and the **New SE Pitch Bootcamp**: the journey timeline, step-by-step modules with exit proofs, checkpoint question banks, and the pitch rubric and prep guide.

This version is a **read-only static site** hosted on GitHub Pages. There's no sign-in, no progress tracking and nothing is saved: it presents the program content. Earlier interactive versions are kept in [archive/](archive/) for when tracking, a backend and GitHub SSO are added (see [Adding tracking, a backend and SSO](#adding-tracking-a-backend-and-sso)).

The original brief is in [se-enablement-app-spec.md](se-enablement-app-spec.md).

## Stack

| Layer | Choice |
|---|---|
| App | SvelteKit 2 + Svelte 5, TypeScript, built with `adapter-static` (every page prerendered) |
| Styling | Tailwind CSS v4 + `@tailwindcss/typography`; Solace palette in [src/app.css](src/app.css) |
| Content | mdsvex (Markdown → Svelte) for modules; YAML for tracks, checkpoints and the rubric |
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

## Deploying to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The workflow type-checks, builds with `BASE_PATH=/<repo-name>` and publishes `build/`.

The site is then at `https://<owner>.github.io/<repo-name>/`. For a custom domain or a `<owner>.github.io` repository, set `BASE_PATH` to an empty string in the workflow.

To test a Pages-style build locally:

```bash
BASE_PATH=/se-enablement-program npm run build
```

## What's on the site

- **Journey overview** (home): both tracks on one 90-day timeline and every stop from kickoff to the Day 90 capstone.
- **90-day overview:** the three blocks, their modules and checkpoints, outcomes and planning notes.
- **Modules:** overview, why it matters with customers, estimated time, numbered steps with docs links and "how to verify" hints, the exit proof to demonstrate, and checkpoint prep questions.
- **Checkpoints:** what each covers, what to demonstrate, the question bank, and the retake policy.
- **Pitch bootcamp:** components, cadence, rubric and graduation target, and a prep guide (scenario, research prompts, discovery questions, the deck on Solace Hub, common objections).

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
src/lib/components/content/  <Step>, <Verify>, <Callout> used inside module Markdown
src/routes/                  Pages: journey overview, tracks, modules, checkpoints
archive/                     Earlier interactive versions (see below). Not built.
```

## Adding tracking, a backend and SSO

Two earlier versions are kept as starting points. Neither is built or type-checked with the current site.

- **[archive/interactive-v2/](archive/interactive-v2/): static, with tracking in the browser.** SEs set a start date and check off steps, add evidence, submit exit proofs, and log checkpoint and pitch results. Data is saved in localStorage and IndexedDB, with backup and restore.
  - All reads and writes go through a `LearnerRepository` interface, so an API-backed version replaces browser storage in one file.
  - The program rules (dates, gating, statuses, retakes) are pure functions a server can reuse.
  - Sign-in goes through an `AuthProvider` interface.
- **[archive/fullstack-v1/](archive/fullstack-v1/): full stack.** SQLite with portable SQL migrations, cookie sessions and evidence uploads, plus the evaluator and manager views (team roster, enrollment, scenario assignment, checkpoint and pitch scoring).

**GitHub SSO** needs a server, because the OAuth client secret can't ship in a static site. The backend handles `/auth/github` and its callback, with scopes `read:user user:email` (plus `read:org` to limit sign-in to the Solace GitHub org), and sets a session cookie.

Module front matter still carries `evidence_types`, and the content loader supports `setup_tasks` in `platform-90-day.yaml` (empty for now), so those features can come back without content changes.

## Accessibility and branding

Solace palette: Classic Green `#00C895`, Deep Blue `#093B5F`, Dark Blue `#03213B`, greys `#F4F4F4` / `#D6D6D6`. Body text is Figtree, falling back to Segoe UI.

- Green is used as a fill and on dark backgrounds (7.4:1 on Dark Blue). Text on white uses a darker green (`#007A5B`, 5.3:1) to meet WCAG AA.
- The pitch track uses an amber accent so the two tracks are easy to tell apart.
- Animations respect `prefers-reduced-motion`.

## Open questions

- **Tracking:** this version doesn't track progress or results; see the archived versions above.
- **Solace Hub:** the site links to the deck. Pulling the section list automatically needs Solace Hub API access.
