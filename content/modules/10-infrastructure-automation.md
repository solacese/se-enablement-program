---
id: infrastructure-automation
title: Infrastructure automation
track: platform-90-day
block: 3
order: 10
weeks: [10]
estimated_hours: 10
icon: config
summary: >
  Automate broker configuration with the SEMPv2 REST API, then manage the same
  configuration as code with Terraform: plan, apply, change and tear down.
why_it_matters: >
  Platform teams won't adopt anything they have to click through by hand. Showing
  queues, users and ACLs created from a pipeline, reviewed like any other code,
  answers "how does this fit our DevOps process?" before it's asked.
prerequisites: [insights-distributed-tracing]
exit_proof: >
  A Message VPN's queues, client usernames and ACL profiles created and changed
  from Terraform, with the change shown in a plan before it's applied, plus the
  same objects read back through SEMPv2.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-90-capstone
prep_questions:
  - When would you use SEMPv2 directly, and when Terraform?
  - Walk me through what happens between terraform plan and terraform apply.
  - How would a customer keep broker configuration in sync across dev, test and production?
  - What happens if someone changes a queue by hand after Terraform created it?
---

Everything you've configured by hand so far can be done through an API. In this
module you'll drive the broker with SEMPv2, then move to Terraform so the
configuration lives in a repo and changes go through review.

<Step id="sempv2-explore" title="Explore the SEMPv2 API" minutes="60">

SEMPv2 is the broker's REST management API. Open the API reference for your broker
version and find the config, monitor and action sections.

Read your Message VPN and list its queues with `curl`, authenticating as your admin
user:

```bash
curl -s -u admin:admin \
  http://localhost:8080/SEMP/v2/config/msgVpns/default/queues
```

<Verify>

The response lists the queues you created in earlier modules.

</Verify>

Docs: [SEMP API reference](https://docs.solace.com/Admin/SEMP/Using-SEMP.htm)

</Step>

<Step id="sempv2-script" title="Script configuration with SEMPv2" minutes="90">

Write a small script that creates a queue, adds a topic subscription to it, and
creates a client username, using `POST` requests. Run it twice, and handle the
"already exists" error so the script can be rerun safely.

Then use a monitor endpoint to read the queue's message count while you publish to it.

<Verify>

The script creates everything on the first run, changes nothing on the second, and
the new objects appear in Broker Manager.

</Verify>

<Callout title="Customer angle" tone="tip">

Broker Manager uses SEMPv2 too. Anything a customer can do in the console, they
can automate.

</Callout>

</Step>

<Step id="terraform-setup" title="Set up the Terraform provider" minutes="60">

Install Terraform and add the Solace broker provider to a new configuration.
Point it at your broker's SEMP URL and pass the credentials in through environment
variables, never in the `.tf` files.

Docs: [Solace Terraform providers](https://registry.terraform.io/namespaces/SolaceProducts)

<Verify>

`terraform init` downloads the provider and `terraform plan` connects to the broker
without errors.

</Verify>

</Step>

<Step id="terraform-apply" title="Manage a Message VPN as code" minutes="120">

Describe a queue with subscriptions, two client usernames and an ACL profile in
Terraform, reusing the design from the Authentication and authorization module.
Run `terraform plan`, review it, then `terraform apply`.

Change one setting in the code, such as a queue's maximum spool size, and plan
again. Then change the same setting by hand in Broker Manager and see how Terraform
reports the drift.

<Verify>

The plan shows exactly the change you made, `apply` makes it, and a manual change
shows up as drift on the next plan.

</Verify>

</Step>

<Step id="pipeline-story" title="Tell the pipeline story" minutes="45">

In your notes, sketch how a customer would promote broker configuration from dev
to production: the repo, a review step, `plan` in CI, and `apply` on merge. Note
where SEMPv2 still fits, for example in monitoring scripts or one-off actions.

Tear down what you created with `terraform destroy`. You'll walk through this at the
Day 90 capstone.

</Step>
