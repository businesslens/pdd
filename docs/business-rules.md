---
title: Business rules
description: Durable constraints stated as assertions, reusable across the domains, features, journeys, and scenarios they govern.
section: open-source
group: Product model
order: 15
---

# Business rules

**A business rule is a durable constraint, stated as an assertion:** *an order
can be refunded only while unsettled*, or *a private blueprint is never returned
by an anonymous endpoint*.

Rules connect to the domains, features, journeys, and scenarios they govern.
That is what makes the same constraint **reusable and reviewable** instead of
being copied into several scenario descriptions and drifting apart.

## When you create one

Create a rule when a constraint must hold across more than one behavior, or when
it is the kind of thing a reviewer would want stated once and pointed at.

Write it as something that is **true**, not as something that happens. "An order
is confirmed only after payment succeeds" is a rule. "Charge the card, then
confirm" is a step.

> **Business rule vs decision point.** A rule states what must remain true and
> can govern many entities. A [decision point](./scenarios.md#decision-points)
> records one question and its branches inside a single scenario.

A rule must relate to at least one domain, feature, journey, or scenario. A
constraint governing nothing is not a constraint.

## The file

Business rules live at `business-rules/<rule-id>.md`.

```md [business-rules/payment-before-confirmation.md]
---
domains: [ordering]
features: [checkout]
journeys: [browse-and-buy]
scenarios: [complete-checkout]
codeRefs:
  - src/services/payments.ts#PaymentGateway.charge
---

# Payment before confirmation

An order is confirmed only after its payment succeeds.

## Intent

Never create a fulfilled customer promise without a successful charge.

## Rationale

Confirmation is the durable customer-facing boundary of checkout.
```

The **lead paragraph is the rule statement** — the assertion itself. All four
relation lists are optional individually, but at least one must be present.

`## Rationale` is a supporting section: why the constraint exists, as opposed to
`## Intent`, which is the outcome it protects.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `references missing domain "…"` / `missing feature "…"` / `missing journey "…"` / `missing scenario "…"` | A relation names an entity that does not exist. |
| `missing H1 title` | Every rule needs a `# Heading`. |
| `missing lead paragraph (description)` | The rule statement is missing. |

Business rules may carry optional `codeRefs` when one location is a useful
starting point for reading the constraint. The bookmark does not prove it.
