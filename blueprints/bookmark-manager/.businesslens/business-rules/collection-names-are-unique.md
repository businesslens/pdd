---
appliesTo:
  - { type: entity, id: collection, facts: [Name] }
---

# Collection names are unique

No two collections share a name. Creating or renaming a collection to a name
in use is refused, and accepting a suggestion that names a new collection files
into the existing one when a collection of that name already exists.

## Rationale

The Owner picks a collection by its name when saving and when browsing; two of
the same name would make that choice a guess.
