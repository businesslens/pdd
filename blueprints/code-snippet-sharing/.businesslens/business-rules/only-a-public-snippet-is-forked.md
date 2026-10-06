---
appliesTo:
  - type: entity
    id: snippet
    effect: creates
    facts: [Forked from]
---

# Only a public snippet is forked

A snippet is forked only from one that is public and owned by someone else.
An unlisted snippet can be read by whoever holds its address, but not forked;
once its owner makes a public snippet unlisted or private, it can no longer be
forked, and forks made before stay with their owners.

## Rationale

Making a snippet public is the owner's statement that it is open for reuse.
Sharing by link is not, so a link alone never lets someone take a copy away.
