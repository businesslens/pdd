---
kind: edge
routes:
  agent: Agent
steps:
  - text: The AI agent asks for a goal it was asked to plan
    kind: actor
    actor: ai-agent
    entities:
      - { entity: goal, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product provides the goal's topics, the hours already logged, the upcoming schedule and the Student's weekly availability
    kind: product
    actor: ai-agent
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
      - { entity: topic, effect: reads, facts: [Name, Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      agent:
        place: planner-agent
  - text: The AI agent finds that the study still to do needs more hours than the Student's availability holds before the target date
    kind: actor
    actor: ai-agent
    entities:
      - { entity: student, effect: reads, facts: [] }
  - text: The AI agent leaves a plan that fills the available time, with the hours that do not fit as its shortfall
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product confirms the proposed sessions fit and keeps the plan with its shortfall
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions, Shortfall] }
    contexts:
      agent:
        place: planner-agent
---

# Propose a plan that falls short

## Trigger

The Student asks their AI agent to plan a goal that needs more study than their availability holds before its date.

## Outcome

The proposed plan uses the available time, says how many hours do not fit and which topics they belong to, and schedules nothing outside the availability.
