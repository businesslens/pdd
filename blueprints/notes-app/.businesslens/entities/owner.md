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
  - entity: ai-agent
    verb: connects
    cardinality: one-to-many
---

# Owner

The one person whose notes these are. They capture, edit, organize and search
their notes, and decide every suggestion the AI agent they connect leaves.
