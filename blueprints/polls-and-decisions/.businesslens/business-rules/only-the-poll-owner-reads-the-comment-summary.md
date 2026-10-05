---
appliesTo:
  - type: entity
    id: poll
    effect: reads
    facts: [Comment summary]
permits:
  - related: [{ verb: owns, entity: member }]
---

# Only the poll owner reads the comment summary

The Assistant's summary of a poll's comments is shown only to the Member who
owns the poll. Other Members read the comments themselves.

## Rationale

A summary chooses which arguments to keep. Shown to the team, it would stand in
for the discussion it shortens; kept with the owner, it is a working aid the
owner checks against the comments.
