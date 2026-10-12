---
appliesTo:
  - type: entity
    id: card-proposal
    effect: reads
permits:
  - related: [{ verb: holds, entity: deck }, { verb: owns, entity: learner }]
---

# Only a deck's owner sees its card proposals

A deck's card proposals, and the passages they came from, are shown only to the
Learner who owns the deck. A shared deck presents its cards and never its
proposals.

## Rationale

The passages come from the owner's own notes, and an undecided draft is not
yet study material anyone else should see.
