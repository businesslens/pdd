---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner brings the address of a page they want to keep
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product reads the title the page gives itself
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Owner keeps or changes the title and may add a note, tags and a collection
    kind: actor
    actor: owner
    entities:
      - { entity: collection, effect: reads, facts: [Name] }
      - { entity: tag, effect: reads, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Owner saves
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The Product adds the bookmark to the library, creating any tag that is new
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
      - { entity: tag, effect: creates, facts: [Name] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
  - text: The bookmark is in the chosen collection, or Unsorted when none was chosen
    kind: condition
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
      - { entity: collection, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::save-link
      mobile:
        place: bookmarks-mobile::save-link
---

# Save a link

## Trigger

On the web the Owner pastes a page's address or presses the browser button on
the page itself; on a phone they share the page to the Product from any app.

## Outcome

The page is a bookmark in the library with its title, any note and tags, and
the collection the Owner chose.

## Edge cases

- The Owner leaves before saving → nothing is added to the library.
