---
entities:
  - { entity: source, shows: [Name] }
  - { entity: item, shows: [Title, Published at] }
entryPoints:
  - reader-mobile: content-reader://library/source-backlog
---

# Source backlog

Shows the selected source's unread items and lets the Reader mark that source's
remaining backlog read together. This is a destination of the Source-focused
library, with its own selected source context.
