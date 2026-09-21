---
entities:
  - { entity: item, facts: [Title, Published at, Saved at] }
  - { entity: source, facts: [Name] }
capabilities:
  - read-content
  - track-reading-state
  - save-item
  - synchronize-feeds
entryPoints:
  - reader-mobile: content-reader://library/unread
references:
  - kind: visual
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/screen-map.md
    title: Screen map
---

# Unread library

Presents a finite backlog of unread items, newest first, with each item's
source, and the actions that make progress through it.
