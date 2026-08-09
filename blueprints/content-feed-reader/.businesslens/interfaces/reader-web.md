---
actors: [reader, visitor]
entryPoints:
  - web: /
---

# Reader web application

The supported browser Interface for a Reader's private library and public
collection links.

## Capability boundary

Supports every Reader- and Visitor-facing capability. Private library behavior
requires a Reader session; public collection reading does not. Feed collection
occurs through the separate syndicated-feed Interface.
