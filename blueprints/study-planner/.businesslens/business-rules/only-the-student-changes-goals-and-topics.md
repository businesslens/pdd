---
appliesTo:
  - type: entity
    id: goal
    effect: creates
  - type: entity
    id: goal
    effect: changes
  - type: entity
    id: topic
    effect: creates
  - type: entity
    id: topic
    effect: changes
  - type: entity
    id: topic
    effect: removes
permits:
  - actors: [student]
---

# Only the Student changes goals and topics

Goals, their target dates, their topics and the topics' estimates are set and
changed only by the Student. The Planning assistant plans from them as they
are and never adjusts an estimate or a date to make a plan fit.

## Rationale

Estimates and dates are the Student's statement of what they must study and by
when. A plan that quietly changed them would hide exactly the shortfall the
Student needs to see.
