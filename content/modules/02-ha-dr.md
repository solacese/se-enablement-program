---
id: ha-dr
title: HA and DR
track: platform-90-day
block: 1
order: 2
weeks: [3]
estimated_hours: 14
icon: shield
summary: >
  Build an HA group by hand, then as a repeatable Docker Compose setup. Replicate
  between a self-managed cloud site and your laptop, then fail over and fail back.
why_it_matters: >
  "What happens when a node dies?" comes up in every serious evaluation. Being able
  to show failover live, and to explain HA vs. DR clearly, wins trust with operations teams.
prerequisites: [broker-fundamentals]
exit_proof: >
  Messages sync on the HA backup; DR failover and fail-back with message continuity.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-30
prep_questions:
  - Draw your HA group. What does each node do, and how do they talk to each other?
  - How did you prove no messages were lost on failover?
  - Explain HA vs. DR to a CIO in two sentences.
  - What would you change before running this in production?
---

HA protects you from losing a node. DR protects you from losing a site. In this
module you'll build both, break both and show that messages survive.

<Step id="ha-manual" title="Build an HA group by hand" minutes="120">

Start three Enterprise broker containers on a shared Docker network: **primary**,
**backup** and **monitor**. Configure the redundancy group on each node, then enable
config-sync.

<Verify>

`show redundancy` reports the primary as Active and the backup as Standby, with config-sync Up.

</Verify>

</Step>

<Step id="ha-compose" title="Make it repeatable with Docker Compose" minutes="90">

Capture the same HA group as a `docker-compose.yml` you can bring up with one command.
Keep it in your notes or a personal repo. You'll reuse it for demos and walk
through it at the Day 30 checkpoint.

</Step>

<Step id="ha-failover" title="Fail over and check message sync" minutes="60">

Spool persistent messages on a queue, then stop the primary container. Connect a
consumer to the backup and drain the queue.

<Verify>

Every message published before the failure is consumed from the backup.

</Verify>

</Step>

<Step id="dr-replication" title="Set up DR replication" minutes="150">

Run a self-managed broker in a cloud VM as the **active** site and use your laptop
broker as the **standby**. Configure replication on a Message VPN, including the
replicated topics you need.

<Verify>

Messages published on the active site appear in the replicated queue on the standby.

</Verify>

</Step>

<Step id="dr-failover" title="Fail over and fail back" minutes="90">

Switch the standby to active, consume from it, then fail back to the original site.
Keep a publisher running throughout and record sequence numbers so you can show continuity.

Record this end to end. It's the centrepiece of your Day 30 checkpoint.

</Step>
