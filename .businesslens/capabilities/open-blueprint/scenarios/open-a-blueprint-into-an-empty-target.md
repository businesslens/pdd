---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer points the Product at a local report file and the directory that should receive it
    kind: actor
    actor: developer
    entities:
      - { entity: blueprint, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reads the report, refusing anything that is not a plain file within its size limit, or written under a contract it does not speak
    kind: product
    entities:
      - { entity: blueprint, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product expands it into a complete model in a staging area and checks that the result is structurally sound
    kind: product
    entities:
      - { entity: blueprint, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product moves the model into place with its orientation README and names what it opened
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: creates }
    contexts:
      terminal:
        place: businesslens-cli
---

# Open a Blueprint into an empty target

## Trigger

The Developer has a Product Report file and wants it as a working model.

## Outcome

The target directory holds a canonical Product Model that records that
implementation alignment still has to be verified there. Nothing outside
`.businesslens/` was touched, and no skills were installed.

## Edge cases

- A web address is refused with a pointer to the catalog pull, which is the supported way to fetch one.
- The report path is read relative to the shell, while the chosen directory decides where the model lands.
- A report from an earlier contract is refused by name rather than migrated; the repository that authored it re-exports.
