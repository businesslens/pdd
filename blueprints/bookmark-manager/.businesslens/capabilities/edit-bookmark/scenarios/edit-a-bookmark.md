---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner opens a bookmark from the library
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address] }
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
  - text: The Product presents everything the library keeps about it
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Owner changes its title, note or collection and saves
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product records the changes
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: changes, facts: [Title, Note, Collection] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The address, tags and when the bookmark was saved are unchanged
    kind: condition
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: tag, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Edit a bookmark

## Trigger

The Owner wants a bookmark described or filed differently.

## Outcome

The bookmark carries the Owner's new title, note and collection, and still
opens the same address with the same tags.

## Edge cases

- The Owner clears its collection → the bookmark is Unsorted.
- The Owner leaves without saving → nothing about the bookmark changes.
