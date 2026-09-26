---
entities:
  - { entity: item, shows: [Title, Published at] }
  - { entity: source, shows: [Name] }
  - { entity: collection, shows: [Name] }
entryPoints:
  - reader-web: /search
---

# Search

Lets a Reader find items, sources and collections across their whole library
by what they are called, and open what they find. It belongs to the private
library because a Visitor has no library to search.
