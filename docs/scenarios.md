---
title: Scenarios
description: Observable paths through a journey — Trigger, Steps, Outcome, and decision points. The smallest unit that can be verified.
section: open-source
group: Product model
order: 14
---

# Scenarios

**A scenario is one concrete, observable path through a journey.**

Scenarios are deliberately the smallest unit that can be verified. Their
Trigger, Steps, and Outcome are the acceptance contract that
[`businesslens-verify`](./skill-businesslens-verify.md) compares with the
implementation—and the criteria handed to the injected builder.

## When you create one

Split a new scenario off when a condition produces a **materially different
observable outcome**. Checkout succeeding and payment being declined are two
scenarios. Checkout succeeding on Tuesday is not.

> **Scenario vs step.** A scenario is a complete acceptance unit. A step is one
> ordered event inside it and is not independently addressable.
>
> **Edge case vs scenario.** `## Edge cases` is for supporting exceptions worth
> noting. A materially distinct path should be its own scenario.

Scenario IDs are **globally unique across the model**, not just within their
journey, so any scenario can be referenced unambiguously from anywhere.

## The file

Scenarios live at `journeys/<journey-id>/scenarios/<scenario-id>.md`.

```md [journeys/browse-and-buy/scenarios/complete-checkout.md]
---
kind: primary
businessRules: [payment-before-confirmation]
codeRefs:
  - src/services/orders.ts#OrderService.submit
  - src/services/payments.ts#PaymentGateway.charge
---

# Complete checkout

## Trigger

The shopper presses "Place order" with a non-empty cart.

## Steps

1. The cart is validated against the catalog
2. The payment gateway charges the total
3. The order is persisted

## Decision points

### Payment result

Did the payment gateway accept the charge?

- accepted → persist and confirm the order
- declined → preserve the cart and show the failure

## Outcome

The order is stored and a confirmation is shown.

## Edge cases

- Payment declined → the cart is preserved and an error is shown
```

`journeyId` is derived from the path — you never write it.

## Required sections

| Section | Shape | Holds |
| --- | --- | --- |
| `## Trigger` | paragraph | What starts the path |
| `## Steps` | ordered list, ≥1 item | The observable progression, at product level |
| `## Outcome` | paragraph | What the actor or operator ends up with |

`## Edge cases` is an optional bullet list.

## Scenario kind

`kind` classifies the whole scenario and must exist in `taxonomies.yaml`:

```yaml
scenarioKinds:
  - id: primary
    name: Primary
    description: Expected path through a user goal.
    colorSlot: 1
  - id: edge
    name: Edge case
    description: Alternative or failure path.
    colorSlot: 6
```

A kind is a label for navigation and analysis. It does not change scenario
structure, and the vocabulary is yours — add whatever kinds fit your product.

## Decision points

`## Decision points` is optional. Each decision asks **one product question**
and gives at least two condition-to-outcome branches:

```md
### Payment result

Did the payment gateway accept the charge?

- accepted → persist and confirm the order
- declined → preserve the cart and show the failure
```

An H3 title, a non-empty question paragraph, then the branches. Each branch is
`condition → outcome` with the Unicode arrow, or `condition -> outcome` with
ASCII.

Use a decision point when behavior **actually forks**. Do not turn ordinary
sequential steps into fake choices.

> **Business rule vs decision point.** A [business rule](./business-rules.md)
> states what must remain true and can govern many entities. A decision point
> records one question and its branches inside a single scenario.

Decision points are embedded in the scenario, not promoted to standalone files.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `missing "## Trigger" section` / `missing "## Outcome" section` | Both are required paragraphs. |
| `"## Steps" needs at least one ordered item` | Steps must be an ordered list with content. |
| `kind "…" is not defined in taxonomies.yaml` | Add the kind, or use an existing one. |
| `scenario id "…" already used in <journey> (ids are global)` | Rename one of them. |
| `references missing business rule "…"` | A `businessRules:` entry names no existing rule file. |
