---
kind: primary
result: achieved
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
    capability: accept-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Prepared at] }
    contexts:
      web-and-agent:
        place: planner-web::plans
  - text: The Student reviews the proposed sessions and the explanation, and accepts the plan
    kind: actor
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Replaced sessions, Explanation] }
    contexts:
      web-and-agent:
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
      web-and-agent:
        place: planner-web::plan-review
  - text: The Product marks the plan accepted
    kind: product
    actor: student
    capability: accept-study-plan
    entities:
      - { entity: study-plan, from: Proposed, to: Accepted, facts: [] }
    contexts:
      web-and-agent:
        place: planner-web::plan-review
---

# Plan a goal and accept the plan

## Trigger

The Student has a goal with topics, sets their availability, and asks their AI agent to plan it.

## Outcome

The Journey goal is achieved: the goal's upcoming sessions are the accepted plan's.

## Edge cases

- The plan is a revision the AI agent left after a missed session → the Student accepts it the same way, and the missed session itself is unchanged.
