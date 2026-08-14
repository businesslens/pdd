---
title: Business rules
description: Durable assertions that own their scope across Product entities or exact Interface availability.
section: open-source
group: Product Model
order: 16
---

# Business rules

**A Business Rule is a durable constraint stated as an assertion:** an order is
confirmed only after payment succeeds; a subscription never grants write
access.

The Rule is the single owner of its scope. Its `appliesTo` list targets
Capabilities, Journeys, Capability Scenarios, Journey Scenarios, or exact
Interface contexts. Other entities do not copy Rule IDs, so one
constraint remains reusable and reviewable instead of drifting across several
files.

## When you create one

Create a Rule when a constraint applies across behavior or deserves to be
stated once for review. Write something that must remain true, not a sequential
step.

A Rule must have at least one target. Target a behavioral entity when the Rule
governs that behavior. Add exact `contexts` to narrow an entity target, or use a
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
      - context: customer-web::shopping
      - context: customer-mobile::shopping
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
| `appliesTo` | yes | Give at least one unique entity or direct context target. Entity types are `capability`, `capability-scenario`, `journey`, and `journey-scenario`; the direct type is `context`. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name the Rule and state its durable assertion. |
| `## Intent` | no | Explain the outcome the Rule protects. |
| `## Rationale` | no | Explain why the constraint exists. |

An entity target without `contexts` applies to every context supported by that
entity. When present, `contexts` is a non-empty list of singular exact contexts,
each using one `context` scope id. Use the bare Interface id for an undivided
Interface or `interface-id::experience-id` for an Experience. Every narrowed
context must be inside the target's supported contexts. A direct context target
has no `id`:

```yaml
appliesTo:
  - type: context
    context: operator-cli
```

Targets are additive. Do not target a Capability and one of its Capability
Scenarios in the same Rule, or a Journey and one of its Journey Scenarios; the
child target is redundant. Domains are not authored Rule targets. Consumers
derive Domain backlinks through targeted behavior.
