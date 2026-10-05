---
appliesTo:
  - type: capability
    id: create-snippet
  - type: capability
    id: edit-snippet
  - type: capability
    id: fork-snippet
---

# Every code change keeps a revision

A snippet's code is kept as revision 1 when the snippet is created or forked,
and every later save that changes its code or language keeps the next revision.
A save that changes only the title, description or tags, and any change of
visibility, keeps no revision.

## Rationale

The history is the code's history. Revisions for every change of wording would
bury the changes readers came to compare.
