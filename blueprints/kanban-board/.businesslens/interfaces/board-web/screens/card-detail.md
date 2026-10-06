---
entities:
  - { entity: card, shows: [Title, Description, Assignees, Due date, Column, Entered column at], collects: [Title, Description, Assignees, Due date] }
  - { entity: comment, shows: [Text, Posted at], collects: [Text] }
  - { entity: teammate, shows: [Name] }
  - { entity: stall-flag, shows: [Reason, Raised at] }
entryPoints:
  - board-web: /boards/:boardId/cards/:cardId
---

# Card detail

One card opened from its board: its title and description, its assignees and
due date, the column it is in and since when, any stall flag it carries, and
its comments with who wrote them and when. Members change the card's details,
post comments, delete the comments they wrote and delete the card here.
