---
kind: external-failure
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to contribute the current Product Model
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The GitHub CLI is not installed, or is installed but not signed in
    kind: condition
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product stops before doing any work, says which of the two it is, and gives the one command that fixes it
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse without an authenticated code host

## Trigger

Contribution is requested without the identity it would be submitted under.

## Outcome

The run stopped at the start rather than halfway through, leaving no temporary
branch, fork, or partial proposal behind.
