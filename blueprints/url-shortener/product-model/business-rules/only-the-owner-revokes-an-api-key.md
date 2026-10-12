---
appliesTo:
  - type: entity
    id: api-key
    effect: removes
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner revokes an API key

An API key is revoked only by the Owner who created it. An API client cannot
revoke the key it presents, or any other.

## Rationale

The Owner is the one who decides which tools may create links in their
account, so cutting a tool off is theirs alone.
