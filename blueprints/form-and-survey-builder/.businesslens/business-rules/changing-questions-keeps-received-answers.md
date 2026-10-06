---
appliesTo:
  - type: entity
    id: choice-question
    effect: changes
  - type: entity
    id: choice-question
    effect: removes
  - type: entity
    id: entry-question
    effect: changes
  - type: entity
    id: entry-question
    effect: removes
---

# Changing questions keeps received answers

Changing or removing a question never changes or removes the answers already
given to it; each response keeps its answers as given.

## Rationale

A Creator refines a form while it is open, and what Respondents already said
must survive that refinement.
