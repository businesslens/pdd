---
appliesTo:
  - type: entity
    id: snippet
    facts: [Code, Language]
---

# Every code change keeps a revision

A snippet's code is kept as revision 1 when the snippet is created or forked,
and every later save that changes its code or language keeps the next revision,
so a snippet's code and language are always its latest revision's. A save that
changes only the title, description or tags, and any change of visibility,
keeps no revision.

## Rationale

The history is the code's history. Revisions for every change of wording would
bury the changes readers came to compare.
