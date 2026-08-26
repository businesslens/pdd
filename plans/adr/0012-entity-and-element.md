# 0012 — The kind is an Entity; a kind is an Element

Status: **Accepted** — 2026-08-26

## Context

[ADR-0010](./0010-a-thing-the-product-keeps.md) gave a home to what the Product
keeps and called it `Object`. The word carries object-oriented baggage — class,
fields, methods — which pulls toward exactly the schema reading the kind must not
become.

In domain modelling **Entity** means precisely what this is: a thing with
identity, distinguishable from another of its type. The word was unavailable
because the format already called its own kinds entities — *"every entity
declares…"* meaning any of Actor, Interface, Capability. That use was the loose
one. Those things are **kinds of file in a Product Model**, and "entity" was
convenient rather than considered.

Cost of taking it: about 490 sites, overwhelmingly code identifiers
(`ReportEntityKind`, `AnyEntityView`, `entityKey`), plus 40 in `spec/format.md`
and 53 across `docs/`.

## Decision

**The kind that names a thing the Product keeps is an `Entity`.**

**A kind of file in a Product Model is an `Element`.** `ReportElementKind`,
`AnyElementView`, `elementKey`, *"every model element"*.

Two consequences follow, and were decided with it:

- **The test for an Entity is identity, not persistence.** "Keeps" leaned
  storage-ward; a thing the Product only reasons about still has identity.
- **An Actor is never an Entity.** An Actor is *who acts*, an Entity is *what is
  acted upon*. Direction decides, the same rule that already separates an
  inbound Interface from an outbound dependency. An Actor carries its own
  `## Information kept` so a Reader's reading position has a home without
  modelling the Reader twice.

## Consequences

- The rename landed as one mechanical commit ahead of the semantic work, so the
  semantic diff stays readable. Shipping `Entity` without it would have released
  a schema in which one word meant two things.
- `identity` had to be protected throughout: a naive substitution turns it into
  `idelement`, and `ReportIdentity` is a real type. `typeof x === 'object'` and
  `Object.keys` needed the same care in the second pass.
- No glossary kind is added. Vocabulary a model uses and never defines is
  modelling debt — `cart` appeared 15 times in the fixture and was nothing, so it
  became an Entity. A glossary would compete with the kind that should own the
  term.
