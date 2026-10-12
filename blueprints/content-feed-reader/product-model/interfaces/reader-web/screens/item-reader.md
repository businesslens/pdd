---
entities:
  - { entity: item, shows: [Title, Published at] }
  - { entity: source, shows: [Name] }
  - { entity: collection, shows: [Name] }
entryPoints:
  - reader-web: /items/:itemId
---

# Item reader

Presents one item's readable content with its source and publication context,
and names the library or collection the person opened it from so they can
return there. It is the same view whether the person arrived from their
private library or from a published collection, which is why it is shared
across both Experiences of the web application rather than belonging to one.
