---
id: broker-fundamentals
title: Broker fundamentals
track: platform-90-day
block: 1
order: 1
weeks: [1, 2]
estimated_hours: 12
icon: broker
summary: >
  Run a Solace Event Broker on your laptop and work through publish/subscribe,
  topic hierarchies and wildcards, queues, and persistence.
why_it_matters: >
  Every Solace conversation starts with the broker. Customers want to know you've
  run one, broken one and fixed one. Topic design is the first thing architects ask about.
prerequisites: []
exit_proof: Live publish and consume demo.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-30
prep_questions:
  - Walk me through your setup. How did you start the broker and what ports are exposed?
  - Why does a wildcard subscription on a hierarchical topic beat a flat topic name?
  - What happens to a persistent message when the consumer is offline?
  - What broke, and how did you fix it?
---

This module gets a broker running on your machine and makes the core messaging
model second nature. By the end you should be able to explain topics, queues and
persistence on a whiteboard **and** show them working live.

<Step id="run-broker" title="Run an Event Broker locally" minutes="45">

Start the free Standard edition in Docker. You'll switch to the Enterprise
evaluation broker in the HA and DR module.

```bash
docker run -d --name solace \
  -p 8080:8080 -p 55555:55555 -p 1883:1883 -p 5672:5672 -p 9000:9000 \
  --shm-size=1g \
  --env username_admin_globalaccesslevel=admin \
  --env username_admin_password=admin \
  solace/solace-pubsub-standard
```

Open Broker Manager at `http://localhost:8080` and sign in as `admin`.

<Verify>

The `default` Message VPN shows as **Up** in Broker Manager.

</Verify>

Docs: [Docker Hub image](https://hub.docker.com/r/solace/solace-pubsub-standard) · [Solace docs](https://docs.solace.com)

</Step>

<Step id="pub-sub" title="Publish and subscribe with Try Me" minutes="30">

In Broker Manager, open **Try Me!**. Connect a publisher and a subscriber in two
panes. Subscribe to `acme/orders/created` and publish a few messages to it.

Then publish to `acme/orders/shipped`. Nothing arrives, because nothing subscribes to it yet.

<Verify>

Messages appear in the subscriber pane within a second of publishing.

</Verify>

</Step>

<Step id="topic-hierarchy" title="Design a topic hierarchy and use wildcards" minutes="90">

Design a hierarchy for a fictional retailer, for example
`acme/orders/{verb}/{region}/{storeId}`. Write it down in your notes before you test it.

- `acme/orders/*/emea/>` matches every order event in EMEA.
- `*` matches exactly one level. `>` matches one or more levels and must be last.

Subscribe with at least three different wildcard patterns and prove each one
matches what you expect, and nothing else.

<Callout title="Customer angle" tone="tip">

Hierarchical topics let consumers filter at the broker, not in their code.
That's the moment many architects get it.

</Callout>

</Step>

<Step id="queues" title="Attract topics to a queue" minutes="60">

Create a durable queue `q.orders.emea` and add the subscription `acme/orders/*/emea/>`.
Publish with persistent delivery mode, then disconnect your consumer and keep publishing.

<Verify>

The queue's message count grows while the consumer is offline, then drains when it reconnects.

</Verify>

</Step>

<Step id="persistence" title="Prove persistence across a restart" minutes="45">

With messages spooled on the queue, restart the container with `docker restart solace`.
Reconnect a consumer and confirm every message is delivered exactly once.

Record a short clip of this. It's your exit proof.

</Step>
