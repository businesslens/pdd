---
kind: person
acts: external
relations:
  - entity: poll
    verb: owns
    cardinality: one-to-many
  - entity: vote
    verb: casts
    cardinality: one-to-many
  - entity: comment
    verb: writes
    cardinality: one-to-many
---

# Member

A person on the team. Any Member can put a question to the team, vote on and
discuss its open polls, and read its decisions; the Member who creates a poll
owns it and is the one who closes it, deletes it before anyone votes, and
records its decision.

## Information kept

- **Display name** — the name shown beside their comments and their votes on named polls
