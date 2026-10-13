---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer asks what is published to pull
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product reads the Blueprint release's index anonymously
    kind: product
    entities:
      - { entity: blueprint, effect: reads, facts: [Product identity] }
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product prints each published Blueprint's name and title, ordered by name, and the command that pulls one
    kind: product
    actor: developer
    entities:
      - { entity: blueprint, effect: reads, facts: [Product identity] }
    contexts:
      terminal:
        place: pdd-kit-cli
---

# List the published Blueprints

## Trigger

The Developer wants to start from a Blueprint and needs to know which ones exist
and what each is called.

## Outcome

The Developer sees every Blueprint the release publishes, each by the name a
pull accepts, and nothing was written.

## Edge cases

- A release that publishes no Blueprints yet says so and still succeeds.
- A repository named for a fork that is not an `owner/repo` pair is refused before any request is made.
