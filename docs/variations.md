---
title: Variations
description: A named set of supported alternatives of one resource type — an experiment, a configuration, or live versions — with how one is chosen written once on the set.
section: open-source
group: Product Model
order: 15
terms:
  - term: Variation
    definition: "A named set of two or more currently supported alternatives of one resource type, with how one of them is chosen written once on the set."
  - term: Alternative
    anchor: the-file
    definition: "One resource in a Variation, still a complete resource of its own type, with the condition that selects it."
  - term: Experiment
    anchor: subtypes
    definition: "A Variation subtype for alternatives offered to evaluate different outcomes, with who is assigned and how."
  - term: Configuration
    anchor: subtypes
    definition: "A Variation subtype for alternatives selected through a Product setting or operating context."
  - term: Version
    anchor: subtypes
    definition: "A Variation subtype for distinct contracts or forms that remain supported at the same time, each with a label."
---

# Variations

**A Variation is one product choice with several supported answers.** Stores
choose Standard or Strict refund review; signed-in shoppers either see how many
units of a product remain or do not; a payment gateway posts either the v1 or the v2 settlement
contract. Each answer is an **alternative**: an ordinary, complete resource of
one type — a Business Rule, a Screen, an Interface. The Variation names the
choice, says why the alternatives coexist, and says once how one of them is
chosen.

A Variation is read as the type it varies. Refund review is a set of Business
Rules; Stock disclosure is a set of Screens. Nothing about an alternative
moves: its folder, its Domain, its owner and its Scenarios stay where they are.
Membership is a relation, never containment.

Interfaces, Experiences, Screens and Business Rules can vary. No other type
does.

## When you create one

**Two or more resources of one type are all supported now, and something
decides which one applies.** Create a Variation when a reader could otherwise
see the alternatives as unrelated duplicates, or as contradictions — two Rules
that both seem to govern every refund.

Do not create one for:

| What you see | Model it as |
| --- | --- |
| One behavior branching on a condition | A decision point in one Scenario |
| A value that changes a number, not the resource | Content of the one resource — Strict and Standard refund review are two Rules; a different threshold is not |
| A thing moving through phases | Entity States |
| The same Experience on another Interface | A counterpart: same id under each Interface |
| A visual treatment with the same facts and abilities | References on the one Screen |
| A flag deciding whether someone may perform an operation | A settings fact read by a permission grant's `when` — see [Business Rules](./business-rules.md) |
| The same resource offered in several languages | `languages` on the Product and Interface — each language is not an alternative |
| A retired version no client uses | Nothing — the model holds only what is supported |

All alternatives are currently supported. None is a default, a parent or a
historical version. When only one alternative is left, remove the Variation and
keep any still-relevant meaning in ordinary content.

## The file

A Variation lives at `variations/<id>.md`; one with assets expands to
`variations/<id>/variation.md`. The H1 names the choice and the lead says why
the alternatives coexist. `## Intent` is optional.

```yaml
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

**Membership lives only on the set.** `alternatives` lists the resources by the
ids their own type uses — a Rule's id, a Screen's full
`interface::experience::screen`. No alternative's file names its Variation, and
no alternative repeats how it is chosen. The list is a set: its order means
nothing.

**Each selection field is written at exactly one level.** The set carries what
chooses, `takesEffect` and `stability`; each alternative carries its own
`selectedWhen` and, on a Version, its `label`. Nothing is inherited or
overridden.

| Field | Level | What it says |
| --- | --- | --- |
| `selectedWhen` | alternative | Eligibility and the choice selecting this one, including missing or unsupported choices and defaults |
| `takesEffect` | set | When the choice is made or re-evaluated, including changes during use |
| `stability` | set | How long the choice holds, and what happens to existing sessions, clients or records when it changes |

## Subtypes

The subtype says why the alternatives coexist, and decides which other fields
the set carries. A fact reference is `{ entity: <id>, fact: <name> }` and names
one of that [Entity](./entities.md)'s Information kept.

| `kind` | Why they coexist | Set fields | Alternative fields |
| --- | --- | --- | --- |
| `experiment` | To compare outcomes | Required `assignmentUnit` — `{ entity: <id> }`, or `{ description: <text> }` for a unit the model does not keep, such as a browser session — and `assignmentMethod`. Optional `assignmentFact` and `allocation`. | — |
| `configuration` | A setting or operating context selects one | Optional `settings`: the facts that choose between the alternatives. A fact that only tunes one alternative's behavior is not a setting here. | — |
| `version` | Contracts or forms stay live together | Optional `discriminator`: the fact identifying the selected version | Required `label` |

A version selected by a setting is still a Version; an experiment enabled by a
setting is still an Experiment. Where selection uses context the model does not
keep — a header, a path — say so in `selectedWhen` rather than inventing an
Entity to hold it. Never invent what the evidence does not establish: leave out
an optional field such as `allocation`, say so in a required one such as
`takesEffect`, and record the gap in [Coverage](./product-model.md#coverage).

An Entity used only to choose — an assignment unit, a setting's holder — is
used; it needs nothing else to belong in the model. A Variation grants no
permission: who may use an alternative is still a [Business
Rule](./business-rules.md). A Business Rule that is an alternative holds only
while it is selected, never unconditionally.

## What lint checks

- `kind`, `of`, `takesEffect`, `stability` and `alternatives` are required;
  `kind` is `experiment`, `configuration` or `version`; `of` is `interface`,
  `experience`, `screen` or `business-rule`.
- At least two alternatives, each listed once, each resolving to a resource of
  the type `of` names.
- A resource is an alternative in at most one Variation.
- A field outside the subtype is an error: `settings` on an Experiment, a
  `label` outside a Version, an Experiment without `assignmentUnit` or
  `assignmentMethod`.
- Version labels are present and unique within the set, ignoring case.
- Every Entity and fact reference resolves, and no fact is listed twice.
- An Interface may hold Experiences its audiences alone would not justify when
  those Experiences are alternatives in a Variation.
