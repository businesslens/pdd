---
appliesTo:
  - { type: entity, id: bookmark, effect: reads }
permits:
  - related: [{ verb: owns, entity: owner }]
  - related: [{ verb: owns, entity: owner }, { verb: connects, entity: ai-agent }]
---

# Only the Owner and their AI agent read bookmarks

A bookmark is read by the Owner who keeps it and by the AI agent that Owner
connected, which reads it to suggest how to tidy the library. Nobody else reads
a bookmark.

## Rationale

What someone keeps is a record of what they read and care about. The agent
reads it only because its Owner connected it to help.
