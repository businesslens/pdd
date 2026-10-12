---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to update the pdd-kit skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: No installation in the searched harnesses and scopes carries a valid pdd-kit marker
    kind: condition
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product reports that it found nothing it owns and points to installation instead
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Report no managed installation

## Trigger

An update is requested where pdd-kit has never installed, or where the
skills were placed by hand.

## Outcome

Nothing changed, and the Developer is told the one command that would make the
installation eligible.
