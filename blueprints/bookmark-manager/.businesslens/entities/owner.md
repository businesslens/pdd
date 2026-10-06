---
kind: person
acts: external
relations:
  - entity: bookmark
    verb: owns
    cardinality: one-to-many
  - entity: collection
    verb: owns
    cardinality: one-to-many
  - entity: ai-agent
    verb: connects
    cardinality: one-to-one
---

# Owner

The one person whose library this is. The Owner saves, files, finds and
deletes bookmarks, imports them from a browser, and decides every suggestion
their AI agent leaves.
