---
appliesTo:
  - type: entity
    id: note
    effect: reads
permits:
  - related: [{ verb: keeps, entity: owner }]
  - related: [{ verb: keeps, entity: owner }, { verb: connects, entity: ai-agent }]
---

# Only the owner and their AI agent read notes

A note is read by the Owner who keeps it, and by an AI agent that Owner has
connected. Nobody else ever reads a note.

## Rationale

Notes hold whatever their Owner thinks of, so an agent reads them only because
the Owner connected it.
