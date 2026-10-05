---
appliesTo:
  - type: entity
    id: snippet
    effect: reads
    contexts: [{ place: snippets-web::discover }]
permits:
  - actors: [developer, visitor]
    when: [{ state: Public }]
---

# Only public snippets are listed in Discover

Discover and its search show public snippets and nothing else. An unlisted
snippet is never listed or found there, not even to its owner, and is reached
only through its address.

## Rationale

Unlisted means shared with whoever holds the link. Listing it anywhere would
turn a link the owner passed to one person into one anyone can find.
