---
kind: edge
routes:
  agent: Agent
steps:
  - text: The AI agent asks for a goal's topics, the hours already logged, the upcoming schedule and the Student's weekly availability
    kind: actor
    actor: ai-agent
    entities:
      - { entity: goal, effect: reads, facts: [Name, Target date] }
      - { entity: topic, effect: reads, facts: [Name, Estimated hours] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      agent:
        place: planner-agent
  - text: The study still to do needs more hours than the Student's availability holds before the target date
    kind: condition
    actor: ai-agent
    entities:
      - { entity: topic, effect: reads, facts: [Estimated hours] }
      - { entity: student, effect: reads, facts: [Weekly availability] }
    contexts:
      agent:
        place: planner-agent
  - text: The AI agent leaves a plan that fills the available time, with the hours that do not fit as its shortfall
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared by, Prepared at] }
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

# Propose a revision that falls short

## Trigger

The AI agent revises a goal whose remaining study no longer fits the time before its date.

## Outcome

The proposed plan uses the available time, says how many hours do not fit and which topics they belong to, and schedules nothing outside the availability.
