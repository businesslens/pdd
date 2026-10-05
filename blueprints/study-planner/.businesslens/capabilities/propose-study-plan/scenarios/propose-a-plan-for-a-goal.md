---
kind: primary
routes:
  web: Web
steps:
  - text: The Student picks a goal, confirms their weekly availability and asks for a plan
    kind: actor
    actor: student
    entities:
      - { entity: goal, effect: reads, facts: [Name] }
      - { entity: student, facts: [Weekly availability] }
    contexts:
      web:
        place: planner-web::plans
  - text: The Planning assistant reads the goal's topics, the hours already logged and the upcoming schedule
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [Name, Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
  - text: The Planning assistant divides the study still to do into sessions inside the Student's weekly availability and before the target date
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: student, effect: reads, facts: [Weekly availability] }
      - { entity: goal, effect: reads, facts: [Target date] }
  - text: The Planning assistant proposes the plan, explaining how it divided the study
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
  - text: The Product opens the proposed plan for the Student to review
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::plan-review
  - text: The schedule is unchanged until the Student decides
    kind: condition
    actor: student
    entities:
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Propose a plan for a goal

## Trigger

The Student wants the planner to work out when to study the topics of a goal.

## Outcome

A proposed plan for the goal is open for the Student's review, with its sessions, the sessions it would replace and the assistant's explanation; the schedule has not changed.

## Edge cases

- A plan for the goal is already waiting for review → the Product opens that plan instead of preparing another.
- The weekly availability has no hours in it → the Product asks for some, and nothing is prepared.
- The goal is past → it is not offered for planning.
