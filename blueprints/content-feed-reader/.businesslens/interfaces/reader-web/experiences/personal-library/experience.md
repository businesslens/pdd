---
actors: [reader]
access: authenticated
entryPoints:
  - reader-web: /unread
---

# Personal library

The private context in which a Reader follows sources, reads, saves, organizes,
searches, and publishes selected collections on the web. Every item, reading-state
change, saved item, and collection belongs to the signed-in Reader.

## Counterpart note

`reader-mobile::personal-library` pursues the same goal on the mobile
Interface. They share a folder name, which is what makes them counterparts, and
they are separate elements because their reach differs: publishing a collection
is a web commitment.
