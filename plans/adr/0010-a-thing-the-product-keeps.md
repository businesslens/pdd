# 0010 — A thing the Product keeps is its own entity

Status: **Accepted** — 2026-08-26. Amended the same day: the kind is named
**Entity**, and the test is **identity rather than persistence**. See
[ADR-0012](./0012-entity-and-element.md).

## Context

[ADR-0009](./0009-what-the-product-keeps-is-in-scope.md) puts what the Product
keeps in scope. Something has to own it.

A first attempt shipped in schema 7 as `Object`, carrying states and transitions
only. It was an orphan: **nothing in the model referenced it**. No Capability
declared one, no Screen showed one, no Rule targeted one, and its only edge was
an optional `domain:`. Its documentation claimed an existence rule — *"two or
more named states referenced by two or more Capabilities… `lint` applies it"* —
that `lint` could not apply, because no Capability-to-thing edge existed. The
threshold had been invented so the rule would be *computable*, which was
optimising determinism over truth.

## Decision

**A thing the Product keeps or reasons about is an Entity in its own right.**
Capabilities are the Product's verbs; Entities are its nouns. The test is
**identity, not persistence**: a draft recommendation the Product never stores is
still an Entity when an Actor points at it and the Product tells it apart.

**The unit is the naming test**: a thing an Actor would point at and call *"this
one"*. A shopper says *"this order"*, never *"this order line"*. A reader says
*"this item"* and *"this collection"*, but "library" is simply all of them.
Containers and parts are not separate things.

**It carries** an optional `## Information kept`, and an optional `## States`
with the transitions between them. **At least one** must be present.
Transitions are required exactly when states are. A thing may have information
and no lifecycle; requiring both is what produced the earlier arbitrary
threshold.

**Three edges, each with one owner:**

- a **Capability** declares the things it acts on — this covers changes to
  information, which a transition can never express;
- a **transition** names the Capability that causes it, and `lint` cross-checks
  that the Capability declares that thing, exactly as it already cross-checks a
  Screen's Capabilities against a Capability's availability;
- a **Screen** declares the things it presents.

**No orphans.** A thing must be referenced by a Capability that changes it or a
Screen that shows it. This is the honest replacement for the invented threshold,
and unlike it, it is enforceable.

## Consequences

- Business Rules stay behavioral and gain no target for these. A constraint on a
  thing is a constraint on what may be done to it, which is a Capability.
- Domain stays a separate axis: a region can hold Capabilities and no things.
- An asset's `state:` resolves against the states of the entity it hangs on —
  one namespace per entity, replacing the former Screens-only special case.
- The collection stays optional. A Product that keeps nothing worth naming — a
  pure calculator — needs none, and forcing one would be ceremony.
