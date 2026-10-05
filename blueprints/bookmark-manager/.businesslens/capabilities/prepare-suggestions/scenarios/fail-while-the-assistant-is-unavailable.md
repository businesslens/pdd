---
kind: edge
routes:
  web: Web
steps:
  - text: The Owner asks for suggestions
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The assistant cannot be reached or cannot finish its review
    kind: condition
    actor: assistant
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: The Product tells the Owner that no suggestions could be prepared and that they can ask again
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::suggestions
  - text: No suggestion is created and the library is unchanged
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Fail while the assistant is unavailable

## Trigger

The Owner asks for suggestions while the assistant cannot be reached or cannot
finish.

## Outcome

No partial suggestions appear, the library is unchanged, and the Owner can ask
again later. After an import, the imported bookmarks stay Unsorted.
