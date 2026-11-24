# HCP public comment: two issues (draft)

Post each as a separate issue with the "Specification feedback" template:
https://github.com/loyalagents/hcp-spec/issues/new?template=spec-feedback.md

Deadline: 27 November 2026. Comments are probably public. Everything below uses invented examples, as CONTRIBUTING asks.

Optional opening line for both, if you want to say who you are:
"From an independent implementer working on an open source, end-to-end encrypted HCP Provider that runs in the person's own trust domain (4.8)."

---

## Issue 1

**Title:** Where disclosed context is processed: hosted inference under 3.12, and letting the person see and limit it

### Draft and revision

HCP 2.0 Draft 3, commit b790561 ([specification.md](https://github.com/loyalagents/hcp-spec/blob/b790561830702c067cd7810c96ee78dd3d84741c/spec/2.0-draft-3/specification.md))

### Relevant sections

3.12 (onward disclosure), 3.2.8 (Client Operator shown at grant time), 3.9 and 8.2 (`participants.model`), 6.3 (standing rules), 8.6 (disclosure summary), 4.8 (trust domain). Context Client that uses a language model.

### Scenario or question

A person uses a writing assistant, a Context Client operated by `writer.example`. They grant it read access to `health` for the purpose "draft a sick-leave email". Depending on settings, the assistant sends the disclosed context to:

- (a) a model running on the person's own laptop;
- (b) a model `writer.example` hosts itself;
- (c) a third-party inference API at `inference.example`, under a processing agreement with `writer.example`.

The person is happy with (a), unsure about (b), and does not want `health` to reach (c).

### What is unclear or missing?

1. **Is (c) an onward disclosure?** 3.12 forbids passing disclosed context to "a party operated by a different organization". A third-party inference API is such a party, yet most Context Clients will call one. Read strictly, most clients are non-conformant. Read loosely (a processor acting for the Client Operator is part of it), an organization that actually receives the person's context becomes invisible to them.
2. **The person can't see where it goes.** The grant request shows the Client Operator (3.2.8), not who runs the model. `participants.model` is present only where the client chooses to identify the model, and says nothing about who operates it or whether it runs on the person's device.
3. **The person can't limit it.** Standing rules (6.3) can deny by Client Operator, but not by where context is processed. "Health context only to models on my own device" can't be expressed.
4. **The summary can't answer it afterwards.** 8.6 can't answer "which organizations' models received my health context?"

Outcome needed: at grant time and afterwards, the person can see which organization runs the model that receives their context and whether it runs on their device, and can set a rule about it.

### Suggested change or alternatives (optional)

- Treat inference providers explicitly. They are permitted under 3.12 only when declared in client registration, with operator identifier and name (as in 3.2.8) and a deployment class: `subject-device`, `client-operator` or `third-party`.
- Show declared inference processors in the grant request, next to the Client Operator.
- Extend `participants.model` to `{ id, operator, deployment, attestation }`:
  - `attestation` is `declared` where the client states it;
  - `attestation` is `observed` where a component in the person's trust domain (4.8), such as a local proxy the person runs, saw the request leave for that endpoint.
- Let standing rules deny by inference operator or deployment class, for example `{ "effect": "deny", "processing": ["third-party"], "categories": ["health"] }`.
- Add the inference processors to the 8.6 summary per client.

Related: #44 (identifying the receiving organization by domain), #22 (trust-domain boundaries).

---

## Issue 2

**Title:** Let the person verify exactly what a client received: a disclosure digest, and an optional copy held in the person's trust domain

### Draft and revision

HCP 2.0 Draft 3, commit b790561 ([specification.md](https://github.com/loyalagents/hcp-spec/blob/b790561830702c067cd7810c96ee78dd3d84741c/spec/2.0-draft-3/specification.md))

### Relevant sections

7.4 (disclosures), 8.2 (`disclosed[]`), 8.5 (controller-side log), 8.6 (disclosure summary), 8.7 (integrity), 4.8 (`e2e` and the trust domain), 5.2.4 and 5.2.5 (revise, withdraw). Person-facing capabilities.

### Scenario or question

In March a person discloses an `employment` entry, version 2, to a job-search agent. In May they revise it (version 3) and later hard-delete the entry. In June they disagree with the agent's operator about what the agent was told.

The log records that entry X, version 2, was disclosed to that client. But:

- the content of version 2 no longer exists;
- nothing ties the log line to the exact bytes delivered, which can differ from the stored entry, for example a credential disclosed in derived form (7.4, 14.9).

### What is unclear or missing?

Is the person's log meant to let them establish what a client received, or only which entry versions were involved? As written, after revision, withdrawal or hard deletion, the person cannot reconstruct or prove what was delivered.

8.5 rightly bars content from the controller-side log. The person's own log is not barred from it, but nothing provides for it either.

Outcome needed: the person, or someone they choose to show it to, can verify exactly what a client received in a retrieval, without the provider learning anything new.

### Suggested change or alternatives (optional)

- Add `disclosed[].digest`: a hash of each disclosure as delivered (the 7.4 object in a canonical JSON form). It's computed by whichever component built the disclosure: the provider, or under `e2e` the trust-domain component.
  - It reveals nothing extra.
  - It lets a receipt be checked against the client's copy.
  - It fits with the hash-chained integrity in 8.7.
  - Prior art: the individual Internet-Draft on Memory Projection Records, https://datatracker.ietf.org/doc/html/draft-ferro-schrock-memory-projection-record-01
- Optionally, a profile in which a component in the person's trust domain keeps an encrypted copy of each delivered disclosure:
  - readable only by the person;
  - kept as long as the person chooses;
  - covered by hard deletion.

  Under `e2e` the copy never reaches the provider.
- In the person-facing view of 8.6, allow "show exactly what was shared" where such copies exist.

Related: #39 (audit after hard deletion), #42 (sharing reports after expiry or revocation), #43 (disclosure-summary aggregation).
