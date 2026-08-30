---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer names the Blueprint they want and the directory that should receive it
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product resolves which catalog to read and refuses any origin that is not a bare, secure one
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product fetches the report anonymously, confirms it is the named Blueprint, and confirms the body matches the digest the catalog declared
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product fetches the Product's logo from the same catalog, continuing without one if it is missing or invalid
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product expands the Blueprint into a Product Model and names what it pulled
    kind: product
    changes:
      - entity: product-model
    contexts:
      terminal:
        place: businesslens-cli
---

# Pull a catalog Blueprint by name

## Trigger

The Developer wants to start a repository from a reviewed Product Model that
already exists in a catalog.

## Outcome

The directory holds a Product Model identical to what opening the same Blueprint
locally would have produced, with its orientation README, and nothing outside
`.businesslens/` was touched.

## Edge cases

- A name that is not lowercase kebab-case, or longer than the catalog allows, is refused before any request is made.
- A non-empty target is refused, or backed up first, exactly as opening a local Blueprint would.
