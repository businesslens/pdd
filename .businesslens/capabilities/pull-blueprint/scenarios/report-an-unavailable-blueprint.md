---
kind: external-failure
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for a Blueprint by name
    kind: actor
    actor: developer
    contexts:
      terminal:
        place: businesslens-cli
  - text: The catalog reports that there is no such Blueprint, that it has been withdrawn, or that it is temporarily unavailable
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product explains which of those happened, in its own words rather than by echoing whatever the response body contained
    kind: product
    contexts:
      terminal:
        place: businesslens-cli
---

# Report an unavailable Blueprint

## Trigger

The named Blueprint is not something the catalog can serve right now.

## Outcome

The Developer can tell a wrong name from a withdrawn Blueprint from an outage,
and knows whether trying again would help.
