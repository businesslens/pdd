---
appliesTo:
  - { type: entity, id: bookmark, effect: reads }
permits:
  - actors: [owner, ai-agent]
---

# Only the Owner and their AI agent read the library

Bookmarks are read by the Owner and by the AI agent the Owner connected, which
reads them to suggest how to file them. Nobody else reads a bookmark.

## Rationale

What someone keeps is a record of what they read and care about. The agent
reads it only because the Owner connected it to help.
