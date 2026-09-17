---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer requests cancellation of an identified pending Coverage review
    kind: actor
    actor: developer
    entities: [{ entity: coverage-review, effect: reads }]
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product discards only that pending worklist and its conclusions
    kind: product
    entities: [{ entity: coverage-review, effect: removes, from: Pending }]
    contexts: { terminal: { place: businesslens-cli } }
---

# Cancel a pending review

## Trigger

A pending worklist is no longer suitable for completion.

## Outcome

The pending review is removed. A previous completed baseline remains intact.
