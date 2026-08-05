---
actors: [reader]
interfaces: [reader-web, reader-mobile]
access: authenticated
entryPoints:
  - reader-web: /unread
  - reader-mobile: content-reader://library
---

# Personal library

The private context in which a Reader follows sources, reads, saves, organizes,
and publishes selected collections.

## Capability boundary

Every item, reading-state change, saved item, and collection belongs to the
signed-in Reader. This context never exposes another Reader's library.
