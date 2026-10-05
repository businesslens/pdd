---
entities:
  - { entity: page, shows: [Title, Content, Parent page, Last edited at], collects: [Title, Content, Parent page] }
  - { entity: revision, shows: [Saved at, Origin] }
  - { entity: member, shows: [Name] }
  - { entity: suggestion, shows: [Reason] }
  - { entity: space, shows: [Name] }
entryPoints:
  - wiki-web: /pages/:pageId
---

# Page

One page, opened to read or work on. It presents the page's title and content,
where it sits in its space, and when and by whom it was last edited, with its
history of revisions to open. An Editor edits and saves it here, adds a page
under it, moves it under another page, and sees whether it has an open
suggestion waiting.
