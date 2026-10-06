---
kind: system
acts: external
relations:
  - entity: suggestion
    verb: leaves
    cardinality: one-to-many
---

# AI agent

An AI agent harness a Member connects to their spaces. It chooses what to read,
what to propose and when to look. It works on that Member's behalf: it reads the
pages of the spaces the Member belongs to, answers the Member's questions with a
citation to every page it relies on, and reviews those spaces for pages that
look stale or disagree with each other, leaving a suggested update for the
space's Editors.
