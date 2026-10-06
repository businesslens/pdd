---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a bookmark and takes one of its tags off
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Tags] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product takes the tag off the bookmark
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
  - text: Other bookmarks still carry the tag, so it stays in the library
    kind: condition
    actor: owner
    entities:
      - { entity: tag, effect: reads, facts: [Name] }
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Untag a bookmark

## Trigger

A tag no longer describes a bookmark.

## Outcome

The bookmark no longer carries the tag and no longer appears when the Library is
narrowed to it; the other bookmarks carrying it are unchanged.
