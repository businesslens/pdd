---
appliesTo:
  - type: entity
    id: comment
    effect: removes
permits:
  - related: [{ verb: writes, entity: teammate }]
  - related: [{ verb: has, entity: card }, { verb: holds, entity: column }, { verb: contains, entity: board }, { verb: has, entity: board-membership }, { verb: holds, entity: teammate }]
    when: [{ entity: board-membership, fact: Role, is: Admin }]
---

# Only its author or a board admin deletes a comment

A comment is deleted by the Teammate who wrote it, or by a Teammate whose role
on the card's board is Admin. An admin who deletes a card or the board deletes
every comment on it too, whoever wrote them. No other member deletes a
colleague's comment.

## Rationale

A comment is someone's own words, so only they take them back; the admins the
team chose to arrange the board also keep its conversation fit to read.
