---
appliesTo:
  - type: entity
    id: form
    effect: removes
permits:
  - related: [{ verb: owns, entity: creator }]
---

# Only a Creator deletes their form

Only the Creator who owns a form deletes it, and its questions and responses
go with it.

## Rationale

Deleting a form deletes what other people said in it, so only the person they
answered may decide that.
