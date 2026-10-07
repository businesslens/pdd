---
entities:
  - entity: bookmark
    shows: [Title, Address]
    collects: [Title, Note, Tags, Collection]
  - { entity: collection, shows: [Name] }
  - { entity: tag, shows: [Name] }
entryPoints:
  - bookmarks-mobile: bookmarks://save
---

# Save link

Opens over another app when the Owner shares a page to the Product, with the
shared address and the title read from the page, and lets them change the
title and add a note, tags and an existing collection before saving.
