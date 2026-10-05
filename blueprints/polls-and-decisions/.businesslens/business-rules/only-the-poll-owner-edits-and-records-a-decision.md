---
appliesTo:
  - type: entity
    id: decision
    effect: changes
permits:
  - related: [{ verb: settles, entity: poll }, { verb: owns, entity: member }]
---

# Only the poll owner edits and records a decision

Only the Member who owns a poll edits its draft decision and records it. A
generated draft is only a proposal until the owner has edited it as they see
fit and recorded it.

## Rationale

The record speaks for the team, so a person who asked the question must read
and confirm every word of it before anyone else sees it.
