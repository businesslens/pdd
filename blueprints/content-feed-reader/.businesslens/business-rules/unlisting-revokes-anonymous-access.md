---
appliesTo:
  - type: entity
    id: collection
    effect: reads
permits:
  - related: [{ verb: owns, entity: reader }]
  - actors: [reader, visitor]
    when: [{ state: Published }]
---

# Unlisting revokes anonymous access

A collection is read by its owner always, and by anyone else only while it is
published. Once an owner unlists it, its public address serves no collection
contents.

## Rationale

Publication must have one immediate and reliable reversal without deleting the
owner's collection.
