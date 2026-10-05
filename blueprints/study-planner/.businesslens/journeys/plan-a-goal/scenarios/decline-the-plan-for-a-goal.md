---
kind: edge
result: not-achieved
routes:
  web-and-agent: Web and agent
steps:
  - text: The Student sets the hours they can study each day
    kind: actor
    actor: student
    capability: edit-weekly-availability
    entities:
      - { entity: student, facts: [Weekly availability] }
    contexts:
      web-and-agent:
        place: planner-web::plans
  - text: The AI agent leaves a plan that divides the study still to do across that availability
    kind: actor
    actor: ai-agent
    capability: propose-study-plan
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
      - { entity: student, effect: reads, facts: [] }
    contexts:
      web-and-agent:
        place: planner-agent
  - text: The Student opens the plan waiting in Plans
    kind: actor
    actor: student
    capability: decline-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
    contexts:
      web-and-agent:
        place: planner-web::plans
  - text: The Student reviews the plan and declines it
    kind: actor
    actor: student
    capability: decline-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Declined, facts: [] }
    contexts:
      web-and-agent:
        place: planner-web::plan-review
---

# Decline the plan for a goal

## Trigger

The Student asks their AI agent to plan a goal and does not like what it proposes.

## Outcome

The Journey goal is not achieved: the plan is declined and the schedule is as it was.
