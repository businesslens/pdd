---
kind: system
acts: external
relations:
  - entity: suggestion
    verb: leaves
    cardinality: one-to-many
---

# AI agent

An AI agent the owner connects to their notes. It reads the inbox and the notes
around it and leaves suggestions — a notebook to file a note in, tags to put on
it, other notes to link it to — and never changes a note itself. It reaches the
notes only through the agent connection, and only while the owner allows it.
