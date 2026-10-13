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
  - text: The release answers with a redirect away from HTTPS, an oversized or malformed index or report, an index for a report version the Product does not read, a report that does not match the digest its index records, or a report for a different name than the one asked for
    kind: condition
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
  - text: The Product refuses the download, says which check failed, and writes nothing
    kind: product
    entities: []
    contexts:
      terminal:
        place: pdd-kit-cli
---

# Refuse an untrustworthy release response

## Trigger

The Blueprint release answers a pull with something that cannot be shown to be
the requested Blueprint, intact.

## Outcome

Nothing was written. The Developer knows the pull failed on integrity rather
than on content, so they can tell a broken release from a missing Blueprint.
