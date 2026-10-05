---
appliesTo:
  - type: entity
    id: decision
    effect: changes
permits:
  - related: [{ verb: settles, entity: poll }, { verb: owns, entity: member }]
---

# Only the poll owner edits and records a decision

Only the Member who owns a poll edits its draft decision and records it. The
Assistant prepares a draft but never changes one afterwards, and never records
it.

## Rationale

The record speaks for the team, so a person who asked the question must read
and confirm every word of it before anyone else sees it.
