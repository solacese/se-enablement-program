---
id: queue-types
title: Queue types, consumer patterns and replay
track: platform-90-day
block: 2
order: 5
weeks: [6]
estimated_hours: 8
icon: layers
summary: >
  Work through exclusive and non-exclusive queues, competing consumers, and
  partitioned queues, handle messages that can't be processed, and replay past
  messages with Message Replay.
why_it_matters: >
  "How do we scale consumers without losing order?" comes up in almost every
  architecture review. Knowing which queue type fits each pattern, and showing it
  live, is how you answer it with confidence.
prerequisites: [apis-protocols]
exit_proof: >
  An exclusive queue failing over between consumers, a non-exclusive queue
  load-balancing across competing consumers, and a replay of past messages into a
  queue, with a clear recommendation for when to use each.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-60
prep_questions:
  - When would you choose an exclusive queue over a non-exclusive one?
  - What happens to message order with competing consumers, and how do partitioned queues help?
  - What happens to a message that a consumer keeps failing to process?
  - When would a customer use Message Replay, and what does the replay log cost them?
---

A queue's access type decides how messages are shared between the consumers bound
to it. In this module you'll run the same workload against each queue type and see
the difference in delivery, ordering and failover, then use Message Replay to
deliver past messages again.

<Step id="exclusive" title="Fail over with an exclusive queue" minutes="60">

Create a durable queue `q.orders.exclusive` with **exclusive** access and the
subscription `acme/orders/>`. Bind two consumers to it, then publish a numbered
sequence of persistent messages.

Only one consumer receives messages; the other waits on standby. Stop the active
consumer mid-stream and watch the standby take over where it left off.

<Verify>

Broker Manager shows one active flow on the queue, and the sequence numbers stay in
order across the failover.

</Verify>

</Step>

<Step id="competing-consumers" title="Scale out with competing consumers" minutes="60">

Create a second queue `q.orders.shared` with **non-exclusive** access and the same
subscription. Bind three consumers and publish 30 numbered messages.

This is the competing-consumers pattern: the broker spreads messages across the
bound consumers, so adding a consumer adds throughput. Stop one consumer and notice
the others pick up its share.

<Verify>

Each consumer receives a share of the messages, and together they receive all 30
exactly once.

</Verify>

<Callout title="Customer angle" tone="tip">

Competing consumers scale out processing but give up global ordering. Ask early
whether the customer needs order across everything, per key, or not at all.

</Callout>

</Step>

<Step id="partitioned" title="Keep per-key order with a partitioned queue" minutes="60">

Give the non-exclusive queue a partition count, for example 3. Publish orders for
several customers, setting the partition key (the `JMSXGroupID` property) to the
customer id.

Messages with the same key always go to the same consumer, in order, while
different keys are still spread across consumers. Add and remove a consumer to see
partitions rebalance.

<Verify>

All messages for one customer arrive at a single consumer in sequence, and the load
is still spread across consumers.

</Verify>

</Step>

<Step id="redelivery-dmq" title="Handle messages that can't be processed" minutes="45">

Set a maximum redelivery count on a queue and configure a dead message queue.
Publish a message marked as eligible for the dead message queue, then have a
consumer reject it each time it's delivered.

<Verify>

After the redelivery limit, the message moves to the dead message queue and stops
blocking the consumers.

</Verify>

</Step>

<Step id="replay" title="Replay past messages with Message Replay" minutes="90">

Enable Message Replay on your Message VPN and give the replay log enough spool to
hold a few hundred messages. Publish a numbered sequence to `acme/orders/>`, then
consume it from a queue.

Now start a replay on that queue, first from the beginning of the replay log and
then from a point in time partway through the sequence. The broker redelivers the
stored messages to the queue in their original order.

<Verify>

The consumer receives the earlier messages again, starting from the point you chose,
in the original sequence.

</Verify>

<Callout title="Customer angle" tone="tip">

Replay helps a new consumer catch up on history, recovers from a bug that processed
messages wrongly, and gives test environments real traffic. The replay log uses
spool space, so size it for how far back the customer needs to go.

</Callout>

</Step>

<Step id="choose" title="Write the decision guide" minutes="30">

In your notes, write a short table you could share with a customer:

- **Exclusive:** strict order, one active consumer, automatic standby.
- **Non-exclusive:** scale-out processing, no ordering guarantee.
- **Partitioned:** scale-out with order kept per key.
- **Message Replay:** redeliver past messages to catch up, recover or test.

Add one real customer scenario for each row. You'll walk through it at the Day 60
checkpoint.

</Step>
