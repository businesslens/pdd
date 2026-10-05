---
kind: system
acts: internal
relations:
  - entity: suggestion
    verb: drafts
    cardinality: one-to-many
---

# Assistant

The wiki's own assistant. It answers a Member's questions from the pages that
Member may read, citing every page it used, and reviews spaces for pages that
look stale or disagree with each other, drafting a suggested update for the
space's editors. It chooses what to read and what to suggest, but it never
changes a page: an Editor decides.
