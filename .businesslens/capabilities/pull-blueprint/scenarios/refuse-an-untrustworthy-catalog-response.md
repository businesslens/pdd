---
kind: external-failure
routes:
  terminal: Terminal
steps:
  - text: The Developer asks for a catalog entry by name
    kind: actor
    actor: developer
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The catalog answers with a redirect, an oversized body, a missing or malformed digest, a body that does not match its digest, a different entry than the one asked for, or a report version the Product does not read
    kind: condition
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product refuses the response, says which check failed, and writes nothing
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Refuse an untrustworthy catalog response

## Trigger

A catalog answers a pull with something that cannot be shown to be the requested
Blueprint, intact.

## Outcome

Nothing was written. The Developer knows the pull failed on integrity rather
than on content, so they can tell a broken catalog from a missing Blueprint.
