---
appliesTo:
  - { type: entity, id: collection, effect: creates }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner creates their collections

A collection is created only by its Owner, directly or by accepting a
suggestion that names a new collection. Their AI agent can propose a collection
but never creates one.

## Rationale

Collections are how the Owner remembers where things are, so each one exists
because the Owner decided it should.
