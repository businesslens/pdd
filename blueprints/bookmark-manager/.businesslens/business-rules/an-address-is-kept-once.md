---
appliesTo:
  - { type: entity, id: bookmark, facts: [Address] }
---

# An address is kept once

The library holds at most one bookmark for an address exactly as written.
Saving an address already kept opens the bookmark that has it, and importing
one skips it. Different addresses that lead to the same page are separate
bookmarks until the Owner merges them.

## Rationale

A second copy of the same link only splits its tags and notes in two. Exact
repeats are refused where they arrive; near repeats need judgment, which is the
AI agent's to suggest and the Owner's to decide.
