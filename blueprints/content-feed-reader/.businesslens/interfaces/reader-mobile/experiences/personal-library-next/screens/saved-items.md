---
entities:
  - { entity: item, facts: [Title, Published at, Saved at] }
  - { entity: source, facts: [Name] }
  - { entity: collection, facts: [Name] }
capabilities:
  - read-content
  - save-item
entryPoints:
  - reader-mobile: content-reader://library/saved
---

# Saved items

Presents the durable items a Reader chose to keep, with their source and
publication context and the owned collections they belong to, and provides a
direct way to return to their content.
