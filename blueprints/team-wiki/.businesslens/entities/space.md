---
domain: spaces
relations:
  - entity: page
    verb: contains
    cardinality: one-to-many
  - entity: space-membership
    verb: has
    cardinality: one-to-many
---

# Space

A shared area of the wiki for one team or topic, holding a tree of pages and
read only by the people who belong to it.

## Information kept

- **Name** — what the space is called, unique in the workspace
- **Description** — what the space is for
