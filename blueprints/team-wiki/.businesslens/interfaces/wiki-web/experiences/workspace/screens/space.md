---
entities:
  - { entity: space, shows: [Name, Description] }
  - { entity: page, shows: [Title, Parent page], collects: [Title] }
entryPoints:
  - wiki-web: /spaces/:spaceKey
---

# Space

One space the Member belongs to: its name and purpose and its tree of pages,
each under its parent. It opens a page, and lets an Editor add a page at the top
of the space.
