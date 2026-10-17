---
id: authentication-authorization
title: Authentication and authorization
track: platform-90-day
block: 2
order: 6
weeks: [7]
estimated_hours: 10
icon: key
summary: >
  Secure the broker end to end: TLS on the wire, client authentication with
  passwords, tokens or certificates, and authorization with client and ACL profiles.
why_it_matters: >
  Security teams sign off on every deal. Showing how clients prove who they are, and
  how the broker limits what each one can publish and subscribe to, removes one of
  the most common late-stage blockers.
prerequisites: [queue-types]
exit_proof: >
  A client authenticated with OAuth or a client certificate over TLS, and an ACL
  profile that visibly blocks a publish and a subscribe outside its allowed topics.
evidence_types: [notes, screenshot, config, recording_link]
checkpoint: day-60
prep_questions:
  - Walk me through how a client is authenticated and then authorized.
  - What's the difference between a client profile and an ACL profile?
  - How would you connect the broker to the customer's identity provider?
  - How would you stop one application publishing on another application's topics?
---

Authentication answers "who is this client?" and authorization answers "what is it
allowed to do?". You'll set up both on your broker, starting with the transport and
ending with the customer's identity provider.

<Step id="tls" title="Turn on TLS" minutes="60">

Load a server certificate on your broker and connect a client over the broker's TLS
port instead of the plain-text one. Keep the certificate and key out of any repo.

<Verify>

The client connects over TLS, and a client that doesn't trust the certificate is
refused.

</Verify>

</Step>

<Step id="basic-auth" title="Authenticate with client usernames" minutes="45">

Switch the Message VPN to basic authentication against the broker's internal
database. Create a client username and password for each of two apps, for example
`orders-service` and `analytics`.

<Verify>

Each app connects with its own credentials, and a wrong password is rejected.

</Verify>

</Step>

<Step id="acl" title="Limit topics with ACL profiles" minutes="90">

Create an ACL profile for each app and assign it to its client username:

- `orders-service` may publish to `acme/orders/>` and nothing else.
- `analytics` may subscribe to `acme/orders/*/emea/>` but not publish.

Then try to break the rules from each client. Look at the client profile too, which
controls what a client can do, such as creating queues, separately from which
topics it can use.

<Verify>

A publish outside the allowed topics is denied, and a subscription outside them is
rejected, with the reason visible on the client and in the broker's logs.

</Verify>

<Callout title="Customer angle" tone="tip">

Use the `$client-username` substitution variable in an ACL topic to give every
client its own branch of the hierarchy with a single profile.

</Callout>

</Step>

<Step id="oauth-certs" title="Use the customer's identity provider" minutes="120">

Configure OAuth (OpenID Connect) authentication with an identity provider you can
run in a sandbox, and connect a client with a token. If OAuth isn't an option,
use client certificate authentication (mutual TLS) instead.

<Verify>

A client connects with a valid token or certificate, and is refused when the token
has expired or the certificate isn't trusted.

</Verify>

</Step>

<Step id="security-story" title="Write the security story" minutes="30">

In your notes, write a one-page summary you could share with a customer's security
team. Cover transport encryption, how clients authenticate, how ACLs keep apps in
their own topics, and what changes in Solace Cloud. You'll walk through it at the
Day 60 checkpoint.

</Step>
