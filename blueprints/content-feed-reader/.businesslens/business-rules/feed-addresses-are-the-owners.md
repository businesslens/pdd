---
appliesTo:
  - type: entity
    id: source
    effect: reads
    facts: [Feed address]
permits:
  - related: [{ verb: follows, entity: reader }]
---

# Feed addresses are the owner's

Where a source's feed is read from is shown only to the Reader who follows it.
The source's name may appear beside items anyone can read; its feed address
may not.

## Rationale

A feed address can carry a private token or a paid subscription, so it belongs
to the Reader who supplied it and nobody else.
