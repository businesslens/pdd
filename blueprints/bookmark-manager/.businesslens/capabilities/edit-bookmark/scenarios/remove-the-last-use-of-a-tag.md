---
kind: edge
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner takes a tag off a bookmark and saves
    kind: actor
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product records the bookmark's remaining tags
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: changes, facts: [Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: No other bookmark carries that tag
    kind: condition
    entities:
      - { entity: tag, effect: reads, facts: [] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product removes the tag from the library
    kind: product
    actor: owner
    entities:
      - { entity: tag, effect: removes }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Remove the last use of a tag

## Trigger

The Owner takes off a tag that only this bookmark carried.

## Outcome

The bookmark no longer carries the tag, and the tag no longer appears among the
library's tags.
