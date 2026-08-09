---
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
capabilities: [reading-state, item-saving]
capabilityScenarios: [mark-an-item-read, mark-a-source-read-in-bulk, save-an-accessible-item]
journeyScenarios: [work-through-the-unread-backlog, save-while-catching-up]
entryPoints:
  - reader-web: /unread
  - reader-mobile: content-reader://library/unread
references:
  - kind: visual
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/screen-map.md
    title: Screen map
---

# Unread library

Presents a finite backlog and the actions that make progress through it.

## Information presented

- Unread items in newest-first order
- Each item's source and publication context
- The remaining unread count

## Available actions

- Open an unread item
- Mark an item read or unread
- Mark one source's unread items read
- Save an item

## Product states

### Unread items available

The backlog shows what remains and lets the Reader reduce it.

### Caught up

The Reader sees that no unread items remain without losing followed sources or
saved content.

## Capability boundary

Changes reading and saving state. It does not add sources or edit collections.
