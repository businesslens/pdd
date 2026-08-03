---
title: Business rules
description: Durable assertions that own their scope across Domains, Capabilities, Journeys, Scenarios, or Interface–Experience pairs.
section: open-source
group: Product Model
order: 17
---

# Business rules

**A Business Rule is a durable constraint stated as an assertion:** an order is
confirmed only after payment succeeds; a subscription never grants write
access.

The Rule is the single owner of its scope. It connects to the Domains,
Capabilities, Journeys, Scenarios, or exact availability pairs it governs.
Other entities do not copy Rule IDs, so one constraint remains reusable and
reviewable instead of drifting across several files.

## When you create one

Create a Rule when a constraint applies across behavior or deserves to be
stated once for review. Write something that must remain true, not a sequential
step.

A Rule must relate to at least one Domain, Capability, Journey, Scenario, or
availability pair. Use availability only when the constraint is specific to an
Interface–Experience context.

## The file

Business Rules live at `business-rules/<rule-id>.md`.

```md [business-rules/payment-before-confirmation.md]
---
domains: [ordering]
capabilities: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
---

# Payment before confirmation

An order is confirmed only after its payment succeeds.

## Intent

Never create a fulfilled customer promise without a successful charge.

## Rationale

Confirmation is the durable customer-facing boundary of checkout.
```

`domains`, `capabilities`, `journeys`, `scenarios`, and `availability` are all
optional individually, but at least one scope relation is required. The lead is
the Rule statement. `## Rationale` explains why the constraint exists. Optional
[References](./references.md) attach intent, implementation, or context
artifacts.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `must relate to a domain, capability, journey, scenario, or availability pair` | Give the Rule Product scope. |
| `references missing …` | A Domain, Capability, Journey, Scenario, Interface, or Experience does not exist. |
| Availability relationship finding | Correct an impossible or duplicate pair. |
| `missing H1 title` / `missing lead paragraph (description)` | Every Rule needs a title and assertion. |
