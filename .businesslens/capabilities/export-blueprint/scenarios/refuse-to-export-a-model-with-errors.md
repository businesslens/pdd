---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the current Product Model to be exported
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The model does not pass its structural check
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product lists the structural errors and produces no report
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse to export a model with errors

## Trigger

Export is requested for a model that is not structurally sound.

## Outcome

No Blueprint was produced, so a malformed model cannot be handed to anyone else.
