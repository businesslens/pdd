---
actors: [reader]
access: authenticated
variationKind: configuration
variationUsage:
  settings: [{ entity: reader, fact: Library assignment }]
  selectedWhen: Classic or unset. Source-focused selects Source-focused library; unknown values are rejected.
  takesEffect: At session start; assignment changes take effect in the next session.
  stability: Fixed until the session ends.
entryPoints:
  - reader-mobile: content-reader://library
navigation: [unread-library, saved-items, source-list]
---

# Personal library

The private context in which a Reader follows sources, reads and saves items on
a mobile device. Every item,
reading-state change and saved item belongs to the signed-in Reader;
organizing and publishing collections stays on the web.

## Counterpart note

`reader-web::personal-library` is the same context on the web Interface.
