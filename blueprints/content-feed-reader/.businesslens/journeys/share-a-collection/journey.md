---
actors: [reader]
capabilities: [collections, collection-sharing]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
entryPoints:
  - reader-web: /collections/:collectionId
  - reader-mobile: content-reader://library/collections/:collectionId
---

# Share a collection

A Reader publishes an owned collection to a web link and can later revoke that
link.
