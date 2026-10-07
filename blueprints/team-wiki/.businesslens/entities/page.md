---
domain: pages
relations:
  - entity: revision
    verb: keeps
    cardinality: one-to-many
  - entity: suggestion
    verb: receives
    cardinality: one-to-many
  - entity: page
    verb: nests
    cardinality: one-to-many
---

# Page

One written page in a space, sitting at the top of the space's tree or under
another page.

## Information kept

- **Title** — what the page is called
- **Content** — what the page currently says
- **Parent page** — the page it sits under, or none when it is at the top of its space
- **Last edited at** — when its current revision was saved
