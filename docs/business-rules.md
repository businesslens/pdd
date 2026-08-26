---
title: Business rules
description: Durable assertions that apply to Product elements or Contexts naming Interfaces, Experiences, or Screens.
section: open-source
group: Product Model
order: 17
---

# Business rules

**A Business Rule is a durable constraint stated as an assertion:** an order is
confirmed only after payment succeeds; a subscription never grants write
access.

The Rule is the single owner of where it applies. Its `appliesTo` list targets
Capabilities, Journeys, Capability Scenarios, Journey Scenarios, or direct
Contexts. Other elements do not copy Rule IDs, so one
constraint remains reusable and reviewable instead of drifting across several
files.

## When you create one

**A Rule governs two or more behaviors, or a Context independent of any single
behavior.** Anything true of exactly one Capability is that Capability's own
business — a `condition` Step, or its Scenario's Outcome — and `lint` warns when
a Rule's targets resolve to a single behavioral element with no `contexts`
narrowing them.

Write something that must remain true, not a sequential step.

A Rule must have at least one target. Target a behavioral element when the Rule
governs that behavior. Add `contexts` to narrow an element target, or use a
direct `context` target when the constraint belongs to the interaction context
itself rather than one behavior.

## The file

Business Rules normally live at `business-rules/<rule-id>.md`. A Rule with
assets expands to `business-rules/<rule-id>/business-rule.md`.

```md [business-rules/payment-before-confirmation.md]
---
appliesTo:
  - type: capability
    id: checkout
    contexts:
      - place: customer-web::shopping
      - place: customer-mobile::shopping
  - type: journey
    id: browse-and-buy
---

# Payment before confirmation

An order is confirmed only after its payment succeeds.

## Intent

Never create a fulfilled customer promise without a successful charge.

## Rationale

Confirmation is the durable customer-facing boundary of checkout.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `appliesTo` | yes | Give at least one unique element or direct context target. Element types are `capability`, `capability-scenario`, `journey`, and `journey-scenario`; the direct type is `context`. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Rule and state its durable assertion. |
| `## Intent` | no | Explain the outcome the Rule protects. |
| `## Rationale` | no | Explain why the constraint exists. |

An element target without `contexts` applies everywhere that element is
supported. When present, `contexts` is a non-empty list of strict Context
objects. A Rule Context may name any Interface, Experience, or Screen place.
An ancestor place includes supported descendants: an Interface Context can
deliberately select occurrences in its Experiences and Screens. Every selected
Context must overlap the target's supported places. Duplicate selectors and
ancestor/descendant selectors in the same list are rejected because one makes
the other redundant.

A direct Context target has no `id` and nests the same Context shape under
`context`:

```yaml
appliesTo:
  - type: context
    context:
      place: operator-cli
```

Targets are additive. Do not target a Capability and one of its Capability
Scenarios in the same Rule, or a Journey and one of its Journey Scenarios; the
child target is redundant. Domains are not authored Rule targets. Consumers
derive Domain backlinks through targeted behavior.
