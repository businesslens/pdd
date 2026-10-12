---
entities:
  - { entity: bookmark, shows: [Title, Address, Note, Tags, Collection, Saved at] }
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-mobile: bookmarks://library
---

# Library

Presents the Owner's bookmarks newest first. The Owner searches them, narrows
them to a collection, a tag or the Unsorted bookmarks, and opens a bookmark or
the page it leads to.

## Counterpart note

`bookmarks-web::library` is the same place on the web, where a collection
opens in a place of its own.
