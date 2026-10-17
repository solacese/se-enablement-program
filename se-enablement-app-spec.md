# SE Enablement Guide: Web App Specification

A guided web app that walks a new Solace Sales Engineer through two learning paths, the **New SE Pitch Bootcamp** and the **90-day Solace Platform technical path**. It tracks their progress, collects evidence of completed work, and supports the live evaluations that close each stage.

This document is the build brief for Claude Code. Sections 1–3 describe the program content the app must deliver. Sections 4–10 describe the app itself.

---

## 1. Purpose

The app gives each new SE:

- **one place** to see both learning paths, what's due, and what's next
- **guided, step-by-step modules** with a clear exit proof for each
- **a record of evidence** (notes, screenshots, configs, recordings) for evaluators to review before live sessions
- **visibility for managers** into each SE's progress across both tracks

The end goal: each SE can pitch Solace credibly and run technical engagements on their own.

---

## 2. Track A: New SE Pitch Bootcamp

**Duration:** 3–4 weeks, starting at the **day 30 mark** of the technical path, after the Day 30 checkpoint. It runs alongside Block 2.
**Evaluators:** managers and sales.
**Goal:** sharpen pitching and discovery skills by combining research on a real scenario with live discovery and pitch practice, graded against a defined rubric.

### 2.1 Scenario setup

Each SE is assigned:

- **one vertical** (for example capital markets, airlines, IIoT/manufacturing, financial services)
- **one real contact**, someone met at a conference, with a company and contact profile shared in advance

### 2.2 Program components

| Component | Focus | What the SE does |
|---|---|---|
| 1. Scenario & Research | Preparation | Given a vertical and a real contact, researches the company and the contact's stated priorities |
| 2. Discovery in Practice | Live discovery | Restates the contact's priorities, then runs structured discovery live and adjusts the pitch plan based on what discovery surfaces |
| 3. Pitch & Objection Handling | Delivery | Presents the deck sections most relevant to the scenario, handles objections live, and closes with a clear next step |

### 2.3 Evaluation flow

1. **Scenario Assignment:** vertical, company and real contact profile, shared in advance.
2. **Research & Prep:** the SE researches the company and prepares to restate priorities.
3. **Live Session:** discovery, relevant pitch delivery, and objection handling, all live.
4. **Scored Debrief:** the evaluators (a manager and a sales representative) score against the rubric and give feedback on what they observed.

**Cadence across the 3–4 weeks:** Baseline → Coaching → Practice → Graded Eval.

### 2.4 Scoring rubric

| Dimension | Proficient behaviour |
|---|---|
| Priority Restatement | Restates the contact's priorities accurately |
| Discovery Quality | Asks open, research-based questions |
| Pitch Relevance | Ties deck sections to stated priorities |
| Objection Handling | Addresses objections without deflecting |

- Each dimension is scored **1–5**, for a maximum of **20**.
- **The graduation target is ≥ 16/20.**

### 2.5 Repeat attempts

An SE who scores below 16/20 on the graded eval gets **targeted coaching** on the weakest dimensions, followed by a **retake window** for another graded eval.

---

## 3. Track B: The Solace Platform in 90 Days

**Duration:** 90 days in three 30-day blocks, with 10 modules and 3 checkpoints
**Goal:** a hands-on technical path from broker fundamentals to the full Solace Platform. The order follows how an SE presents the platform: the runtime first, then what developers and architects build with, then operations, AI and partner channels.

### 3.1 Path overview

| Block | Days | Theme | Modules | Ends with |
|---|---|---|---|---|
| 1 | 1–30 | Core platform | Broker fundamentals, HA and DR, Solace Cloud | Day 30 checkpoint: live quiz with a senior SE |
| 2 | 31–60 | Build and integrate | APIs and protocols, Micro-Integrations, Event Portal | Day 60 checkpoint: live quiz with a senior SE |
| 3 | 61–90 | Operate and extend | Insights / Distributed Tracing, Solace Agent Mesh, SAP AEM, Boomi Event Streams Enterprise | Day 90 capstone: full-platform demo |

### 3.2 Modules and exit proofs

Every module ends with an **exit proof**, something the SE can show working rather than just describe.

