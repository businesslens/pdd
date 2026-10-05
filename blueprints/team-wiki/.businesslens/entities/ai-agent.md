---
kind: system
acts: external
relations:
  - entity: suggestion
    verb: drafts
    cardinality: one-to-many
---

# AI agent

An AI agent harness a Member connects to the wiki. It works on that Member's
behalf: it reads the pages of the spaces the Member belongs to, answers the
Member's questions with a citation to every page it relies on, and reviews
spaces for pages that look stale or disagree with each other, leaving a
suggested update for the space's Editors. It chooses what to read and what to
suggest, but it never changes a page: an Editor decides.
