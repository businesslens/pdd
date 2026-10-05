---
kind: edge
result: achieved
routes:
  web: Web
steps:
  - text: The Planning assistant finds a planned session whose day has passed without being logged
    kind: actor
    actor: planning-assistant
    capability: propose-study-plan
    entities:
      - { entity: study-session, as: missed, effect: reads, facts: [Start, Logged minutes] }
  - text: The Planning assistant proposes a revised plan that moves the missed study into the time left
    kind: actor
    actor: planning-assistant
    capability: propose-study-plan
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
  - text: The Student opens the revised plan from Plans
    kind: actor
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
    contexts:
      web:
        place: planner-web::plans
  - text: The Student reviews the moved study and accepts the plan
    kind: actor
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product replaces the goal's upcoming planned sessions with the plan's sessions
    kind: product
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-session, as: replaced, effect: removes, from: Planned }
      - { entity: study-session, as: proposed, effect: creates, to: Planned, facts: [Start, Planned minutes] }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan accepted
    kind: product
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Accept a revision after a missed session

## Trigger

A planned session is missed, and the Student later opens Plans.

## Outcome

The Journey goal is achieved: the missed study is rescheduled through a plan the Student accepted, and the missed session itself is unchanged.
