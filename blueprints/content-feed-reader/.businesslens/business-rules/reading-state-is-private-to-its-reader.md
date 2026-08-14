---
appliesTo:
  - type: capability
    id: reading-state
    contexts:
      - context: reader-web::personal-library
      - context: reader-mobile::personal-library
---

# Reading state is private to its Reader

Only the Reader who owns a library can see or change its read and unread state.

## Rationale

Reading progress is personal working state, not information exposed through
shared collections.
