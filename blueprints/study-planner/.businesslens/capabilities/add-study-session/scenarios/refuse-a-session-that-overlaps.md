---
kind: validation
routes:
  web: Web
steps:
  - text: The Student picks a topic and enters a start and a length that overlap a session already scheduled
    kind: actor
    actor: student
    entities:
      - { entity: topic, effect: reads, facts: [Name] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The new session would overlap another session in the schedule
    kind: condition
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
  - text: The Product explains which session it overlaps
    kind: product
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [Start] }
    contexts:
      web:
        place: planner-web::schedule
---

# Refuse a session that overlaps

## Trigger

The Student schedules a session at a time another session already holds.

## Outcome

No session is added, and the topic, start and length the Student entered remain available to change.
