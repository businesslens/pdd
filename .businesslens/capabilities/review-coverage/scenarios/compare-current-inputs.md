---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The Developer requests the current coverage status
    kind: actor
    actor: developer
    entities: []
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product compares the current repository and Product Model with the completed Coverage review
    kind: product
    entities:
      - { entity: coverage-review, effect: reads }
      - { entity: product-model, effect: reads }
    contexts: { terminal: { place: businesslens-cli } }
---

# Compare current inputs

## Trigger

The Developer wants to know what changed since the last completed accounting.

## Outcome

The result distinguishes source additions, modifications, deletions and
unreadable inputs, model changes, and any work in progress. No baseline advances.

## Edge cases

- Without a completed review, current files are unreviewed and no comparison history is invented.
- A file still present but no longer selected by the inventory policy is distinct from a deletion.
- Renames appear as an addition and a deletion. An unchanged file can still be affected by changes elsewhere.
- A corrupt or unsupported record fails explicitly; it is never presented as a missing baseline.
