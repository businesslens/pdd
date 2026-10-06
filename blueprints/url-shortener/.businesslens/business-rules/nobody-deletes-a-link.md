---
appliesTo:
  - type: entity
    id: link
    effect: removes
permits: []
---

# Nobody deletes a link

A link can be disabled or left to expire, but never deleted — not by its
Owner, not by an API client, and not by the Product. Its slug therefore never
names another link, and a taken slug stays taken.

## Rationale

Short addresses live on in printed pages, old messages and other people's
posts. If a link could be deleted and its slug claimed again, an address handed
out long ago could start sending Visitors somewhere its Owner never chose.
