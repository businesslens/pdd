---
kind: external-failure
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
  - text: The release publishes nothing for the report version the Product reads, cannot be reached, redirects away from HTTPS, or answers with an index that is oversized, malformed, or for another report version
    kind: condition
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product says which of those happened in its own words and prints no list
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Report an unreadable Blueprint list

## Trigger

The Blueprint release cannot be read, or answers with an index the Product
cannot trust.

## Outcome

The run failed without printing a partial or misleading list, and the Developer
can tell a missing release from an outage from a broken index.
