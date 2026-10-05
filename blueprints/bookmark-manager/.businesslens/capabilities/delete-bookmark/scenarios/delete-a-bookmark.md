---
kind: primary
routes:
  web: Web
  mobile: Mobile
steps:
  - text: The Owner chooses to delete a bookmark
    kind: actor
    actor: owner
    entities:
      - { entity: bookmark, effect: reads, facts: [Title] }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product asks the Owner to confirm, and says that deleting cannot be undone
    kind: product
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Owner confirms
    kind: actor
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Product deletes the bookmark
    kind: product
    actor: owner
    entities:
      - { entity: bookmark, effect: removes }
    contexts:
      web:
        place: bookmarks-web::bookmark
      mobile:
        place: bookmarks-mobile::bookmark
  - text: The Owner is back in the library, which no longer holds it
    kind: condition
    actor: owner
    entities: []
    contexts:
      web:
        place: bookmarks-web::library
      mobile:
        place: bookmarks-mobile::library
---

# Delete a bookmark

## Trigger

The Owner no longer wants to keep a bookmark.

## Outcome

The bookmark is gone from the library, its collection and every tag view.

## Edge cases

- The Owner declines to confirm → the bookmark stays as it was.
- The bookmark carried the only use of a tag → the tag is removed with it.
- A pending suggestion named the bookmark → the suggestion no longer offers it.
