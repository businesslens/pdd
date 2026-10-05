---
entities:
  - { entity: collection, shows: [Name] }
  - { entity: bookmark, shows: [Title, Address, Tags, Saved at] }
entryPoints:
  - bookmarks-web: /collections/:collectionId
---

# Collection

One collection, opened to work in: its name and the bookmarks filed in it,
newest first. The Owner renames or deletes the collection here and opens its
bookmarks.
