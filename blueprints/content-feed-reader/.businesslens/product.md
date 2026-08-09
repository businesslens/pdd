---
id: content-feed-reader
summary: Follow feeds, catch up on unread items, and share curated reading lists across web and mobile.
category: content
tags: [content, reading, syndication]
authors:
  - name: BusinessLens
license: MIT
limitations:
  - Public collection links open on the web; the mobile application serves the reader's private library.
  - Sharing is read-only. There is no commenting, co-editing, or social graph.
  - The product reads syndicated feeds but does not publish feeds of its own.
references:
  - kind: visual
    role: intent
    target: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/screen-map.md
    title: Screen map
  - kind: research
    role: context
    target: https://github.com/businesslens/pdd/blob/main/blueprints/content-feed-reader/references/reader-research.md
    title: Reader assumptions
---

# Content Feed Reader

A focused reading product for people who follow more sources than they can keep
up with. It synchronizes followed feeds into a private library, remembers reading
progress, lets readers save and group worthwhile items, and publishes a
collection as a read-only web link.

## Intent

Make a growing stream of syndicated content feel finite and dependable. The
Reader controls what they follow, what they have read, and what they choose to
keep. Sharing exposes only the collection the reader deliberately publishes;
the rest of the library remains private.
