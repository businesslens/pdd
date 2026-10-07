---
appliesTo:
  - type: entity
    id: snippet
    effect: reads
permits:
  - related: [{ verb: owns, entity: developer }]
  - actors: [developer, visitor]
    when: [{ state: Unlisted }]
  - actors: [developer, visitor]
    when: [{ state: Public }]
---

# Only the owner reads a private snippet

A snippet is read by its owner always, and by anyone else only while it is
unlisted or public. To anyone else, a private snippet's address shows the same
thing as an address with no snippet at all.

## Rationale

Snippets start private and many stay that way, so the address of a private
snippet must reveal nothing, not even that it exists.
