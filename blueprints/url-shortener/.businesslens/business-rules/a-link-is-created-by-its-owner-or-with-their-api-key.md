---
appliesTo:
  - type: entity
    id: link
    effect: creates
permits:
  - related: [{ verb: owns, entity: owner }]
  - related: [{ verb: owns, entity: owner }, { verb: owns, entity: api-key }, { verb: identifies, entity: api-client }]
---

# A link is created by its Owner or with their API key

A link comes into being only in an Owner's account: created by the Owner on the
web, or by an API client presenting one of that Owner's API keys. A link an
API client creates belongs to the Owner of the key it presented.

## Rationale

Every short address needs an Owner who can change, disable and account for it.
An API client never holds links of its own.
