---
entities:
  - { entity: board, shows: [Name, Stall threshold], collects: [Name, Stall threshold] }
  - { entity: board-membership, shows: [Role], collects: [Role] }
  - { entity: teammate, shows: [Name, Email address], collects: [Email address] }
entryPoints:
  - board-web: /boards/:boardId/settings
---

# Board settings

One board's name and stall threshold, and its members with the role each
holds. Every member sees them; admins change the name and threshold, add
members, change their roles, remove them and delete the board here, and any
member leaves the board from here.
