---
kind: primary
routes:
  web: Web
steps:
  - text: The Owner chooses the export file their browser made
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product reads the bookmarks and the folders they sit in
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product skips every bookmark whose address the library already keeps
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Address] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product adds the rest as Unsorted bookmarks, each remembering the browser folder it came from
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: creates, facts: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product reports how many bookmarks it added and how many it skipped
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::import
  - text: The Product hands the added bookmarks over for review and takes the Owner to Suggestions
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [] }
    contexts:
      web:
        place: bookmarks-web::suggestions
---

# Import a browser export

## Trigger

The Owner has a bookmarks file exported from a browser and wants those links
in the library.

## Outcome

Every bookmark from the file whose address was new is in the library, Unsorted,
with the folder it came from. The Owner knows what was added and skipped, and is
handed to Suggestions while the assistant reviews the new bookmarks.

## Edge cases

- The file holds the same address twice → it is added once.
