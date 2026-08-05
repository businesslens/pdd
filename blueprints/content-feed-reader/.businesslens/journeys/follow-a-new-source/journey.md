---
actors: [reader]
capabilities: [source-following]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
entryPoints:
  - reader-web: /sources
  - reader-mobile: content-reader://library/sources
---

# Follow a new source

A Reader adds a feed to the private library so its items can join the reading
stream.
