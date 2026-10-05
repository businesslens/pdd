---
kind: validation
routes:
  agent: Agent
steps:
  - text: The AI agent leaves a plan with a session outside the Student's weekly availability or over another session
    kind: actor
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [] }
      - { entity: student, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
  - text: A proposed session falls outside the availability, after the target date, or over a session the plan does not replace
    kind: condition
    entities:
      - { entity: student, effect: reads, facts: [Weekly availability] }
      - { entity: study-session, effect: reads, facts: [Start, Planned minutes] }
    contexts:
      agent:
        place: planner-agent
  - text: The Product refuses the plan, says which session does not fit and why, and keeps nothing
    kind: product
    actor: ai-agent
    entities:
      - { entity: study-plan, effect: reads, facts: [] }
    contexts:
      agent:
        place: planner-agent
---

# Refuse a plan outside the availability

## Trigger

The AI agent proposes a session the Student could not keep.

## Outcome

No plan is kept, nothing waits for the Student, and the AI agent knows which session to change.
