---
appliesTo:
  - type: entity
    id: poll
    effect: creates
permits:
  - actors: [member]
---

# Any Member puts a question to the team

Every Member of the team can open a poll, and owns each poll they open.

## Rationale

A question is worth settling whoever on the team raises it; owning it makes
that Member answerable for closing it and recording what was decided.
