---
domain: collections
relations:
  - entity: bookmark
    verb: holds
    cardinality: one-to-many
---

# Collection

A named place the Owner files bookmarks in. A bookmark is in at most one
collection; one filed in none is Unsorted.

## Information kept

- **Name** — the name the Owner or an accepted suggestion gave it, unique in the library
