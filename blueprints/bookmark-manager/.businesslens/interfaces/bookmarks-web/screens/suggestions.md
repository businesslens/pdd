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

Presents the assistant's pending suggestions, each with the bookmarks it
names and the assistant's reason: where to file bookmarks and which tags to
add, and which bookmarks lead to the same page. The Owner asks the assistant
for suggestions here, and accepts, merges or declines each one.

## Intent

Keep every change the assistant proposes in one place where the Owner decides
it, and nowhere it could take effect on its own.
