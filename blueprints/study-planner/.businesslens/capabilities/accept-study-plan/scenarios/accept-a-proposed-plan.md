---
kind: primary
routes:
  web: Web
steps:
  - text: The Student reviews the proposed sessions, the sessions they replace, any shortfall and the explanation
    kind: actor
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Shortfall, Explanation] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Student accepts the plan
    kind: actor
    actor: student
    entities: []
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product confirms the schedule has not changed since the plan was prepared
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
      - { entity: study-session, as: replaced, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product removes the goal's upcoming planned sessions that the plan replaces
    kind: product
    actor: student
    entities:
      - { entity: study-session, as: replaced, effect: removes, from: Planned }
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product schedules the plan's proposed sessions
    kind: product
    actor: student
    entities:
      - { entity: study-session, as: proposed, effect: creates, to: Planned, facts: [Start, Planned minutes] }
      - { entity: study-plan, effect: reads, facts: [Proposed sessions] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The Product marks the plan accepted
    kind: product
    actor: student
    entities:
      - { entity: study-plan, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule shows the new sessions, with logged and missed sessions where they were
    kind: condition
    entities:
      - { entity: study-session, as: proposed, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      web:
        place: planner-web::schedule
---

# Accept a proposed plan

## Trigger

The Student is satisfied with a proposed plan for a goal.

## Outcome

The goal's upcoming sessions are the plan's sessions, the plan is accepted, and every logged or missed session is unchanged.

## Edge cases

- The goal had no upcoming planned sessions → the proposed sessions are added and nothing is removed.
