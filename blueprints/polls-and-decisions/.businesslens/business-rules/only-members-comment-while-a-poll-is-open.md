---
appliesTo:
  - type: entity
    id: comment
    effect: creates
permits:
  - actors: [member]
    when: [{ entity: poll, fact: Closed at, absent: true }]
---

# Only Members comment while a poll is open

Comments come only from Members of the team, and only until their poll closes.
Nothing generated is ever posted as a comment, and once a poll has closed its
discussion takes nothing more.

## Rationale

The arguments are the team's own voice. An argument added after voting ends
could no longer sway anyone, and would read as part of a discussion the team
has already closed.
