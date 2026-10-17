---
id: solace-cloud
title: Solace Cloud
track: platform-90-day
block: 1
order: 3
weeks: [4]
estimated_hours: 8
icon: cloud
summary: >
  Create and manage event broker services in Solace Cloud, then mesh a cloud service
  to your local broker.
why_it_matters: >
  Most customers are hybrid. Showing an event flow from a laptop to a managed cloud
  service and back makes "event mesh" concrete in minutes.
prerequisites: [ha-dr]
exit_proof: Two-way events across a hybrid mesh.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-30
prep_questions:
  - What's flowing in each direction across your mesh, and why?
  - When would you position Solace Cloud vs. self-managed vs. hybrid?
  - What does the customer manage in Solace Cloud, and what does Solace manage?
---

Solace Cloud runs event broker services for the customer. This module takes you
from creating a service to linking it with the broker on your laptop.

<Step id="create-service" title="Create an event broker service" minutes="45">

In the Solace Cloud Console, create a service in a region near you. Explore the
connection details, client profiles and Message VPN settings.

<Verify>

You can connect Try Me! to the cloud service and round-trip a message.

</Verify>

</Step>

<Step id="manage-service" title="Manage the service" minutes="60">

Create a client username, a queue and an ACL profile from the console. Note what
the console makes easy compared with your local setup.

</Step>

<Step id="hybrid-mesh" title="Mesh the cloud service to your local broker" minutes="120">

Link your laptop broker and the cloud service so subscriptions propagate between them.
Subscribe on one side and publish on the other.

<Verify>

A subscriber on your laptop receives events published to the cloud service, and vice versa.

</Verify>

</Step>

<Step id="hybrid-story" title="Write the hybrid story" minutes="30">

In your notes, write the three-sentence version of why a customer would run hybrid.
You'll use it in the Pitch Bootcamp too.

</Step>
