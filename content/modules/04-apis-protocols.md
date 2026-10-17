---
id: apis-protocols
title: APIs and protocols
track: platform-90-day
block: 2
order: 4
weeks: [5]
estimated_hours: 14
icon: plug
summary: >
  Use native SMF APIs alongside open protocols (JMS, MQTT, AMQP, REST), with
  cross-protocol interoperability.
why_it_matters: >
  Developers judge a platform by its APIs. Showing one event fan out across three
  protocols, with no glue code, is one of the most memorable demos you can give.
prerequisites: [solace-cloud]
exit_proof: An event published over one protocol is consumed by apps on two others.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-60
prep_questions:
  - Show me the event crossing protocols. What does the broker do in between?
  - When would you recommend SMF over MQTT or AMQP?
  - How do headers and properties map across protocols?
---

Solace speaks many protocols natively. In this module you'll write small apps in
more than one language and prove they all interoperate through the same broker.

<Step id="smf-app" title="Build a native SMF publisher and subscriber" minutes="120">

Pick a native API (Java, JavaScript, Python, Go, C or .NET) and build a small
publisher and subscriber. Use direct messaging first, then guaranteed messaging to a queue.

Docs: [Solace tutorials](https://tutorials.solace.dev) · [Codelabs](https://codelabs.solace.dev)

</Step>

<Step id="jms" title="Add a JMS consumer" minutes="90">

Write a JMS consumer that reads from the same queue. Note what changes in the
connection setup and what stays the same.

</Step>

<Step id="mqtt" title="Publish with MQTT" minutes="60">

Use an MQTT client (for example Paho or MQTTX) to publish to a topic your SMF
subscriber is listening on. Pay attention to the topic separator.

</Step>

<Step id="amqp-rest" title="Consume with AMQP and publish with REST" minutes="90">

Consume from a queue with an AMQP 1.0 client. Then publish with a plain HTTP
`POST` to the broker's REST port.

<Verify>

A `curl` POST lands in your AMQP consumer.

</Verify>

</Step>

<Step id="interop-demo" title="Run the cross-protocol demo" minutes="60">

Publish one event over one protocol and consume it in apps on two others at the same
time. Record it. This is your exit proof.

</Step>
