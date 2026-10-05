---
kind: edge
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
  - text: The Planning assistant finds that the study still to do needs more hours than the Student's availability holds before the target date
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Logged minutes] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
      - { entity: goal, effect: reads, facts: [Target date] }
  - text: The Planning assistant fills the available time and proposes the plan with the hours that do not fit as its shortfall
    kind: actor
    actor: planning-assistant
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
  - text: The Product opens the proposed plan, showing the shortfall beside the proposed sessions
    kind: product
    actor: student
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Shortfall, Explanation] }
      - { entity: goal, effect: reads, facts: [Name, Target date] }
    contexts:
      web:
        place: planner-web::plan-review
---

# Propose a plan that falls short

## Trigger

The Student asks for a plan for a goal that needs more study than their availability holds before its date.

## Outcome

The proposed plan uses all the available time, says how many hours do not fit and which topics they belong to, and never schedules outside the availability.
