---
appliesTo:
  - type: entity
    id: link
    effect: changes
    facts: [Slug]
permits: []
---

# Nobody changes a link's slug

A link keeps the slug it was created with. Its Owner can change where it leads
and when it expires, but never the short address itself.

## Rationale

Everyone who received the short address relies on it. A changed slug would
break every copy already handed out and free the old one for another link.
