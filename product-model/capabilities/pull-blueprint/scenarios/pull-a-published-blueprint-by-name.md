---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer names what they want pulled and the directory that should receive it
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product reads the Blueprint release's index anonymously and finds the named Blueprint in it
    kind: product
    entities:
      - { entity: blueprint, effect: reads, facts: [Product identity] }
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product downloads the report anonymously, confirms it matches the digest the index records, and confirms it is the named Blueprint
    kind: product
    entities:
      - { entity: blueprint, effect: reads, facts: [Schema version, Product identity, Product meaning] }
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product downloads the Product's logo and cover from the same release, continuing without either if it is missing or invalid
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product expands the Blueprint into a Product Model and names what it pulled
    kind: product
    actor: developer
    entities:
      - { entity: blueprint, effect: reads, facts: [Schema version, Product identity, Product meaning] }
      - { entity: product-model, effect: creates, facts: [Product, Coverage, Method] }
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Pull a published Blueprint by name

## Trigger

The Developer wants to start a repository from a reviewed Product Model that is
already published as a Blueprint.

## Outcome

The directory holds a Product Model identical to what opening the same Blueprint
locally would have produced, with its orientation README, and nothing outside
`product-model/` was touched.

## Edge cases

- A name that is not lowercase kebab-case, or longer than a Blueprint name allows, is refused before any request is made.
- A repository named for a fork that is not an `owner/repo` pair is refused before any request is made.
- A cover is fetched only together with a logo, since both live in the Product's folder.
- A non-empty target is refused, or backed up first, exactly as opening a local Blueprint would.
