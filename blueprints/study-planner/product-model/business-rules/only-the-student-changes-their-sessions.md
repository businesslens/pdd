---
appliesTo:
  - type: entity
    id: study-session
    effect: changes
permits:
  - related: [{ verb: is studied in, entity: topic }, { verb: covers, entity: goal }, { verb: owns, entity: student }]
---

# Only the Student changes their sessions

A study session is moved or logged only by the Student. The AI agent never moves or logs a session.

## Rationale

Moving and logging say what the Student will do and did; only the Student knows either.
