---
kind: primary
routes:
  web: Web
steps:
  - text: The Planning assistant finds a planned session whose day has passed without being logged
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Logged minutes] }
  - text: The Planning assistant divides the goal's study still to do again, across the Student's weekly availability before the target date
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
  - text: The Planning assistant proposes the revised plan, explaining which missed study it moved and where
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
  - text: The revised plan waits in Plans for the Student, and the schedule still shows the session as missed
    kind: condition
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: student, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plans
---

# Revise a plan after a missed session

## Trigger

A planned session's day passes without the Student logging it, for a goal whose target date is still ahead.

## Outcome

A revised plan waits for the Student's review; the schedule has not changed.

## Edge cases

- A plan for the goal is already waiting for review → that plan becomes outdated and the revised plan takes its place.
- The Student declined the last revision for the goal → the assistant prepares another only when a further session is missed.
- The goal is past → no revision is prepared.
