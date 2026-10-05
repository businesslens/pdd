---
appliesTo:
  - type: entity
    id: note
    effect: reads
permits:
  - related: [{ verb: keeps, entity: owner }]
  - actors: [ai-agent]
    when: [{ entity: owner, fact: Assistant access, is: true }]
---

# Only the owner and an allowed AI agent read notes

A note is read by the Owner who keeps it, and by an AI agent only while that
Owner has assistant access turned on. Nobody else ever reads a note.

## Rationale

Notes hold whatever their Owner thinks of, so letting an agent read them is a
decision the Owner makes and can undo at any time.
