---
actors: [reader]
access: authenticated
version: next
entryPoints:
  - reader-mobile: content-reader://library
navigation: [unread-library, unread-library::by-source, saved-items, source-list]
---

# Personal library (next)

The next version of the private mobile library, served beside the classic one
for the same signed-in Readers with the same access. It offers the same
library and adds one thing the classic version does not: the unread backlog
grouped by source, reachable from everywhere as its own destination.

## Counterpart note

`reader-mobile::personal-library` is the classic version of this context. The
two share an entry point, which is why they are Experiences of one Interface
rather than two Interfaces, and `version` is the only thing that divides them.
