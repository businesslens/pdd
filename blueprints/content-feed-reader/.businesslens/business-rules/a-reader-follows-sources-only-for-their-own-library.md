---
appliesTo:
  - type: entity
    id: source
    effect: creates
permits:
  - related: [{ verb: follows, entity: reader }]
---

# A Reader follows sources only for their own library

A source is followed by the Reader who adds it, for their own library. Nobody
else adds a source to a Reader's library.

## Rationale

Which feeds may fill a library is the Reader's own choice.
