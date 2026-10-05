---
appliesTo:
  - type: entity
    id: owner
    effect: changes
    facts: [Assistant access]
permits:
  - self: true
---

# Only the owner changes assistant access

Assistant access is turned on or off only by the Owner it belongs to. It starts
off, and no AI agent can turn it on for itself.

## Rationale

The switch is the boundary between private notes and any agent; an agent able
to move it would have no boundary at all.
