---
kind: configuration
of: experience
settings:
  - entity: reader
    fact: Library assignment
takesEffect: At session start; assignment changes take effect in the next session.
stability: Fixed until the session ends.
alternatives:
  - id: reader-mobile::personal-library
    selectedWhen: Library assignment is Classic or unset. Unknown values are rejected.
  - id: reader-mobile::source-focused-library
    selectedWhen: Library assignment is Source-focused.
---

# Library layout

Readers on mobile get one of two library layouts: a personal list of everything unread, or a view organised by source for readers who follow many feeds.
