---
experiences:
  - reading-app
features:
  - item-saving
  - reading-state
  - source-refresh
scenarios:
  - a-source-republishes-old-items
  - mark-a-source-read-in-bulk
  - refresh-adds-nothing-new
  - work-through-the-unread-backlog
entryPoints:
  - web: /unread
  - ios: content-reader://library/unread
  - android: content-reader://library/unread
links:
  - rel: visual
    href: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/screen-map.md
    title: Cross-platform screen map
  - rel: research
    href: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/reader-research.md
    title: Reader research assumptions
---

# Unread library

Presents the reader's finite backlog and the actions that make meaningful
progress through it.

## Intent

Keep catching up understandable and achievable even when sources are noisy,
duplicative, or temporarily unhealthy.

## Information presented

- Unread items in newest-first order
- Each item's source and publication context
- The current unread amount and any active source-health warning
- Whether a refresh added genuinely new items

## Available actions

- Open an unread item
- Mark an item read or unread
- Mark a source's unread items read in bulk
- Save an item
- Refresh followed sources

## Product states

### Unread items available

The backlog shows what remains and lets the reader reduce it item by item or in
bulk.

### Caught up

The reader is told that no unread items remain without implying that followed
sources or saved content disappeared.

### Nothing new after refresh

The existing library remains visible and the refresh completes with a clear
no-change outcome.

### Source warning

A failing source is identified while items already in the library remain
available and the rest of the backlog remains usable.

## Capability boundary

The Screen changes reading and saving state and may request a refresh. It does
not add or remove followed sources, edit tags or collections, or expose another
reader's library. Republished items do not create duplicate backlog entries.
