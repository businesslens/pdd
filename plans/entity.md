# The Entity: design and outcome

Status: **schema 7 design, superseded.** The design below is what shipped in
folder schema 7, settled across nine grilling rounds and recorded as
[ADR-0009](./adr/0009-what-the-product-keeps-is-in-scope.md) through
[ADR-0012](./adr/0012-entity-and-element.md). It was superseded by
[ADR-0013](./adr/0013-relationships-are-product-meaning.md) through
[ADR-0018](./adr/0018-steps-are-the-single-source-of-truth.md): structured
`relations` exist, `## Transitions` and Capability `entities:` are gone, the
lifecycle is composed from Scenario Steps, and an Actor is an Entity that
`acts`. The body is kept as written; read `spec/format.md` for what is current.

## What was wrong

Schema 7 shipped a kind called `Object` that nothing in the model referenced. No
Capability declared one, no Screen showed one, no Rule targeted one; its only
edge was an optional `domain:`. Its own documentation claimed an existence rule
— *"two or more named states referenced by two or more Capabilities… `lint`
applies it"* — that `lint` could not apply, because no Capability-to-thing edge
existed. The threshold had been invented so the rule would be *computable*,
which was optimising determinism over truth.

It also held half a concept. A thing's **states** were on it; a thing's
**attributes** were scattered across the Screens that displayed them —
*"The time each item was saved"* on two Screens, *"Product name and
description"* on two more, duplicated per platform.

## What an Entity is

A thing the Product keeps or reasons about, which an Actor can point at and the
Product can tell apart. **Identity, not storage**: a draft recommendation the
Product never persists still qualifies; a row no Actor can name does not.

**The unit is the naming test** — a thing an Actor would call *"this one"*. A
shopper says *"this order"*, never *"this order line"*. Containers ("library")
and parts ("order line") are not Entities.

It carries `## Information kept` and/or `## States` with `## Transitions`; at
least one, never neither. What the Product keeps, never how it is stored: no
types, no cardinality, no keys, **no structured relations between Entities**.

## The three edges

| Edge | Owner |
| --- | --- |
| Capability → Entity | Capability `entities:` — covers information-only changes |
| transition → Capability | the transition's `by`, cross-checked against that declaration |
| Screen → Entity | Screen `entities:` |

**No orphans**: an Entity nothing references is an error — the honest,
enforceable replacement for the invented threshold.

## What moved

`## Product states` on a Screen became **`## View states`**, holding only the
view's own. `## Information presented` narrowed to what *this view* shows.
An **Actor** gained `## Information kept`, so a Reader's reading position has a
home without modelling the Reader twice.

## Naming

The kind is **Entity**; a kind of file in a Product Model is an **Element**. The
meta-use was the loose one, and gave the word up. See
[ADR-0012](./adr/0012-entity-and-element.md).

## Models

The Blueprint gained `item` — its most-mentioned noun, previously absent. The
fixture gained `catalog-product` and `cart`; `cart` appeared 15 times in prose
and nowhere in the model.

## Deferred: the undefined-vocabulary check

The design called for a `lint` warning on words a model's prose keeps using that
match no Entity id, **with an explicit abort condition: ship nothing if it reads
noisy.** It does, and nothing shipped.

Narrowed as agreed to where things get named — Screen `## Information presented`
bullets and Scenario step text, excluding section vocabulary and known ids — the
top hits are still verbs and generics:

```
BLUEPRINT: confirms(10) publication(9) name(8) ownership(8) opens(7) reads(6)
FIXTURE:   submits(3) gateway(3)
```

Only `gateway` is arguably a real finding, and it is buried. A warning authors
learn to ignore is worse than no warning, and this release argued that rules
should be real. The gap stays open and honest rather than papered over with a
check that cries wolf.
