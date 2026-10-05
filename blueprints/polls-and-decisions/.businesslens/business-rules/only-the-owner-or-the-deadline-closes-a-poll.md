---
appliesTo:
  - type: entity
    id: poll
    effect: changes
    to: Closed
permits:
  - related: [{ verb: owns, entity: member }]
  - unattended: true
---

# Only the owner or the deadline closes a poll

A poll is closed by the Member who owns it, at any time while it is open, or by
the Product when its deadline passes. No other Member, and not the Assistant,
can end the voting.

## Rationale

The person who asked the question is accountable for when the team has
answered it; a deadline is that person's decision made in advance.
