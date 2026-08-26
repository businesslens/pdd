---
kind: validation
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to contribute the current Product Model
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product finds the model lacks something a public Blueprint needs — a category, a tag, an author, a licence, a Capability, a logo, or Scenario coverage for a declared availability Context
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product lists everything that is missing and opens nothing
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse a model missing public metadata

## Trigger

Contribution is requested for a model that would not be usable as a public
Blueprint.

## Outcome

No pull request was opened, and the Developer holds the complete list of what to
add before trying again.
