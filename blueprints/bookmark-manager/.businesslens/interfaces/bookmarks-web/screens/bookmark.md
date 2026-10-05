---
entities:
  - entity: bookmark
    shows: [Title, Address, Note, Tags, Collection, Saved at, Imported from folder]
    collects: [Title, Note, Tags, Collection]
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-web: /bookmarks/:bookmarkId
---

# Bookmark

One bookmark with everything the library keeps about it, including where it
came from when it arrived by import. The Owner changes its title, note, tags
and collection here, opens the page it leads to, or deletes it.
