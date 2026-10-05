---
kind: primary
routes:
  agent: Agent
steps:
  - text: The AI agent asks for the Student's schedule
    kind: actor
    actor: ai-agent
    entities:
      - { entity: student, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product provides the sessions, with those whose day passed unlogged shown as missed
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes, Logged minutes] }
    contexts:
      agent:
        place: planner-agent
  - text: The AI agent divides the missed goal's study still to do again, across the availability before the target date
    kind: actor
    actor: ai-agent
    entities:
      - { entity: goal, effect: reads, facts: [Target date] }
      - { entity: topic, effect: reads, facts: [Estimated hours] }
    contexts:
      agent:
        place: planner-agent
  - text: The AI agent leaves the revised plan, explaining which missed study it moved and where
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: creates, to: Proposed, facts: [Proposed sessions, Replaced sessions, Explanation, Shortfall, Prepared at] }
    contexts:
      agent:
        place: planner-agent
  - text: The revised plan waits in Plans for the Student, and the schedule still shows the session as missed
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

# Revise a plan after a missed session

## Trigger

The AI agent looks over the Student's schedule and finds a planned session whose day passed without being logged, for a goal still ahead.

## Outcome

A revised plan waits for the Student's review; the schedule has not changed.

## Edge cases

- A plan for the goal is already waiting for review → that plan becomes outdated and the revised plan takes its place.
- The goal is past → the Product refuses a revision and keeps nothing.
