---
entities:
  - { entity: item, facts: [Title, Published at] }
  - { entity: source, facts: [Name] }
  - { entity: collection, facts: [Name] }
capabilities:
  - search-whole-library
entryPoints:
  - reader-web: /search
---

# Search

Lets a Reader find items, sources and collections across their whole library
by what they are called, and open what they find. It belongs to the private
library because a Visitor has no library to search.
