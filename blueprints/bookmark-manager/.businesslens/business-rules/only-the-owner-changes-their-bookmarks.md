---
appliesTo:
  - { type: entity, id: bookmark, effect: changes }
permits:
  - related: [{ verb: owns, entity: owner }]
---

# Only the Owner changes their bookmarks

A bookmark's title, note, tags and collection change only by its Owner's own
action: editing it, deleting its collection, or accepting a suggestion. Their
AI agent never files or tags a bookmark itself.

## Rationale

The library is one person's memory of what they found worth keeping. An agent
that could rearrange it on its own would leave the Owner unsure where anything
is.
