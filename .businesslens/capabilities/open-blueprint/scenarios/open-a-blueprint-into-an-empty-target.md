---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer points the Product at a local Product Report and the directory that should receive it
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product reads the report, refusing anything that is not a plain file within its size limit
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product expands it into a complete Product Model in a staging area and checks that the result is structurally sound
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product moves the model into place with its orientation README and names what it opened
    kind: product
    changes:
      - entity: product-model
      - entity: product
      - entity: actor
      - entity: interface
      - entity: experience
      - entity: screen
      - entity: domain
      - entity: entity
      - entity: capability
      - entity: capability-scenario
      - entity: journey
      - entity: journey-scenario
      - entity: business-rule
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
