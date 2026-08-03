---
title: Scenarios
description: Observable acceptance paths through a Journey, optionally narrowed to particular Interface–Experience pairs.
section: open-source
group: Product Model
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

| Field or section | Required | Constraint |
| --- | --- | --- |
| Filename | yes | Use a globally unique lowercase kebab-case Scenario ID. The Journey ID comes from the path. |
| `kind` | yes | Name an entry in `taxonomies.yaml`. |
| `availability` | no | Narrow, but never expand, the Journey's availability. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| `## Trigger` | yes | State the observable starting condition. |
| `## Steps` | yes | Provide a non-empty ordered list. |
| `## Decision points` | no | Give each H3 decision one Product question and at least two `condition → outcome` branches. |
| `## Edge cases` | no | Provide a bullet list when present. |
| `## Outcome` | yes | State the one observable result. |

Business Rules own their Scenario relations; Scenarios do not duplicate a
`businessRules` list.

## Decision points

Each decision has an H3 title, one non-empty Product question, and at least two
`condition → outcome` branches. Use decisions for real behavioral forks, not
ordinary sequential steps. Its branches remain inside and converge on this
Scenario's one observable Outcome. When a branch produces a materially
different Outcome, give it a separate Scenario instead.
