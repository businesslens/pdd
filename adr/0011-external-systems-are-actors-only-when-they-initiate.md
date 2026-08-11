---
status: accepted
---

# External systems are Actors only when they initiate

## Context

ADR-era planning in `plans/interfaces-experiences-and-capabilities.md` defined an
external Actor as "an independently acting customer, visitor, partner, source, or
system outside the Product owner's control" and listed "supported integration"
among the Interface examples. Read together, those two phrases licensed a
modeling shape that does not hold up.

The `content-feed-reader` Blueprint took the license literally. It declared a
`feed-provider` Actor and a `syndicated-feed-integration` Interface for a
syndicated feed the Product *polls*. The result was internally contradictory:

- the Interface named an Actor and then stated that the Actor could do nothing
  through it — "It does not let a feed provider read or change a Reader's
  library, state, saved items, or collections";
- it was the only Interface with no Experience, because an Experience needs an
  audience and this Interface had none;
- both feed Capability Scenarios carried `actors: [feed-provider]` with steps
  that were entirely "the Product does X", and the Reader — the only party who
  observes the outcome — was *structurally barred* from being an Actor there,
  since every Scenario Actor must be supported by a selected context;
- nothing in the model triggered synchronization at all, because the synthetic
  Interface absorbed the question of who or what starts the call.

The model linted clean throughout. The defect was conceptual, and `lint` cannot
see it: direction of initiation is not recoverable from the files.

The existing definition already contained the correct test — *independently
acting*. A polled feed does not act. The Product acts on it. The test was
present and simply not applied.

## Decision

Direction of initiation decides whether an external system enters the model.

**An external system is an Actor only when it initiates interaction with the
Product.** Then, and only then, the surface it arrives through is an Interface.
An Interface is inbound by definition: something arrives at the Product through
it. An outbound connection the Product opens to a third party is not an
Interface, however stable, versioned, or vendor-supported the integration is.

An outbound dependency is modeled where its result is observed:

- the Capability that makes the call names the external system in its prose and
  states what triggers the call;
- its `availability` names the Interfaces where an Actor observes the outcome,
  never a synthetic integration surface;
- product-significant failure behavior is a Capability Scenario;
- the provider's published contract attaches as a `references` entry with
  `kind: spec` or `kind: doc` and `role: context`.

Direction, not ownership, is the axis. One third party can be a dependency in
one direction and an Actor in the other: a payment processor the Product charges
is a dependency, and the same processor posting a webhook back is an Actor with
a real inbound Interface.

No new entity type is introduced. There is no `external-systems/` or
`dependencies/` collection and no `kind: system` reference. An outbound
dependency shared by several Capabilities is described by each Capability that
depends on it.

This is a modeling rule for authors and skills, not a validation rule. `lint` is
unchanged and cannot enforce it, so the rule is carried by `spec/format.md`, the
Product Model docs, and the mapping rubric that governs what
`businesslens-map` produces from a real repository.

## Consequences

- `spec/format.md` gains an Actor-section paragraph, an inbound clause on
  Interface, and an **Outbound dependencies** subsection. "Supported
  integration" is removed from the Interface examples and replaced with "inbound
  webhook endpoint".
- `docs/actors.md` and `docs/interfaces.md` carry the same rule for authors,
  including the three-question test.
- `skills/businesslens-map/references/mapping-rubric.md` stops the map skill from
  reproducing this shape from outbound HTTP clients found in target code. The
  three condensed `skills/*/references/format.md` copies state the rule too.
- The `content-feed-reader` Blueprint drops the `feed-provider` Actor and the
  `syndicated-feed-integration` Interface. `feed-synchronization` moves to the
  Reader-facing Interfaces where its result is seen, its Scenarios become
  Reader-observable, and a Reader-initiated refresh supplies the trigger the
  model previously lacked.
- The Blueprint loses its demonstration that an Interface may have no
  Experience. That rule remains true and is taught in `docs/interfaces.md`
  prose, where an operator CLI or partner API is an honest example.
  Demonstrating a valid rule with an invalid entity is worse than not
  demonstrating it.
- No folder-schema bump. No parser, linter, report, or viewer change. Existing
  models that named an outbound integration as an Interface still lint; they are
  now describable as wrong.
- Revisit a first-class dependency entity only when a real case demands it:
  several Capabilities restating one external system's failure story, a need to
  answer "what breaks when X is down" or enumerate third parties across the
  model, or an external dependency holding product-significant state that
  several Capabilities read. Each would be additive rather than a migration.
