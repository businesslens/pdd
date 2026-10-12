---
appliesTo:
  - type: entity
    id: snippet
    effect: changes
permits:
  - related: [{ verb: owns, entity: developer }]
---

# Only the owner changes a snippet

Only the Developer who owns a snippet changes its code, language, title,
description, tags or visibility. Every other Developer may at most read it
and, while it is public, fork it.

## Rationale

Sharing a snippet hands out the right to read it, never the right to change it.
Reuse goes through a fork, which belongs to the Developer who made it.
