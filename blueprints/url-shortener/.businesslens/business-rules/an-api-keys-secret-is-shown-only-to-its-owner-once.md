---
appliesTo:
  - type: entity
    id: api-key
    effect: reads
    facts: [Secret]
permits:
  - related: [{ verb: owns, entity: owner }]
---

# An API key's secret is shown only to its Owner, once

The secret of an API key is shown to the Owner who created it, at the moment
it is created, and never again — not to them, and not to anyone else. Its name,
creation and last use stay visible to the Owner.

## Rationale

Anyone holding the secret can create links in the Owner's account. Showing it
once keeps the only copy outside the Product with the tool it was made for.
