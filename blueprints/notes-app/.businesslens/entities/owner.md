---
kind: person
acts: external
relations:
  - entity: note
    verb: keeps
    cardinality: one-to-many
  - entity: notebook
    verb: keeps
    cardinality: one-to-many
  - entity: tag
    verb: keeps
    cardinality: one-to-many
---

# Owner

The one person whose notes these are. They capture, edit, organize and search
their notes, decide every suggestion an AI agent leaves, and decide whether an
agent may work on their notes at all.

## Information kept

- **Assistant access** — whether an AI agent the owner connected may read their notes and leave suggestions; off until the owner turns it on
