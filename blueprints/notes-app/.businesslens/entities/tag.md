---
domain: notes
relations:
  - entity: note
    verb: labels
    cardinality: many-to-many
---

# Tag

A word the owner puts on notes to group them across notebooks, such as
`idea` or `to-read`. A tag exists while at least one note carries it.

## Information kept

- **Name** — the word itself, unique among the owner's tags
