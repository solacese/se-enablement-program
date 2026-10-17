---
id: micro-integrations
title: Micro-Integrations
track: platform-90-day
block: 2
order: 7
weeks: [8]
estimated_hours: 8
icon: puzzle
summary: >
  Deploy and configure a micro-integration that brings an external system's events
  onto the broker.
why_it_matters: >
  Customers have systems that will never speak SMF. Micro-Integrations answer
  "how do we get our existing data in?" without a custom build.
prerequisites: [authentication-authorization]
exit_proof: Events flow from a source system into a queue.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-60
prep_questions:
  - Where does your micro-integration run, and who operates it?
  - How did you map source data onto your topic hierarchy?
  - What happens if the source system goes down?
---

A micro-integration connects one external system to the event mesh. You'll pick a
source, deploy it, and see events land on a queue.

<Step id="pick-source" title="Pick a source system" minutes="30">

Choose a source you can run locally or in a sandbox, such as a database, a message
queue or a cloud service. Write down why a customer would care about events from it.

</Step>

<Step id="deploy" title="Deploy the micro-integration" minutes="120">

Deploy a micro-integration for your source and point it at your broker. Save
its configuration, with secrets removed, so you can walk through it at the checkpoint.

</Step>

<Step id="topic-mapping" title="Map data to topics" minutes="60">

Configure the target topic so events land in your hierarchy from Broker fundamentals.
Attract them to a queue with a subscription.

<Verify>

New records in the source system appear as messages on your queue.

</Verify>

</Step>

<Step id="failure" title="Test a failure" minutes="45">

Stop the source system or the micro-integration, make some changes, then restart.
Note what's delivered and what isn't.

</Step>
