---
appliesTo:
  - type: entity
    id: card
    effect: removes
permits:
  - related: [{ verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only the board's admins delete its cards

A card is deleted only by a Teammate whose role on its board is Admin, once they
confirm, or with its board when an admin deletes the board. A Member never
deletes a card, and neither does an AI agent.

## Rationale

Deleting a card deletes every comment on it, whoever wrote them, and only the
board's admins may delete a colleague's comment. A Member who wants a card gone
moves it out of the way or asks an admin.
