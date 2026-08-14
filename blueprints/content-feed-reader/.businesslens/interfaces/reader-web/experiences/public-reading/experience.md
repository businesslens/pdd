---
actors: [visitor]
access: public
entryPoints:
  - reader-web: /collections/:collectionSlug
---

# Public reading

The read-only context reached through a published collection link.

## Capability boundary

Shows one published collection and its items without requiring an account. It
does not expose the owner's sources, reading state, saved items, or other
collections.
