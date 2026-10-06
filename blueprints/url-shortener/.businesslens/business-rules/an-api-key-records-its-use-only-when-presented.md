---
appliesTo:
  - type: entity
    id: api-key
    effect: changes
permits:
  - related: [{ verb: identifies, entity: api-client }]
---

# An API key records its use only when presented

An API key changes only when the API client it identifies presents it, which
records when it was last used. Its name and secret never change, and the Owner
does not edit a key.

## Rationale

The Owner reads a key's last use to decide whether the tool holding it is
still in use, so only that tool presenting it may move it.
