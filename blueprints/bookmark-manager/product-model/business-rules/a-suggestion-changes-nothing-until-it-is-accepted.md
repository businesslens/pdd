---
appliesTo:
  - { type: entity, id: filing-suggestion }
  - { type: entity, id: duplicate-suggestion }
---

# A suggestion changes nothing until it is accepted

While a suggestion is Proposed, every bookmark, collection and tag it names is
exactly as it was. Leaving, dismissing or outdating a suggestion changes
nothing in the library; only the Owner accepting it files, tags or merges.

## Rationale

The Owner can let suggestions pile up and decide them whenever they like,
knowing that nothing is filed, merged or deleted behind their back.