| Week | Module | What the SE does | Exit proof |
|---|---|---|---|
| 1–2 | Broker fundamentals | Runs an Event Broker locally and works through publish/subscribe, topic hierarchy and wildcards, queues, and persistence | Live publish and consume demo |
| 3 | HA and DR | Builds an HA group by hand, then as a repeatable Docker Compose setup. Replicates between a self-managed cloud site and a laptop, then fails over and fails back | Messages sync on the HA backup; DR failover and fail-back with message continuity |
| 4 | Solace Cloud | Creates and manages services in Solace Cloud, then meshes a cloud service to the local broker | Two-way events across a hybrid mesh |
| 5–6 | APIs and protocols | Uses native SMF APIs alongside open protocols (JMS, MQTT, AMQP, REST), with cross-protocol interoperability | An event published over one protocol is consumed by apps on two others |
| 7 | Micro-Integrations | Deploys and configures a micro-integration that brings an external system's events onto the broker | Events flow from a source system into a queue |
| 8 | Event Portal | Models an application domain, its events and schemas; discovers a running broker; uses the catalog for governance | Walkthrough of a designed and discovered event architecture |
| 9 | Insights / Distributed Tracing | Sets up monitoring dashboards and alerting for brokers and services, plus Distributed Tracing (DT) for an end-to-end EDA scenario | A triggered alert plus a dashboard walkthrough; a walkthrough of how to enable DT for scenarios |
| 10–11 | Solace Agent Mesh | Stands up Agent Mesh, configures agents, and connects them over the event broker | Live multi-agent workflow triggered by events |
| 12 | SAP AEM | Learns how the platform is packaged and sold through SAP, with light integration in SAP Integration Suite | Positions AEM to an SAP-led customer |
| 12 | Boomi Event Streams Enterprise | Learns how the platform is packaged and sold through Boomi, with light integration with Boomi | Positions Event Streams Enterprise to a Boomi customer |

### 3.3 Validation

A senior SE runs each checkpoint as a one-on-one live quiz. They ask about the SE's setup, how it works, and what the SE did to get it working.

An SE who doesn't pass a checkpoint gets **coaching** on the modules that fell short, followed by a **retake window** for the checkpoint.

- **Day 30 checkpoint:** Event Broker, HA/DR, and Solace Cloud.
- **Day 60 checkpoint:** APIs and protocols, Micro-Integrations, and Event Portal.
- **Day 90 capstone:** an end-to-end, customer-style demo spanning the full platform, which also covers the Insights, DT, Agent Mesh and OEM modules.

### 3.4 Outcomes

By the end of the path, an SE can:

- install and operate an Event Broker in any environment, and explain and demo HA vs. DR
- position self-managed, Solace Cloud and hybrid deployments
- build across protocols and APIs, bring existing systems in with Micro-Integrations, and govern designs in Event Portal
- show observability with Insights and Distributed Tracing
- build an agentic AI workflow with Solace Agent Mesh
- explain how SAP AEM and Boomi Event Streams Enterprise relate to the direct Solace offering

### 3.5 Planning notes

- HA, DR and mesh exercises need an **Enterprise evaluation broker**, not the free Standard edition. The SE should request one in week 1. The app should surface this as a day-1 task.
- Week 12 covers both OEM channels. If one matters more in the SE's pipeline, they spend the full week there and do the other self-paced. The app should let the SE pick which OEM module is primary.

---

## 4. Users and roles

| Role | Who | Needs |
|---|---|---|
| **Learner** | New SE | See both tracks, work through guided modules, submit evidence, prepare for live sessions, see feedback and scores |
| **Technical evaluator** | Senior SE running technical checkpoints | See an assigned SE's evidence before a session, run the session with a guide, record pass/fail and feedback |
| **Pitch evaluator** | Managers and sales | See an assigned SE's evidence before a session, run the session, record rubric scores and feedback |
| **Manager / Admin** | SE leadership | Enroll SEs, assign scenarios and evaluators, see team-wide progress, edit program content |

---

## 5. Core experience

### 5.1 Learner dashboard

- **Both tracks on one timeline.** The technical track spans 90 days in three blocks. The pitch track is a 3–4 week band starting at day 30, alongside Block 2.
- A **"Today / This week"** panel showing the current module step, upcoming deadlines, and scheduled live sessions.
- A **progress indicator** per track: modules complete, exit proofs submitted, checkpoints passed, current pitch score.
- **Flags** for blockers, such as the Enterprise evaluation broker not yet requested, or evidence missing ahead of a checkpoint.

