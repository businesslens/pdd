---
entities:
  - { entity: filing-suggestion, shows: [Collection, Tags to add, Reason] }
  - { entity: duplicate-suggestion, shows: [Shared page, Kept bookmark, Reason], collects: [Kept bookmark] }
  - { entity: bookmark, shows: [Title, Address, Saved at] }
  - { entity: collection, shows: [Name] }
entryPoints:
  - bookmarks-web: /suggestions
---

# Suggestions

Presents the pending suggestions the Owner's AI agent left, each with the
bookmarks it names and the agent's reason: where to file bookmarks and which
tags to add, and which bookmarks lead to the same page. The Owner accepts,
merges or declines each one.

## Intent

Keep every change the AI agent proposes in one place where the Owner decides
it, and nowhere it could take effect on its own.
