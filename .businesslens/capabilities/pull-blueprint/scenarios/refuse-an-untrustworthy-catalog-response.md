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
  - text: The catalog answers with a redirect, an oversized body, a missing or malformed digest, a body that does not match its digest, or a different Blueprint than the one asked for
    kind: condition
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product refuses the response, says which check failed, and writes no Product Model files
    kind: product
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
