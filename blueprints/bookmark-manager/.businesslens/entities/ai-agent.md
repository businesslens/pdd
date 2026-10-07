---
kind: system
acts: external
relations:
  - entity: filing-suggestion
    verb: leaves
    cardinality: one-to-many
  - entity: duplicate-suggestion
    verb: leaves
    cardinality: one-to-many
---

# AI agent

An AI agent harness an Owner connects to their library. It chooses what to
read, what to propose and when to look. It reads their bookmarks, collections
and tags, and leaves each thing it proposes as a suggestion with its reason.
