---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a bookmark and chooses to add a tag
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Tags] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product offers the tags the library already has
    kind: product
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Owner picks one of them or types a new one
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product puts the tag on the bookmark, creating it when it is new
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: changes, facts: [Tags] }
      - { entity: tag, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Tag a bookmark

## Trigger

The Owner wants to find a bookmark again under a word, whichever collection it
is in.

## Outcome

The bookmark carries the tag, and narrowing the Library to that tag shows it.

## Edge cases

- The bookmark already carries the tag → nothing changes.
