---
actors: [reader]
access: authenticated
entryPoints:
  - reader-web: /unread
screens: [unread-library, saved-items, source-list, collection-workspace]
---

# Personal library

The private context in which a Reader follows sources, reads, saves, organizes,
and publishes selected collections on the web.

## Capability boundary

Every item, track-reading-state change, saved item, and collection belongs to the
signed-in Reader. This context never exposes another Reader's library.

## Counterpart note

`reader-mobile::personal-library` pursues the same goal on the mobile
Interface. They share a folder name, which is what makes them counterparts, and
they are separate elements because their reach differs: publishing a collection
is a web commitment.
