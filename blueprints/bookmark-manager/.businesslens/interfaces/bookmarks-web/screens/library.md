---
entities:
  - { entity: bookmark, shows: [Title, Address, Note, Tags, Collection, Saved at] }
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-web: /
---

# Library

Presents the Owner's bookmarks newest first, each with its title, address,
tags and collection. The Owner searches them, narrows them to a tag or to the
Unsorted bookmarks filed in no collection, picks a collection to open, and
opens a bookmark or the page it leads to.
