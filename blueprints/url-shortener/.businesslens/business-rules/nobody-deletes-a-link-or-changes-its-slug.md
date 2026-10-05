---
appliesTo:
  - type: entity
    id: link
    effect: removes
  - type: entity
    id: link
    effect: changes
    facts: [Slug]
permits: []
---

# Nobody deletes a link or changes its slug

A link can be disabled or left to expire, but never deleted, and its slug
never changes. A slug, once given to a link, therefore never names another
link, and a taken slug stays taken.

## Rationale

Short addresses live on in printed pages, old messages and other people's
posts. If a slug could be freed and claimed again, an address handed out
long ago could start sending Visitors somewhere its Owner never chose.
