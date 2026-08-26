---
title: Actors
description: Product-significant people and systems, classified by kind and by their relationship to the Product boundary.
section: open-source
group: Product Model
order: 9
---

# Actors

**An Actor is a person or system whose goal, privilege, trigger, or outcome
changes Product behavior.** A shopper, store administrator, partner system, and
content source can all be Actors.

Every Actor declares two independent classifications:

- `kind: person|system` says whether the Actor is human;
- `relationship: external|internal` says whether it acts independently outside
  the Product owner's boundary or on the Product owner's behalf.

The relationship is about the Product, not network location. A staff operator
is usually internal even when working remotely. A partner system is usually
external even when connected over a private network.

## When you create one

Create an Actor only when its responsibility or privilege is
product-significant. If two roles have the same goals and permissions, they are
one Actor. An internal service is not an Actor merely because it calls another
service; a system becomes an Actor when its autonomous trigger, permissions, or
outcome belongs in the Product contract.

> **Actor vs persona.** A persona describes who someone is. An Actor exists
> because the Product must behave differently for them.

## An AI agent is an Actor

An AI agent harness that loads a skill and acts inside the repository is an
Actor. Give it the id `ai-agent`, `kind: system`, `relationship: external`.

It qualifies because its responsibility is product-significant in its own right.
It initiates, it is the only participant that reads and writes on the person's
behalf, and what it does is not fully determined by whoever invoked it — it
chooses what to inspect, what to propose, and when to stop. That latitude is the
test. A browser delivering a `web` Interface makes no such choices and is not an
Actor; an agent does, and is.

Name it `ai-agent`, not `coding-agent`. The same participant appears in a
support product or a research product, and the narrower name would be wrong in
both.

A Scenario Step may name it wherever the agent rather than the person performs
the step — inspecting, proposing, resolving.

## External systems: direction decides

An external system is an Actor only when it **initiates**. Ask three questions:

1. Does it start the interaction with your Product?
2. Does it have a goal or privilege of its own inside your Product?
3. Must you keep an inbound interaction contract stable and verifiable for it?

All three yes — a partner system calling your API, a processor posting a
webhook — and it is an Actor with an [Interface](./interfaces.md). Any no and it
is not an Actor at all: a system your Product calls out to is a dependency of
the [Capability](./capabilities.md) that calls it.

A syndicated feed your Product polls scores no on all three. The same provider
pushing updates to your Product scores yes on all three. Same company, opposite
answer, because direction changed.

## The file

An Actor normally lives at `actors/<actor-id>.md`. If it gains an asset, expand
it to `actors/<actor-id>/actor.md` and place the asset beside that file.

```md [actors/store-admin.md]
---
kind: person
relationship: internal
references:
  - kind: code
    role: implementation
    target: src/routes/admin.ts
---

# Store administrator

An employee who manages orders on behalf of the store.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a lowercase kebab-case stem as the Actor ID. |
| `kind` | yes | Use `person` or `system`. |
| `relationship` | yes | Use `external` or `internal` relative to the Product boundary. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name and describe the Actor. |

Every Actor ID named by another entity must have a corresponding file.

## Referenced by

| From | Key | Meaning |
| --- | --- | --- |
| [Interfaces](./interfaces.md) | `actors:` | Who may use any part of the Interface |
| [Experiences](./experiences.md) | `actors:` | Who participates in that coherent context |
| [Capability Scenario Steps](./capabilities.md#capability-scenarios) | `actor:` on an Actor Step | Who performs that local observable action |
| [Journeys](./journeys.md) | `actors:` | Who shares the stable intent and success criterion |
| [Journey Scenario Steps](./journeys.md#journey-scenarios) | `actor:` on an Actor Step | Who performs that action in the end-to-end variation |
