---
entities:
  - { entity: item, facts: [Title, Published at] }
  - { entity: source, facts: [Name] }
  - { entity: collection, facts: [Name] }
capabilities:
  - search-whole-library
entryPoints:
  - reader-mobile: content-reader://search
---

# Search

Lets a Reader find items, sources and collections across their whole library
by what they are called, and open what they find. It is the same view in both
versions of the mobile library, which is why it is shared beside them rather
than written under each.
