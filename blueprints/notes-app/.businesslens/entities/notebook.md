---
domain: notebooks
relations:
  - entity: note
    verb: holds
    cardinality: one-to-many
---

# Notebook

A named place the owner files notes into, such as Work, Recipes or Travel. A
note is filed in at most one notebook.

## Information kept

- **Name** — what the owner called it, unique among their notebooks
