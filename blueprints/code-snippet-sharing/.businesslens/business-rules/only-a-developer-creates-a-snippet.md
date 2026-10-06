---
appliesTo:
  - type: entity
    id: snippet
    effect: creates
permits:
  - actors: [developer]
---

# Only a Developer creates a snippet

A snippet is created by a signed-in Developer, by writing it or by forking one,
and belongs to that Developer from then on. A Visitor reads snippets and creates none.

## Rationale

Every snippet needs an owner who decides who reads it and who changes it, and
only a Developer has an account to own it.
