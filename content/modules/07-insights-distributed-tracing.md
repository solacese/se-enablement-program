---
id: insights-distributed-tracing
title: Insights / Distributed Tracing
track: platform-90-day
block: 3
order: 7
weeks: [9]
estimated_hours: 10
icon: pulse
summary: >
  Set up monitoring dashboards and alerting for brokers and services, plus
  Distributed Tracing for an end-to-end EDA scenario.
why_it_matters: >
  Operations teams ask "how do we know it's working?" Dashboards, alerts and traces
  that follow an event end to end answer that question better than any slide.
prerequisites: [event-portal]
exit_proof: >
  A triggered alert plus a dashboard walkthrough; a walkthrough of how to enable
  Distributed Tracing for scenarios.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-90-capstone
prep_questions:
  - Show me the alert you triggered. What threshold did you choose, and why?
  - How would a customer enable Distributed Tracing for one of their flows?
  - What would you put on a dashboard for an operations lead?
---

Observability is where the platform proves itself in production. You'll set up
monitoring with Insights, trigger an alert, then trace an event across the mesh.

<Step id="dashboards" title="Explore Insights dashboards" minutes="60">

Open Insights for your cloud service. Find message rates, queue depth, connection
counts and resource usage.

</Step>

<Step id="alert" title="Create and trigger an alert" minutes="60">

Create an alert, for example on queue depth. Stop your consumer and publish until
the alert fires.

<Verify>

You receive the alert notification and can show it in the dashboard.

</Verify>

</Step>

<Step id="dt-setup" title="Enable Distributed Tracing" minutes="120">

Enable Distributed Tracing on a broker, run an OpenTelemetry collector, and send
traces to a backend you can view.

</Step>

<Step id="dt-scenario" title="Trace an end-to-end EDA scenario" minutes="90">

Instrument a publisher and a consumer so one event can be followed from publish,
through the broker, to consume.

<Verify>

A single trace shows spans for the publish, the broker and the consume.

</Verify>

</Step>
