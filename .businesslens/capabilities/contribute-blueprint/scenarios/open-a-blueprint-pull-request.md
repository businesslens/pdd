---
kind: primary
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
  - text: The Product checks the model, exports it portably, regenerates a canonical model from that report, and shows the name it would be proposed under
    kind: product
    entities:
      - { entity: product-model, effect: reads }
      - { entity: blueprint, effect: creates, to: Exported }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer confirms that a public pull request may be opened
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product prepares the contribution outside the repository it was asked from, pushes only its own branch, and opens the pull request
    kind: product
    entities:
      - { entity: blueprint, effect: changes, from: Exported, to: Proposed }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product prints the pull request address, and where a fork was needed, says to leave it in place until the merge
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Open a Blueprint pull request

## Trigger

The Developer has a model complete enough that someone else could build a
recognizable product from it, and wants it in the catalog.

## Outcome

A public pull request exists containing only the portable expansion of the
model. The Developer's own repository is unchanged, and the Blueprint is
proposed, not published.

## Edge cases

- Running it again revises the same proposal: the branch is replaced from current upstream and an already-open pull request is updated rather than duplicated.
- A fork that cannot be brought up to date stops the run, rather than proposing unrelated changes alongside the Blueprint.
- Without an interactive terminal, the confirmation must be given explicitly or the run refuses to open anything.
