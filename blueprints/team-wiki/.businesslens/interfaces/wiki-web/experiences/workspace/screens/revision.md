---
entities:
  - { entity: revision, shows: [Title, Content, Saved at, Origin] }
  - { entity: page, shows: [Title, Content] }
  - { entity: member, shows: [Name] }
  - { entity: space, shows: [Name] }
entryPoints:
  - wiki-web: /pages/:pageId/revisions/:revisionId
---

# Revision

One earlier revision of a page: what the page said at that save, who saved it
and when, and how it differs from the page as it stands now. An Editor restores
it from here.
