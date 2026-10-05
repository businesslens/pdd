---
kind: primary
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
  - text: The AI agent leaves a plan that divides the study still to do across the Student's availability before the target date, explaining how
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
      - { entity: student, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product confirms that every proposed session fits the availability and overlaps no other session, and keeps the plan
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [Proposed sessions] }
    contexts:
      agent:
        place: planner-agent
  - text: The plan waits in Plans for the Student, and the schedule is unchanged
    kind: condition
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: student, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
---

# Propose a plan for a goal

## Trigger

The Student asks their AI agent to plan a goal that has topics and a target date still ahead.

## Outcome

A proposed plan for the goal waits for the Student's review, with its sessions, the sessions it would replace and the agent's explanation; the schedule has not changed.

## Edge cases

- A plan for the goal is already waiting for review → that plan becomes outdated and the new plan takes its place.
- The goal has no topics, or its target date has passed → the Product refuses the plan and keeps nothing.
