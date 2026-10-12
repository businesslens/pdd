---
appliesTo:
  - type: entity
    id: revision
    effect: changes
permits: []
---

# A revision is never rewritten

Once kept, a revision's code, language and saved time never change. A snippet
changes by gaining a new revision, and its revisions leave only when the
snippet itself is deleted.

## Rationale

History is only worth reading if it is what was really there. An owner who
wants earlier code back saves it again, which keeps the path it took.
