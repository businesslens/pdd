---
appliesTo:
  - type: entity
    id: vote
    effect: creates
  - type: entity
    id: comment
    effect: creates
permits:
  - actors: [member]
    when: [{ entity: poll, fact: Closed at, absent: true }]
---

# Only Members vote and comment while a poll is open

Votes and comments come only from Members of the team, and only until their poll
closes. The Assistant never casts a vote or adds a comment, and once a poll has
closed nothing more is added to its votes or its discussion.

## Rationale

The results and the arguments are the team's own voice. Anything added after
voting ends, or by anyone but a Member, would change a result the team has
already seen as final.