### 5.2 Guided technical module

Each module page is a step-by-step walkthrough:

1. **Overview:** what the SE will build, why it matters in customer conversations, the estimated time, and prerequisites.
2. **Steps:** an ordered checklist. Each step has instructions, links to official docs, and an optional "how to verify" hint. Steps can be checked off; progress saves automatically.
3. **Exit proof:** a clear statement of what to demonstrate, plus an evidence form (notes, screenshots, config files or snippets, a recording link).
4. **Checkpoint prep:** sample questions the evaluator may ask, such as "walk me through your setup," "why does this work," and "what broke and how did you fix it."

Modules unlock in order within a block. An SE can preview later modules, but completion is gated so each exit proof is submitted before the next module starts. The manager can override the gating.

### 5.3 Pitch bootcamp flow

1. **Scenario card:** the assigned vertical, company and contact profile.
2. **Research workspace:** structured prompts covering company overview, the contact's stated priorities, likely event-driven use cases, and hypotheses to test. Includes a field for the SE's written **priority restatement**.
3. **Discovery planner:** draft open, research-based questions, each tied to a stated priority.
4. **Pitch plan:** open the current Solace pitch deck from **Solace Hub**, choose the sections most relevant to the scenario, and note the reason for each choice. The app links to the deck on Solace Hub rather than storing a copy, so SEs always work from the latest version. Prepare responses to likely objections and the intended next step.
5. **Session stages:** Baseline → Coaching → Practice → Graded Eval. Each stage records the session date, the evaluator, and feedback.
6. **Scorecard:** the rubric scores (1–5 per dimension), the total out of 20, pass/fail against the ≥ 16 target, and the evaluators' observations. Shows the trend from baseline to graded eval.
7. **Retake (if needed):** below 16/20 opens a coaching stage focused on the lowest-scoring dimensions, then a retake window for another graded eval. Each attempt is kept so the trend stays visible.

### 5.4 Evaluator view

- A list of assigned SEs and their upcoming sessions.
- For **technical checkpoints** (senior SEs): the SE's submitted exit proofs for the block, a suggested question bank per module, a pass / needs-work result per module, and notes. A needs-work result opens coaching and a retake window.
- For the **pitch bootcamp** (managers and sales): the SE's research, discovery plan and pitch plan before the session; the rubric form during or after it. A score below 16/20 opens coaching and a retake window.
- Feedback written by the evaluator is visible to the learner.

### 5.5 Manager view

- Team roster with the status of each track: on track, behind, or blocked.
- Enroll a new SE and set their start date. All dates on both tracks derive from it, with the pitch bootcamp starting at day 30.
- See open retake windows and SEs in coaching.
- Assign a pitch scenario and evaluators.
- Edit program content (see section 6).

---

## 6. Content as data

All program content (tracks, blocks, modules, steps, exit proofs, checkpoint question banks, rubric dimensions, scenario templates) lives in **version-controlled content files** (Markdown with YAML front matter, or YAML/JSON), not in code. This lets the program change without code changes, such as the Insights module gaining Distributed Tracing, or evaluators changing.

Suggested structure:

```
content/
  tracks/
    pitch-bootcamp.yaml        # components, stages, rubric, graduation target
    platform-90-day.yaml       # blocks, checkpoints, outcomes
  modules/
    01-broker-fundamentals.md
    02-ha-dr.md
    03-solace-cloud.md
    04-apis-protocols.md
    05-micro-integrations.md
    06-event-portal.md
    07-insights-distributed-tracing.md
    08-solace-agent-mesh.md
    09-sap-aem.md
    10-boomi-event-streams.md
  checkpoints/
    day-30.yaml                # modules covered, question bank
    day-60.yaml
    day-90-capstone.yaml
  scenarios/
    _template.yaml             # vertical, company, contact profile fields
```

Example module front matter:

```yaml
id: ha-dr
title: HA and DR
track: platform-90-day
block: 1
weeks: [3]
prerequisites: [broker-fundamentals, enterprise-eval-broker]
exit_proof: >
  Messages sync on the HA backup; DR failover and fail-back
  with message continuity.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-30
```

