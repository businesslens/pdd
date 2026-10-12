---
kind: primary
result: achieved
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner brings the address of a page to keep
    kind: actor
    actor: owner
    capability: save-bookmark
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The library already keeps a bookmark with exactly this address
    kind: condition
    actor: owner
    capability: save-bookmark
    entities:
      - { entity: bookmark, effect: reads, facts: [Address] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product opens the bookmark already kept
    kind: product
    actor: owner
    capability: save-bookmark
    entities:
      - { entity: bookmark, effect: reads, facts: [Title, Address, Collection, Saved at] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Owner chooses the collection it belongs in and saves
    kind: actor
    actor: owner
    capability: edit-bookmark
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product files the bookmark in that collection
    kind: product
    actor: owner
    capability: edit-bookmark
    entities:
      - { entity: bookmark, effect: changes, facts: [Collection] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
---

# Refile a link already kept

## Trigger

The Owner saves a page they already kept, meaning to file it somewhere.

## Outcome

The Journey goal is achieved: the page is still one bookmark, now filed in the
collection the Owner intended.
