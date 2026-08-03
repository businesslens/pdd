---
title: Scenarios
description: Observable acceptance paths through a Journey, optionally narrowed to particular Interface–Experience pairs.
section: open-source
group: Product model
order: 16
---

# Scenarios

**A Scenario is one concrete, observable path through a Journey.** Its Trigger,
Steps, decisions, and Outcome form the smallest acceptance contract that
`businesslens-verify` compares with implementation.

## When you create one

Split a Scenario when a condition produces a materially different observable
outcome. Checkout succeeding and payment being declined are separate Scenarios;
checkout succeeding on Tuesday is not.

By default a Scenario inherits every availability pair from its Journey. Add
optional `availability` only when its behavior or outcome applies to a narrower
Interface–Experience subset. Do not copy the Journey matrix mechanically.

Scenario IDs are globally unique across the model.

## The file

Scenarios live at `journeys/<journey-id>/scenarios/<scenario-id>.md`.

```md [journeys/browse-and-buy/scenarios/complete-checkout.md]
---
kind: primary
availability:
  - interface: customer-web
    experiences: [shopping]
---

# Complete checkout

## Trigger

The shopper presses "Place order" with a non-empty cart.

## Steps

1. The cart is validated
2. Payment is charged
3. The order is confirmed

## Decision points

### Fulfillment path

Does the cart contain physical items?

- physical items → collect a delivery address before payment
- digital only → continue to payment without delivery details

## Outcome

The order is stored and a confirmation is shown.
```

`journeyId` is derived from the path. `kind` must name an entry in
`taxonomies.yaml`. Required body sections are `## Trigger`, an ordered
`## Steps` list, and `## Outcome`. `## Edge cases` is an optional bullet list.
Optional [References](./references.md) attach intent, implementation, or
context artifacts without changing the acceptance contract.

Business Rules own their Scenario relations; Scenarios do not duplicate a
`businessRules` list.

## Decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Use decisions for real behavioral forks, not
ordinary sequential steps. Its branches remain inside and converge on this
Scenario's one observable Outcome. When a branch produces a materially
different Outcome, give it a separate Scenario instead.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| Missing Trigger/Steps/Outcome finding | Supply all required acceptance sections. |
| `kind "…" is not defined in taxonomies.yaml` | Add or correct the Scenario kind. |
| `scenario id "…" already used in …` | Rename one Scenario; IDs are global. |
| `availability "interface/experience" is outside journey "…"` | Scenario availability may only narrow its Journey. |
| Availability relationship finding | Correct malformed, duplicate, or missing Interface/Experience references. |
