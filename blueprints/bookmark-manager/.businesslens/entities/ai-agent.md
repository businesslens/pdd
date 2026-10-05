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

An AI agent the Owner connects to their library. It reads their bookmarks,
collections and tags, classifies what they imported, finds pages kept more
than once and proposes collections, and leaves each of these as a suggestion
with its reason. It chooses what to read and what to propose, and it never
files, tags, merges or deletes anything itself.
