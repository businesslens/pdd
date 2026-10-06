---
appliesTo:
  - type: entity
    id: comment
    effect: removes
permits:
  - related: [{ verb: gathers, entity: poll }, { verb: owns, entity: member }]
    when:
      - { entity: poll, fact: Closed at, absent: true }
      - { entity: poll, fact: Votes cast, is: 0 }
---

# Only the poll owner deletes its comments with it

A comment is deleted only with its poll, when the Member who owns the poll
deletes it before anyone has voted. Nobody deletes a single comment, their own
included.

## Rationale

Comments written on a poll that is taken back have nothing left to argue about;
on any poll that stands, they are part of the team's record of why it decided.
