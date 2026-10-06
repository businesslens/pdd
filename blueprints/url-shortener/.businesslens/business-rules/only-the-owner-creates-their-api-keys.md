---
appliesTo:
  - type: entity
    id: api-key
    effect: creates
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner creates their API keys

An API key is created in an Owner's account by that Owner, on the web. An API
client cannot create a key, for itself or for another tool.

## Rationale

The Owner is the one who decides which tools may create links in their
account, so letting a tool in is theirs alone.
