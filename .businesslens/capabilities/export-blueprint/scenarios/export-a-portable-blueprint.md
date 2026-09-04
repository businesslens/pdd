---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the current Product Model to be exported
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product checks the model's structure, compiles it into one portable report, and removes source-specific navigation from it
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product writes the report to the model's generated build location and names the file
    kind: product
    entities:
      - { entity: blueprint, effect: creates, to: Exported }
    contexts:
      terminal:
        place: businesslens-cli
---

# Export a portable Blueprint

## Trigger

The Developer wants the model as a single portable artifact — to move it, to
inspect what would travel, or to prepare a contribution.

## Outcome

A Blueprint exists as a generated file that the repository ignores and that is
replaced on every run. It holds no code references, no implementation
references, no repository-relative targets, and no source areas.
