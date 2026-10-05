---
appliesTo:
  - { type: entity, id: filing-suggestion, effect: creates }
  - { type: entity, id: duplicate-suggestion, effect: creates }
permits:
  - actors: [assistant]
---

# Suggestions come only from the assistant

Only the assistant prepares a suggestion. The Owner changes the library
directly and has no need to suggest anything to themselves.

## Rationale

Suggestions are the one thing the assistant may create, which keeps everything
it does in one place the Owner reviews.
