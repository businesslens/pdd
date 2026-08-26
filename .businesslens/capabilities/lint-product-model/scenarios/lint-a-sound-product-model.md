---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for the Product Model to be checked
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product locates the model in the current directory, or at the repository root when the current directory has none
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reports that the structure is sound and succeeds
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Lint a sound Product Model

## Trigger

The Developer wants to know whether the model they are about to commit is well
formed.

## Outcome

The check succeeds and says the structure is sound. It makes no claim about
whether the implementation agrees with the model.

## Edge cases

- Warnings, such as a Domain holding fewer than two Capabilities, are reported without failing the check.
- Being pointed at a directory with no model anywhere above it fails with a message naming the two workflows that create one.
