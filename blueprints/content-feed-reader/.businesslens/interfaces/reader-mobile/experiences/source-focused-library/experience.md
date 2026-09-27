---
actors: [reader]
access: authenticated
variantOf: reader-mobile::personal-library
variationUsage:
  settings: [{ entity: reader, fact: Library assignment }]
  selectedWhen: Source-focused. Classic or unset selects Personal library; unknown values are rejected.
  takesEffect: At session start; assignment changes take effect in the next session.
  stability: Fixed until the session ends.
entryPoints:
  - reader-mobile: content-reader://library
navigation: [unread-library, saved-items, source-list, source-backlog]
---

# Source-focused library

An alternative mobile library organized around sources.
It supports the same individual-item reading and saving, and adds a source
backlog where a Reader can mark that source's unread items read together.
