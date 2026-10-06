---
appliesTo:
  - type: entity
    id: poll
    facts: [Comment summary]
permits:
  - related: [{ verb: owns, entity: member }]
---

# Only the poll owner asks for and reads the comment summary

Only the Member who owns a poll asks for a generated summary of its comments,
and only they see it. Other Members read the comments themselves.

## Rationale

A summary chooses which arguments to keep. Shown to the team, it would stand in
for the discussion it shortens; kept with the owner, it is a working aid the
owner checks against the comments.
