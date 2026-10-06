---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent asks to change a goal, a topic or a session itself instead of leaving a plan
    kind: actor
    actor: ai-agent
    entities:
      - { entity: goal, effect: reads, facts: [] }
      - { entity: topic, effect: reads, facts: [] }
      - { entity: study-session, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product refuses, and says that the agent connection changes nothing and offers leaving a plan instead
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
---

# Refuse a direct change from the AI agent

## Trigger

The AI agent tries to change the schedule, a goal or a topic itself.

## Outcome

The planner is exactly as it was, and the AI agent is told that a study plan is the only change it can propose.
