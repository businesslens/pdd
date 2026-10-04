---
appliesTo:
  - type: entity
    id: collection
    effect: reads
    facts: [Public address]
    contexts: [{ place: reader-web::personal-library::collection-workspace }]
permits:
  - related: [{ verb: owns, entity: reader }]
---

# Public addresses are the owner's

Inside the collection workspace, a collection's public address is shown only to
its owner: in the collection's settings and in the part of them that controls
sharing. Nowhere else in the workspace presents it.

## Rationale

The address of an unlisted collection is a way back in that only its owner
should hold until they publish it again.
