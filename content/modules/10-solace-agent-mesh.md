---
id: solace-agent-mesh
title: Solace Agent Mesh
track: platform-90-day
block: 3
order: 10
weeks: [10, 11]
estimated_hours: 14
icon: sparkles
summary: >
  Stand up Agent Mesh, configure agents, and connect them over the event broker.
why_it_matters: >
  Every customer is asking about agentic AI. Showing agents that are triggered by,
  and coordinate over, real-time events is where Solace is clearly different.
prerequisites: [insights-distributed-tracing]
exit_proof: Live multi-agent workflow triggered by events.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-90-capstone
prep_questions:
  - Which event triggers your workflow, and how do the agents coordinate?
  - Why does an event broker make multi-agent systems better than point-to-point calls?
  - What would a customer need to run this in production?
---

Solace Agent Mesh is an open-source framework for building multi-agent systems that
communicate over the event broker. You'll install it, add agents, and trigger a
workflow from an event.

<Step id="install" title="Install and initialise Agent Mesh" minutes="60">

Install Agent Mesh in a Python virtual environment, initialise a project, and point
it at your broker and an LLM endpoint.

Docs: [Solace Agent Mesh on GitHub](https://github.com/SolaceLabs/solace-agent-mesh)

<Verify>

The web UI gateway starts and the orchestrator answers a simple prompt.

</Verify>

</Step>

<Step id="agents" title="Configure your own agents" minutes="150">

Add at least two agents with distinct skills, for example one that looks up order
data and one that drafts a customer notification.

</Step>

<Step id="event-trigger" title="Trigger the workflow from an event" minutes="120">

Connect an event-driven gateway so a message published to your topic hierarchy starts
the workflow without a human prompt.

<Verify>

Publishing one event produces a finished, multi-agent result.

</Verify>

</Step>

<Step id="demo" title="Record the multi-agent demo" minutes="45">

Record the workflow end to end, including the triggering event. This is your exit proof
and a likely part of your capstone.

</Step>
