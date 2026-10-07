---
title: Variations
description: Feature flags, settings, plan tiers, A/B tests and API versions, when your product works in more than one supported way and something decides which way applies.
section: open-source
group: Product Model
order: 14
terms:
  - term: Variation
    definition: "A product that works in more than one supported way, with what decides which way applies: a feature flag, a setting, a plan, an A/B test or a version."
  - term: Alternative
    anchor: the-file
    definition: "One of the supported ways in a Variation, still a complete resource of its own type, with the condition that selects it."
  - term: Experiment
    anchor: subtypes
    definition: "A Variation whose alternatives are offered to compare outcomes, such as an A/B test, with who is assigned and how."
  - term: Configuration
    anchor: subtypes
    definition: "A Variation chosen by a setting, feature flag, plan or deployment."
  - term: Version
    anchor: subtypes
    definition: "A Variation whose alternatives are contracts or forms that stay supported together, such as API v1 and v2, each with a label."
---

# Variations

**A Variation is when your product works in more than one supported way, and
something decides which way applies.** Feature flags, per-customer settings,
plan tiers, A/B tests, regional rules and API versions all end up here.

Each supported way is an **alternative**: an ordinary, complete resource (a
Scenario, a Screen, a Business Rule, an Interface). The Variation names the
choice, says why the ways coexist, and says once what picks one.

## In practice

| In your product | The Variation | Kind |
| --- | --- | --- |
| A store setting picks Standard or Strict refund review | Two Business Rules | Configuration |
| Half the shoppers skip the address review at checkout | Two Scenarios of Checkout | Experiment |
| Partners call webhook v1 or v2, both still supported | Two Interfaces | Version |
| EU stores issue a VAT invoice, US stores a sales tax receipt | Two Entities | Configuration |
| A plan tier shows a product page with or without remaining stock | Two Screens | Configuration |

Nothing about an alternative moves: its folder, owner and Scenarios stay where
they are. Interfaces, Experiences, Screens, Entities, Capabilities, Journeys,
Scenarios and Business Rules can vary.

## When you create one

Create one when **two or more ways are supported right now, and a setting, flag,
plan, assignment or version decides which applies**. Without it, a reviewer would
see two Rules that both seem to govern every refund, or two near-identical
checkouts, and not know why.

### Vary the smallest resource that contains the difference

| What differs | What varies |
| --- | --- |
| What a person does, such as a checkout with or without address review | Two Scenarios of one Capability |
| What a place shows or offers | Screens or Experiences |
| What the Product keeps, such as a VAT invoice or a sales tax receipt | Entities |
| A whole policy, such as Standard or Strict refund review | Business Rules |

A single Step never varies on its own; the Scenario holding it does.

### What selects decides it

Something chosen *before* the behavior starts (a setting, a flag, a plan, an
assignment, a version) makes a Variation when it switches between complete
supported forms: what a person does, what a place shows or offers, what the
Product keeps, or a whole policy. Anything the behavior meets *along the way*
stays inside one Scenario:

- **The state of the thing** (an item out of stock, a document in a draft
  format) is a condition in the Scenario.
- **A choice that only changes the Product's own Steps, or only the outcome,** is
  a decision point (a branch inside one Scenario) or a separate Scenario, not a
  Variation.
- **Several independent settings on one flow** (a captcha and a password policy
  on one sign-up) are decision points, so no flow needs a Variation per
  combination.

### Variation or not?

A flag or setting (an admin's configuration counts too) makes a Variation only
when it switches between two complete forms. Turning one thing on or off is not
two forms.

| What you see | Model it as |
| --- | --- |
| A flag or setting that switches between two complete forms of a place or flow, such as a product page with or without stock | A Variation |
| A flag, plan or setting that only turns a feature on or off | An ordinary resource whose description (the paragraph under its title) says it exists only while the switch is on; every permission grant only that feature passes, such as refunding on paid plans, also gets the switch as a condition on its [Business Rule](./business-rules.md#grant-keys) |
| A flag that only decides *who may* do something, such as self-service cancellation | A permission condition on a [Business Rule](./business-rules.md#grant-keys) |
| A threshold or other value one policy reads | Content of that one resource |
| A difference only in looks, or a setting that only changes looks, such as dark mode | Design, not modeled; attach a Reference if useful |
| The same flow in several languages | `languages`, not alternatives |
| A retired version nobody uses any more | Nothing: the model holds only what is supported |

## The file

`variations/<id>.md`. The H1 names the choice; the lead says why the ways
coexist.

```md [variations/refund-review.md]
---
kind: configuration          # experiment | configuration | version
of: business-rule            # the one type every alternative has
settings:
  - { entity: store-settings, fact: Refund review mode }
takesEffect: When a refund is requested. A settings change applies to subsequent requests.
stability: A refund already under review keeps the policy captured when it was requested.
alternatives:
  - id: refund-review-standard
    selectedWhen: Refund review mode is Standard. Missing mode uses Standard.
  - id: refund-review-strict
    selectedWhen: Refund review mode is Strict.
---

# Refund review

Stores choose how strictly refunds are reviewed; both policies are supported.
```

| Field | Says |
| --- | --- |
| `of` | The one type every alternative has: `interface`, `experience`, `screen`, `entity`, `capability`, `capability-scenario`, `journey`, `journey-scenario` or `business-rule` |
| `alternatives` | The resources, by their own ids, each with `selectedWhen`: when this one applies, including the default |
| `takesEffect` | When the choice is made or re-evaluated |
| `stability` | How long the choice holds, and what happens to existing records or sessions when it changes |

Membership lives only here: no alternative's own file mentions the Variation.

## Subtypes

| `kind` | Use it for | Extra fields |
| --- | --- | --- |
| `configuration` | Settings, feature flags, plans, regions, deployments | Optional `settings`: the facts that choose |
| `experiment` | A/B tests and other trials | Required `assignmentUnit` and `assignmentMethod`; optional `assignmentFact`, `allocation` |
| `version` | Contracts or forms live together, such as API v1 and v2 | Optional `discriminator`; each alternative needs a `label` |

Don't invent what you don't know: leave out an optional field, say "unknown" in
a required one, and in a model mapped from code, list that code under
[Coverage](./product-model.md#coverage) `limitations`.

## What lint checks

All of these are errors:

- `kind`, `of`, `takesEffect`, `stability` and at least two `alternatives` are
  required, each alternative with `id` and `selectedWhen`.
- Every alternative exists, is of the type `of` names, and appears once; a
  resource belongs to at most one Variation.
- The alternatives of a Scenario Variation share their Capability or Journey.
- An Experiment has `assignmentUnit` (who is assigned, such as
  `{ entity: shopper }`) and `assignmentMethod`, how, in words.
- A field outside the subtype (`settings` on an Experiment, a `label` outside a
  Version) and a Version without unique labels.
- Every Entity and fact reference resolves.
