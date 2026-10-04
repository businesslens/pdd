---
entities:
  - { entity: item, shows: [Title, Published at, Saved at] }
  - { entity: source, shows: [Name] }
entryPoints:
  - reader-web: /unread
assets:
  - file: mockup.svg
    title: Mockup of the unread library
  - file: implementation/backlog-dark.svg
    title: Captured backlog with unread items, dark
references:
  - kind: visual
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/screen-map.md
    title: Screen map
---

# Unread library

Presents a finite backlog of unread items, newest first, with each item's
source, and the actions that make progress through it.
