---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent asks to add, move, log or cancel a session itself instead of leaving a plan
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product refuses, and says that the agent connection changes no session and offers leaving a plan instead
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-session, effect: reads, facts: [] }
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
---

# Refuse a direct schedule change from the AI agent

## Trigger

The AI agent tries to change the schedule, a goal or a topic itself.

## Outcome

The planner is exactly as it was, and the AI agent is told that a study plan is the only change it can propose.
