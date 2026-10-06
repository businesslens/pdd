---
appliesTo:
  - type: entity
    id: comment
    effect: removes
permits:
  - related: [{ verb: writes, entity: teammate }]
---

# Only its author deletes a comment

A comment is deleted only by the Teammate who wrote it, or together with its
card when a member deletes the card.

## Rationale

A comment is someone's own words; nobody else takes them back on their behalf.
