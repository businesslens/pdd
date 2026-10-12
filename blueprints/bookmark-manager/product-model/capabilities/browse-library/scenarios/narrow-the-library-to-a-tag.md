---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner picks a tag
    kind: actor
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Product presents only the bookmarks carrying that tag, from every collection
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Tags, Collection] }
      - { entity: collection, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Owner opens one of them
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
---

# Narrow the library to a tag

## Trigger

The Owner wants every bookmark on one subject, whichever collection holds it.

## Outcome

The Owner sees every bookmark carrying the tag and has the one they wanted open.

## Edge cases

- The Owner picks Unsorted instead of a tag → only bookmarks filed in no collection are presented.
