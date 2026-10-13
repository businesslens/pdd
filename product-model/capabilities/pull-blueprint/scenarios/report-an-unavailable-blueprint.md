---
kind: external-failure
routes:
  terminal: Terminal
steps:
  - text: The Developer asks to pull one by name
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The release lists nothing of that name, publishes nothing for the report version the Product reads, lists a report it has not finished uploading, or cannot be reached
    kind: condition
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product explains which of those happened in its own words, points a wrong name to the command that lists what is published, and writes nothing
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Report an unavailable Blueprint

## Trigger

The named Blueprint is not something the Blueprint release can serve right now.

## Outcome

The Developer can tell a wrong name from a release still being rebuilt from an
outage, and knows whether trying again would help.
