---
kind: system
acts: external
relations:
  - entity: suggestion
    verb: leaves
    cardinality: one-to-many
---

# AI agent

An AI agent harness an Owner connects to their notes. It chooses what to read,
what to propose and when to look. It reads the inbox and the notes around it
and leaves suggestions — a notebook to file a note in, tags to put on it, other
notes to link it to — and never changes a note itself.
