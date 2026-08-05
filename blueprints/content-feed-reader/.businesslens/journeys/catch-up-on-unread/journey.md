---
actors: [reader]
capabilities: [reading-state, item-saving]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
entryPoints:
  - reader-web: /unread
  - reader-mobile: content-reader://library/unread
---

# Catch up on unread

A Reader works through new items and leaves the unread backlog smaller.
