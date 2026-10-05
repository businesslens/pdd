---
appliesTo:
  - type: entity
    id: suggestion
    effect: changes
permits:
  - related: [{ verb: requests, entity: developer }]
---

# Only the Developer who asked accepts or dismisses a suggestion

A suggestion is accepted or dismissed only by the Developer who asked for it.
The Snippet assistant never accepts its own proposal.

## Rationale

The assistant proposes; a person decides. Accepting is the step where the
proposal becomes the Developer's own words.
