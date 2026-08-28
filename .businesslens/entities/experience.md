---
domain: model-authoring
relations:
  - entity: screen
    verb: holds
    cardinality: many
---

# Experience

A coherent context of use inside exactly one Interface, with its own audience and
access boundary. Whether an Interface has any is derived, never judged.

## Information kept

- Which Interface contains it, from its path
- The Actors it serves and the access it requires
- Its own entry points
- What it supports, and what it explicitly does not
