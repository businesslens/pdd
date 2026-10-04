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

# Library organization

Readers on mobile get one of two libraries: a personal list of everything unread, or one organized by source that also lets a Reader mark a source's unread items read together.
