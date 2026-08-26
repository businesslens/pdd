---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to update the BusinessLens skills
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: No installation in the searched harnesses and scopes carries a valid BusinessLens marker
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reports that it found nothing it owns and points to installation instead
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Report no managed installation

## Trigger

An update is requested where BusinessLens has never installed, or where the
skills were placed by hand.

## Outcome

Nothing changed, and the Developer is told the one command that would make the
installation eligible.
