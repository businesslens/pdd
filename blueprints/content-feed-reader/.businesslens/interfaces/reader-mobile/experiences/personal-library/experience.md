---
actors: [reader]
access: authenticated
version: classic
entryPoints:
  - reader-mobile: content-reader://library
navigation: [unread-library, saved-items, source-list]
---

# Personal library

The private context in which a Reader follows sources, reads and saves items on
a mobile device, in the classic version of the mobile library. Every item,
reading-state change and saved item belongs to the signed-in Reader;
organizing and publishing collections stays on the web.

## Counterpart note

`reader-web::personal-library` is the same context on the web Interface, and
`reader-mobile::personal-library-next` is the next version of this one, served
at the same time from the same entry point.
