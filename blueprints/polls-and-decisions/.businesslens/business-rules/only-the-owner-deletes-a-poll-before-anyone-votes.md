---
appliesTo:
  - type: entity
    id: poll
    effect: removes
permits:
  - related: [{ verb: owns, entity: member }]
    when:
      - { fact: Closed at, absent: true }
      - { fact: Votes cast, is: 0 }
---

# Only the owner deletes a poll before anyone votes

Only the Member who owns a poll deletes it, and only while it is open and nobody
has voted on it. Once the first vote is cast, the poll stays for good.

## Rationale

A poll opened with a typo or the wrong options should be easy to take back, but
once someone has voted, deleting it would erase a say the team has already
given.
