---
appliesTo:
  - type: entity
    id: vote
    effect: creates
permits:
  - actors: [member]
    when: [{ entity: poll, fact: Closed at, absent: true }]
---

# Only Members vote while a poll is open

Votes come only from Members of the team, and only until their poll closes.
Nothing generated is ever cast as a vote, and once a poll has closed no vote is
added to it.

## Rationale

The results are the team's own voice. A vote added after voting ends, or by
anyone but a Member, would change a result the team has already seen as final.
