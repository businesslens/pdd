---
entities:
  - entity: bookmark
    shows: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder]
    collects: [Title, Note, Tags, Collection]
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-mobile: bookmarks://bookmarks/:bookmarkId
---

# Bookmark

One bookmark with everything the library keeps about it. The Owner changes
its title, note and collection here, tags and untags it, opens the page it
leads to, or deletes it.