The module body (Markdown) holds the overview, ordered steps, and checkpoint prep questions.

---

## 7. Data model (initial)

| Entity | Key fields |
|---|---|
| User | id, name, email, role (learner / evaluator / manager) |
| Enrollment | user, start date, primary OEM module choice, assigned evaluators |
| Track | id, title, duration, stages or blocks (from content) |
| Module | id, track, block, weeks, steps, exit proof (from content) |
| StepProgress | enrollment, module, step, completed at |
| Evidence | enrollment, module, type, content or file reference, submitted at |
| Checkpoint | id, track, modules covered, attempt number, scheduled date, evaluator, result, notes |
| Scenario | enrollment, vertical, company, contact profile, research, discovery plan, pitch plan (selected Solace Hub deck sections) |
| PitchSession | enrollment, stage (baseline / coaching / practice / graded / retake), attempt number, date, evaluators, rubric scores, total, feedback |

Program content is read from files. Learner state is stored in the database.

---

## 8. Suggested stack and constraints

These are suggestions. Claude Code may propose alternatives, with reasons.

- **Frontend and backend:** a single full-stack TypeScript app (for example Next.js) for a simple, deployable footprint.
- **Database:** SQLite for local development, with Postgres-compatible migrations for hosting.
- **Content:** Markdown with YAML front matter, loaded at build or start time.
- **Auth:** simple email-based or local auth for v1, designed so SSO can be added later.
- **Files:** evidence uploads stored locally in development, with a storage interface that can move to object storage later.
- **Styling:** Solace brand palette: Classic Green `#00C895`, Deep Blue `#093B5F`, Dark Blue `#03213B`, and greys `#F4F4F4` / `#D6D6D6`. Body text uses Figtree, falling back to Segoe UI. Must meet WCAG AA contrast.
- **No secrets or customer data** in the repo. Scenario contact details are entered at runtime, not committed.

---

## 9. Build plan for Claude Code

Build in milestones, each runnable and demoable:

1. **Scaffold and content loading.** Set up the project, load the content files, and render read-only pages for both tracks and all modules.
2. **Learner progress.** Add auth, enrollment with a start date, derived timelines, step checklists with saved progress, and the learner dashboard.
3. **Evidence and exit proofs.** Add evidence forms and uploads per module, gating between modules, and the day-1 Enterprise evaluation broker task.
4. **Technical checkpoints.** Add checkpoint scheduling fields, the evaluator view with submitted evidence and question banks, recording results and feedback, and the coaching and retake flow.
5. **Pitch bootcamp.** Add the scenario card, research workspace, discovery planner, pitch plan with a Solace Hub deck link, session stages starting at day 30, and the rubric scorecard with ≥ 16/20 graduation logic and the coaching and retake flow.
6. **Manager view.** Add the team roster, status rollups, enrollment and assignment, and the primary OEM choice.
7. **Polish.** Apply Solace branding, accessibility, empty and error states, seed data for a demo learner and evaluator, and a README covering setup and how to edit content.

### Acceptance criteria (v1)

- A manager can enroll a new SE with a start date and assign evaluators and a pitch scenario.
- The SE sees both tracks with correct dates derived from their start date, with the pitch bootcamp starting at day 30.
- The SE can complete module steps, submit evidence for each exit proof, and see what unlocks next.
- An evaluator can review an SE's evidence before a technical checkpoint and record the result.
- A manager or sales evaluator can score a pitch session on all four rubric dimensions. The app shows the total and whether it meets ≥ 16/20.
- A failed checkpoint or a pitch score below 16/20 opens coaching and a retake window, and every attempt is kept.
- Changing a content file, such as editing an exit proof, updates the app without code changes.

---

## 10. Out of scope for v1 / open questions

**Out of scope:** automated provisioning of lab environments, auto-verification of exit proofs against a live broker, calendar integration for scheduling sessions, LMS or HR system integration.

**Open questions to resolve before or during the build:**

- **Hosting and access.** Is this internal-only behind SSO, and where will it be hosted?
- **Solace Hub access.** Is a direct link to the deck enough, or should the app pull the deck's section list from Solace Hub automatically?
- **Retake window length.** How long is the retake window after coaching, and is there a limit on attempts?
