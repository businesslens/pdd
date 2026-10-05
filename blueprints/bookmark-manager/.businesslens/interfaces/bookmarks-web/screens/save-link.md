---
entities:
  - entity: bookmark
    shows: [Title, Address]
    collects: [Address, Title, Note, Tags, Collection]
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-web: /save?url=:address
---

# Save link

Takes the Owner through keeping one page: its address, pasted or brought by
the browser button from the page they are on; the title the Product read from
the page, which the Owner may change; and an optional note, tags and
collection, including a new collection made on the spot.
