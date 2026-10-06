---
appliesTo:
  - { type: entity, id: notebook, effect: creates }
permits:
  - related: [{ verb: keeps, entity: owner }]
---

# Only the owner creates their notebooks

A notebook is created only by the Owner who will keep it. An AI agent may
suggest filing a note in an existing notebook, never a new one.

## Rationale

Notebooks are how the Owner chose to divide their notes; an agent able to add
them would be reorganizing the notes without a decision.
