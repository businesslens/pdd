---
appliesTo:
  - type: entity
    id: poll
    effect: changes
    facts: [Comment summary]
permits:
  - related: [{ verb: owns, entity: member }]
---

# Only the poll owner asks for the comment summary

Only the Member who owns a poll asks for a generated summary of its comments,
and each new summary replaces the one before.

## Rationale

Sending a poll's discussion to a language model is the owner's call, made when
the owner needs the gist to decide.
