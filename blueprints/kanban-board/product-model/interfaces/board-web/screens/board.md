---
entities:
  - { entity: board, shows: [Name] }
  - { entity: column, shows: [Name, Position], collects: [Name, Position] }
  - { entity: card, shows: [Title, Assignees, Due date, Column, Position], collects: [Title, Column, Position] }
  - { entity: stall-flag, shows: [Reason] }
entryPoints:
  - board-web: /boards/:boardId
---

# Board

One board's columns in order, each with its cards from top to bottom, showing
who is on each card, when it is due, whether it is overdue, and whether it
carries a stall flag. Members add cards to a column and move cards between and
within columns here; admins add, rename, move and remove columns.
