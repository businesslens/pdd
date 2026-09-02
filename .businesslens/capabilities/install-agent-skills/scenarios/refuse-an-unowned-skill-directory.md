---
kind: conflict
routes:
  terminal: Terminal
steps:
  - text: A directory with a BusinessLens skill's name already exists and is not marked as BusinessLens-owned
    kind: condition
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Developer asks to install the BusinessLens skills
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product stops before writing anything, names the directory it refused, and explains that replacing it requires saying so explicitly
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse an unowned skill directory

## Trigger

Installation would overwrite a directory that carries a BusinessLens skill name
but no evidence of being a BusinessLens installation.

## Outcome

Nothing on disk changed. The Developer knows exactly which directory blocked the
install and that they can proceed only by declaring they own it.

## Edge cases

- An installation marker that cannot be read grants no permission to overwrite; the directory is treated as unowned.
