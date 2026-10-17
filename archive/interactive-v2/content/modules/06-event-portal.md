---
id: event-portal
title: Event Portal
track: platform-90-day
block: 2
order: 6
weeks: [8]
estimated_hours: 8
icon: map
summary: >
  Model an application domain, its events and schemas; discover a running broker;
  and use the catalog for governance.
why_it_matters: >
  Architects and governance teams buy design and visibility, not just throughput.
  Event Portal is how you show them the whole event architecture in one place.
prerequisites: [micro-integrations]
exit_proof: Walkthrough of a designed and discovered event architecture.
evidence_types: [notes, screenshot, recording_link]
checkpoint: day-60
prep_questions:
  - Walk me through your application domain. Why are the boundaries there?
  - What did discovery find that you hadn't designed?
  - How would a governance team use the catalog every day?
---

Event Portal is the design-time and governance layer. You'll model what you built in
Block 1 and Block 2, then let discovery show you what's actually running.

<Step id="model-domain" title="Model an application domain" minutes="90">

Create an application domain for your retailer. Add at least three applications,
four events and their schemas. Reuse your topic hierarchy.

</Step>

<Step id="discover" title="Discover a running broker" minutes="90">

Run discovery against your local or cloud broker and import the results. Compare
what was discovered with what you designed.

<Verify>

Discovered topics and clients appear in Event Portal and can be linked to your design.

</Verify>

</Step>

<Step id="catalog" title="Use the catalog for governance" minutes="45">

Browse the catalog as a developer looking for an event to consume. Find an event,
its schema and its owner without asking anyone.

</Step>

<Step id="walkthrough" title="Record the walkthrough" minutes="30">

Record a five-minute walkthrough of your designed and discovered architecture.
This is your exit proof.

</Step>
