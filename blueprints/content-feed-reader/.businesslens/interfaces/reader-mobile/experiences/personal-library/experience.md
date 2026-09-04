---
actors: [reader]
access: authenticated
entryPoints:
  - reader-mobile: content-reader://library
screens: [unread-library, saved-items, source-list]
---

# Personal library

The private context in which a Reader follows sources, reads and saves items on
a mobile device.

## Capability boundary

Every item, track-reading-state change and saved item belongs to the signed-in Reader.
This context never exposes another Reader's library, and it does not organize or
publish collections — that stays on the web.
