---
kind: validation
routes:
  local: Local
steps:
  - text: The Developer asks to view the current Product Model
    kind: actor
    actor: developer
    contexts:
      local:
        place: businesslens-cli
  - text: The model does not pass its structural check
    kind: condition
    contexts:
      local:
        place: businesslens-cli
  - text: The Product reports the structural failure and never opens a port
    kind: product
    contexts:
      local:
        place: businesslens-cli
---

# Refuse to serve a model with errors

## Trigger

Viewing is requested for a model that is not structurally sound.

## Outcome

Nothing is served and nothing is written. The Developer is told what is wrong
with the model rather than shown an empty or partial report.
