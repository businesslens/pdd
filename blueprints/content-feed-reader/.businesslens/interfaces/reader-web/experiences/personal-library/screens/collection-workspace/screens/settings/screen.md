---
entities:
  - { entity: collection, facts: [Name, Public address] }
capabilities:
  - rename-collection
entryPoints:
  - reader-web: /collections/:collectionId/settings
---

# Settings

Presents the open collection's name and, once it has been published, the
public address it is served at, and lets the owner give it a new name. Sharing
is controlled in the part of this view that shows the address.
