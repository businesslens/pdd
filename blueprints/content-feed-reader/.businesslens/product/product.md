---
id: content-feed-reader
summary: Follow feeds, catch up and keep worthwhile items in a private web or mobile library, and publish read-only collections for the web.
category: personal-productivity
tags: [single-user, public]
authors:
  - name: BusinessLens
license: MIT
languages: [en, de, fr]
limitations:
  - Sharing is read-only. There is no commenting, co-editing, or social graph.
  - The product reads syndicated feeds but does not publish feeds of its own.
  - Items are never deleted from a library; unfollowing a source keeps everything it already delivered.
  - A source keeps the name and feed address it was followed with; changing either means unfollowing it and following it again.
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
progress, lets readers save worthwhile items and gather them into collections,
and publishes a collection as a read-only web link.

## Intent

People who follow many sources face a stream that never ends and never feels
caught up, and what they wanted to keep gets lost in it. The Product makes that
stream finite and dependable: the Reader controls what they follow, what they
have read, and what they choose to keep. Sharing exposes only the collection
the Reader deliberately publishes; the rest of the library remains private.
